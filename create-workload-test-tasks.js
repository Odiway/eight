/**
 * Quick task creation for testing the new average workload approach
 */

const { PrismaClient } = require('@prisma/client');

async function createTestTasks() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📝 Creating test tasks for workload testing...\n');

    // Get the first project and some users
    const project = await prisma.project.findFirst();
    const users = await prisma.user.findMany({ take: 3 }); // Get first 3 users

    if (!project) {
      console.log('❌ No project found. Please create a project first.');
      return;
    }

    if (users.length < 3) {
      console.log('❌ Need at least 3 users. Found only:', users.length);
      return;
    }

    console.log(`🎯 Using project: ${project.name}`);
    console.log(`👥 Using users: ${users.map(u => u.name).join(', ')}\n`);

    // Create today's date range
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 5); // 5 days from now

    // Create 3 test tasks with different workloads
    const testTasks = [
      {
        title: 'High Workload Task',
        description: 'Testing high workload calculation',
        estimatedHours: 32, // 32 hours
        maxDailyHours: 4,   // 4 hours/day = 8 days needed, but 32/5 = 6.4h/day actual
        startDate: today,
        endDate: endDate,
        projectId: project.id,
        userId: users[0].id, // Assign to first user
        expectedWorkload: '80%' // 6.4/8 = 80%
      },
      {
        title: 'Medium Workload Task',
        description: 'Testing medium workload calculation',
        estimatedHours: 20, // 20 hours
        maxDailyHours: 5,   // 5 hours/day, 20/5 = 4h/day actual
        startDate: today,
        endDate: endDate,
        projectId: project.id,
        userId: users[1].id, // Assign to second user
        expectedWorkload: '50%' // 4/8 = 50%
      },
      {
        title: 'Light Workload Task',
        description: 'Testing light workload calculation',
        estimatedHours: 10, // 10 hours
        maxDailyHours: 2,   // 2 hours/day, 10/5 = 2h/day actual
        startDate: today,
        endDate: endDate,
        projectId: project.id,
        userId: users[2].id, // Assign to third user
        expectedWorkload: '25%' // 2/8 = 25%
      }
    ];

    console.log('📊 Expected Results:');
    console.log(`   ${users[0].name}: ~80% workload (High)`);
    console.log(`   ${users[1].name}: ~50% workload (Medium)`);
    console.log(`   ${users[2].name}: ~25% workload (Light)`);
    console.log(`   📈 Average: ~52% (what calendar bars should show)`);
    console.log();

    for (let i = 0; i < testTasks.length; i++) {
      const taskData = testTasks[i];
      const user = users[i];

      // Create the task
      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          estimatedHours: taskData.estimatedHours,
          maxDailyHours: taskData.maxDailyHours,
          startDate: taskData.startDate,
          endDate: taskData.endDate,
          projectId: taskData.projectId,
          workloadPercentage: 0, // Will be calculated
          status: 'TODO',
          priority: 'MEDIUM'
        }
      });

      // Assign to user using the new assignment system
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          userId: user.id,
          assignedAt: new Date(),
          role: 'ASSIGNEE'
        }
      });

      console.log(`✅ Created: ${task.title} (assigned to ${user.name})`);
    }

    console.log('\n🎉 Test tasks created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Refresh your browser');
    console.log('2. Navigate to the project calendar');
    console.log('3. Check that:');
    console.log('   - Calendar grid shows ~52% doluluk (average)');
    console.log('   - Individual user cards show their personal percentages');

    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestTasks();
