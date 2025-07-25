import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check if users already exist to avoid duplicate seeding
  const existingUsers = await prisma.user.findMany()
  const forceReseed = process.env.FORCE_RESEED === 'true'
  
  if (existingUsers.length > 0 && !forceReseed) {
    console.log('✅ Users already exist, skipping user seeding')
    console.log('⏭️ Skipping project seeding in production environment')
    console.log('✅ Seed data already exists!')
    console.log('💡 Use FORCE_RESEED=true to override this behavior')
    return
  }

  if (forceReseed && existingUsers.length > 0) {
    console.log('🔄 Force reseeding enabled, clearing existing data...')
    // Note: In production, we should be careful about data deletion
    // This is mainly for development purposes
  }

  // Create Users (from the team photos provided)
  const users = await Promise.all([
    // Batarya Paketleme Ekibi
    prisma.user.create({
      data: {
        name: 'Ali Ağcakoyunlu',
        email: 'ali.agcakoyunlu@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        photo: '/avatars/ali-agcakoyunlu.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Canberk Albay',
        email: 'canberk.albay@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'Batarya Ve Mobilite Endüstriyel Yöneticisi',
        studentId: '5243',
        photo: '/avatars/canberk-albay.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Ekrem Atıcı',
        email: 'ekrem.atici@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        photo: '/avatars/ekrem-atici.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Fatih Rüştü Pıtır',
        email: 'fatih.rustu@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        photo: '/avatars/fatih-rustu.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Hüseyin Can Sak',
        email: 'huseyin.can@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        photo: '/avatars/huseyin-can.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Kemal Taştan',
        email: 'kemal.tastan@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        photo: '/avatars/kemal-tastan.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Oğuzhan İnandı',
        email: 'oguzhan.inandi@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'Tts Mobilite Ve Endüstriyel Mühendisi',
        photo: '/avatars/oguzhan-inandi.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Ömer Arısoy',
        email: 'omer.arisoy@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        photo: '/avatars/omer-arisoy.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Samet Danacı',
        email: 'samet.danaci@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        photo: '/avatars/samet-danaci.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Yaşar Doğan',
        email: 'yasar.dogan@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        photo: '/avatars/yasar-dogan.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Yunus Emre Koç',
        email: 'yunus.emre@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        photo: '/avatars/yunus-emre.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Yusuf Kebüde',
        email: 'yusuf.kebude@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'İşçi',
        photo: '/avatars/yusuf-kebude.jpg',
      },
    }),

    // Batarya Geliştirme Ekibi
    prisma.user.create({
      data: {
        name: 'Arda Sönmez',
        email: 'arda.sonmez@temsada.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Tts Batarya Geliştirme Mühendisi',
        photo: '/avatars/arda-sonmez.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Batuhan Salıcı',
        email: 'batuhan.salici@temsada.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Arge Mühendisi',
        studentId: '6389',
        photo: '/avatars/batuhan-salici.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Berk Ertürk',
        email: 'berk.erturk@temsada.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Batarya Geliştirme Mühendisi',
        photo: '/avatars/berk-erturk.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Berkay Şimşek',
        email: 'berkay.simsek@temsada.com',
        department: 'Batarya Paketleme Ekibi',
        position: 'Batarya Ve Mobilite Endüstriyel Mühendisi',
        photo: '/avatars/berkay-simsek.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Biran Can Türe',
        email: 'biran.can@temsada.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Arge Mühendisi',
        photo: '/avatars/biran-can.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Esra Dönmez',
        email: 'esra.donmez@temsada.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Arge Mühendisi',
        studentId: '6623',
        photo: '/avatars/esra-donmez.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mete Han Kuşdemir',
        email: 'mete.han@temsada.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Arge Mühendisi',
        studentId: '5223',
        photo: '/avatars/mete-han.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Muhammed Karakuş',
        email: 'muhammed.karakus@temsada.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Arge Mühendisi',
        studentId: '5253',
        photo: '/avatars/muhammed-karakus.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Murat Kara',
        email: 'murat.kara@temsada.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Arge Uzmanı',
        studentId: '6322',
        photo: '/avatars/murat-kara.jpg',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Selim Akbudak',
        email: 'selim.akbudak@temsada.com',
        department: 'Batarya Geliştirme Ekibi',
        position: 'Batarya Geliştirme Yöneticisi',
        studentId: '5290',
        photo: '/avatars/selim-akbudak.jpg',
      },
    }),
  ])

  // Create Teams
  const bataryaPaketlemeTeam = await prisma.team.create({
    data: {
      name: 'Batarya Paketleme Ekibi',
      description: 'Batarya paketleme işlemlerinden sorumlu ekip',
    },
  })

  const bataryaGelistirmeTeam = await prisma.team.create({
    data: {
      name: 'Batarya Geliştirme Ekibi',
      description:
        'Batarya araştırma ve geliştirme çalışmalarından sorumlu ekip',
    },
  })

  // Add team members
  const paketlemeUsers = users.filter(
    (user) => user.department === 'Batarya Paketleme Ekibi'
  )
  const gelistirmeUsers = users.filter(
    (user) => user.department === 'Batarya Geliştirme Ekibi'
  )

  for (const user of paketlemeUsers) {
    await prisma.teamMember.create({
      data: {
        teamId: bataryaPaketlemeTeam.id,
        userId: user.id,
        role:
          user.position.includes('Yönetici') ||
          user.position.includes('Mühendis')
            ? 'Lead'
            : 'Member',
      },
    })
  }

  for (const user of gelistirmeUsers) {
    await prisma.teamMember.create({
      data: {
        teamId: bataryaGelistirmeTeam.id,
        userId: user.id,
        role: user.position.includes('Yönetici')
          ? 'Lead'
          : user.position.includes('Mühendis')
          ? 'Senior'
          : 'Member',
      },
    })
  }

  // Create sample projects only in development
  const shouldSeedProjects = process.env.NODE_ENV !== 'production' && process.env.SEED_PROJECTS !== 'false'
  
  let projects: any[] = []
  
  if (shouldSeedProjects) {
    projects = await Promise.all([
      prisma.project.create({
        data: {
          name: 'Yeni Batarya Hücre Tasarımı',
          description:
            'Gelişmiş enerji yoğunluğuna sahip yeni batarya hücre tasarımının geliştirilmesi',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-06-30'),
        },
      }),
      prisma.project.create({
        data: {
          name: 'Üretim Hattı Optimizasyonu',
          description:
            'Mevcut üretim hattının verimlilik artırımı için optimizasyon çalışmaları',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-05-15'),
        },
      }),
      prisma.project.create({
        data: {
          name: 'Kalite Kontrol Sistemi',
          description:
            'Otomatik kalite kontrol sisteminin geliştirilmesi ve uygulanması',
          status: 'PLANNING',
          priority: 'HIGH',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-08-30'),
        },
      }),
    ])
  } else {
    console.log('⏭️ Skipping project seeding in production environment')
  }

  // Create workflow steps for projects (only if projects exist)
  if (shouldSeedProjects && projects.length > 0) {
    for (const project of projects) {
      await prisma.workflowStep.createMany({
        data: [
          { name: 'Tasarım', order: 1, color: '#EF4444', projectId: project.id },
          { name: 'Prototip', order: 2, color: '#F59E0B', projectId: project.id },
          { name: 'Test', order: 3, color: '#3B82F6', projectId: project.id },
          { name: 'Üretim', order: 4, color: '#10B981', projectId: project.id },
        ],
      })
    }

    // Add project members
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]
      const projectUsers = users.slice(i * 4, (i + 1) * 4)

      for (const user of projectUsers) {
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: user.id,
            role: user.position.includes('Yönetici')
              ? 'Manager'
              : user.position.includes('Mühendis')
              ? 'Lead'
              : 'Member',
          },
        })
      }
    }
  }

  // Create sample tasks (only if projects exist)
  if (shouldSeedProjects && projects.length > 0) {
    const workflowSteps = await prisma.workflowStep.findMany()

    const taskSamples = [
      'Batarya hücre spesifikasyonlarının belirlenmesi',
      'Malzeme tedarik planının hazırlanması',
      'Prototip üretim sürecinin tasarlanması',
      'Test protokollerinin geliştirilmesi',
      'Kalite standartlarının belirlenmesi',
      'Üretim hattı düzeninin optimize edilmesi',
      'Güvenlik prosedürlerinin güncellenmesi',
      'Performans test sonuçlarının analizi',
    ]

    for (let i = 0; i < taskSamples.length; i++) {
      const task = taskSamples[i]
      const project = projects[i % projects.length]
      const assignedUser = users[i % users.length]
      const workflowStep = workflowSteps[i % workflowSteps.length]

      await prisma.task.create({
        data: {
          title: task,
          description: `${task} için detaylı çalışma planı ve uygulama`,
          status: ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'][
            Math.floor(Math.random() * 4)
          ] as any,
          priority: ['LOW', 'MEDIUM', 'HIGH'][
            Math.floor(Math.random() * 3)
          ] as any,
          projectId: project.id,
          assignedId: assignedUser.id,
          createdById: users[0].id,
          workflowStepId: workflowStep.id,
          startDate: new Date(),
          endDate: new Date(
            Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000
          ), // Random date within 30 days
        },
      })
    }
  }

  console.log('✅ Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
