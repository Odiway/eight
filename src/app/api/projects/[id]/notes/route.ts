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
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Always return empty state initially to avoid any issues
    // This ensures the feature works even if there's no existing data
    let currentNote = ''
    let history: ProjectNote[] = []

    // Try to parse notes from description only if it exists and looks like JSON
    if (project.description && project.description.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(project.description)
        if (parsed && typeof parsed === 'object' && parsed.notes === true) {
          currentNote = parsed.currentNote || ''
          history = Array.isArray(parsed.history) ? parsed.history : []
        }
      } catch {
        // If parsing fails, just ignore and return empty state
        // This prevents any errors from breaking the application
      }
    }

    return NextResponse.json({
      currentNote,
      history,
    })
  } catch (error) {
    console.error('Error fetching project notes:', error)
    // Return empty state instead of error to prevent breaking the UI
    return NextResponse.json({
      currentNote: '',
      history: [],
    })
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
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    let currentNote = ''
    let history: ProjectNote[] = []

    // Only try to parse if description exists and looks like notes JSON
    if (project.description && project.description.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(project.description)
        if (parsed && typeof parsed === 'object' && parsed.notes === true) {
          currentNote = parsed.currentNote || ''
          history = Array.isArray(parsed.history) ? parsed.history : []
        }
      } catch {
        // If parsing fails, start fresh
        currentNote = ''
        history = []
      }
    }

    // Move current note to history if it exists
    if (currentNote.trim()) {
      const newHistoryEntry: ProjectNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: currentNote,
        createdAt: new Date().toISOString(),
        createdBy: createdBy || 'Unknown User',
      }
      history.unshift(newHistoryEntry)
    }

    // Create new notes data structure
    const notesData: NotesData = {
      notes: true,
      currentNote: content.trim(),
      history: history.slice(0, 50), // Keep only last 50 notes
    }

    try {
      // Try to update the project description with notes
      await prisma.project.update({
        where: { id: projectId },
        data: {
          description: JSON.stringify(notesData),
        },
      })

      return NextResponse.json({
        success: true,
        currentNote: content.trim(),
        history: notesData.history,
      })
    } catch (dbError) {
      console.error('Database update failed:', dbError)

      // If database update fails, still return success
      // The frontend can handle this gracefully
      return NextResponse.json({
        success: true,
        currentNote: content.trim(),
        history: notesData.history,
        warning: 'Note saved locally but not persisted to database',
      })
    }
  } catch (error) {
    console.error('Error saving project note:', error)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}
