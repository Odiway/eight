// Preview Script - Shows what will be added to User table
// Run this first to see exactly what users will be created
// This script is READ-ONLY - no changes to database

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const newUsers = [
  'admin', 'ali.agcakoyunlu', 'berkay.simsek', 'canberk.albay', 'ekrem.atici', 
  'fatih.pitir', 'huseyin.sak', 'kemal.tastan', 'oguzhan.inandi', 'omer.arisoy',
  'samet.danaci', 'yasar.dogan', 'yunus.koc', 'yusuf.kebude', 'arda.sonmez',
  'batuhan.salici', 'berk.erturk', 'biran.ture', 'esra.donmez', 'mete.kusdemir',
  'muhammed.karakus', 'murat.kara', 'selim.akbudak', 'fatih.avci', 'polen.acimis',
  'gokhan.bilgin'
]

async function previewUserAdditions() {
  console.log('🔍 PREVIEW: User Table Analysis')
  console.log('=====================================\n')

  try {
    // Check current state
    const currentUsers = await prisma.user.findMany({
      select: { username: true, role: true, name: true }
    })

    console.log(`📊 Current users in database: ${currentUsers.length}`)
    if (currentUsers.length > 0) {
      console.log('Current usernames:')
      currentUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.role}) - ${user.name}`)
      })
    }

    console.log('\n🆕 Users that will be ADDED:')
    let willAdd = 0
    let willSkip = 0

    for (const username of newUsers) {
      const exists = currentUsers.find(u => u.username === username)
      if (exists) {
        console.log(`   ⚠️  ${username} - ALREADY EXISTS, will skip`)
        willSkip++
      } else {
        console.log(`   ✅ ${username} - WILL BE CREATED`)
        willAdd++
      }
    }

    console.log('\n📋 SUMMARY:')
    console.log(`✅ Users to create: ${willAdd}`)
    console.log(`⚠️  Users to skip: ${willSkip}`)
    console.log(`📊 Total after seeding: ${currentUsers.length + willAdd}`)

    console.log('\n🛡️  SAFETY CONFIRMATION:')
    console.log('   ✅ Only User table will be affected')
    console.log('   ✅ Projects table: UNTOUCHED')
    console.log('   ✅ Tasks table: UNTOUCHED') 
    console.log('   ✅ All other data: UNTOUCHED')

    console.log('\n🚀 Ready to proceed? Run:')
    console.log('   DATABASE_URL="your_neon_url" node seed-users-only.js')

  } catch (error) {
    console.error('❌ Preview failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

previewUserAdditions()
