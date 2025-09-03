// Update existing Oğuzhan İNANDI user with proper credentials
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function updateOguzhanUser() {
  console.log('🔧 Updating Oğuzhan İNANDI with proper credentials...')
  
  try {
    // Find the existing Oğuzhan user
    const oguzhanUser = await prisma.$queryRaw`
      SELECT * FROM "User" WHERE email = 'oguzhan.inandi@temsa.com'
    `
    
    if (oguzhanUser.length > 0) {
      const user = oguzhanUser[0]
      console.log(`📋 Found user: ${user.name} with current username: ${user.username}`)
      
      // Update with proper credentials
      const hashedPassword = await bcrypt.hash('T9r2E8y5', 12)
      
      await prisma.$queryRaw`
        UPDATE "User" 
        SET username = 'oguzhan.inandi',
            password = ${hashedPassword},
            role = 'USER',
            "isActive" = true,
            "updatedAt" = NOW()
        WHERE id = ${user.id}
      `
      
      console.log('✅ Updated Oğuzhan İNANDI successfully!')
      console.log('   Username: oguzhan.inandi')
      console.log('   Password: T9r2E8y5')
      
      // Verify the update
      const updated = await prisma.$queryRaw`
        SELECT username, name, email, role FROM "User" 
        WHERE username IN ('admin', 'oguzhan.inandi')
      `
      
      console.log('\n📋 Authentication users ready:')
      console.table(updated)
      
    } else {
      console.log('❌ Could not find Oğuzhan İNANDI user')
    }

  } catch (error) {
    console.error('💥 Update failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

updateOguzhanUser()
