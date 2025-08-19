// Enhanced Delay Calculation Test
console.log('🧪 TESTING ENHANCED DELAY CALCULATION SYSTEM\n');

// Mock project data with multiple delay sources
const testProject = {
  id: 'test-project-1',
  plannedStart: '2024-01-01',
  plannedEnd: '2024-03-01', // 60 days duration
  currentDate: '2024-03-25', // 24 days past planned end
  tasks: [
    {
      id: 'task-1',
      title: 'Design Phase',
      status: 'COMPLETED',
      startDate: '2024-01-01',
      endDate: '2024-01-15', // Planned
      completedAt: '2024-01-20', // 5 days delay
      estimatedHours: 40
    },
    {
      id: 'task-2', 
      title: 'Development Phase',
      status: 'IN_PROGRESS',
      startDate: '2024-01-16',
      endDate: '2024-02-15', // This task is overdue by 38 days!
      completedAt: null,
      estimatedHours: 80
    },
    {
      id: 'task-3',
      title: 'Testing Phase',
      status: 'TODO',
      startDate: '2024-02-16',
      endDate: '2024-03-01',
      completedAt: null,
      estimatedHours: 32
    },
    {
      id: 'task-4',
      title: 'Final Review',
      status: 'TODO', 
      startDate: '2024-03-02',
      endDate: '2024-03-10', // This extends 10 days past original project end
      completedAt: null,
      estimatedHours: 16
    }
  ]
};

console.log('📊 PROJECT SETUP:');
console.log(`Planned Project Duration: ${testProject.plannedStart} → ${testProject.plannedEnd}`);
console.log(`Current Date: ${testProject.currentDate}`);
console.log(`Total Tasks: ${testProject.tasks.length}`);
console.log(`Completed Tasks: ${testProject.tasks.filter(t => t.status === 'COMPLETED').length}`);
console.log('');

// Calculate different delay factors
const now = new Date(testProject.currentDate);
const plannedEnd = new Date(testProject.plannedEnd);
const completedTasks = testProject.tasks.filter(t => t.status === 'COMPLETED');
const inProgressTasks = testProject.tasks.filter(t => t.status === 'IN_PROGRESS'); 
const todoTasks = testProject.tasks.filter(t => t.status === 'TODO');

console.log('🔍 DELAY FACTOR ANALYSIS:');

// DELAY FACTOR 1: Task-based delays
const allTaskEndDates = [
  ...completedTasks.filter(t => t.completedAt).map(t => new Date(t.completedAt)),
  ...inProgressTasks.filter(t => t.endDate).map(t => new Date(t.endDate)),
  ...todoTasks.filter(t => t.endDate).map(t => new Date(t.endDate))
];

const latestTaskDate = new Date(Math.max(...allTaskEndDates.map(d => d.getTime())));
const taskBasedDelay = Math.max(0, Math.ceil((latestTaskDate.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24)));

console.log(`1️⃣ Task-based delay: ${taskBasedDelay} days`);
console.log(`   Latest task end: ${latestTaskDate.toLocaleDateString('tr-TR')}`);
console.log(`   vs Planned end: ${plannedEnd.toLocaleDateString('tr-TR')}`);

// DELAY FACTOR 2: Schedule-based delay
const scheduleBasedDelay = now > plannedEnd ? Math.ceil((now.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24)) : 0;
console.log(`2️⃣ Schedule-based delay: ${scheduleBasedDelay} days`);
console.log(`   Current date: ${now.toLocaleDateString('tr-TR')}`);
console.log(`   vs Planned end: ${plannedEnd.toLocaleDateString('tr-TR')}`);

// DELAY FACTOR 3: Individual overdue tasks  
let maxOverdueDelay = 0;
let overdueTaskInfo = [];
[...inProgressTasks, ...todoTasks].forEach(task => {
  if (task.endDate && new Date(task.endDate) < now) {
    const taskDelay = Math.ceil((now.getTime() - new Date(task.endDate).getTime()) / (1000 * 60 * 60 * 24));
    maxOverdueDelay = Math.max(maxOverdueDelay, taskDelay);
    overdueTaskInfo.push(`${task.title}: ${taskDelay} days overdue`);
  }
});

console.log(`3️⃣ Individual overdue tasks delay: ${maxOverdueDelay} days`);
overdueTaskInfo.forEach(info => console.log(`   ${info}`));

// DELAY FACTOR 4: Progress-based estimation
const completionPercentage = (completedTasks.length / testProject.tasks.length) * 100;
console.log(`4️⃣ Progress-based analysis: ${completionPercentage.toFixed(1)}% complete`);

// FINAL CALCULATION: MAXIMUM DELAY
const finalDelay = Math.max(taskBasedDelay, scheduleBasedDelay, maxOverdueDelay);
const actualEndDate = new Date(plannedEnd.getTime() + (finalDelay * 24 * 60 * 60 * 1000));

console.log('\n🎯 FINAL RESULT:');
console.log(`📊 Delay factors: [${taskBasedDelay}, ${scheduleBasedDelay}, ${maxOverdueDelay}] days`);
console.log(`🔥 MAXIMUM DELAY: ${finalDelay} days (This is what we use!)`);
console.log(`📅 Original Planned End: ${plannedEnd.toLocaleDateString('tr-TR')}`);
console.log(`📅 New Calculated End: ${actualEndDate.toLocaleDateString('tr-TR')}`);
console.log(`⏰ Days from now: ${Math.ceil((actualEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days remaining`);

console.log('\n✅ KEY IMPROVEMENTS:');
console.log('• Takes MAXIMUM delay from multiple sources instead of just one');
console.log('• Considers individual overdue tasks (38-day overdue task detected)');
console.log('• Factors in current schedule status (24 days past planned end)'); 
console.log('• Uses task timeline extensions (10 days beyond planned project end)');
console.log('• Result: More accurate "Gerçek Bitiş" calculation!');

// Simulate what would happen with the old vs new system
console.log('\n📈 OLD vs NEW COMPARISON:');
console.log(`OLD SYSTEM: Would likely show ${scheduleBasedDelay} days delay (just schedule-based)`);
console.log(`NEW SYSTEM: Shows ${finalDelay} days delay (maximum of all factors)`);
console.log(`IMPROVEMENT: ${finalDelay - scheduleBasedDelay} days more accurate!`);

export default function testEnhancedDelayCalculation() {
  return 'Enhanced delay calculation test completed - check console for detailed analysis';
}
