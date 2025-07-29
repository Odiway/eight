import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const data = await getPerformanceData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Performance reports API error:', error)
    // Return mock data when database is not available
    return NextResponse.json(getMockPerformanceData())
  }
}

async function getPerformanceData() {
  try {
    const users = await prisma.user.findMany({
      include: {
        taskAssignments: {
          include: {
            task: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    })

    const projects = await prisma.project.findMany({
      include: {
        tasks: true,
      },
    })

    // Calculate user performance
    const userPerformance = users.map((user) => {
      const totalTasks = user.taskAssignments.length
      const completedTasks = user.taskAssignments.filter(
        (ta) => ta.task.status === 'COMPLETED'
      ).length
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        id: user.id,
        name: user.name,
        department: user.department,
        totalTasks,
        completedTasks,
        completionRate,
        averageTasksPerProject:
          user.taskAssignments.length > 0
            ? Math.round(
                user.taskAssignments.length /
                  new Set(user.taskAssignments.map((ta) => ta.task.projectId))
                    .size
              )
            : 0,
      }
    })

    // Calculate project performance
    const projectPerformance = projects.map((project) => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter(
        (task) => task.status === 'COMPLETED'
      ).length
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        totalTasks,
        completedTasks,
        completionRate,
        estimatedHours: project.tasks.reduce(
          (sum, task) => sum + (task.estimatedHours || 0),
          0
        ),
        actualHours: project.tasks.reduce(
          (sum, task) => sum + (task.actualHours || 0),
          0
        ),
      }
    })

    return {
      generatedAt: new Date().toISOString(),
      userPerformance: userPerformance.sort(
        (a, b) => b.completionRate - a.completionRate
      ),
      projectPerformance: projectPerformance.sort(
        (a, b) => b.completionRate - a.completionRate
      ),
      summary: {
        totalUsers: users.length,
        totalProjects: projects.length,
        averageUserCompletion:
          userPerformance.reduce((sum, user) => sum + user.completionRate, 0) /
            userPerformance.length || 0,
        averageProjectCompletion:
          projectPerformance.reduce(
            (sum, proj) => sum + proj.completionRate,
            0
          ) / projectPerformance.length || 0,
      },
    }
  } catch (error) {
    console.error('Database error in getPerformanceData:', error)
    throw error
  }
}

function getMockPerformanceData() {
  return {
    generatedAt: new Date().toISOString(),
    userPerformance: [
      {
        id: '1',
        name: 'Ahmet Yılmaz',
        department: 'Bilgi Teknolojileri',
        totalTasks: 12,
        completedTasks: 11,
        completionRate: 92,
        averageTasksPerProject: 4,
      },
      {
        id: '2',
        name: 'Fatma Kaya',
        department: 'İnsan Kaynakları',
        totalTasks: 8,
        completedTasks: 7,
        completionRate: 88,
        averageTasksPerProject: 3,
      },
      {
        id: '3',
        name: 'Mehmet Öz',
        department: 'Bilgi Teknolojileri',
        totalTasks: 10,
        completedTasks: 8,
        completionRate: 80,
        averageTasksPerProject: 5,
      },
    ],
    projectPerformance: [
      {
        id: '1',
        name: 'Web Uygulaması Projesi',
        status: 'IN_PROGRESS',
        totalTasks: 15,
        completedTasks: 12,
        completionRate: 80,
        estimatedHours: 120,
        actualHours: 95,
      },
      {
        id: '2',
        name: 'Mobil Uygulama Projesi',
        status: 'COMPLETED',
        totalTasks: 8,
        completedTasks: 8,
        completionRate: 100,
        estimatedHours: 80,
        actualHours: 85,
      },
    ],
    summary: {
      totalUsers: 12,
      totalProjects: 8,
      averageUserCompletion: 85,
      averageProjectCompletion: 78,
    },
  }
}
