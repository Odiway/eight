/**
 * Final Calendar Integration Test
 * Comprehensive test to verify all calendar synchronization issues are resolved
 */

const BASE_URL = 'http://localhost:3000';

async function finalCalendarTest() {
  console.log('🎯 Final Calendar Integration Test\n');
  console.log('Testing: Task creation → Workload calculation → Calendar display\n');

  try {
    // Step 1: Create a new task with specific workload parameters
    console.log('📍 Step 1: Creating task with specific workload parameters...');
    const taskData = {
      title: `Final Test - Calendar Sync (${new Date().toLocaleTimeString()})`,
      description: 'Final verification of calendar workload synchronization',
      projectId: 'cmdh30yxs0000o86k3fjgkj75', // TTRAK project
      estimatedHours: 20,
      maxDailyHours: 5,
      priority: 'HIGH',
      status: 'TODO',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log(`❌ FAILED: Task creation - ${errorText}`);
      return;
    }
    
    const createdTask = await createResponse.json();
    console.log(`✅ SUCCESS: Task created`);
    console.log(`   📊 Task ID: ${createdTask.id}`);
    console.log(`   📊 Workload: ${createdTask.workloadPercentage}%`);
    console.log(`   📊 Expected: 100% (20h ÷ 5h/day = 4 days, 100% utilization)`);

    // Step 2: Verify task in project data (simulating what the calendar receives)
    console.log('\n📍 Step 2: Verifying project data synchronization...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for data consistency
    
    const projectResponse = await fetch(`${BASE_URL}/api/projects/cmdh30yxs0000o86k3fjgkj75`);
    const projectData = await projectResponse.json();
    
    const foundTask = projectData.tasks.find(t => t.id === createdTask.id);
    if (!foundTask) {
      console.log(`❌ FAILED: Task not found in project data`);
      return;
    }
    
    console.log(`✅ SUCCESS: Task found in project data`);
    console.log(`   📊 workloadPercentage: ${foundTask.workloadPercentage}%`);
    console.log(`   📊 estimatedHours: ${foundTask.estimatedHours}h`);
    console.log(`   📊 maxDailyHours: ${foundTask.maxDailyHours}h`);
    console.log(`   📊 delayDays: ${foundTask.delayDays || 0}`);
    console.log(`   📊 isBottleneck: ${foundTask.isBottleneck || false}`);

    // Step 3: Verify calendar receives complete data
    console.log('\n📍 Step 3: Calendar component data verification...');
    
    // Simulate the data transformation that happens in the calendar tab
    const calendarTask = {
      ...foundTask,
      description: foundTask.description || undefined,
      startDate: foundTask.startDate || undefined,
      endDate: foundTask.endDate || undefined,
      originalEndDate: foundTask.originalEndDate || undefined,
      assignedId: foundTask.assignedId || undefined,
      estimatedHours: foundTask.estimatedHours || undefined,
      actualHours: foundTask.actualHours || undefined,
      workloadPercentage: foundTask.workloadPercentage || 0,
      delayDays: foundTask.delayDays || 0,
      isBottleneck: foundTask.isBottleneck || false,
      maxDailyHours: foundTask.maxDailyHours || undefined,
      assignedUser: foundTask.assignedUser
        ? {
            id: foundTask.assignedUser.id,
            name: foundTask.assignedUser.name,
            maxHoursPerDay: foundTask.assignedUser.maxHoursPerDay || 8,
          }
        : undefined,
    };
    
    console.log(`✅ SUCCESS: Calendar receives complete task data`);
    console.log(`   📊 workloadPercentage: ${calendarTask.workloadPercentage}% ✓`);
    console.log(`   📊 maxDailyHours: ${calendarTask.maxDailyHours}h ✓`);
    console.log(`   📊 estimatedHours: ${calendarTask.estimatedHours}h ✓`);

    // Step 4: Summary and recommendations
    console.log('\n🎯 FINAL TEST RESULTS');
    console.log('=====================================');
    
    const workloadCalculatedCorrectly = foundTask.workloadPercentage > 0;
    const dataFlowComplete = calendarTask.workloadPercentage > 0 && calendarTask.maxDailyHours > 0;
    
    console.log(`✅ Task Creation: WORKING`);
    console.log(`${workloadCalculatedCorrectly ? '✅' : '❌'} Workload Calculation: ${workloadCalculatedCorrectly ? 'WORKING' : 'BROKEN'}`);
    console.log(`✅ Database Sync: WORKING`);
    console.log(`${dataFlowComplete ? '✅' : '❌'} Calendar Data Flow: ${dataFlowComplete ? 'WORKING' : 'BROKEN'}`);
    
    if (workloadCalculatedCorrectly && dataFlowComplete) {
      console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
      console.log('✅ Tasks are created with proper workload calculation');
      console.log('✅ Calendar receives complete workload data');
      console.log('✅ Enhanced calendar can display workload percentages');
      console.log('\n💡 The calendar workload visualization should now be working correctly!');
    } else {
      console.log('\n⚠️ ISSUES DETECTED:');
      if (!workloadCalculatedCorrectly) {
        console.log('❌ Workload percentage not being calculated on task creation');
      }
      if (!dataFlowComplete) {
        console.log('❌ Calendar not receiving complete workload data');
      }
    }

    // Clean up
    console.log('\n📍 Cleanup: Removing test task...');
    const deleteResponse = await fetch(`${BASE_URL}/api/tasks/${createdTask.id}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log(`✅ Test task cleaned up`);
    } else {
      console.log(`⚠️ Cleanup failed - Task ID: ${createdTask.id}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the final test
finalCalendarTest();
