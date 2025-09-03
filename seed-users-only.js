// Safe User-Only Seeding Script for Production
// Only affects the User table - leaves all other data intact

const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const users = [
  // Admin Account
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

async function seedUsersOnly() {
  console.log('🔐 Adding users to production database...')
  console.log('⚠️  SAFE MODE: Only affecting User table - all other tables remain untouched')
  
  try {
    // Check database connection
    await prisma.$connect()
    console.log('✅ Connected to database')

    // Count existing users for safety check
    const existingUserCount = await prisma.user.count()
    console.log(`📊 Current users in database: ${existingUserCount}`)

    let created = 0
    let skipped = 0
    
    for (const user of users) {
      try {
        // Check if user exists first
        const existingUser = await prisma.user.findUnique({
          where: { username: user.username }
        })

        if (existingUser) {
          console.log(`⚠️  ${user.username} already exists, skipping...`)
          skipped++
          continue
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 12)
        
        // Create ONLY user record - no other tables affected
        await prisma.user.create({
          data: {
            username: user.username,
            password: hashedPassword,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            position: user.position,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        
        console.log(`✅ Created: ${user.username} - ${user.name}`)
        created++
        
        // Small delay to be gentle on database
        await new Promise(resolve => setTimeout(resolve, 50))
        
      } catch (error) {
        console.error(`❌ Error creating ${user.username}:`, error.message)
      }
    }
    
    // Final summary
    console.log('\n📋 SAFE USER SEEDING SUMMARY:')
    console.log(`✅ Users created: ${created}`)
    console.log(`⚠️  Users skipped (already exist): ${skipped}`)
    console.log(`📊 Total processed: ${users.length}`)
    console.log(`🛡️  Other tables: UNTOUCHED ✅`)
    
    // Verify final count
    const finalUserCount = await prisma.user.count()
    console.log(`📊 Total users now: ${finalUserCount}`)
    
    if (created > 0) {
      console.log('\n🎉 User seeding completed successfully!')
      console.log('\n🔐 Test Login Credentials:')
      console.log('   Admin: admin / Securepassword1')
      console.log('   User: oguzhan.inandi / T9r2E8y5')
      console.log('\n🌐 Your projects, tasks, and other data remain completely unchanged!')
    }

  } catch (error) {
    console.error('💥 Seeding failed:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Execute the seeding
seedUsersOnly()
  .then(() => {
    console.log('✨ Process completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Process failed:', error)
    process.exit(1)
  })
