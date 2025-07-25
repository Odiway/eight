const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugAssignments() {
  try {
    console.log('=== DEBUGGING TASK ASSIGNMENTS ===\n')
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        maxHoursPerDay: true
      }
    })
    
    console.log('Users found:')
    users.forEach(user => {
      console.log(`- ${user.name} (ID: ${user.id}) - Department: ${user.department}`)
    })
    console.log('')
    
    // Get all tasks with their assignments
    const tasks = await prisma.task.findMany({
      include: {
        assignedUsers: {
          include: {
            user: true
          }
        },
        assignedUser: true // Legacy assignment
      }
    })
    
    console.log('Tasks found:')
    tasks.forEach(task => {
      console.log(`\nTask: ${task.title}`)
      console.log(`  - Legacy assignedId: ${task.assignedId || 'None'}`)
      console.log(`  - New assignments: ${task.assignedUsers.length}`)
      task.assignedUsers.forEach(assignment => {
        console.log(`    * ${assignment.user.name} (ID: ${assignment.userId})`)
      })
      console.log(`  - Start Date: ${task.startDate}`)
      console.log(`  - End Date: ${task.endDate}`)
      console.log(`  - Status: ${task.status}`)
    })
    
    console.log('\n=== ASSIGNMENT ANALYSIS ===')
    
    // Check if users have any task assignments
    for (const user of users) {
      const legacyAssignments = tasks.filter(t => t.assignedId === user.id)
      const newAssignments = tasks.filter(t => 
        t.assignedUsers.some(a => a.userId === user.id)
      )
      
      console.log(`\n${user.name}:`)
      console.log(`  - Legacy assignments: ${legacyAssignments.length}`)
      console.log(`  - New assignments: ${newAssignments.length}`)
      console.log(`  - Total unique tasks: ${[...new Set([...legacyAssignments, ...newAssignments])].length}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAssignments()
