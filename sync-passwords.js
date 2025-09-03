// Sync all passwords in Neon database to match USER_CREDENTIALS.md exactly
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

// Exact mapping from USER_CREDENTIALS.md
const credentialsMapping = [
  // Admin Account
  { email: 'admin@temsa.com', username: 'admin', password: 'Securepassword1', role: 'ADMIN' },
  
  // Batarya Paketleme Ekibi
  { email: 'ali.agcakoyunlu@temsa.com', username: 'ali.agcakoyunlu', password: 'K9m2P8x1', role: 'USER' },
  { email: 'berkay.simsek@temsa.com', username: 'berkay.simsek', password: 'N7w5Q2z9', role: 'USER' },
  { email: 'canberk.albay@temsa.com', username: 'canberk.albay', password: 'R4t8Y6u3', role: 'USER' },
  { email: 'ekrem.atici@temsa.com', username: 'ekrem.atici', password: 'L1s9D4h7', role: 'USER' },
  { email: 'fatih.rustu.pitir@temsa.com', username: 'fatih.pitir', password: 'M3x6B9k2', role: 'USER' },
  { email: 'huseyin.can.sak@temsa.com', username: 'huseyin.sak', password: 'P8v2C5n1', role: 'USER' },
  { email: 'kemal.tastan@temsa.com', username: 'kemal.tastan', password: 'Q4j7F3w6', role: 'USER' },
  { email: 'oguzhan.inandi@temsa.com', username: 'oguzhan.inandi', password: 'T9r2E8y5', role: 'USER' },
  { email: 'omer.arisoy@temsa.com', username: 'omer.arisoy', password: 'V6k4H9s2', role: 'USER' },
  { email: 'samet.danaci@temsa.com', username: 'samet.danaci', password: 'W1q8L6p4', role: 'USER' },
  { email: 'yasar.dogan@temsa.com', username: 'yasar.dogan', password: 'Z3m7N2c9', role: 'USER' },
  { email: 'yunus.emre.koc@temsa.com', username: 'yunus.koc', password: 'A8b5R1x7', role: 'USER' },
  { email: 'yusuf.kebude@temsa.com', username: 'yusuf.kebude', password: 'D4g9T6v2', role: 'USER' },

  // Batarya Geliştirme Ekibi
  { email: 'arda.sonmez@temsa.com', username: 'arda.sonmez', password: 'F2k8W5j3', role: 'USER' },
  { email: 'batuhan.salici@temsa.com', username: 'batuhan.salici', password: 'G7n4Q9m1', role: 'USER' },
  { email: 'berk.erturk@temsa.com', username: 'berk.erturk', password: 'H5p2L8c6', role: 'USER' },
  { email: 'biran.can.ture@temsa.com', username: 'biran.ture', password: 'J9x3V7b4', role: 'USER' },
  { email: 'esra.donmez@temsa.com', username: 'esra.donmez', password: 'K1f6S2n8', role: 'USER' },
  { email: 'mete.han.kusdemir@temsa.com', username: 'mete.kusdemir', password: 'L4h9R5t7', role: 'USER' },
  { email: 'muhammed.karakus@temsa.com', username: 'muhammed.karakus', password: 'M8d2Y6w3', role: 'USER' },
  { email: 'murat.kara@temsa.com', username: 'murat.kara', password: 'N3z7E9q1', role: 'USER' },
  { email: 'selim.akbudak@temsa.com', username: 'selim.akbudak', password: 'O6s4I8u5', role: 'USER' },

  // Satın Alma Ekibi
  { email: 'fatih.avci@temsa.com', username: 'fatih.avci', password: 'P2v8X4k9', role: 'USER' },
  { email: 'polen.acimis@temsa.com', username: 'polen.acimis', password: 'Q7c1Z3m6', role: 'USER' },

  // Proje Geliştirme Ekibi
  { email: 'gokhan.bilgin@temsa.com', username: 'gokhan.bilgin', password: 'R9f5A2l8', role: 'USER' }
]

async function syncPasswords() {
  console.log('🔄 Syncing all passwords to match USER_CREDENTIALS.md...\n')
  
  try {
    let updated = 0
    let notFound = 0
    let errors = 0

    for (const cred of credentialsMapping) {
      try {
        // Find user by email
        const users = await prisma.$queryRaw`
          SELECT id, username, email, name FROM "User" WHERE email = ${cred.email}
        `

        if (users.length > 0) {
          const user = users[0]
          
          // Hash the correct password
          const hashedPassword = await bcrypt.hash(cred.password, 12)
          
          // Update user with correct username and password
          await prisma.$queryRaw`
            UPDATE "User" 
            SET username = ${cred.username},
                password = ${hashedPassword},
                role = ${cred.role},
                "isActive" = true,
                "updatedAt" = NOW()
            WHERE id = ${user.id}
          `
          
          console.log(`✅ ${cred.username} (${user.name}) - Password synced`)
          updated++
          
        } else {
          console.log(`❌ ${cred.username} - User not found with email ${cred.email}`)
          notFound++
        }

        // Small delay to be gentle
        await new Promise(resolve => setTimeout(resolve, 50))

      } catch (error) {
        console.error(`💥 Error syncing ${cred.username}:`, error.message)
        errors++
      }
    }

    console.log('\n📊 PASSWORD SYNC SUMMARY:')
    console.log(`✅ Users updated: ${updated}`)
    console.log(`❌ Users not found: ${notFound}`)
    console.log(`💥 Errors: ${errors}`)
    console.log(`📝 Total processed: ${credentialsMapping.length}`)

    if (updated > 0) {
      console.log('\n🧪 Testing synced passwords...')
      
      // Test a few key credentials
      const testCreds = ['admin', 'arda.sonmez', 'oguzhan.inandi', 'ali.agcakoyunlu']
      
      for (const testUsername of testCreds) {
        const mapping = credentialsMapping.find(c => c.username === testUsername)
        if (mapping) {
          try {
            const user = await prisma.$queryRaw`
              SELECT password FROM "User" WHERE username = ${testUsername}
            `
            
            if (user.length > 0) {
              const isValid = await bcrypt.compare(mapping.password, user[0].password)
              const status = isValid ? '✅ VALID' : '❌ INVALID'
              console.log(`   ${testUsername} / ${mapping.password} → ${status}`)
            }
          } catch (e) {
            console.log(`   ${testUsername} → ❌ ERROR`)
          }
        }
      }

      console.log('\n🎉 Password sync completed!')
      console.log('\n🌐 All USER_CREDENTIALS.md passwords should now work on production:')
      console.log('   Admin: admin / Securepassword1')
      console.log('   User: arda.sonmez / F2k8W5j3')
      console.log('   User: ali.agcakoyunlu / K9m2P8x1')
      console.log('   User: oguzhan.inandi / T9r2E8y5')
      console.log('   (And all others from the credentials file)')
    }

  } catch (error) {
    console.error('💥 Password sync failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

syncPasswords()
