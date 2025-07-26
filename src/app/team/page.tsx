import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import TeamView from '@/components/TeamView'
import { Users, UserPlus, Plus } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getTeamData() {
  const users = await prisma.user.findMany({
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
          project: true,
        },
      },
      teamMembers: {
        include: {
          team: true,
        },
      },
    },
    orderBy: {
      department: 'asc',
    },
  })

  const teams = await prisma.team.findMany({
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Calculate stats for each user
  const usersWithStats = users.map((user) => {
    // Combine tasks from both assignedTasks (legacy) and taskAssignments (new)
    const allUserTasks = [
      ...user.assignedTasks,
      ...user.taskAssignments.map(assignment => assignment.task)
    ];

    // Remove duplicates (in case a task is in both arrays)
    const uniqueTasks = allUserTasks.filter((task, index, array) => 
      array.findIndex(t => t.id === task.id) === index
    );

    const activeTasks = uniqueTasks.filter(
      (task) => task.status === 'TODO' || task.status === 'IN_PROGRESS'
    )
    const completedTasks = uniqueTasks.filter(
      (task) => task.status === 'COMPLETED'
    )
    const activeProjects = user.projects.filter(
      (membership) =>
        membership.project.status === 'IN_PROGRESS' ||
        membership.project.status === 'PLANNING'
    )

    return {
      ...user,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      activeProjects: activeProjects.length,
      totalTasks: uniqueTasks.length,
    }
  })

  // Group by department
  const departments = usersWithStats.reduce((acc, user) => {
    if (!acc[user.department]) {
      acc[user.department] = []
    }
    acc[user.department].push(user)
    return acc
  }, {} as Record<string, typeof usersWithStats>)

  return {
    users: usersWithStats,
    teams,
    departments,
    totalUsers: users.length,
    totalTeams: teams.length,
    departmentCount: Object.keys(departments).length,
  }
}

export default async function TeamPage() {
  const { users, teams, totalUsers, totalTeams, departmentCount } = await getTeamData()

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />

      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-blue-600 rounded-xl'>
                <Users className='w-7 h-7 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Takım Yönetimi
                </h1>
                <p className='text-gray-600'>
                  {totalUsers} çalışan, {totalTeams} takım, {departmentCount} departman
                </p>
              </div>
            </div>

            <div className='flex space-x-3'>
              <Link
                href='/team/new'
                className='inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors duration-200'
              >
                <UserPlus className='w-4 h-4 mr-2' />
                Yeni Kullanıcı
              </Link>
              <Link
                href='/team/new-team'
                className='inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors duration-200 shadow-lg'
              >
                <Plus className='w-4 h-4 mr-2' />
                Yeni Takım
              </Link>
            </div>
          </div>

          {/* Team Stats Overview */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white overflow-hidden shadow rounded-lg'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>
                        {totalUsers}
                      </span>
                    </div>
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Toplam Çalışan
                      </dt>
                      <dd className='text-lg font-medium text-gray-900'>
                        {totalUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow rounded-lg'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>
                        {departmentCount}
                      </span>
                    </div>
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Departman
                      </dt>
                      <dd className='text-lg font-medium text-gray-900'>
                        {departmentCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow rounded-lg'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>
                        {users.reduce((sum, user) => sum + user.activeTasks, 0)}
                      </span>
                    </div>
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Aktif Görevler
                      </dt>
                      <dd className='text-lg font-medium text-gray-900'>
                        {users.reduce((sum, user) => sum + user.activeTasks, 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow rounded-lg'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>
                        {users.reduce(
                          (sum, user) => sum + user.activeProjects,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Aktif Projeler
                      </dt>
                      <dd className='text-lg font-medium text-gray-900'>
                        {users.reduce(
                          (sum, user) => sum + user.activeProjects,
                          0
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Filter and View */}
          <TeamView initialUsers={users} initialTeams={teams} />
        </div>
      </div>
    </div>
  )
}
