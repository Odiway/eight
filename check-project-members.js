const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProjectMembers() {
  try {
    console.log('=== PROJECT MEMBERS ANALYSIS ===\n')
    
    // Get all projects with their members and tasks
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: {
            user: true
          }
        },
        tasks: {
          include: {
            assignedUsers: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })
    
    for (const project of projects) {
      console.log(`\n=== ${project.name} ===`)
      console.log(`Direct members: ${project.members.length}`)
      console.log(`Tasks: ${project.tasks.length}`)
      
      if (project.members.length > 0) {
        console.log('Direct members:')
        project.members.forEach(member => {
          console.log(`  - ${member.user.name} (${member.role})`)
        })
      }
      
      // Calculate unique users from task assignments
      const uniqueUsersFromTasks = new Set()
      project.tasks.forEach(task => {
        task.assignedUsers.forEach(assignment => {
          uniqueUsersFromTasks.add(assignment.user.id)
        })
      })
      
      console.log(`Unique users from task assignments: ${uniqueUsersFromTasks.size}`)
      
      if (uniqueUsersFromTasks.size > 0) {
        console.log('Users assigned to tasks:')
        const userNames = []
        project.tasks.forEach(task => {
          task.assignedUsers.forEach(assignment => {
            if (!userNames.find(u => u.id === assignment.user.id)) {
              userNames.push({ id: assignment.user.id, name: assignment.user.name })
            }
          })
        })
        userNames.forEach(user => {
          console.log(`  - ${user.name}`)
        })
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProjectMembers()
