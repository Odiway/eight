import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch all projects with minimal required data for Master Gantt
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            estimatedHours: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    // Transform data for Master Gantt Chart
    const transformedProjects = projects.map(project => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter((task: any) => task.status === 'COMPLETED').length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // Check if project is delayed
      const today = new Date()
      const isDelayed = project.endDate && today > project.endDate && project.status !== 'COMPLETED'
      const delayDays = isDelayed && project.endDate 
        ? Math.ceil((today.getTime() - project.endDate.getTime()) / (1000 * 60 * 60 * 24))
        : project.delayDays

      // Get project manager (first member with Manager or Admin role or first member)
      const manager = project.members.find((member: any) => 
        member.role === 'Manager' || member.role === 'Admin' || member.role === 'Lead'
      ) || project.members[0]

      // Create milestones from tasks (approximate milestones based on important tasks)
      const importantTasks = project.tasks.filter((task: any) => 
        task.status === 'COMPLETED' || task.estimatedHours && task.estimatedHours >= 40
      ).slice(0, 3) // Take up to 3 important tasks as milestones

      const milestones = importantTasks.map((task: any, index: number) => ({
        id: `milestone_${task.id}`,
        title: `Kilometre Taşı ${index + 1}`,
        date: project.endDate ? new Date(project.endDate.getTime() - (importantTasks.length - index) * 7 * 24 * 60 * 60 * 1000) : new Date(),
        completed: task.status === 'COMPLETED'
      }))

      return {
        id: project.id,
        name: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        progress,
        priority: project.priority,
        teamCount: project.members.length,
        taskCount: totalTasks,
        completedTasks,
        budget: null, // Not available in current schema
        spent: null, // Not available in current schema
        manager: manager ? {
          id: manager.user.id,
          name: manager.user.name,
        } : null,
        isDelayed: Boolean(isDelayed),
        delayDays: delayDays || 0,
        milestones: milestones,
      }
    })

    // Calculate overall stats
    const stats = {
      totalProjects: transformedProjects.length,
      activeProjects: transformedProjects.filter(p => p.status === 'IN_PROGRESS').length,
      completedProjects: transformedProjects.filter(p => p.status === 'COMPLETED').length,
      delayedProjects: transformedProjects.filter(p => p.isDelayed).length,
      totalBudget: transformedProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
      totalSpent: transformedProjects.reduce((sum, p) => sum + (p.spent || 0), 0),
      avgProgress: transformedProjects.length > 0 
        ? Math.round(transformedProjects.reduce((sum, p) => sum + p.progress, 0) / transformedProjects.length)
        : 0,
    }

    return NextResponse.json({
      projects: transformedProjects,
      stats,
    })
  } catch (error) {
    console.error('Error fetching master gantt data:', error)
    return NextResponse.json(
      { 
        error: 'Master Gantt verileri alınamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    )
  }
}