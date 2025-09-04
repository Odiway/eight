import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  try {
    console.log('=== DATABASE CONNECTION TEST ===')
    
    // Check environment variables
    const envCheck = {
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      DATABASE_URL_preview: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 50) + '...' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL
    }
    
    console.log('Environment:', envCheck)
    
    // Test different connection approaches
    let testResults: any = {
      env: envCheck,
      tests: {}
    }
    
    // Test 1: Basic Prisma connection
    try {
      console.log('Test 1: Basic Prisma connection...')
      const prisma = new PrismaClient()
      await prisma.$connect()
      await prisma.$disconnect()
      testResults.tests.basicConnection = 'SUCCESS'
    } catch (error: any) {
      console.error('Test 1 failed:', error)
      testResults.tests.basicConnection = `FAILED: ${error.message}`
    }
    
    // Test 2: Direct database query
    try {
      console.log('Test 2: Direct query test...')
      const prisma = new PrismaClient()
      const result = await prisma.$queryRaw`SELECT 1 as test`
      await prisma.$disconnect()
      testResults.tests.directQuery = 'SUCCESS'
    } catch (error: any) {
      console.error('Test 2 failed:', error)
      testResults.tests.directQuery = `FAILED: ${error.message}`
    }
    
    // Test 3: User table access
    try {
      console.log('Test 3: User table access...')
      const prisma = new PrismaClient()
      const count = await prisma.user.count()
      await prisma.$disconnect()
      testResults.tests.userTableAccess = `SUCCESS - Found ${count} users`
    } catch (error: any) {
      console.error('Test 3 failed:', error)
      testResults.tests.userTableAccess = `FAILED: ${error.message}`
    }
    
    return NextResponse.json(testResults)
    
  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    )
  }
}
