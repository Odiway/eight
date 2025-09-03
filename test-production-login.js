// Production login test script
const bcrypt = require('bcryptjs')

async function testProductionLogin() {
  console.log('Testing production login for arda.sonmez...')
  
  // Test environment
  console.log('Environment check:')
  console.log('- NODE_ENV:', process.env.NODE_ENV)
  console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL)
  console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET)
  
  // Test the actual login flow
  try {
    console.log('\nTesting login API...')
    const response = await fetch('https://your-app-url.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'arda.sonmez',
        password: 'F2k8W5j3',
        loginType: 'user'
      }),
    })
    
    const result = await response.json()
    console.log('Login response status:', response.status)
    console.log('Login response:', result)
    
    // Also test the debug endpoint
    console.log('\nTesting debug API...')
    const debugResponse = await fetch('https://your-app-url.vercel.app/api/debug')
    const debugResult = await debugResponse.json()
    console.log('Debug response:', debugResult)
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

// If you want to test locally with production database:
async function testWithProductionDB() {
  // You would set the production DATABASE_URL temporarily
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing with production database...')
    const user = await prisma.user.findUnique({
      where: { username: 'arda.sonmez' }
    })
    
    if (user) {
      console.log('User found:', {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive
      })
      
      // Test password
      const isValid = await bcrypt.compare('F2k8W5j3', user.password)
      console.log('Password valid:', isValid)
    } else {
      console.log('User not found')
    }
    
  } catch (error) {
    console.error('Database test error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Uncomment the test you want to run:
// testProductionLogin()
// testWithProductionDB()

module.exports = { testProductionLogin, testWithProductionDB }
