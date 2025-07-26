const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProjectData() {
  try {
    console.log('🔍 Checking project data...')
    
    // Get all projects with tasks and members
    const projects = await prisma.project.findMany({
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

    console.log(`\n📊 Found ${projects.length} projects:`)
    
    projects.forEach(project => {
      console.log(`\n🔷 Project: ${project.name}`)
      console.log(`   Status: ${project.status}`)
      console.log(`   Tasks: ${project.tasks.length}`)
      console.log(`   Members: ${project.members.length}`)
      
      if (project.tasks.length > 0) {
        console.log(`   Task assignments:`)
        project.tasks.forEach(task => {
          const assignedCount = task.assignedUsers.length
          console.log(`     - ${task.title}: ${assignedCount} assigned users`)
        })
      }
    })

    // Check total task assignments
    const taskAssignments = await prisma.taskAssignment.findMany()
    console.log(`\n📋 Total TaskAssignments in database: ${taskAssignments.length}`)

    // Check users
    const users = await prisma.user.findMany()
    console.log(`👥 Total Users in database: ${users.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProjectData()
