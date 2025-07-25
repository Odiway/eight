const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearProjects() {
  try {
    console.log('🚀 Starting to clear all projects...\n');

    // Delete in the correct order to respect foreign key constraints
    
    // 1. Delete task time tracking
    console.log('1. Deleting task time tracking records...');
    const timeTracking = await prisma.taskTimeTracking.deleteMany();
    console.log(`   ✅ Deleted ${timeTracking.count} time tracking records\n`);

    // 2. Delete task assignments
    console.log('2. Deleting task assignments...');
    const taskAssignments = await prisma.taskAssignment.deleteMany();
    console.log(`   ✅ Deleted ${taskAssignments.count} task assignments\n`);

    // 3. Delete workload analysis
    console.log('3. Deleting workload analysis records...');
    const workloadAnalysis = await prisma.workloadAnalysis.deleteMany();
    console.log(`   ✅ Deleted ${workloadAnalysis.count} workload analysis records\n`);

    // 4. Delete project bottlenecks
    console.log('4. Deleting project bottlenecks...');
    const bottlenecks = await prisma.projectBottleneck.deleteMany();
    console.log(`   ✅ Deleted ${bottlenecks.count} bottleneck records\n`);

    // 5. Delete tasks
    console.log('5. Deleting all tasks...');
    const tasks = await prisma.task.deleteMany();
    console.log(`   ✅ Deleted ${tasks.count} tasks\n`);

    // 6. Delete project memberships
    console.log('6. Deleting project memberships...');
    const memberships = await prisma.projectMembership.deleteMany();
    console.log(`   ✅ Deleted ${memberships.count} project memberships\n`);

    // 7. Delete workflow steps
    console.log('7. Deleting workflow steps...');
    const workflowSteps = await prisma.workflowStep.deleteMany();
    console.log(`   ✅ Deleted ${workflowSteps.count} workflow steps\n`);

    // 8. Finally delete projects
    console.log('8. Deleting all projects...');
    const projects = await prisma.project.deleteMany();
    console.log(`   ✅ Deleted ${projects.count} projects\n`);

    console.log('🎉 All projects and related data have been successfully cleared!');
    console.log('\n📊 Summary:');
    console.log(`   • Projects: ${projects.count}`);
    console.log(`   • Tasks: ${tasks.count}`);
    console.log(`   • Task Assignments: ${taskAssignments.count}`);
    console.log(`   • Time Tracking: ${timeTracking.count}`);
    console.log(`   • Workload Analysis: ${workloadAnalysis.count}`);
    console.log(`   • Bottlenecks: ${bottlenecks.count}`);
    console.log(`   • Memberships: ${memberships.count}`);
    console.log(`   • Workflow Steps: ${workflowSteps.count}`);

  } catch (error) {
    console.error('❌ Error clearing projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will permanently delete ALL projects and related data!');
console.log('This includes:');
console.log('  • All projects');
console.log('  • All tasks');
console.log('  • All task assignments');
console.log('  • All time tracking records');
console.log('  • All workload analysis data');
console.log('  • All project bottlenecks');
console.log('  • All project memberships');
console.log('  • All workflow steps');

rl.question('\nAre you sure you want to continue? (type "YES" to confirm): ', (answer) => {
  if (answer === 'YES') {
    clearProjects();
  } else {
    console.log('Operation cancelled.');
  }
  rl.close();
});
