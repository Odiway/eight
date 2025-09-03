// Production User Seeding Script for Neon Database
// Run this script to populate your production database with all user credentials

import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

// Initialize Prisma with production DATABASE_URL
const prisma = new PrismaClient()

const users = [
  // Admin Account
  {
    username: 'admin',
    password: 'Securepassword1',
    name: 'System Administrator',
    email: 'admin@temsa.com',
    role: 'ADMIN',
    department: 'MANAGEMENT',
    position: 'Administrator',
    isActive: true
  },
  
  // Batarya Paketleme Ekibi
  {
    username: 'ali.agcakoyunlu',
    password: 'K9m2P8x1',
    name: 'Ali AĞCAKOYUNLU',
    email: 'ali.agcakoyunlu@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'berkay.simsek',
    password: 'N7w5Q2z9',
    name: 'Berkay ŞİMŞEK',
    email: 'berkay.simsek@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'canberk.albay',
    password: 'R4t8Y6u3',
    name: 'Canberk ALBAY',
    email: 'canberk.albay@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'ekrem.atici',
    password: 'L1s9D4h7',
    name: 'Ekrem ATICI',
    email: 'ekrem.atici@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'fatih.pitir',
    password: 'M3x6B9k2',
    name: 'Fatih Rüştü PITIR',
    email: 'fatih.rustu.pitir@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'huseyin.sak',
    password: 'P8v2C5n1',
    name: 'Hüseyin Can SAK',
    email: 'huseyin.can.sak@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'kemal.tastan',
    password: 'Q4j7F3w6',
    name: 'Kemal TAŞTAN',
    email: 'kemal.tastan@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'oguzhan.inandi',
    password: 'T9r2E8y5',
    name: 'Oğuzhan İNANDI',
    email: 'oguzhan.inandi@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'omer.arisoy',
    password: 'V6k4H9s2',
    name: 'Ömer ARISOY',
    email: 'omer.arisoy@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'samet.danaci',
    password: 'W1q8L6p4',
    name: 'Samet DANACI',
    email: 'samet.danaci@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'yasar.dogan',
    password: 'Z3m7N2c9',
    name: 'Yaşar DOĞAN',
    email: 'yasar.dogan@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'yunus.koc',
    password: 'A8b5R1x7',
    name: 'Yunus Emre KOÇ',
    email: 'yunus.emre.koc@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },
  {
    username: 'yusuf.kebude',
    password: 'D4g9T6v2',
    name: 'Yusuf KEBÜDE',
    email: 'yusuf.kebude@temsa.com',
    role: 'USER',
    department: 'BATTERY_PACKAGING',
    position: 'Battery Packaging Specialist',
    isActive: true
  },

  // Batarya Geliştirme Ekibi
  {
    username: 'arda.sonmez',
    password: 'F2k8W5j3',
    name: 'Arda SÖNMEZ',
    email: 'arda.sonmez@temsa.com',
    role: 'USER',
    department: 'BATTERY_DEVELOPMENT',
    position: 'Battery Development Engineer',
    isActive: true
  },
  {
    username: 'batuhan.salici',
    password: 'G7n4Q9m1',
    name: 'Batuhan SALICI',
    email: 'batuhan.salici@temsa.com',
    role: 'USER',
    department: 'BATTERY_DEVELOPMENT',
    position: 'Battery Development Engineer',
    isActive: true
  },
  {
    username: 'berk.erturk',
    password: 'H5p2L8c6',
    name: 'Berk ERTÜRK',
    email: 'berk.erturk@temsa.com',
    role: 'USER',
    department: 'BATTERY_DEVELOPMENT',
    position: 'Battery Development Engineer',
    isActive: true
  },
  {
    username: 'biran.ture',
    password: 'J9x3V7b4',
    name: 'Biran Can TÜRE',
    email: 'biran.can.ture@temsa.com',
    role: 'USER',
    department: 'BATTERY_DEVELOPMENT',
    position: 'Battery Development Engineer',
    isActive: true
  },
  {
    username: 'esra.donmez',
    password: 'K1f6S2n8',
    name: 'Esra DÖNMEZ',
    email: 'esra.donmez@temsa.com',
    role: 'USER',
    department: 'BATTERY_DEVELOPMENT',
    position: 'Battery Development Engineer',
    isActive: true
  },
  {
    username: 'mete.kusdemir',
    password: 'L4h9R5t7',
    name: 'Mete Han KUŞDEMİR',
    email: 'mete.han.kusdemir@temsa.com',
    role: 'USER',
    department: 'BATTERY_DEVELOPMENT',
    position: 'Battery Development Engineer',
    isActive: true
  },
  {
    username: 'muhammed.karakus',
    password: 'M8d2Y6w3',
    name: 'Muhammed KARAKUŞ',
    email: 'muhammed.karakus@temsa.com',
    role: 'USER',
    department: 'BATTERY_DEVELOPMENT',
    position: 'Battery Development Engineer',
    isActive: true
  },
  {
    username: 'murat.kara',
    password: 'N3z7E9q1',
    name: 'Murat KARA',
    email: 'murat.kara@temsa.com',
    role: 'USER',
    department: 'BATTERY_DEVELOPMENT',
    position: 'Battery Development Engineer',
    isActive: true
  },
  {
    username: 'selim.akbudak',
    password: 'O6s4I8u5',
    name: 'Selim AKBUDAK',
    email: 'selim.akbudak@temsa.com',
    role: 'USER',
    department: 'BATTERY_DEVELOPMENT',
    position: 'Battery Development Engineer',
    isActive: true
  },

  // Satın Alma Ekibi
  {
    username: 'fatih.avci',
    password: 'P2v8X4k9',
    name: 'Fatih AVCI',
    email: 'fatih.avci@temsa.com',
    role: 'USER',
    department: 'PROCUREMENT',
    position: 'Procurement Specialist',
    isActive: true
  },
  {
    username: 'polen.acimis',
    password: 'Q7c1Z3m6',
    name: 'Polen ACIMIŞ',
    email: 'polen.acimis@temsa.com',
    role: 'USER',
    department: 'PROCUREMENT',
    position: 'Procurement Specialist',
    isActive: true
  },

  // Proje Geliştirme Ekibi
  {
    username: 'gokhan.bilgin',
    password: 'R9f5A2l8',
    name: 'Gökhan BİLGİN',
    email: 'gokhan.bilgin@temsa.com',
    role: 'USER',
    department: 'PROJECT_DEVELOPMENT',
    position: 'Project Development Engineer',
    isActive: true
  }
]

async function seedProductionDatabase() {
  console.log('🚀 Starting production database seeding...')
  
  try {
    // First, let's check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    })

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists, skipping seeding.')
      console.log('   If you want to reset, delete users manually first.')
      return
    }

    // Hash all passwords and create users
    let successCount = 0
    let errorCount = 0

    for (const userData of users) {
      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(userData.password, 12)
        
        // Create user
        await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword
          }
        })
        
        console.log(`✅ Created user: ${userData.username} (${userData.name})`)
        successCount++
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.username}:`, error.message)
        errorCount++
      }
    }

    console.log('\n📊 Seeding Summary:')
    console.log(`✅ Successfully created: ${successCount} users`)
    console.log(`❌ Failed to create: ${errorCount} users`)
    console.log(`📝 Total users processed: ${users.length}`)
    
    if (successCount > 0) {
      console.log('\n🎉 Production database seeding completed!')
      console.log('\n🔐 Admin Credentials:')
      console.log('   Username: admin')
      console.log('   Password: Securepassword1')
      console.log('\n👥 User Credentials:')
      console.log('   See USER_CREDENTIALS.md for all user passwords')
    }

  } catch (error) {
    console.error('💥 Fatal error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
if (require.main === module) {
  seedProductionDatabase()
    .then(() => {
      console.log('✨ Seeding process completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error)
      process.exit(1)
    })
}

export default seedProductionDatabase
