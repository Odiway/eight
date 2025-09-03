// Add ALL remaining users from USER_CREDENTIALS.md to Neon database
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Use Neon database URL directly
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_ktUhJc4KEiL2@ep-empty-bird-adt2uzb9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
})

const allUsers = [
  // Admin (already exists)
  { username: 'admin', password: 'Securepassword1', name: 'System Administrator', email: 'admin@temsa.com', role: 'ADMIN', department: 'MANAGEMENT', position: 'Administrator' },
  
  // Batarya Paketleme Ekibi
  { username: 'ali.agcakoyunlu', password: 'K9m2P8x1', name: 'Ali AĞCAKOYUNLU', email: 'ali.agcakoyunlu@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'berkay.simsek', password: 'N7w5Q2z9', name: 'Berkay ŞİMŞEK', email: 'berkay.simsek@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'canberk.albay', password: 'R4t8Y6u3', name: 'Canberk ALBAY', email: 'canberk.albay@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'ekrem.atici', password: 'L1s9D4h7', name: 'Ekrem ATICI', email: 'ekrem.atici@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'fatih.pitir', password: 'M3x6B9k2', name: 'Fatih Rüştü PITIR', email: 'fatih.rustu.pitir@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'huseyin.sak', password: 'P8v2C5n1', name: 'Hüseyin Can SAK', email: 'huseyin.can.sak@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'kemal.tastan', password: 'Q4j7F3w6', name: 'Kemal TAŞTAN', email: 'kemal.tastan@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'oguzhan.inandi', password: 'T9r2E8y5', name: 'Oğuzhan İNANDI', email: 'oguzhan.inandi@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'omer.arisoy', password: 'V6k4H9s2', name: 'Ömer ARISOY', email: 'omer.arisoy@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'samet.danaci', password: 'W1q8L6p4', name: 'Samet DANACI', email: 'samet.danaci@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'yasar.dogan', password: 'Z3m7N2c9', name: 'Yaşar DOĞAN', email: 'yasar.dogan@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'yunus.koc', password: 'A8b5R1x7', name: 'Yunus Emre KOÇ', email: 'yunus.emre.koc@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },
  { username: 'yusuf.kebude', password: 'D4g9T6v2', name: 'Yusuf KEBÜDE', email: 'yusuf.kebude@temsa.com', role: 'USER', department: 'BATTERY_PACKAGING', position: 'Battery Packaging Specialist' },

  // Batarya Geliştirme Ekibi  
  { username: 'arda.sonmez', password: 'F2k8W5j3', name: 'Arda SÖNMEZ', email: 'arda.sonmez@temsa.com', role: 'USER', department: 'BATTERY_DEVELOPMENT', position: 'Battery Development Engineer' },
  { username: 'batuhan.salici', password: 'G7n4Q9m1', name: 'Batuhan SALICI', email: 'batuhan.salici@temsa.com', role: 'USER', department: 'BATTERY_DEVELOPMENT', position: 'Battery Development Engineer' },
  { username: 'berk.erturk', password: 'H5p2L8c6', name: 'Berk ERTÜRK', email: 'berk.erturk@temsa.com', role: 'USER', department: 'BATTERY_DEVELOPMENT', position: 'Battery Development Engineer' },
  { username: 'biran.ture', password: 'J9x3V7b4', name: 'Biran Can TÜRE', email: 'biran.can.ture@temsa.com', role: 'USER', department: 'BATTERY_DEVELOPMENT', position: 'Battery Development Engineer' },
  { username: 'esra.donmez', password: 'K1f6S2n8', name: 'Esra DÖNMEZ', email: 'esra.donmez@temsa.com', role: 'USER', department: 'BATTERY_DEVELOPMENT', position: 'Battery Development Engineer' },
  { username: 'mete.kusdemir', password: 'L4h9R5t7', name: 'Mete Han KUŞDEMİR', email: 'mete.han.kusdemir@temsa.com', role: 'USER', department: 'BATTERY_DEVELOPMENT', position: 'Battery Development Engineer' },
  { username: 'muhammed.karakus', password: 'M8d2Y6w3', name: 'Muhammed KARAKUŞ', email: 'muhammed.karakus@temsa.com', role: 'USER', department: 'BATTERY_DEVELOPMENT', position: 'Battery Development Engineer' },
  { username: 'murat.kara', password: 'N3z7E9q1', name: 'Murat KARA', email: 'murat.kara@temsa.com', role: 'USER', department: 'BATTERY_DEVELOPMENT', position: 'Battery Development Engineer' },
  { username: 'selim.akbudak', password: 'O6s4I8u5', name: 'Selim AKBUDAK', email: 'selim.akbudak@temsa.com', role: 'USER', department: 'BATTERY_DEVELOPMENT', position: 'Battery Development Engineer' },

  // Satın Alma & Proje Geliştirme
  { username: 'fatih.avci', password: 'P2v8X4k9', name: 'Fatih AVCI', email: 'fatih.avci@temsa.com', role: 'USER', department: 'PROCUREMENT', position: 'Procurement Specialist' },
  { username: 'polen.acimis', password: 'Q7c1Z3m6', name: 'Polen ACIMIŞ', email: 'polen.acimis@temsa.com', role: 'USER', department: 'PROCUREMENT', position: 'Procurement Specialist' },
  { username: 'gokhan.bilgin', password: 'R9f5A2l8', name: 'Gökhan BİLGİN', email: 'gokhan.bilgin@temsa.com', role: 'USER', department: 'PROJECT_DEVELOPMENT', position: 'Project Development Engineer' }
]

