const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const users = [
  // Batarya Paketleme Ekibi
  {
    name: "Ali AĞCAKOYUNLU",
    email: "ali.agcakoyunlu@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "İşçi",
    username: "ali.agcakoyunlu",
    password: "K9m2P8x1",
    role: "USER"
  },
  {
    name: "Berkay ŞİMŞEK",
    email: "berkay.simsek@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "Batarya ve Mobilte Endüstriyelleşme Mühendisi",
    username: "berkay.simsek",
    password: "N7w5Q2z9",
    role: "USER"
  },
  {
    name: "Canberk ALBAY",
    email: "canberk.albay@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "Batarya ve Mobilite Endüstriyelleşme Yöneticisi",
    username: "canberk.albay",
    password: "R4t8Y6u3",
    role: "USER"
  },
  {
    name: "Ekrem ATICI",
    email: "ekrem.atici@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "İşçi",
    username: "ekrem.atici",
    password: "L1s9D4h7",
    role: "USER"
  },
  {
    name: "Fatih Rüştü PITIR",
    email: "fatih.rustu.pitir@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "İşçi",
    username: "fatih.pitir",
    password: "M3x6B9k2",
    role: "USER"
  },
  {
    name: "Hüseyin Can SAK",
    email: "huseyin.can.sak@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "İşçi",
    username: "huseyin.sak",
    password: "P8v2C5n1",
    role: "USER"
  },
  {
    name: "Kemal TAŞTAN",
    email: "kemal.tastan@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "İşçi",
    username: "kemal.tastan",
    password: "Q4j7F3w6",
    role: "USER"
  },
  {
    name: "Oğuzhan İNANDI",
    email: "oguzhan.inandi@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "Tts Mobilite Ve Endüstriyelleşme Mühendisi",
    username: "oguzhan.inandi",
    password: "T9r2E8y5",
    role: "USER"
  },
  {
    name: "Ömer ARISOY",
    email: "omer.arisoy@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "İşçi",
    username: "omer.arisoy",
    password: "V6k4H9s2",
    role: "USER"
  },
  {
    name: "Samet DANACI",
    email: "samet.danaci@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "İşçi",
    username: "samet.danaci",
    password: "W1q8L6p4",
    role: "USER"
  },
  {
    name: "Yaşar DOĞAN",
    email: "yasar.dogan@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "İşçi",
    username: "yasar.dogan",
    password: "Z3m7N2c9",
    role: "USER"
  },
  {
    name: "Yunus Emre KOÇ",
    email: "yunus.emre.koc@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "İşçi",
    username: "yunus.koc",
    password: "A8b5R1x7",
    role: "USER"
  },
  {
    name: "Yusuf KEBÜDE",
    email: "yusuf.kebude@temsa.com",
    department: "Batarya Paketleme Ekibi",
    position: "İşçi",
    username: "yusuf.kebude",
    password: "D4g9T6v2",
    role: "USER"
  },

  // Batarya Geliştirme Ekibi
  {
    name: "Arda SÖNMEZ",
    email: "arda.sonmez@temsa.com",
    department: "Batarya Geliştirme Ekibi",
    position: "Tts Batarya Geliştirme Mühendisi",
    username: "arda.sonmez",
    password: "F2k8W5j3",
    role: "USER"
  },
  {
    name: "Batuhan SALICI",
    email: "batuhan.salici@temsa.com",
    department: "Batarya Geliştirme Ekibi",
    position: "Arge Mühendisi",
    username: "batuhan.salici",
    password: "G7n4Q9m1",
    role: "USER"
  },
  {
    name: "Berk ERTÜRK",
    email: "berk.erturk@temsa.com",
    department: "Batarya Geliştirme Ekibi",
    position: "Batarya Geliştirme Mühendisi",
    username: "berk.erturk",
    password: "H5p2L8c6",
    role: "USER"
  },
  {
    name: "Biran Can TÜRE",
    email: "biran.can.ture@temsa.com",
    department: "Batarya Geliştirme Ekibi",
    position: "Batarya Geliştirme Ekibi Arge Mühendisi",
    username: "biran.ture",
    password: "J9x3V7b4",
    role: "USER"
  },
  {
    name: "Esra DÖNMEZ",
    email: "esra.donmez@temsa.com",
    department: "Batarya Geliştirme Ekibi",
    position: "Arge Mühendisi",
    username: "esra.donmez",
    password: "K1f6S2n8",
    role: "USER"
  },
  {
    name: "Mete Han KUŞDEMİR",
    email: "mete.han.kusdemir@temsa.com",
    department: "Batarya Geliştirme Ekibi",
    position: "Arge Mühendisi",
    username: "mete.kusdemir",
    password: "L4h9R5t7",
    role: "USER"
  },
  {
    name: "Muhammed KARAKUŞ",
    email: "muhammed.karakus@temsa.com",
    department: "Batarya Geliştirme Ekibi",
    position: "Arge Mühendisi",
    username: "muhammed.karakus",
    password: "M8d2Y6w3",
    role: "USER"
  },
  {
    name: "Murat KARA",
    email: "murat.kara@temsa.com",
    department: "Batarya Geliştirme Ekibi",
    position: "Arge Uzmanı",
    username: "murat.kara",
    password: "N3z7E9q1",
    role: "USER"
  },
  {
    name: "Selim AKBUDAK",
    email: "selim.akbudak@temsa.com",
    department: "Batarya Geliştirme Ekibi",
    position: "Batarya Geliştirme Yöneticisi",
    username: "selim.akbudak",
    password: "O6s4I8u5",
    role: "USER"
  },

  // Satın Alma Ekibi
  {
    name: "Fatih AVCI",
    email: "fatih.avci@temsa.com",
    department: "Satın Alma Ekibi",
    position: "Satın Alma Ekibi Yöneticisi",
    username: "fatih.avci",
    password: "P2v8X4k9",
    role: "USER"
  },
  {
    name: "Polen ACIMIŞ",
    email: "polen.acimis@temsa.com",
    department: "Satın Alma Ekibi",
    position: "Satın Alma Uzmanı",
    username: "polen.acimis",
    password: "Q7c1Z3m6",
    role: "USER"
  },

  // Proje Geliştirme Ekibi
  {
    name: "Gökhan BİLGİN",
    email: "gokhan.bilgin@temsa.com",
    department: "Proje Geliştirme Ekibi",
    position: "Ar-Ge Proje Yöneticisi",
    username: "gokhan.bilgin",
    password: "R9f5A2l8",
    role: "USER"
  }
]

async function main() {
  console.log('🚀 Creating users with authentication...')

  try {
    // Create users with hashed passwords
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          department: userData.department,
          position: userData.position,
          username: userData.username,
          password: hashedPassword,
          role: userData.role,
          isActive: true,
          maxHoursPerDay: 8,
          workingDays: "1,2,3,4,5"
        }
      })

      console.log(`✅ Created user: ${user.name} (${user.username})`)
    }

    console.log(`\n🎉 Successfully created ${users.length} users!`)
    console.log('\n📋 Login Information:')
    console.log('Admin: admin / Securepassword1')
    console.log('Users: Check USER_CREDENTIALS.md file')

  } catch (error) {
    console.error('❌ Error creating users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
