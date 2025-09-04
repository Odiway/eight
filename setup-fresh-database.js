const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// User credentials from USER_CREDENTIALS.md
const users = [
  // Admin
  { username: 'admin', password: 'Securepassword1', role: 'ADMIN', name: 'System Administrator', email: 'admin@temsa.com', department: 'System', position: 'Administrator' },
  
  // Batarya Paketleme Ekibi
  { username: 'ali.agcakoyunlu', password: 'K9m2P8x1', name: 'Ali AĞCAKOYUNLU', email: 'ali.agcakoyunlu@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'berkay.simsek', password: 'N7w5Q2z9', name: 'Berkay ŞİMŞEK', email: 'berkay.simsek@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'canberk.albay', password: 'R4t8Y6u3', name: 'Canberk ALBAY', email: 'canberk.albay@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'ekrem.atici', password: 'L1s9D4h7', name: 'Ekrem ATICI', email: 'ekrem.atici@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'fatih.pitir', password: 'M3x6B9k2', name: 'Fatih Rüştü PITIR', email: 'fatih.rustu.pitir@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'huseyin.sak', password: 'P8v2C5n1', name: 'Hüseyin Can SAK', email: 'huseyin.can.sak@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'kemal.tastan', password: 'Q4j7F3w6', name: 'Kemal TAŞTAN', email: 'kemal.tastan@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'oguzhan.inandi', password: 'T9r2E8y5', name: 'Oğuzhan İNANDI', email: 'oguzhan.inandi@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'omer.arisoy', password: 'V6k4H9s2', name: 'Ömer ARISOY', email: 'omer.arisoy@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'samet.danaci', password: 'W1q8L6p4', name: 'Samet DANACI', email: 'samet.danaci@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'yasar.dogan', password: 'Z3m7N2c9', name: 'Yaşar DOĞAN', email: 'yasar.dogan@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'yunus.koc', password: 'A8b5R1x7', name: 'Yunus Emre KOÇ', email: 'yunus.emre.koc@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },
  { username: 'yusuf.kebude', password: 'D4g9T6v2', name: 'Yusuf KEBÜDE', email: 'yusuf.kebude@temsa.com', department: 'Batarya Paketleme', position: 'Teknisyen' },

  // Batarya Geliştirme Ekibi
  { username: 'arda.sonmez', password: 'F2k8W5j3', name: 'Arda SÖNMEZ', email: 'arda.sonmez@temsa.com', department: 'Batarya Geliştirme', position: 'Mühendis' },
  { username: 'batuhan.salici', password: 'G7n4Q9m1', name: 'Batuhan SALICI', email: 'batuhan.salici@temsa.com', department: 'Batarya Geliştirme', position: 'Mühendis' },
  { username: 'berk.erturk', password: 'H5p2L8c6', name: 'Berk ERTÜRK', email: 'berk.erturk@temsa.com', department: 'Batarya Geliştirme', position: 'Mühendis' },
  { username: 'biran.ture', password: 'J9x3V7b4', name: 'Biran Can TÜRE', email: 'biran.can.ture@temsa.com', department: 'Batarya Geliştirme', position: 'Mühendis' },
  { username: 'esra.donmez', password: 'K1f6S2n8', name: 'Esra DÖNMEZ', email: 'esra.donmez@temsa.com', department: 'Batarya Geliştirme', position: 'Mühendis' },
  { username: 'mete.kusdemir', password: 'L4h9R5t7', name: 'Mete Han KUŞDEMİR', email: 'mete.han.kusdemir@temsa.com', department: 'Batarya Geliştirme', position: 'Mühendis' },
  { username: 'muhammed.karakus', password: 'M8d2Y6w3', name: 'Muhammed KARAKUŞ', email: 'muhammed.karakus@temsa.com', department: 'Batarya Geliştirme', position: 'Mühendis' },
  { username: 'murat.kara', password: 'N3z7E9q1', name: 'Murat KARA', email: 'murat.kara@temsa.com', department: 'Batarya Geliştirme', position: 'Mühendis' },
  { username: 'selim.akbudak', password: 'O6s4I8u5', name: 'Selim AKBUDAK', email: 'selim.akbudak@temsa.com', department: 'Batarya Geliştirme', position: 'Mühendis' },

  // Satın Alma Ekibi
  { username: 'fatih.avci', password: 'P2v8X4k9', name: 'Fatih AVCI', email: 'fatih.avci@temsa.com', department: 'Satın Alma', position: 'Uzman' },
  { username: 'polen.acimis', password: 'Q7c1Z3m6', name: 'Polen ACIMIŞ', email: 'polen.acimis@temsa.com', department: 'Satın Alma', position: 'Uzman' },

  // Proje Geliştirme Ekibi
  { username: 'gokhan.bilgin', password: 'R9f5A2l8', name: 'Gökhan BİLGİN', email: 'gokhan.bilgin@temsa.com', department: 'Proje Geliştirme', position: 'Proje Yöneticisi' }
]

async function setupFreshDatabase() {
  console.log('🚀 Setting up fresh database...')
  
  const prisma = new PrismaClient()
  
  try {
    // Test connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Check if tables exist
    console.log('2. Checking database schema...')
    try {
      const userCount = await prisma.user.count()
      console.log(`📊 Found ${userCount} existing users`)
      
      if (userCount > 0) {
        console.log('⚠️  Database already has users. Do you want to clear it? (Ctrl+C to cancel)')
        // Wait 5 seconds before proceeding
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        console.log('🗑️  Clearing existing users...')
        await prisma.user.deleteMany()
        console.log('✅ Users cleared')
      }
    } catch (schemaError) {
      console.log('📋 Database schema needs to be created')
      console.log('💡 Please run: npx prisma db push')
      return
    }

    // Create all users
    console.log('3. Creating users...')
    let successCount = 0
    let errorCount = 0

    for (const userData of users) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        
        // Create user
        const user = await prisma.user.create({
          data: {
            username: userData.username,
            password: hashedPassword,
            email: userData.email,
            name: userData.name,
            role: userData.role || 'USER',
            department: userData.department,
            position: userData.position,
            isActive: true
          }
        })
        
        console.log(`✅ Created: ${userData.name} (${userData.username})`)
        successCount++
        
      } catch (error) {
        console.error(`❌ Failed to create ${userData.username}:`, error.message)
        errorCount++
      }
    }

    console.log('\n🎉 Fresh database setup complete!')
    console.log(`✅ Successfully created: ${successCount} users`)
    console.log(`❌ Errors: ${errorCount} users`)
    console.log('\n📋 Summary:')
    console.log(`- Admin account: admin / Securepassword1`)
    console.log(`- Regular users: 25 team members`)
    console.log(`- All passwords match USER_CREDENTIALS.md`)
    
    // Test login for a few users
    console.log('\n🧪 Testing password verification...')
    const testUsers = ['admin', 'arda.sonmez', 'ali.agcakoyunlu']
    
    for (const username of testUsers) {
      const user = await prisma.user.findUnique({ where: { username } })
      const originalPassword = users.find(u => u.username === username)?.password
      
      if (user && originalPassword) {
        const isValid = await bcrypt.compare(originalPassword, user.password)
        console.log(`${isValid ? '✅' : '❌'} ${username}: ${isValid ? 'VALID' : 'INVALID'}`)
      }
    }

  } catch (error) {
    console.error('💥 Setup failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the setup
setupFreshDatabase()
  .then(() => {
    console.log('\n✅ Setup completed successfully!')
    console.log('🚀 You can now update your Vercel DATABASE_URL and redeploy!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
