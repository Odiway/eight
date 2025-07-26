/**
 * Diagnostic script to check team task counting
 * This will help identify why task counts are showing 0
 */

const { PrismaClient } = require('@prisma/client');

async function debugTeamTaskCounts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging Team Task Counts...\n');
    
    // 1. Check total tasks in database
    const totalTasks = await prisma.task.count();
    console.log(`📊 Total tasks in database: ${totalTasks}`);
    
    // 2. Check total users
    const totalUsers = await prisma.user.count();
    console.log(`👥 Total users in database: ${totalUsers}`);
    
    // 3. Check task assignments
    const totalAssignments = await prisma.taskAssignment.count();
    console.log(`🔗 Total task assignments: ${totalAssignments}`);
    
    // 4. Get a sample user with their tasks
    const sampleUser = await prisma.user.findFirst({
      include: {
        assignedTasks: true,
        taskAssignments: {
          include: {
            task: true,
          },
        },
      },
    });
    
    if (sampleUser) {
      console.log(`\n👤 Sample User: ${sampleUser.name}`);
      console.log(`   - Legacy assigned tasks: ${sampleUser.assignedTasks.length}`);
      console.log(`   - New task assignments: ${sampleUser.taskAssignments.length}`);
      
      if (sampleUser.assignedTasks.length > 0) {
        console.log(`   - Sample legacy task status: ${sampleUser.assignedTasks[0].status}`);
      }
      
      if (sampleUser.taskAssignments.length > 0) {
        console.log(`   - Sample new task status: ${sampleUser.taskAssignments[0].task.status}`);
      }
    }
    
    // 5. Check task statuses distribution
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });
    
    console.log('\n📈 Tasks by status:');
    tasksByStatus.forEach(group => {
      console.log(`   - ${group.status}: ${group._count.status} tasks`);
    });
    
    // 6. Check if tasks have proper assignments
    const tasksWithAssignments = await prisma.task.findMany({
      where: {
        OR: [
          { assignedId: { not: null } },
          { assignedUsers: { some: {} } }
        ]
      },
      include: {
        assignedUsers: true,
      }
    });
    
    console.log(`\n🎯 Tasks with assignments: ${tasksWithAssignments.length}/${totalTasks}`);
    
    if (tasksWithAssignments.length > 0) {
      const sampleTask = tasksWithAssignments[0];
      console.log(`   - Sample task: "${sampleTask.title}"`);
      console.log(`   - Legacy assignedId: ${sampleTask.assignedId || 'null'}`);
      console.log(`   - New assignments: ${sampleTask.assignedUsers.length}`);
    }
    
    console.log('\n✅ Diagnostic complete!');
    
  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTeamTaskCounts();
