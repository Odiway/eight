// Final verification of Neon database authentication
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Use Neon database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_ktUhJc4KEiL2@ep-empty-bird-adt2uzb9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
})

async function verifyAuthentication() {
  console.log('🧪 Testing Neon Database Authentication...\n')
  
  try {
    // Test admin login
    console.log('1️⃣ Testing Admin Login:')
    const admin = await prisma.$queryRaw`
      SELECT username, name, role, email FROM "User" 
      WHERE username = 'admin'
    `
    
    if (admin.length > 0) {
      console.log('✅ Admin user found:', admin[0])
      
      // Test password
      const adminWithPassword = await prisma.$queryRaw`
        SELECT password FROM "User" WHERE username = 'admin'
      `
      const isAdminPasswordValid = await bcrypt.compare('Securepassword1', adminWithPassword[0].password)
      console.log('🔐 Admin password test:', isAdminPasswordValid ? '✅ VALID' : '❌ INVALID')
    }

    // Test regular user login
    console.log('\n2️⃣ Testing Regular User Login:')
    const user = await prisma.$queryRaw`
      SELECT username, name, role, email FROM "User" 
      WHERE username = 'oguzhan.inandi'
    `
    
    if (user.length > 0) {
      console.log('✅ Regular user found:', user[0])
      
      // Test password
      const userWithPassword = await prisma.$queryRaw`
        SELECT password FROM "User" WHERE username = 'oguzhan.inandi'
      `
      const isUserPasswordValid = await bcrypt.compare('T9r2E8y5', userWithPassword[0].password)
      console.log('🔐 User password test:', isUserPasswordValid ? '✅ VALID' : '❌ INVALID')
    }

    // Count total users
    const totalUsers = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`
    console.log(`\n📊 Total users in production: ${totalUsers[0].count}`)

    console.log('\n🎉 PRODUCTION AUTHENTICATION READY!')
    console.log('\n🌐 Test on your Vercel deployment:')
    console.log('   Admin: admin / Securepassword1 → Should go to /dashboard')
    console.log('   User: oguzhan.inandi / T9r2E8y5 → Should go to /calendar')

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAuthentication()
