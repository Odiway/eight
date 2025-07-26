const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function findProjectNames() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      }
    })

    console.log('📋 All projects:')
    projects.forEach((project, i) => {
      console.log(`${i + 1}. "${project.name}" (ID: ${project.id})`)
      console.log(`   Members: ${project._count.members}, Tasks: ${project._count.tasks}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findProjectNames()
