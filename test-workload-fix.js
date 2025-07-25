/**
 * Test the workload calculation after the fix
 */

const { PrismaClient } = require('@prisma/client');

async function testWorkloadCalculation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Workload Calculation After Fix...\n');

    // Get tasks with assignments
    const tasks = await prisma.task.findMany({
      include: {
        assignedUser: true,
        assignedUsers: {
          include: {
            user: true
          }
        }
      }
    });

    // Get users
    const users = await prisma.user.findMany();

    console.log(`📊 Testing with ${tasks.length} tasks and ${users.length} users\n`);

    // Test the new assignment logic for today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    users.slice(0, 5).forEach(user => { // Test first 5 users
      console.log(`\n👤 User: ${user.name}`);
      
      // Apply the new logic - check both assignment systems
      const userTasks = tasks.filter(task => {
        if (!task.startDate || !task.endDate) return false
        
        // Check both assignment systems: legacy assignedId and new assignedUsers
        const isAssignedToUser = task.assignedId === user.id || 
          (task.assignedUsers && task.assignedUsers.some(assignment => assignment.userId === user.id))
        
        if (!isAssignedToUser) return false
        
        const taskStart = new Date(task.startDate)
        const taskEnd = new Date(task.endDate)
        const checkDate = new Date(today)
        
        taskStart.setHours(0, 0, 0, 0)
        taskEnd.setHours(0, 0, 0, 0)
        checkDate.setHours(0, 0, 0, 0)
        
        return checkDate >= taskStart && checkDate <= taskEnd
      });

      console.log(`   📋 Tasks for today: ${userTasks.length}`);
      
      if (userTasks.length > 0) {
        userTasks.forEach(task => {
          console.log(`      - ${task.title} (${task.estimatedHours || 'No hours'} estimated)`);
        });

        // Calculate total hours
        const totalHours = userTasks.reduce((sum, task) => {
          if (!task.estimatedHours) return sum + 4; // Default 4 hours
          
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          const workingDays = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)))
          
          return sum + (task.estimatedHours / workingDays)
        }, 0);

        const maxHours = user.maxHoursPerDay || 8;
        const workloadPercent = Math.round((totalHours / maxHours) * 100);

        console.log(`   ⏰ Total hours today: ${totalHours.toFixed(2)}`);
        console.log(`   📊 Max daily hours: ${maxHours}`);
        console.log(`   📈 Workload percentage: ${workloadPercent}%`);
      } else {
        console.log(`   ✅ No tasks for today - 0% workload`);
      }
    });

    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testWorkloadCalculation();
