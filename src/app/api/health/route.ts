import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check environment variables
    const hasDbUrl = !!process.env.DATABASE_URL
    const nodeEnv = process.env.NODE_ENV || 'development'
    
    let dbConnection = false
    let dbError = null
    
    // Test database connection
    try {
      await prisma.$connect()
      dbConnection = true
      await prisma.$disconnect()
    } catch (error) {
      dbError = error instanceof Error ? error.message : 'Unknown database error'
    }

    return NextResponse.json({
      status: 'ok',
      environment: nodeEnv,
      hasDbUrl,
      dbConnection,
      dbError,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
