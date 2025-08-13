// Test script to verify playground reset functionality
console.log('Testing Playground Reset Functionality...')

async function testPlaygroundReset() {
  try {
    // Test reset endpoint
    const response = await fetch('http://localhost:3000/api/playground', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'reset' }),
    })

    const data = await response.json()
    console.log('Reset Response:', data)

    // Test tasks endpoint after reset
    const tasksResponse = await fetch(
      'http://localhost:3000/api/playground/tasks'
    )
    const tasksData = await tasksResponse.json()
    console.log('Tasks after reset:', tasksData)

    if (tasksData.success && tasksData.tasks.length === 0) {
      console.log('✅ Reset functionality working correctly!')
    } else {
      console.log('❌ Reset may not be working properly')
    }
  } catch (error) {
    console.error('Test error:', error)
  }
}

testPlaygroundReset()
