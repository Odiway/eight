import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignedUser: true,
            workflowStep: true,
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
        workflowSteps: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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

    const project = await prisma.project.update({
      where: { id: id },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        priority: body.priority,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
      include: {
        tasks: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
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
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
        members: true,
        workflowSteps: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete the project (cascade will handle related data)
    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ 
      message: 'Project deleted successfully',
      deletedData: {
        projectName: project.name,
        tasksDeleted: project.tasks.length,
        membersRemoved: project.members.length,
        workflowStepsDeleted: project.workflowSteps.length,
      }
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete project', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
