import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('=== BASIC LOGIN TEST ===')
    
    const body = await request.json()
    const { username, password, loginType } = body
    
    console.log('Request received:', { username, loginType })
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      JWT_SECRET_exists: !!process.env.JWT_SECRET
    })

    // Simple admin check without JWT
    if (loginType === 'admin' && username === 'admin' && password === 'Securepassword1') {
      console.log('Admin login successful - no JWT for now')
      
      // Create a simple token without JWT library
      const simpleToken = createHash('sha256')
        .update(username + Date.now() + randomBytes(16).toString('hex'))
        .digest('hex')
      
      return NextResponse.json({
        success: true,
        token: simpleToken,
        user: {
          id: 'admin',
          username: 'admin',
          role: 'ADMIN',
          name: 'System Administrator'
        },
        message: 'Login successful with basic auth'
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Basic login error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
