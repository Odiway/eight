import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        tasks: {
          include: {
            assignedUsers: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    const debug = {
      timestamp: new Date().toISOString(),
      projectsCount: projects.length,
      projectsDetails: projects.map(p => ({
        id: p.id,
        name: p.name,
        membersCount: p.members.length,
        tasksCount: p.tasks.length,
        members: p.members.map(m => ({
          userId: m.user.id,
          userName: m.user.name,
          role: m.role
        })),
        tasks: p.tasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          assignedUsersCount: t.assignedUsers.length
        }))
      }))
    }

    return NextResponse.json(debug)
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
