/**
 * UI Calendar Test - Create task and verify calendar display
 */

const BASE_URL = 'http://localhost:3000';

async function testUICalendarDisplay() {
  console.log('🎯 Testing UI Calendar Display...\n');

  try {
    // Create a test task with visible workload
    console.log('📍 Creating a test task with high workload...');
    const taskData = {
      title: `UI Calendar Test - High Workload`,
      description: 'Testing calendar workload visualization',
      projectId: 'cmdh30yxs0000o86k3fjgkj75', // TTRAK project
      estimatedHours: 16,
      maxDailyHours: 4,
      priority: 'HIGH',
      status: 'TODO',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days from now
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log(`❌ Task creation failed: ${errorText}`);
      return;
    }
    
    const createdTask = await createResponse.json();
    console.log(`✅ Test task created with ID: ${createdTask.id}`);
    console.log(`✅ Workload percentage: ${createdTask.workloadPercentage}%`);
    console.log(`✅ Expected workload: ${(16/4) * 100 / 4}% = 100% (16 hours over 4 days with 4h max daily)`);
    
    console.log('\n🎯 Task created successfully!');
    console.log('👀 Please check the calendar tab in the browser to see the workload visualization');
    console.log(`📋 Task details: ${createdTask.title} - ${createdTask.workloadPercentage}% workload`);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the UI test
testUICalendarDisplay();
