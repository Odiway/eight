import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { username, password, loginType } = await request.json()

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
    const user = await prisma.user.findUnique({
      where: { username }
    })

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
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
