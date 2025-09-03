const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Replace with your actual Neon database URL
const DATABASE_URL = "postgresql://USERNAME:PASSWORD@ep-XXXXX.us-east-2.aws.neon.tech/neondb"

async function testProductionDatabase() {
  console.log('Testing production database connection...')
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL
      }
    }
  })
  
  try {
    // Test connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Count users
    console.log('2. Counting users...')
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)
    
    // Find specific user
    console.log('3. Looking for arda.sonmez...')
    const user = await prisma.user.findUnique({
      where: { username: 'arda.sonmez' }
    })
    
    if (user) {
      console.log('✅ User found:', {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        department: user.department
      })
      
      // Test password
      console.log('4. Testing password...')
      const isValid = await bcrypt.compare('F2k8W5j3', user.password)
      console.log(`✅ Password validation result: ${isValid}`)
      
      if (isValid) {
        console.log('🎉 Everything looks good! The user should be able to login.')
      } else {
        console.log('❌ Password validation failed. You may need to sync passwords again.')
      }
    } else {
      console.log('❌ User not found. You may need to run the sync script again.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    
    if (error.code === 'P1001') {
      console.log('💡 This looks like a database connection issue. Check your DATABASE_URL.')
    } else if (error.code === 'P2002') {
      console.log('💡 This looks like a unique constraint issue.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testProductionDatabase()
  .then(() => {
    console.log('\nTest completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })
