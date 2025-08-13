import { NextRequest, NextResponse } from 'next/server'
import { playgroundStorage } from '@/lib/playground-storage'

export async function GET() {
  try {
    const tasks = playgroundStorage.getAllTasks()

    return NextResponse.json({
      success: true,
      tasks,
      totalTasks: tasks.length,
    })
  } catch (error) {
    console.error('Playground tasks GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch playground tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, duration } = body

    if (!name || !duration) {
      return NextResponse.json(
        { success: false, error: 'Name and duration are required' },
        { status: 400 }
      )
    }

    const newTask = playgroundStorage.addTask({
      name: name.trim(),
      duration: Math.max(1, parseInt(duration) || 1),
      dependencies: [],
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      isOnCriticalPath: false,
      earlyStart: 0,
      earlyFinish: 0,
      lateStart: 0,
      lateFinish: 0,
      slack: 0,
    })

    return NextResponse.json({
      success: true,
      task: newTask,
      totalTasks: playgroundStorage.getAllTasks().length,
    })
  } catch (error) {
    console.error('Playground tasks POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create playground task' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, updates } = body

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const updatedTask = playgroundStorage.updateTask(taskId, updates)

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
    })
  } catch (error) {
    console.error('Playground tasks PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update playground task' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const taskId = url.searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const deletedTask = playgroundStorage.deleteTask(taskId)

    if (!deletedTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedTask,
      remainingTasks: playgroundStorage.getAllTasks().length,
    })
  } catch (error) {
    console.error('Playground tasks DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete playground task' },
      { status: 500 }
    )
  }
}
