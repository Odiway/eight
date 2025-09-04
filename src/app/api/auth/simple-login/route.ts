import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, loginType } = body

    console.log('Login attempt:', { username, loginType })

    // Admin login check
    if (loginType === 'admin') {
      if (username === 'admin' && password === 'Securepassword1') {
        // Create a simple session token
        const sessionData = {
          id: 'admin',
          username: 'admin',
          role: 'ADMIN',
          timestamp: Date.now()
        }
        
        const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')
        
        const response = NextResponse.json({
          success: true,
          user: {
            id: 'admin',
            username: 'admin',
            role: 'ADMIN',
            name: 'System Administrator'
          }
        })
        
        // Set HTTP-only cookie
        response.cookies.set('auth-session', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 86400 // 24 hours
        })
        
        return response
      } else {
        return NextResponse.json(
          { success: false, message: 'Geçersiz yönetici bilgileri' },
          { status: 401 }
        )
      }
    }

    // User login - for now return error to focus on admin
    return NextResponse.json(
      { success: false, message: 'Kullanıcı girişi henüz hazır değil' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Login API is running',
    timestamp: new Date().toISOString()
  })
}
