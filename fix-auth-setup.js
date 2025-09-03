// Fix existing users and add authentication fields manually
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function fixUsersAndAddAuth() {
  console.log('🔧 Fixing existing users and adding authentication...')
  
  try {
    // First, let's see what we have
    const existingUsers = await prisma.$queryRaw`SELECT * FROM "User" LIMIT 5`
    console.log('📋 Sample existing users:')
    console.table(existingUsers)

    // Add the missing columns manually
    console.log('\n1️⃣ Adding authentication columns...')
    
    try {
      await prisma.$queryRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS username TEXT`
      await prisma.$queryRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS password TEXT`  
      await prisma.$queryRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER'`
      await prisma.$queryRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true`
      await prisma.$queryRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP`
      console.log('✅ Columns added successfully')
    } catch (e) {
      console.log('⚠️  Columns might already exist:', e.message)
    }

    // Generate usernames for existing users (if they don't have them)
    console.log('\n2️⃣ Updating existing users with temporary usernames...')
    const users = await prisma.$queryRaw`SELECT id, name, email FROM "User" WHERE username IS NULL OR username = ''`
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const tempUsername = `temp_user_${i + 1}`
      await prisma.$queryRaw`
        UPDATE "User" 
        SET username = ${tempUsername}, 
            password = ${await bcrypt.hash('ChangeMe123', 12)},
            role = 'USER',
            "isActive" = true
        WHERE id = ${user.id}
      `
      console.log(`✅ Updated ${user.name} with username: ${tempUsername}`)
    }

    // Now add the unique constraint
    console.log('\n3️⃣ Adding unique constraint to username...')
    try {
      await prisma.$queryRaw`ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE (username)`
      console.log('✅ Unique constraint added')
    } catch (e) {
      console.log('⚠️  Constraint might already exist:', e.message)
    }

    // Now add our authentication users
    console.log('\n4️⃣ Adding authentication users...')
    
    const newUsers = [
      { username: 'admin', password: 'Securepassword1', name: 'System Administrator', email: 'admin@temsa.com', role: 'ADMIN', department: 'MANAGEMENT', position: 'Administrator' },
      { username: 'oguzhan.inandi', password: 'T9r2E8y5', name: 'Oğuzhan İNANDI', email: 'oguzhan.inandi@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' }
    ]
    
    for (const userData of newUsers) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 12)
        
        await prisma.$queryRaw`
          INSERT INTO "User" (id, username, password, name, email, role, department, position, "isActive", "createdAt", "updatedAt")
          VALUES (
            ${`user_${userData.username}_${Date.now()}`},
            ${userData.username},
            ${hashedPassword},
            ${userData.name},
            ${userData.email},
            ${userData.role},
            ${userData.department},
            ${userData.position},
            true,
            NOW(),
            NOW()
          )
        `
        console.log(`✅ Added: ${userData.username} - ${userData.name}`)
      } catch (e) {
        if (e.message.includes('unique constraint')) {
          console.log(`⚠️  ${userData.username} already exists, skipping...`)
        } else {
          console.error(`❌ Failed to add ${userData.username}:`, e.message)
        }
      }
    }

    console.log('\n🎉 Authentication setup completed!')
    console.log('\n🔐 Test credentials:')
    console.log('Admin: admin / Securepassword1')
    console.log('User: oguzhan.inandi / T9r2E8y5')

  } catch (error) {
    console.error('💥 Setup failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixUsersAndAddAuth()
