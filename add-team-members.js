const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addTeamMembersToProject() {
  try {
    console.log('🔧 Adding team members to Batarya Dijitalleşme project...')
    
    // Get the project that has no members
    const project = await prisma.project.findFirst({
      where: {
        name: 'Batarya Dijitalleşme '
      },
      include: {
        members: true
      }
    })

    if (!project) {
      console.log('❌ Batarya Dijitalleşme project not found')
      return
    }

    console.log(`📝 Project ID: ${project.id}`)
    console.log(`📝 Current members: ${project.members.length}`)

    // Get some users to add as team members
    const users = await prisma.user.findMany({
      take: 4,
      where: {
        department: {
          contains: 'Batarya'
        }
      }
    })

    console.log(`👥 Found ${users.length} users to add`)

    // Add team members with different roles
    const roles = ['Manager', 'Developer', 'Developer', 'Tester']
    
    for (let i = 0; i < Math.min(users.length, 4); i++) {
      const user = users[i]
      const role = roles[i] || 'Developer'
      
      console.log(`➕ Adding ${user.name} as ${role}`)
      
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: role
        }
      })
    }

    // Verify the changes
    const updatedProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    console.log('✅ Successfully added team members!')
    console.log(`📊 Updated members count: ${updatedProject.members.length}`)
    updatedProject.members.forEach((member, i) => {
      console.log(`  ${i + 1}. ${member.user.name} (${member.role})`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTeamMembersToProject()
