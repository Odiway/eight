import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  let username = ''
  let loginType = ''
  
  // Check for required environment variables
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set')
  }
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set')
    return NextResponse.json(
      { success: false, message: 'Sunucu yapılandırma hatası' },
      { status: 500 }
    )
  }
  
  try {
    const requestData = await request.json()
    username = requestData.username
    const password = requestData.password
    loginType = requestData.loginType

    // Admin login
    if (loginType === 'admin') {
      if (username === 'admin' && password === 'Securepassword1') {
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
        return NextResponse.json(
          { success: false, message: 'Geçersiz yönetici bilgileri' },
          { status: 401 }
        )
      }
    }

    // Regular user login
    let user = null
    try {
      user = await prisma.user.findUnique({
        where: { username }
      })
    } catch (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json(
        { success: false, message: 'Veritabanı bağlantı hatası' },
        { status: 500 }
      )
    }

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı veya aktif değil' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz şifre' },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        department: user.department,
        position: user.position
      }
    })

  } catch (error) {
    console.error('Login error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      username,
      loginType,
      timestamp: new Date().toISOString(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
        JWT_SECRET_EXISTS: !!process.env.JWT_SECRET
      }
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
