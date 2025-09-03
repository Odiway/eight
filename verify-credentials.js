// Check exact usernames and verify passwords in Neon database
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_ktUhJc4KEiL2@ep-empty-bird-adt2uzb9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
})

// Test credentials from USER_CREDENTIALS.md
const testCredentials = [
  { username: 'admin', password: 'Securepassword1' },
  { username: 'arda.sonmez', password: 'F2k8W5j3' },
  { username: 'ali.agcakoyunlu', password: 'K9m2P8x1' },
  { username: 'oguzhan.inandi', password: 'T9r2E8y5' },
  { username: 'berkay.simsek', password: 'N7w5Q2z9' }
]

async function verifyCredentials() {
  console.log('🔍 Checking production credentials...\n')
  
  try {
    // First, show all available usernames
    const allUsers = await prisma.$queryRaw`
      SELECT username, name FROM "User" 
      WHERE username IS NOT NULL AND username NOT LIKE 'temp_user_%'
      ORDER BY username
    `
    
    console.log('📋 Available usernames in production:')
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} - ${user.name}`)
    })
    
    console.log('\n🧪 Testing login credentials...')
    
    for (const cred of testCredentials) {
      try {
        const user = await prisma.$queryRaw`
          SELECT username, password, name, role FROM "User" 
          WHERE username = ${cred.username}
        `
        
        if (user.length > 0) {
          const isPasswordValid = await bcrypt.compare(cred.password, user[0].password)
          const status = isPasswordValid ? '✅ VALID' : '❌ INVALID'
          console.log(`   ${cred.username} / ${cred.password} → ${status}`)
        } else {
          console.log(`   ${cred.username} → ❌ USER NOT FOUND`)
        }
      } catch (error) {
        console.log(`   ${cred.username} → ❌ ERROR: ${error.message}`)
      }
    }
    
    console.log('\n💡 If credentials are not working, the usernames might not match exactly.')
    console.log('   Use the exact usernames shown above for login.')

  } catch (error) {
    console.error('💥 Verification failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyCredentials()
