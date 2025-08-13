import { NextRequest, NextResponse } from 'next/server'
import { playgroundStorage } from '@/lib/playground-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromTaskId, toTaskId } = body

    if (!fromTaskId || !toTaskId) {
      return NextResponse.json(
        { success: false, error: 'Both fromTaskId and toTaskId are required' },
        { status: 400 }
      )
    }

    if (fromTaskId === toTaskId) {
      return NextResponse.json(
        { success: false, error: 'A task cannot depend on itself' },
        { status: 400 }
      )
    }

    const success = playgroundStorage.addDependency(fromTaskId, toTaskId)

    if (!success) {
      // Check if tasks exist
      const fromTask = playgroundStorage.getTask(fromTaskId)
      const toTask = playgroundStorage.getTask(toTaskId)

      if (!fromTask || !toTask) {
        return NextResponse.json(
          { success: false, error: 'One or both tasks not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'This dependency would create a circular reference',
        },
        { status: 400 }
      )
    }

    const updatedTask = playgroundStorage.getTask(toTaskId)

    return NextResponse.json({
      success: true,
      message: 'Dependency added successfully',
      dependency: { fromTaskId, toTaskId },
      updatedTask,
    })
  } catch (error) {
    console.error('Playground dependencies POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add dependency' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fromTaskId = url.searchParams.get('fromTaskId')
    const toTaskId = url.searchParams.get('toTaskId')

    if (!fromTaskId || !toTaskId) {
      return NextResponse.json(
        { success: false, error: 'Both fromTaskId and toTaskId are required' },
        { status: 400 }
      )
    }

    const success = playgroundStorage.removeDependency(fromTaskId, toTaskId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Dependency not found or task not found' },
        { status: 404 }
      )
    }

    const updatedTask = playgroundStorage.getTask(toTaskId)

    return NextResponse.json({
      success: true,
      message: 'Dependency removed successfully',
      dependency: { fromTaskId, toTaskId },
      updatedTask,
    })
  } catch (error) {
    console.error('Playground dependencies DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove dependency' },
      { status: 500 }
    )
  }
}
