import { NextRequest, NextResponse } from 'next/server'
import { playgroundStorage } from '@/lib/playground-storage'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'status':
        const stats = playgroundStorage.getStats()
        return NextResponse.json({
          success: true,
          status: stats,
        })

      case 'export':
        const tasks = playgroundStorage.getAllTasks()
        return NextResponse.json({
          success: true,
          export: {
            tasks,
            exportedAt: new Date().toISOString(),
            version: '1.0',
          },
        })

      default:
        const allTasks = playgroundStorage.getAllTasks()
        return NextResponse.json({
          success: true,
          playground: {
            tasks: allTasks,
            totalTasks: allTasks.length,
          },
        })
    }
  } catch (error) {
    console.error('Playground management GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get playground data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'reset':
        playgroundStorage.reset()

        return NextResponse.json({
          success: true,
          message: 'Playground reset successfully',
          totalTasks: 0,
        })

      case 'loadSample':
        const sampleTasks = playgroundStorage.loadSampleProject()

        return NextResponse.json({
          success: true,
          message: 'Sample project loaded successfully',
          tasks: sampleTasks,
          totalTasks: sampleTasks.length,
        })

      case 'import':
        if (!data || !data.tasks || !Array.isArray(data.tasks)) {
          return NextResponse.json(
            { success: false, error: 'Invalid import data format' },
            { status: 400 }
          )
        }

        const importedTasks = playgroundStorage.importTasks(data.tasks)

        return NextResponse.json({
          success: true,
          message: 'Data imported successfully',
          tasks: importedTasks,
          totalTasks: importedTasks.length,
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Playground management POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform playground action' },
      { status: 500 }
    )
  }
}
