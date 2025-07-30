import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/tasks/[id]/status-notes - Get all status notes for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Get status notes for the task
    const statusNotes = await prisma.taskStatusNote.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Transform the data to match our frontend interface
    const transformedNotes = statusNotes.map((note: any) => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      createdBy: note.createdBy?.name || 'Unknown User',
      status: note.status,
    }))

    return NextResponse.json(transformedNotes)
  } catch (error) {
    console.error('Error fetching status notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status notes' },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/status-notes - Create a new status note for a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id
    const body = await request.json()
    const { content, status } = body

    // Validate required fields
    if (!content || !status) {
      return NextResponse.json(
        { error: 'Content and status are required' },
        { status: 400 }
      )
    }

    // Validate status enum
    const validStatuses = ['INFO', 'WARNING', 'SUCCESS', 'ERROR']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // For now, we'll use a default user ID or get from session/auth
    // In a real app, you'd get this from the authenticated user
    const defaultUserId = await getDefaultUserId()

    // Create the status note
    const statusNote = await prisma.taskStatusNote.create({
      data: {
        content: content.trim(),
        status,
        taskId,
        createdById: defaultUserId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Transform the response to match our frontend interface
    const transformedNote = {
      id: statusNote.id,
      content: statusNote.content,
      createdAt: statusNote.createdAt.toISOString(),
      createdBy: statusNote.createdBy?.name || 'Unknown User',
      status: statusNote.status,
    }

    return NextResponse.json(transformedNote, { status: 201 })
  } catch (error) {
    console.error('Error creating status note:', error)
    return NextResponse.json(
      { error: 'Failed to create status note' },
      { status: 500 }
    )
  }
}

// Helper function to get a default user ID
// In a real app, this would come from authentication
async function getDefaultUserId(): Promise<string> {
  try {
    // Try to find the first user in the database
    const firstUser = await prisma.user.findFirst({
      select: { id: true }
    })
    
    if (firstUser) {
      return firstUser.id
    }

    // If no users exist, create a default one
    const defaultUser = await prisma.user.create({
      data: {
        name: 'System User',
        email: 'system@example.com',
        department: 'System',
        position: 'Automated User',
        maxHoursPerDay: 8,
      }
    })

    return defaultUser.id
  } catch (error) {
    console.error('Error getting default user:', error)
    throw new Error('Could not determine user ID')
  }
}
