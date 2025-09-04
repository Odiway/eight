import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get session cookie
    const sessionCookie = request.cookies.get('auth-session')
    
    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Decode session data
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())

    // Check if session is valid (not expired)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    if (now - sessionData.timestamp > maxAge) {
      // Session expired, clear cookie
      const response = NextResponse.json({ user: null }, { status: 200 })
      response.cookies.delete('auth-session')
      return response
    }

    // For admin users, return basic info
    if (sessionData.role === 'ADMIN' && sessionData.username === 'admin') {
      return NextResponse.json({
        user: {
          id: sessionData.id,
          username: sessionData.username,
          name: sessionData.name || 'System Administrator',
          email: 'admin@temsa.com',
          role: sessionData.role,
          department: 'System',
          position: 'Administrator'
        }
      })
    }

    // For regular users, get full info from database
    if (sessionData.id && sessionData.role === 'USER') {
      try {
        const user = await prisma.user.findUnique({
          where: { id: sessionData.id },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
            department: true,
            position: true
          }
        })

        if (user) {
          return NextResponse.json({ user })
        }
      } catch (dbError) {
        console.error('Database error in check-session:', dbError)
      }
    }

    // Invalid session
    const response = NextResponse.json({ user: null }, { status: 200 })
    response.cookies.delete('auth-session')
    return response

  } catch (error) {
    console.error('Session check error:', error)
    const response = NextResponse.json({ user: null }, { status: 200 })
    response.cookies.delete('auth-session')
    return response
  } finally {
    await prisma.$disconnect()
  }
}
