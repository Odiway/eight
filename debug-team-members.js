const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugTeamMembers() {
  try {
    console.log('🔍 Checking project members...')
    
    // Check projects with members
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        tasks: {
          include: {
            assignedUsers: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    console.log(`\n📊 Total projects: ${projects.length}`)
    
    projects.forEach((project, index) => {
      console.log(`\n--- Project ${index + 1}: ${project.name} ---`)
      console.log(`ID: ${project.id}`)
      console.log(`Status: ${project.status}`)
      console.log(`Members count: ${project.members.length}`)
      console.log(`Tasks count: ${project.tasks.length}`)
      
      if (project.members.length > 0) {
        console.log('Members:')
        project.members.forEach((member, i) => {
          console.log(`  ${i + 1}. ${member.user.name} (Role: ${member.role})`)
        })
      } else {
        console.log('❌ No members found!')
      }
      
      if (project.tasks.length > 0) {
        console.log('Tasks:')
        project.tasks.forEach((task, i) => {
          console.log(`  ${i + 1}. ${task.title} - Assigned to: ${task.assignedUsers.length} users`)
        })
      }
    })

    // Check if there are any users in the system
    const users = await prisma.user.findMany()
    console.log(`\n👥 Total users in system: ${users.length}`)
    
    if (users.length > 0) {
      console.log('Users:')
      users.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.name} (${user.email}) - Department: ${user.department}`)
      })
    }

    // Check project members table directly
    const projectMembers = await prisma.projectMember.findMany({
      include: {
        user: true,
        project: true,
      },
    })
    
    console.log(`\n🔗 Total project members relationships: ${projectMembers.length}`)
    if (projectMembers.length > 0) {
      projectMembers.forEach((pm, i) => {
        console.log(`  ${i + 1}. ${pm.user.name} -> ${pm.project.name} (Role: ${pm.role})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugTeamMembers()
