const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testWorkloadCalculation() {
  try {
    console.log('=== WORKLOAD CALCULATION TEST ===\n')
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        maxHoursPerDay: true
      }
    })
    
    // Get all tasks with their assignments
    const tasks = await prisma.task.findMany({
      include: {
        assignedUsers: {
          include: {
            user: true
          }
        }
      }
    })
    
    // Test date: July 24, 2025 (today from debug output)
    const testDate = new Date(2025, 6, 24) // Month is 0-indexed, so 6 = July
    console.log(`Testing workload for: ${testDate.toLocaleDateString('tr-TR')}`)
    console.log(`Test date ISO: ${testDate.toISOString()}`)
    console.log('')
    
    for (const user of users) {
      console.log(`\n=== ${user.name} ===`)
      
      const userTasks = tasks.filter(task => {
        if (!task.startDate || !task.endDate) {
          console.log(`  Task "${task.title}": Missing dates`)
          return false
        }
        
        // Check assignment
        const isAssignedToUser = task.assignedUsers && task.assignedUsers.some(assignment => assignment.userId === user.id)
        if (!isAssignedToUser) {
          console.log(`  Task "${task.title}": Not assigned to user`)
          return false
        }
        
        const taskStart = new Date(task.startDate)
        const taskEnd = new Date(task.endDate)
        const checkDate = new Date(testDate)
        
        // Normalize times
        taskStart.setHours(0, 0, 0, 0)
        taskEnd.setHours(0, 0, 0, 0)
        checkDate.setHours(0, 0, 0, 0)
        
        console.log(`  Task "${task.title}":`)
        console.log(`    Start: ${taskStart.toLocaleDateString('tr-TR')} (${taskStart.toISOString()})`)
        console.log(`    End: ${taskEnd.toLocaleDateString('tr-TR')} (${taskEnd.toISOString()})`)
        console.log(`    Check: ${checkDate.toLocaleDateString('tr-TR')} (${checkDate.toISOString()})`)
        console.log(`    In range: ${checkDate >= taskStart && checkDate <= taskEnd}`)
        
        return checkDate >= taskStart && checkDate <= taskEnd
      })
      
      console.log(`  -> Active tasks: ${userTasks.length}`)
      
      if (userTasks.length > 0) {
        console.log('  -> Task names:')
        userTasks.forEach(task => {
          console.log(`     * ${task.title}`)
        })
        
        // Calculate total hours
        const totalHours = userTasks.reduce((sum, task) => {
          const defaultHours = 4
          const estimatedHours = task.estimatedHours || defaultHours
          
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          const workingDays = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)))
          
          const dailyHours = estimatedHours / workingDays
          console.log(`     * ${task.title}: ${estimatedHours}h total / ${workingDays} days = ${dailyHours.toFixed(2)}h/day`)
          
          return sum + dailyHours
        }, 0)
        
        const maxHours = user.maxHoursPerDay || 8
        const workloadPercent = Math.round((totalHours / maxHours) * 100)
        
        console.log(`  -> Total daily hours: ${totalHours.toFixed(2)}`)
        console.log(`  -> Max hours per day: ${maxHours}`)
        console.log(`  -> Workload percentage: ${workloadPercent}%`)
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testWorkloadCalculation()
