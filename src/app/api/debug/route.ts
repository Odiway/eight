import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check environment variables
    const envStatus = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
    }

    // Test database connection
    let dbStatus = 'disconnected'
    let userCount = 0
    let sampleUser = null
    
    try {
      userCount = await prisma.user.count()
      sampleUser = await prisma.user.findFirst({
        where: { username: 'arda.sonmez' },
        select: { id: true, username: true, email: true, isActive: true }
      })
      dbStatus = 'connected'
    } catch (dbError) {
      console.error('Database error:', dbError)
      dbStatus = `error: ${dbError instanceof Error ? dbError.message : 'unknown'}`
    }

    return NextResponse.json({
      status: 'ok',
      environment: envStatus,
      database: {
        status: dbStatus,
        userCount,
        sampleUser
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