async function addAllUsers() {
  console.log('👥 Adding ALL users from USER_CREDENTIALS.md to Neon database...')
  
  try {
    let created = 0
    let updated = 0
    let skipped = 0
    
    for (const userData of allUsers) {
      try {
        // Check if user with this email already exists
        const existingUsers = await prisma.$queryRaw`
          SELECT id, username, email FROM "User" WHERE email = ${userData.email}
        `
        
        if (existingUsers.length > 0) {
          const existingUser = existingUsers[0]
          
          // If user exists but doesn't have proper username/password, update them
          if (!existingUser.username || existingUser.username.startsWith('temp_user_')) {
            const hashedPassword = await bcrypt.hash(userData.password, 12)
            
            await prisma.$queryRaw`
              UPDATE "User" 
              SET username = ${userData.username},
                  password = ${hashedPassword},
                  role = ${userData.role},
                  "isActive" = true,
                  "updatedAt" = NOW()
              WHERE id = ${existingUser.id}
            `
            
            console.log(`✅ Updated: ${userData.username} - ${userData.name}`)
            updated++
            
          } else {
            console.log(`⚠️  ${userData.username} already properly configured, skipping...`)
            skipped++
          }
          
        } else {
          // User doesn't exist, create new one
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
          console.log(`✅ Created: ${userData.username} - ${userData.name}`)
          created++
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        if (error.message.includes('unique constraint')) {
          console.log(`⚠️  ${userData.username} already exists with proper username, skipping...`)
          skipped++
        } else {
          console.error(`❌ Error with ${userData.username}:`, error.message)
        }
      }
    }

    console.log('\n📊 COMPLETE USER SETUP SUMMARY:')
    console.log(`✅ Users created: ${created}`)
    console.log(`🔄 Users updated: ${updated}`)
    console.log(`⚠️  Users skipped: ${skipped}`)
    console.log(`📝 Total processed: ${allUsers.length}`)

    // Verify final state
    const authUsers = await prisma.$queryRaw`
      SELECT username, name, role FROM "User" 
      WHERE username IS NOT NULL AND username NOT LIKE 'temp_user_%'
      ORDER BY role DESC, username
    `
    
    console.log('\n🔐 ALL AUTHENTICATION USERS READY:')
    console.table(authUsers)

    console.log('\n🎉 Production database is now complete!')
    console.log('\n📝 Test any of these credentials on your Vercel deployment:')
    console.log('   Admin: admin / Securepassword1')
    console.log('   User: arda.sonmez / F2k8W5j3')
    console.log('   User: ali.agcakoyunlu / K9m2P8x1')
    console.log('   (All users from USER_CREDENTIALS.md should work now)')

  } catch (error) {
    console.error('💥 Failed to add users:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addAllUsers()
