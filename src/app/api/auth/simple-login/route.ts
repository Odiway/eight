import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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

    // User login - database authentication
    if (loginType === 'user') {
      try {
        // Find user in database
        const user = await prisma.user.findUnique({
          where: { username }
        })

        if (!user) {
          return NextResponse.json(
            { success: false, message: 'Kullanıcı bulunamadı' },
            { status: 401 }
          )
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password)
        
        if (!isValidPassword) {
          return NextResponse.json(
            { success: false, message: 'Geçersiz şifre' },
            { status: 401 }
          )
        }

        // Create session token
        const sessionData = {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          timestamp: Date.now()
        }
        
        const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')
        
        const response = NextResponse.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            email: user.email
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

      } catch (dbError) {
        console.error('Database error during user login:', dbError)
        return NextResponse.json(
          { success: false, message: 'Veritabanı hatası' },
          { status: 500 }
        )
      }
    }

    // Invalid login type
    return NextResponse.json(
      { success: false, message: 'Geçersiz giriş türü' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Login API is running',
    timestamp: new Date().toISOString()
  })
}
