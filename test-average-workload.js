/**
 * Test the new average workload approach
 */

const { PrismaClient } = require('@prisma/client');

async function testAverageWorkload() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Average Workload Calculation...\n');

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

    // Test for today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`📅 Testing for date: ${today.toDateString()}\n`);

    // Calculate workload for each user for today
    const userWorkloads = [];

    users.forEach(user => {
      // Apply the fixed logic - check both assignment systems
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

      if (userTasks.length > 0) {
        // Calculate total hours for today
        const totalHours = userTasks.reduce((sum, task) => {
          if (!task.estimatedHours) return sum + 4; // Default 4 hours
          
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          const workingDays = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)))
          
          return sum + (task.estimatedHours / workingDays)
        }, 0);

        const maxHours = user.maxHoursPerDay || 8;
        const workloadPercent = Math.round((totalHours / maxHours) * 100);

        userWorkloads.push({
          userId: user.id,
          userName: user.name,
          workloadPercent,
          totalHours,
          maxHours,
          taskCount: userTasks.length
        });

        console.log(`👤 ${user.name}: ${workloadPercent}% (${totalHours.toFixed(2)}h / ${maxHours}h)`);
      }
    });

    // Calculate average workload
    if (userWorkloads.length > 0) {
      const totalWorkloadPercent = userWorkloads.reduce((sum, u) => sum + u.workloadPercent, 0);
      const averageWorkload = Math.round(totalWorkloadPercent / userWorkloads.length);
      const maxWorkload = Math.max(...userWorkloads.map(u => u.workloadPercent));

      console.log(`\n📊 Workload Summary for ${today.toDateString()}:`);
      console.log(`   👥 Users with tasks: ${userWorkloads.length}`);
      console.log(`   📈 Average workload: ${averageWorkload}% (NEW - what calendar bars will show)`);
      console.log(`   🔺 Maximum workload: ${maxWorkload}% (OLD - what was shown before)`);
      console.log(`\n🎯 Calendar grid bars will now show: ${averageWorkload}% doluluk`);
      console.log(`🎯 Individual user cards will show their personal workload percentages`);
    } else {
      console.log(`\n✅ No users have tasks for today - 0% average workload`);
    }

    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAverageWorkload();
