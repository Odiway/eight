import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN API CALLED ===')
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      JWT_SECRET_exists: !!process.env.JWT_SECRET,
      VERCEL: !!process.env.VERCEL
    })

    const requestData = await request.json()
    const { username, password, loginType } = requestData
    
    console.log('Login attempt:', { username, loginType })

    // Admin login (no database required)
    if (loginType === 'admin') {
      console.log('Processing admin login...')
      
      if (username === 'admin' && password === 'Securepassword1') {
        console.log('Admin credentials valid, generating token...')
        
        const token = jwt.sign(
          { 
            id: 'admin',
            username: 'admin',
            role: 'ADMIN',
            name: 'System Administrator'
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        )

        console.log('Admin login successful')
        return NextResponse.json({
          success: true,
          token,
          user: {
            id: 'admin',
            username: 'admin',
            role: 'ADMIN',
            name: 'System Administrator',
            email: 'admin@temsa.com'
          }
        })
      } else {
        console.log('Invalid admin credentials')
        return NextResponse.json(
          { success: false, message: 'Geçersiz yönetici bilgileri' },
          { status: 401 }
        )
      }
    }

    // For now, reject user login to test admin only
    console.log('User login not implemented in test version')
    return NextResponse.json(
      { success: false, message: 'Kullanıcı girişi test sürümünde devre dışı' },
      { status: 400 }
    )

  } catch (error) {
    console.error('=== LOGIN ERROR ===', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Sunucu hatası',
        debug: process.env.NODE_ENV === 'development' ? {
          error: error instanceof Error ? error.message : 'Unknown error'
        } : undefined
      },
      { status: 500 }
    )
  }
}
