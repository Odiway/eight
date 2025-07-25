/**
 * Debug script to check task assignments and workload calculation
 */

const { PrismaClient } = require('@prisma/client');

async function debugTaskAssignments() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging Task Assignments and Workload...\n');

    // Get all tasks with their assignments
    const tasks = await prisma.task.findMany({
      include: {
        assignedUser: true, // Legacy assignment
        assignedUsers: {    // New assignment system
          include: {
            user: true
          }
        },
        project: true
      }
    });

    console.log(`📊 Found ${tasks.length} tasks\n`);

    tasks.forEach((task, index) => {
      console.log(`\n📋 Task ${index + 1}: ${task.title}`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Estimated Hours: ${task.estimatedHours}`);
      console.log(`   Max Daily Hours: ${task.maxDailyHours}`);
      console.log(`   Workload Percentage: ${task.workloadPercentage}`);
      console.log(`   Start Date: ${task.startDate}`);
      console.log(`   End Date: ${task.endDate}`);
      
      // Check legacy assignment
      if (task.assignedId) {
        console.log(`   ✅ Legacy Assignment - assignedId: ${task.assignedId}`);
        if (task.assignedUser) {
          console.log(`      User: ${task.assignedUser.name}`);
        }
      } else {
        console.log(`   ❌ No Legacy Assignment (assignedId is null)`);
      }
      
      // Check new assignment system
      if (task.assignedUsers && task.assignedUsers.length > 0) {
        console.log(`   ✅ New Assignment System - ${task.assignedUsers.length} users:`);
        task.assignedUsers.forEach(assignment => {
          console.log(`      - ${assignment.user.name} (${assignment.userId})`);
        });
      } else {
        console.log(`   ❌ No New Assignment System users`);
      }
      
      console.log(`   ---`);
    });

    // Check which users exist
    console.log('\n👥 All Users:');
    const users = await prisma.user.findMany();
    users.forEach(user => {
      console.log(`   - ${user.name} (ID: ${user.id})`);
    });

    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugTaskAssignments();
