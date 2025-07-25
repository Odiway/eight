import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 })
    }

    const workloadData: Record<string, any> = {}

    // Get workload data for each user
    for (const userId of userIds) {
      // Get all tasks assigned to this user (both legacy and new assignment system)
      const userTasks = await prisma.task.findMany({
        where: {
          OR: [
            { assignedId: userId }, // Legacy assignment
            { 
              assignedUsers: {
                some: { userId: userId }
              }
            } // New multiple assignment system
          ]
        },
        include: {
          project: true,
          assignedUsers: {
            include: {
              user: true
            }
          }
        }
      })

      // Calculate workload metrics
      const activeTasks = userTasks.filter(task => 
        task.status === 'TODO' || task.status === 'IN_PROGRESS'
      )

      const completedTasks = userTasks.filter(task => 
        task.status === 'COMPLETED'
      )

      const overdueTasks = userTasks.filter(task => {
        if (!task.endDate || task.status === 'COMPLETED') return false
        return new Date(task.endDate) < new Date()
      })

      // Calculate weekly hours from active tasks
      const now = new Date()
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

      let weeklyHours = 0
      let maxWeeklyCapacity = 40 // Default 40 hours per week
      
      activeTasks.forEach(task => {
        if (task.estimatedHours && task.startDate && task.endDate) {
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          
          // Calculate overlap with current week
          const overlapStart = new Date(Math.max(taskStart.getTime(), weekStart.getTime()))
          const overlapEnd = new Date(Math.min(taskEnd.getTime(), weekEnd.getTime()))
          
          if (overlapStart < overlapEnd) {
            // Use maxDailyHours if available for more accurate calculation
            if ((task as any).maxDailyHours) {
              const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))
              const maxDailyForThisTask = (task as any).maxDailyHours
              const maxHoursForTaskThisWeek = Math.min(overlapDays * maxDailyForThisTask, task.estimatedHours || 0)
              weeklyHours += maxHoursForTaskThisWeek
              
              // Update weekly capacity based on actual task constraints
              const taskWeeklyCapacity = Math.min(5 * maxDailyForThisTask, 40) // Max 5 working days
              maxWeeklyCapacity = Math.max(maxWeeklyCapacity, taskWeeklyCapacity)
            } else {
              // Fallback to old calculation
              const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))
              const taskDuration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24))
              const hoursThisWeek = (task.estimatedHours * overlapDays) / Math.max(taskDuration, 1)
              weeklyHours += hoursThisWeek
            }
          }
        }
      })

      // Calculate completion rate
      const totalTasks = userTasks.length
      const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 100

      // Calculate utilization based on actual capacity
      const utilization = Math.min(100, Math.round((weeklyHours / maxWeeklyCapacity) * 100))

      workloadData[userId] = {
        userId,
        activeTasks: activeTasks.length,
        weeklyHours: Math.round(weeklyHours),
        utilization,
        overdueTasks: overdueTasks.length,
        completionRate
      }
    }

    return NextResponse.json(workloadData)
  } catch (error) {
    console.error('Error fetching workload data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workload data' },
      { status: 500 }
    )
  }
}
