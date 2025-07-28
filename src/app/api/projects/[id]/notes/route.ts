import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ProjectNote {
  id: string
  content: string
  createdAt: string
  createdBy: string
}

interface NotesData {
  notes: boolean
  currentNote: string
  history: ProjectNote[]
}

// GET - Fetch project notes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    let currentNote = ''
    let history: ProjectNote[] = []

    // Try to parse notes from a custom field or use description temporarily
    // In production, you'd want to use a separate field or table
    try {
      // First, check if there's a notes field stored as JSON in description
      if (project.description) {
        const parsed = JSON.parse(project.description)
        if (parsed.notes) {
          currentNote = parsed.currentNote || ''
          history = parsed.history || []
        } else {
          // Treat plain text description as the first note
          currentNote = project.description
          history = []
        }
      }
    } catch {
      // If not JSON, treat description as current note
      currentNote = project.description || ''
      history = []
    }

    return NextResponse.json({
      currentNote,
      history
    })
  } catch (error) {
    console.error('Error fetching project notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add or update project note
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const { content, createdBy } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      )
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    let currentNote = ''
    let history: ProjectNote[] = []

    // Parse existing notes
    try {
      if (project.description) {
        const parsed = JSON.parse(project.description)
        if (parsed.notes) {
          currentNote = parsed.currentNote || ''
          history = parsed.history || []
        } else {
          // If description exists but isn't notes format, treat as current note
          currentNote = project.description
        }
      }
    } catch {
      // If not JSON, treat as current note
      currentNote = project.description || ''
    }

    // Move current note to history if it exists
    if (currentNote.trim()) {
      const newHistoryEntry: ProjectNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: currentNote,
        createdAt: new Date().toISOString(),
        createdBy: createdBy || 'Unknown User'
      }
      history.unshift(newHistoryEntry)
    }

    // Create new notes data structure
    const notesData: NotesData = {
      notes: true,
      currentNote: content.trim(),
      history: history.slice(0, 50) // Keep only last 50 notes
    }

    // Update project with new notes
    await prisma.project.update({
      where: { id: projectId },
      data: {
        description: JSON.stringify(notesData)
      }
    })

    return NextResponse.json({
      success: true,
      currentNote: content.trim(),
      history: notesData.history
    })
  } catch (error) {
    console.error('Error saving project note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
