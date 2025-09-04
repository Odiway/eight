import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'API route working',
    timestamp: new Date().toISOString(),
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
  })
}

export async function POST() {
  return NextResponse.json({
    status: 'POST working',
    message: 'API routes are functioning'
  })
}
