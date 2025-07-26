import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        assignedTasks: {
          include: {
            project: true,
            workflowStep: true,
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if new email conflicts with another user
    if (body.email && body.email !== existingUser.email) {
      const emailConflict = await prisma.user.findFirst({
        where: { 
          email: body.email,
          id: { not: id },
        },
      })

      if (emailConflict) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: body.name || existingUser.name,
        email: body.email || existingUser.email,
        department: body.department || existingUser.department,
        position: body.position || existingUser.position,
        photo: body.photo !== undefined ? body.photo : existingUser.photo,
        maxHoursPerDay: body.maxHoursPerDay || existingUser.maxHoursPerDay,
        workingDays: body.workingDays || existingUser.workingDays,
      },
      include: {
        assignedTasks: {
          include: {
            project: true,
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
    })

    // Invalidate caches
    revalidatePath('/team')
    revalidatePath('/projects')

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if user exists and get related data
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        assignedTasks: true,
        projects: true,
        teamMembers: true,
        taskAssignments: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has active tasks
    const activeTasks = user.assignedTasks.filter(
      task => task.status === 'TODO' || task.status === 'IN_PROGRESS'
    )

    if (activeTasks.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete user with ${activeTasks.length} active tasks. Please reassign or complete these tasks first.`,
          activeTasks: activeTasks.length,
        },
        { status: 400 }
      )
    }

    // Delete user (cascade will handle related data)
    await prisma.user.delete({
      where: { id },
    })

    // Invalidate caches
    revalidatePath('/team')
    revalidatePath('/projects')

    return NextResponse.json({ 
      message: 'User deleted successfully',
      deletedData: {
        userName: user.name,
        email: user.email,
        projectsRemoved: user.projects.length,
        teamsRemoved: user.teamMembers.length,
        tasksReassigned: user.assignedTasks.length,
      }
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
