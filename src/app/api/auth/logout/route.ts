import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Clear the auth session cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Çıkış başarılı' 
    })
    
    // Delete the auth-session cookie
    response.cookies.delete('auth-session')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Çıkış işlemi başarısız' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Logout API is running',
    timestamp: new Date().toISOString()
  })
}
