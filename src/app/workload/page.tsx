import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import WorkloadAnalysisView from '@/components/WorkloadAnalysisView'
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  Users,
  Activity,
  Target,
  Award,
  BarChart3,
  Zap,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface DepartmentWorkload {
  name: string
  totalUsers: number
  totalActiveTasks: number
  totalOverdueTasks: number
  totalProjects: number
  avgWorkloadScore: number
  avgCompletionRate: number
  avgEfficiency: number
  highRiskUsers: number
  riskLevel?: string
  productivity?: string
  users: Array<{
    id: string
    name: string
    workloadScore: number
    completionRate: number
    efficiency: number
    riskLevel?: string
  }>
}

interface UserWorkloadData {
  id: string
  name: string
  email: string
  department: string
  position: string
  photo?: string | null
  activeTasks: number
  completedTasks: number
  reviewTasks: number
  overdueTasks: number
  activeProjects: number
  totalTasks: number
  workloadScore: number
  completionRate: number
  efficiency: number
  utilization: number
  riskLevel: string
  allTasks: any[]
  dailyWorkload: { date: string; hours: number; tasks: number }[]
  weeklyWorkload: { week: string; hours: number; tasks: number }[]
  monthlyWorkload: { month: string; hours: number; tasks: number }[]
  maxHoursPerDay: number
  workingDays: string
  studentId?: string | null
  createdAt: Date
  updatedAt: Date
}

// Calculate workload distribution across time periods
function calculateTimeBasedWorkload(tasks: any[]) {
  const now = new Date()
  const dailyData: { [key: string]: { hours: number; tasks: number } } = {}
  const weeklyData: { [key: string]: { hours: number; tasks: number } } = {}
  const monthlyData: { [key: string]: { hours: number; tasks: number } } = {}

  // Initialize the next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + i)
    const dateKey = date.toISOString().split('T')[0]
    dailyData[dateKey] = { hours: 0, tasks: 0 }
  }

  // Initialize the next 12 weeks
  for (let i = 0; i < 12; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + (i * 7))
    const week = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`
    weeklyData[week] = { hours: 0, tasks: 0 }
  }

  // Initialize the next 12 months
  for (let i = 0; i < 12; i++) {
    const date = new Date(now)
    date.setMonth(date.getMonth() + i)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyData[monthKey] = { hours: 0, tasks: 0 }
  }

  // Distribute active tasks across time periods
  tasks.forEach(task => {
    if (task.status === 'COMPLETED') return

    const estimatedHours = task.estimatedHours || 8 // Default 8 hours per task
    const startDate = task.startDate ? new Date(task.startDate) : new Date()
    const endDate = task.endDate ? new Date(task.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    
    // Calculate days between start and end
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    
    // IMPORTANT: For multiple assignments, each person gets the FULL estimated hours
    // Do NOT divide by number of assigned users
    const hoursPerDay = estimatedHours / diffDays

    // Distribute hours across the date range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      if (dailyData[dateKey]) {
        dailyData[dateKey].hours += hoursPerDay
        dailyData[dateKey].tasks += 1 / diffDays // Fractional task distribution
      }

      // Weekly aggregation
      const week = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`
      if (weeklyData[week]) {
        weeklyData[week].hours += hoursPerDay
        weeklyData[week].tasks += 1 / diffDays
      }

      // Monthly aggregation
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].hours += hoursPerDay
        monthlyData[monthKey].tasks += 1 / diffDays
      }
    }
  })

  return {
    daily: Object.entries(dailyData).map(([date, data]) => ({
      date,
      hours: Math.round(data.hours * 10) / 10,
      tasks: Math.round(data.tasks * 10) / 10
    })),
    weekly: Object.entries(weeklyData).map(([week, data]) => ({
      week,
      hours: Math.round(data.hours * 10) / 10,
      tasks: Math.round(data.tasks * 10) / 10
    })),
    monthly: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      hours: Math.round(data.hours * 10) / 10,
      tasks: Math.round(data.tasks * 10) / 10
    }))
  }
}

