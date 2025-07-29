import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTasks: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
                priority: true,
                startDate: true,
                endDate: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        taskAssignments: {
          include: {
            task: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    priority: true,
                    startDate: true,
                    endDate: true,
                  },
                },
              },
            },
          },
          orderBy: {
            task: {
              createdAt: 'desc',
            },
          },
        },
        projects: {
          include: {
            project: {
              include: {
                tasks: {
                  where: {
                    OR: [
                      { assignedId: userId },
                      {
                        assignedUsers: {
                          some: {
                            userId: userId,
                          },
                        },
                      },
                    ],
                  },
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    estimatedHours: true,
                    actualHours: true,
                    startDate: true,
                    endDate: true,
                  },
                },
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        position: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        teamMembers: {
          include: {
            team: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        position: true,
                        department: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        workloadAnalysis: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Combine tasks from both sources and remove duplicates
    const allUserTasks = [
      ...user.assignedTasks,
      ...user.taskAssignments.map(assignment => assignment.task)
    ]

    const uniqueTasks = allUserTasks.filter((task, index, array) => 
      array.findIndex(t => t.id === task.id) === index
    )

    // Calculate comprehensive statistics
    const stats = {
      totalTasks: uniqueTasks.length,
      activeTasks: uniqueTasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length,
      completedTasks: uniqueTasks.filter(t => t.status === 'COMPLETED').length,
      reviewTasks: uniqueTasks.filter(t => t.status === 'REVIEW').length,
      blockedTasks: uniqueTasks.filter(t => t.status === 'BLOCKED').length,
      totalProjects: user.projects.length,
      activeProjects: user.projects.filter(p => 
        p.project.status === 'IN_PROGRESS' || p.project.status === 'PLANNING'
      ).length,
      completedProjects: user.projects.filter(p => p.project.status === 'COMPLETED').length,
      totalEstimatedHours: uniqueTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      totalActualHours: uniqueTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
      totalTeams: user.teamMembers.length,
    }

    // Calculate workload efficiency
    const efficiency = stats.totalEstimatedHours > 0 
      ? (stats.totalActualHours / stats.totalEstimatedHours) * 100 
      : 0

    // Group tasks by status for better organization
    const tasksByStatus = {
      todo: uniqueTasks.filter(t => t.status === 'TODO'),
      inProgress: uniqueTasks.filter(t => t.status === 'IN_PROGRESS'),
      completed: uniqueTasks.filter(t => t.status === 'COMPLETED'),
      review: uniqueTasks.filter(t => t.status === 'REVIEW'),
      blocked: uniqueTasks.filter(t => t.status === 'BLOCKED'),
    }

    // Group tasks by priority
    const tasksByPriority = {
      high: uniqueTasks.filter(t => t.priority === 'HIGH'),
      medium: uniqueTasks.filter(t => t.priority === 'MEDIUM'),
      low: uniqueTasks.filter(t => t.priority === 'LOW'),
    }

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTasks = uniqueTasks.filter(task => 
      task.startDate && new Date(task.startDate) >= thirtyDaysAgo
    )

    const userDetails = {
      ...user,
      tasks: uniqueTasks,
      stats: {
        ...stats,
        efficiency: Math.round(efficiency),
        averageTaskHours: stats.totalTasks > 0 ? Math.round(stats.totalEstimatedHours / stats.totalTasks) : 0,
      },
      tasksByStatus,
      tasksByPriority,
      recentActivity: {
        recentTasks: recentTasks.slice(0, 5),
        tasksStartedThisMonth: recentTasks.length,
      },
    }

    return NextResponse.json(userDetails)
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}
