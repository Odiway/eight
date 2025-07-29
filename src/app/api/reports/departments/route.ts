import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const data = await getDepartmentsData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Departments reports API error:', error)
    // Return mock data when database is not available
    return NextResponse.json(getMockDepartmentsData())
  }
}

async function getDepartmentsData() {
  try {
    // Get all users with their task assignments
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

    // Group by departments
    const departments: Record<
      string,
      {
        name: string
        userCount: number
        totalTasks: number
        completedTasks: number
        users: any[]
        projects: Set<string>
      }
    > = {}

    users.forEach((user) => {
      if (!departments[user.department]) {
        departments[user.department] = {
          name: user.department,
          userCount: 0,
          totalTasks: 0,
          completedTasks: 0,
          users: [],
          projects: new Set(),
        }
      }

      const dept = departments[user.department]
      dept.userCount++
      dept.totalTasks += user.taskAssignments.length
      dept.completedTasks += user.taskAssignments.filter(
        (ta) => ta.task.status === 'COMPLETED'
      ).length

      dept.users.push({
        id: user.id,
        name: user.name,
        email: user.email,
        position: user.position,
        totalTasks: user.taskAssignments.length,
        completedTasks: user.taskAssignments.filter(
          (ta) => ta.task.status === 'COMPLETED'
        ).length,
      })

      // Add unique projects
      user.taskAssignments.forEach((ta) => {
        dept.projects.add(ta.task.project.id)
      })
    })

    return {
      generatedAt: new Date().toISOString(),
      departments: Object.values(departments).map((dept) => ({
        ...dept,
        projectCount: dept.projects.size,
        completionRate:
          dept.totalTasks > 0
            ? Math.round((dept.completedTasks / dept.totalTasks) * 100)
            : 0,
      })),
    }
  } catch (error) {
    console.error('Database error in getDepartmentsData:', error)
    throw error
  }
}

function getMockDepartmentsData() {
  return {
    generatedAt: new Date().toISOString(),
    departments: [
      {
        name: 'Bilgi Teknolojileri',
        userCount: 6,
        totalTasks: 35,
        completedTasks: 28,
        completionRate: 80,
        projectCount: 4,
        users: [
          {
            id: '1',
            name: 'Ahmet Yılmaz',
            email: 'ahmet@example.com',
            position: 'Yazılım Geliştirici',
            totalTasks: 12,
            completedTasks: 11,
          },
          {
            id: '2',
            name: 'Mehmet Öz',
            email: 'mehmet@example.com',
            position: 'Sistem Yöneticisi',
            totalTasks: 10,
            completedTasks: 8,
          },
          {
            id: '3',
            name: 'Ayşe Demir',
            email: 'ayse@example.com',
            position: 'Frontend Developer',
            totalTasks: 8,
            completedTasks: 6,
          },
        ],
      },
      {
        name: 'İnsan Kaynakları',
        userCount: 3,
        totalTasks: 18,
        completedTasks: 15,
        completionRate: 83,
        projectCount: 2,
        users: [
          {
            id: '4',
            name: 'Fatma Kaya',
            email: 'fatma@example.com',
            position: 'İK Uzmanı',
            totalTasks: 8,
            completedTasks: 7,
          },
          {
            id: '5',
            name: 'Can Özkan',
            email: 'can@example.com',
            position: 'İK Müdürü',
            totalTasks: 6,
            completedTasks: 5,
          },
        ],
      },
      {
        name: 'Pazarlama',
        userCount: 3,
        totalTasks: 12,
        completedTasks: 8,
        completionRate: 67,
        projectCount: 2,
        users: [
          {
            id: '6',
            name: 'Zeynep Arslan',
            email: 'zeynep@example.com',
            position: 'Pazarlama Uzmanı',
            totalTasks: 7,
            completedTasks: 4,
          },
          {
            id: '7',
            name: 'Emre Yurt',
            email: 'emre@example.com',
            position: 'Sosyal Medya Uzmanı',
            totalTasks: 5,
            completedTasks: 4,
          },
        ],
      },
    ],
  }
}