async function getWorkloadData() {
  const [users, tasks, projects] = await Promise.all([
    prisma.user.findMany({
      include: {
        assignedTasks: {
          include: {
            project: true,
          },
        },
        taskAssignments: {
          include: {
            task: {
              include: {
                project: true,
              },
            },
          },
        },
        projects: {
          include: {
            project: {
              include: {
                tasks: true,
              },
            },
          },
        },
      },
    }),
    prisma.task.findMany({
      include: {
        project: true,
        assignedUser: true,
        assignedUsers: {
          include: {
            user: true,
          },
        },
      },
    }),
    prisma.project.findMany({
      include: {
        tasks: {
          include: {
            assignedUser: true,
            assignedUsers: {
              include: {
                user: true,
              },
            },
          },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    }),
  ])

  // Calculate workload metrics for each user across ALL projects
  const userWorkloads: UserWorkloadData[] = users
    .map((user) => {
      // Get ALL tasks assigned to this user across ALL projects
      const allUserTasks = [
        ...user.assignedTasks,
        ...user.taskAssignments.map((assignment) => assignment.task),
      ]

      // Remove duplicates based on task ID
      const uniqueTasks = allUserTasks.filter(
        (task, index, self) => index === self.findIndex((t) => t.id === task.id)
      )

      const activeTasks = uniqueTasks.filter(
        (task) => task.status === 'TODO' || task.status === 'IN_PROGRESS'
      )
      const completedTasks = uniqueTasks.filter(
        (task) => task.status === 'COMPLETED'
      )
      const reviewTasks = uniqueTasks.filter((task) => task.status === 'REVIEW')
      const overdueTasks = uniqueTasks.filter((task) => {
        if (!task.endDate || task.status === 'COMPLETED') return false
        const taskEndDate = new Date(task.endDate)
        taskEndDate.setHours(23, 59, 59, 999) // End of the day
        return taskEndDate < new Date()
      })

      // Get all active projects this user is involved in
      const activeProjects = user.projects.filter(
        (membership) =>
          membership.project.status === 'IN_PROGRESS' ||
          membership.project.status === 'PLANNING'
      )

      // Calculate time-based workload distribution
      const timeBasedWorkload = calculateTimeBasedWorkload(uniqueTasks)

      // Enhanced workload calculation across all projects
      const workloadScore =
        activeTasks.length * 2 + activeProjects.length + overdueTasks.length * 3
      const completionRate =
        uniqueTasks.length > 0
          ? (completedTasks.length / uniqueTasks.length) * 100
          : 0

      // Performance metrics
      const efficiency =
        overdueTasks.length === 0
          ? 100
          : Math.max(0, 100 - overdueTasks.length * 20)
      const utilization = Math.min(100, activeTasks.length * 25)

      return {
        ...user,
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        reviewTasks: reviewTasks.length,
        overdueTasks: overdueTasks.length,
        activeProjects: activeProjects.length,
        totalTasks: uniqueTasks.length,
        workloadScore,
        completionRate: Math.round(completionRate),
        efficiency: Math.round(efficiency),
        utilization: Math.round(utilization),
        allTasks: uniqueTasks,
        dailyWorkload: timeBasedWorkload.daily,
        weeklyWorkload: timeBasedWorkload.weekly,
        monthlyWorkload: timeBasedWorkload.monthly,
        riskLevel:
          overdueTasks.length >= 3
            ? 'high'
            : overdueTasks.length >= 1
            ? 'medium'
            : 'low',
      }
    })
    .sort((a, b) => b.workloadScore - a.workloadScore)

  // Enhanced department analysis
  const departmentWorkloads = users.reduce((acc, user) => {
    if (!acc[user.department]) {
      acc[user.department] = {
        name: user.department,
        totalUsers: 0,
        totalActiveTasks: 0,
        totalOverdueTasks: 0,
        totalProjects: 0,
        avgWorkloadScore: 0,
        avgCompletionRate: 0,
        avgEfficiency: 0,
        highRiskUsers: 0,
        users: [],
      }
    }

    const userWorkload = userWorkloads.find((u) => u.id === user.id)!
    acc[user.department].totalUsers++
    acc[user.department].totalActiveTasks += userWorkload.activeTasks
    acc[user.department].totalOverdueTasks += userWorkload.overdueTasks
    acc[user.department].totalProjects += userWorkload.activeProjects
    acc[user.department].avgWorkloadScore += userWorkload.workloadScore
    acc[user.department].avgCompletionRate += userWorkload.completionRate
    acc[user.department].avgEfficiency += userWorkload.efficiency
    if (userWorkload.riskLevel === 'high') acc[user.department].highRiskUsers++
    acc[user.department].users.push(userWorkload)

    return acc
  }, {} as Record<string, DepartmentWorkload>)

  // Calculate department averages and risk levels
  Object.values(departmentWorkloads).forEach((dept: DepartmentWorkload) => {
    dept.avgWorkloadScore = Math.round(dept.avgWorkloadScore / dept.totalUsers)
    dept.avgCompletionRate = Math.round(
      dept.avgCompletionRate / dept.totalUsers
    )
    dept.avgEfficiency = Math.round(dept.avgEfficiency / dept.totalUsers)
    dept.riskLevel =
      dept.highRiskUsers >= 2
        ? 'high'
        : dept.totalOverdueTasks >= 5
        ? 'medium'
        : 'low'
    dept.productivity =
      dept.avgCompletionRate >= 80
        ? 'high'
        : dept.avgCompletionRate >= 60
        ? 'medium'
        : 'low'
  })

  // Global metrics
  const totalOverdueTasks = tasks.filter((t) => {
    if (!t.endDate || t.status === 'COMPLETED') return false
    const taskEndDate = new Date(t.endDate)
    taskEndDate.setHours(23, 59, 59, 999) // End of the day
    return taskEndDate < new Date()
  }).length

  const criticalProjects = projects.filter((p) => {
    const overdue =
      p.endDate && (() => {
        const projectEndDate = new Date(p.endDate)
        projectEndDate.setHours(23, 59, 59, 999) // End of the day
        return projectEndDate < new Date()
      })() && p.status !== 'COMPLETED'
    const highRiskTasks = p.tasks.filter((t) => {
      if (!t.endDate || t.status === 'COMPLETED') return false
      const taskEndDate = new Date(t.endDate)
      taskEndDate.setHours(23, 59, 59, 999) // End of the day
      return taskEndDate < new Date()
    }).length
    return overdue || highRiskTasks >= 3
  }).length

  return {
    userWorkloads,
    departmentWorkloads: Object.values(departmentWorkloads),
    totalUsers: users.length,
    totalActiveTasks: tasks.filter((t) => t.status !== 'COMPLETED').length,
    totalActiveProjects: projects.filter((p) => p.status !== 'COMPLETED')
      .length,
    totalOverdueTasks,
    criticalProjects,
    avgCompletionRate: Math.round(
      userWorkloads.reduce((sum, user) => sum + user.completionRate, 0) /
        userWorkloads.length
    ),
    avgEfficiency: Math.round(
      userWorkloads.reduce((sum, user) => sum + user.efficiency, 0) /
        userWorkloads.length
    ),
  }
}

function getWorkloadColor(score: number) {
  if (score >= 10) return 'bg-red-100 text-red-800 border-red-200'
  if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (score >= 3) return 'bg-blue-100 text-blue-800 border-blue-200'
  return 'bg-green-100 text-green-800 border-green-200'
}

function getWorkloadText(score: number) {
  if (score >= 10) return 'Kritik'
  if (score >= 6) return 'Yüksek'
  if (score >= 3) return 'Orta'
  return 'Düşük'
}

function getRiskColor(level?: string) {
  switch (level) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-green-100 text-green-800 border-green-200'
  }
}

function getRiskText(level?: string) {
  switch (level) {
    case 'high':
      return 'Yüksek Risk'
    case 'medium':
      return 'Orta Risk'
    default:
      return 'Düşük Risk'
  }
}

function getProductivityColor(level?: string) {
  switch (level) {
    case 'high':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-red-100 text-red-800'
  }
}

function getProductivityText(level?: string) {
  switch (level) {
    case 'high':
      return 'Yüksek Verimlilik'
    case 'medium':
      return 'Orta Verimlilik'
    default:
      return 'Düşük Verimlilik'
  }
}

export default async function WorkloadPage() {
  const {
    userWorkloads,
    departmentWorkloads,
    totalUsers,
    totalActiveTasks,
    totalActiveProjects,
    totalOverdueTasks,
    criticalProjects,
    avgCompletionRate,
    avgEfficiency,
  } = await getWorkloadData()

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Navbar />

      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Yönetici Dashboard'u
              </h1>
              <p className='text-gray-600 mt-1'>
                İş yükü analizi ve departman performansı
              </p>
            </div>
            <div className='text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow'>
              Son güncelleme: {formatDate(new Date())}
            </div>
          </div>

          {/* Critical Alerts */}
          {(totalOverdueTasks > 0 || criticalProjects > 0) && (
            <div className='mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <AlertTriangle className='h-5 w-5 text-red-400' />
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>
                    Acil Dikkat Gereken Durumlar
                  </h3>
                  <div className='mt-2 text-sm text-red-700'>
                    <ul className='list-disc pl-5 space-y-1'>
                      {totalOverdueTasks > 0 && (
                        <li>
                          {totalOverdueTasks} adet gecikmiş görev bulunmaktadır
                        </li>
                      )}
                      {criticalProjects > 0 && (
                        <li>
                          {criticalProjects} adet kritik durumda proje
                          bulunmaktadır
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Overview Stats */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8'>
            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <Users className='h-8 w-8 text-blue-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Toplam Çalışan
                      </dt>
                      <dd className='text-2xl font-bold text-gray-900'>
                        {totalUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <Activity className='h-8 w-8 text-orange-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Aktif Görevler
                      </dt>
                      <dd className='text-2xl font-bold text-gray-900'>
                        {totalActiveTasks}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <Target className='h-8 w-8 text-purple-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Aktif Projeler
                      </dt>
                      <dd className='text-2xl font-bold text-gray-900'>
                        {totalActiveProjects}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <AlertTriangle className='h-8 w-8 text-red-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Gecikmiş Görevler
                      </dt>
                      <dd className='text-2xl font-bold text-red-600'>
                        {totalOverdueTasks}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <Award className='h-8 w-8 text-green-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Ort. Tamamlama
                      </dt>
                      <dd className='text-2xl font-bold text-green-600'>
                        %{avgCompletionRate}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <Zap className='h-8 w-8 text-indigo-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Ort. Verimlilik
                      </dt>
                      <dd className='text-2xl font-bold text-indigo-600'>
                        %{avgEfficiency}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workload Distribution Overview */}
          <div className='bg-white shadow-xl rounded-2xl border border-gray-100 mb-8'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600'>
              <h3 className='text-lg font-semibold text-white flex items-center'>
                <BarChart3 className='w-5 h-5 mr-2' />
                İş Yükü Dağılım Görünümü
              </h3>
            </div>
            <div className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <div className='text-2xl font-bold text-green-600'>
                    {userWorkloads.filter(u => u.workloadScore <= 5).length}
                  </div>
                  <div className='text-sm text-gray-600'>Düşük Yük</div>
                  <div className='text-xs text-gray-500'>0-5 puan</div>
                </div>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {userWorkloads.filter(u => u.workloadScore > 5 && u.workloadScore <= 10).length}
                  </div>
                  <div className='text-sm text-gray-600'>Normal Yük</div>
                  <div className='text-xs text-gray-500'>6-10 puan</div>
                </div>
                <div className='text-center p-4 bg-yellow-50 rounded-lg'>
                  <div className='text-2xl font-bold text-yellow-600'>
                    {userWorkloads.filter(u => u.workloadScore > 10 && u.workloadScore <= 15).length}
                  </div>
                  <div className='text-sm text-gray-600'>Yüksek Yük</div>
                  <div className='text-xs text-gray-500'>11-15 puan</div>
                </div>
                <div className='text-center p-4 bg-red-50 rounded-lg'>
                  <div className='text-2xl font-bold text-red-600'>
                    {userWorkloads.filter(u => u.workloadScore > 15).length}
                  </div>
                  <div className='text-sm text-gray-600'>Kritik Yük</div>
                  <div className='text-xs text-gray-500'>15+ puan</div>
                </div>
              </div>

              {/* Visual Workload Bar */}
              <div className='mb-4'>
                <div className='flex justify-between text-sm text-gray-600 mb-2'>
                  <span>Genel İş Yükü Dağılımı</span>
                  <span>Toplam {userWorkloads.length} çalışan</span>
                </div>
                <div className='flex h-4 bg-gray-200 rounded-full overflow-hidden'>
                  <div 
                    className='bg-green-500 transition-all duration-500'
                    style={{ width: `${(userWorkloads.filter(u => u.workloadScore <= 5).length / userWorkloads.length) * 100}%` }}
                    title={`Düşük Yük: ${userWorkloads.filter(u => u.workloadScore <= 5).length} kişi`}
                  ></div>
                  <div 
                    className='bg-blue-500 transition-all duration-500'
                    style={{ width: `${(userWorkloads.filter(u => u.workloadScore > 5 && u.workloadScore <= 10).length / userWorkloads.length) * 100}%` }}
                    title={`Normal Yük: ${userWorkloads.filter(u => u.workloadScore > 5 && u.workloadScore <= 10).length} kişi`}
                  ></div>
                  <div 
                    className='bg-yellow-500 transition-all duration-500'
                    style={{ width: `${(userWorkloads.filter(u => u.workloadScore > 10 && u.workloadScore <= 15).length / userWorkloads.length) * 100}%` }}
                    title={`Yüksek Yük: ${userWorkloads.filter(u => u.workloadScore > 10 && u.workloadScore <= 15).length} kişi`}
                  ></div>
                  <div 
                    className='bg-red-500 transition-all duration-500'
                    style={{ width: `${(userWorkloads.filter(u => u.workloadScore > 15).length / userWorkloads.length) * 100}%` }}
                    title={`Kritik Yük: ${userWorkloads.filter(u => u.workloadScore > 15).length} kişi`}
                  ></div>
                </div>
              </div>

              {/* Legend */}
              <div className='flex flex-wrap gap-4 text-xs'>
                <div className='flex items-center'>
                  <div className='w-3 h-3 bg-green-500 rounded-full mr-2'></div>
                  <span>Düşük Yük (Ek görev alabilir)</span>
                </div>
                <div className='flex items-center'>
                  <div className='w-3 h-3 bg-blue-500 rounded-full mr-2'></div>
                  <span>Normal Yük (Optimal düzey)</span>
                </div>
                <div className='flex items-center'>
                  <div className='w-3 h-3 bg-yellow-500 rounded-full mr-2'></div>
                  <span>Yüksek Yük (İzleme gerekli)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Department Analysis */}
          <div className='grid grid-cols-1 gap-8 mb-8'>
            {/* Top Performers & Risk Analysis */}
            <div className='space-y-6'>
            </div>
          </div>

          {/* Time-Based Workload Analysis */}
          <WorkloadAnalysisView userWorkloads={userWorkloads} />

          {/* Enhanced Individual Workload Management */}
          <div className='bg-white shadow-xl rounded-2xl border border-gray-100'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600'>
              <h3 className='text-lg font-semibold text-white flex items-center'>
                <Users className='w-5 h-5 mr-2' />
                Bireysel İş Yükü Yönetimi
              </h3>
            </div>
            <div className='p-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                {userWorkloads.map((user) => (
                  <div
                    key={user.id}
                    className='border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-indigo-200'
                  >
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                            user.riskLevel === 'high'
                              ? 'bg-red-500'
                              : user.riskLevel === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className='font-semibold text-gray-900'>
                            {user.name}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {user.department}
                          </div>
                          <div className='text-xs text-gray-400'>
                            {user.position}
                          </div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${getWorkloadColor(
                            user.workloadScore
                          )}`}
                        >
                          {getWorkloadText(user.workloadScore)}
                        </span>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className='grid grid-cols-2 gap-3 mb-4'>
                      <div className='text-center p-3 bg-blue-50 rounded-lg'>
                        <div className='text-xl font-bold text-blue-600'>
                          {user.activeTasks}
                        </div>
                        <div className='text-xs text-gray-600'>Aktif</div>
                      </div>
                      <div className='text-center p-3 bg-green-50 rounded-lg'>
                        <div className='text-xl font-bold text-green-600'>
                          {user.completedTasks}
                        </div>
                        <div className='text-xs text-gray-600'>Tamamlanan</div>
                      </div>
                    </div>

                    {/* Risk Indicators */}
                    {user.overdueTasks > 0 && (
                      <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center'>
                            <AlertTriangle className='w-4 h-4 text-red-600 mr-2' />
                            <span className='text-sm text-red-800'>
                              Gecikmiş: {user.overdueTasks}
                            </span>
                          </div>
                          <span className='text-xs text-red-600 font-medium'>
                            Acil!
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Performance Bars */}
                    <div className='space-y-3'>
                      {/* Workload Percentage Bar */}
                      <div>
                        <div className='flex justify-between text-sm text-gray-600 mb-1'>
                          <span>İş Yükü</span>
                          <span>{Math.min(100, Math.round((user.workloadScore / 20) * 100))}%</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              user.workloadScore >= 15
                                ? 'bg-red-500'
                                : user.workloadScore >= 10
                                ? 'bg-yellow-500'
                                : user.workloadScore >= 5
                                ? 'bg-blue-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (user.workloadScore / 20) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className='flex justify-between text-sm text-gray-600 mb-1'>
                          <span>Tamamlama Oranı</span>
                          <span>{user.completionRate}%</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              user.completionRate >= 80
                                ? 'bg-green-500'
                                : user.completionRate >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${user.completionRate}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className='flex justify-between text-sm text-gray-600 mb-1'>
                          <span>Kullanım Oranı</span>
                          <span>{user.utilization}%</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              user.utilization >= 90
                                ? 'bg-red-500'
                                : user.utilization >= 70
                                ? 'bg-yellow-500'
                                : user.utilization >= 50
                                ? 'bg-blue-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${user.utilization}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Active Tasks Preview */}
                    {user.activeTasks > 0 && (
                      <div className='mt-4 pt-4 border-t border-gray-100'>
                        <div className='text-sm font-medium text-gray-700 mb-2'>
                          Son Görevler:
                        </div>
                        <div className='space-y-2'>
                          {user.allTasks
                            .filter(
                              (task) =>
                                task.status === 'TODO' ||
                                task.status === 'IN_PROGRESS'
                            )
                            .slice(0, 2)
                            .map((task) => (
                              <div
                                key={task.id}
                                className='flex items-center justify-between text-xs bg-gray-50 p-2 rounded'
                              >
                                <div className='flex-1 truncate'>
                                  <span className='font-medium'>
                                    {task.title}
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    task.status === 'IN_PROGRESS'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {task.status === 'TODO'
                                    ? 'Bekliyor'
                                    : 'Devam'}
                                </span>
                              </div>
                            ))}
                          {user.activeTasks > 2 && (
                            <div className='text-xs text-gray-500 text-center'>
                              +{user.activeTasks - 2} görev daha
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
