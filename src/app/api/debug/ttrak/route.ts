import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get the TTRAK project specifically
    const ttrakProject = await prisma.project.findFirst({
      where: {
        name: 'TTRAK'
      },
      include: {
        tasks: {
          include: {
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
    })

    if (!ttrakProject) {
      return NextResponse.json({ error: 'TTRAK project not found' }, { status: 404 })
    }

    const stats = {
      projectId: ttrakProject.id,
      projectName: ttrakProject.name,
      status: ttrakProject.status,
      totalTasks: ttrakProject.tasks.length,
      totalMembers: ttrakProject.members.length,
      taskDetails: ttrakProject.tasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        assignedUsersCount: task.assignedUsers.length,
        assignedUsers: task.assignedUsers.map(au => au.user.name)
      })),
      memberDetails: ttrakProject.members.map(member => ({
        id: member.id,
        name: member.user.name,
        role: member.role
      }))
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
