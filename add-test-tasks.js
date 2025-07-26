const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addTestTasksToTTRAK() {
  try {
    console.log('🔍 Looking for TTRAK project...')
    
    // Find the TTRAK project
    const ttrakProject = await prisma.project.findFirst({
      where: {
        name: 'TTRAK'
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!ttrakProject) {
      console.log('❌ TTRAK project not found!')
      return
    }

    console.log(`✅ Found TTRAK project: ${ttrakProject.id}`)
    console.log(`   Current members: ${ttrakProject.members.length}`)

    // Get some users to assign tasks to
    const users = await prisma.user.findMany({
      take: 3 // Get first 3 users
    })

    if (users.length === 0) {
      console.log('❌ No users found in the database!')
      return
    }

    console.log(`👥 Found ${users.length} users to assign tasks to`)

    // Create some test tasks
    const testTasks = [
      {
        title: 'UI/UX Tasarımı',
        description: 'Kullanıcı arayüzü ve deneyimi tasarımı',
        status: 'TODO',
        priority: 'HIGH',
        projectId: ttrakProject.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        title: 'Backend API Geliştirme',
        description: 'REST API endpoints geliştirilmesi',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: ttrakProject.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
      {
        title: 'Database Optimizasyonu',
        description: 'Veritabanı performans optimizasyonu',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        projectId: ttrakProject.id,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endDate: new Date(),
      },
      {
        title: 'Test Senaryoları',
        description: 'Otomatik test senaryolarının yazılması',
        status: 'REVIEW',
        priority: 'MEDIUM',
        projectId: ttrakProject.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      },
    ]

    console.log(`📝 Creating ${testTasks.length} test tasks...`)

    for (let i = 0; i < testTasks.length; i++) {
      const taskData = testTasks[i]
      
      // Create the task
      const task = await prisma.task.create({
        data: taskData,
      })

      console.log(`   ✅ Created task: ${task.title}`)

      // Assign a user to each task
      const userToAssign = users[i % users.length] // Cycle through users
      
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          userId: userToAssign.id,
        },
      })

      console.log(`      👤 Assigned to: ${userToAssign.name}`)
    }

    // Add project members if not already added
    for (const user of users) {
      const existingMember = await prisma.projectMember.findFirst({
        where: {
          projectId: ttrakProject.id,
          userId: user.id,
        },
      })

      if (!existingMember) {
        await prisma.projectMember.create({
          data: {
            projectId: ttrakProject.id,
            userId: user.id,
            role: 'Developer',
          },
        })
        console.log(`   👥 Added ${user.name} as project member`)
      }
    }

    console.log('\n🎉 Successfully added test data to TTRAK project!')
    
    // Verify the result
    const updatedProject = await prisma.project.findUnique({
      where: { id: ttrakProject.id },
      include: {
        tasks: {
          include: {
            assignedUsers: {
              include: {
                user: true,
              },
            },
          },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    console.log(`\n📊 Updated TTRAK project stats:`)
    console.log(`   Tasks: ${updatedProject.tasks.length}`)
    console.log(`   Members: ${updatedProject.members.length}`)
    console.log(`   Task assignments: ${updatedProject.tasks.reduce((sum, task) => sum + task.assignedUsers.length, 0)}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestTasksToTTRAK()
