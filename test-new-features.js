// Test script for new Strategic Playground features
// Tests: Task editing, proper critical path calculation, parallel/toleratable tasks

const baseUrl = 'http://localhost:3000/api/playground'

async function testNewFeatures() {
  console.log('🧪 Testing new Strategic Playground features...\n')

  try {
    // 1. Test reset functionality
    console.log('1️⃣ Testing reset functionality...')
    const resetResponse = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    })
    const resetData = await resetResponse.json()
    console.log('Reset result:', resetData.success ? '✅ Success' : '❌ Failed')

    // 2. Create sample tasks with different types
    console.log('\n2️⃣ Creating sample tasks with different types...')

    const tasks = [
      // Critical path task
      {
        name: 'Critical Task 1',
        duration: 5,
        priority: 'critical',
        x: 50,
        y: 50,
      },
      {
        name: 'Critical Task 2',
        duration: 3,
        priority: 'critical',
        x: 50,
        y: 200,
      },

      // Parallel tasks
      {
        name: 'Parallel Task A',
        duration: 4,
        priority: 'high',
        x: 350,
        y: 100,
      },
      {
        name: 'Parallel Task B',
        duration: 6,
        priority: 'medium',
        x: 350,
        y: 250,
      },

      // Toleratable task
      {
        name: 'Toleratable Task',
        duration: 2,
        priority: 'low',
        x: 650,
        y: 150,
      },
    ]

    const createdTasks = []
    for (const task of tasks) {
      const response = await fetch(`${baseUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      const data = await response.json()
      if (data.success) {
        createdTasks.push(data.task)
        console.log(`✅ Created: ${task.name}`)
      } else {
        console.log(`❌ Failed to create: ${task.name}`)
      }
    }

    // 3. Create dependencies to form critical path and parallel structure
    console.log('\n3️⃣ Creating dependencies...')

    const dependencies = [
      // Critical path: Task 1 -> Task 2
      [createdTasks[0]?.id, createdTasks[1]?.id],

      // Parallel tasks start from Task 1
      [createdTasks[0]?.id, createdTasks[2]?.id], // Task 1 -> Parallel A
      [createdTasks[0]?.id, createdTasks[3]?.id], // Task 1 -> Parallel B

      // Toleratable task depends on Parallel A (loose coupling)
      [createdTasks[2]?.id, createdTasks[4]?.id], // Parallel A -> Toleratable
    ]

    for (const [fromId, toId] of dependencies) {
      if (fromId && toId) {
        const response = await fetch(`${baseUrl}/dependencies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromTaskId: fromId, toTaskId: toId }),
        })
        const data = await response.json()
        console.log(
          `Dependency ${fromId} -> ${toId}:`,
          data.success ? '✅' : '❌'
        )
      }
    }

    // 4. Test task editing functionality
    console.log('\n4️⃣ Testing task editing...')

    if (createdTasks[0]) {
      const editResponse = await fetch(`${baseUrl}/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: createdTasks[0].id,
          updates: {
            name: 'Edited Critical Task 1',
            duration: 7,
            description: 'This task has been edited via API',
            assignedTo: 'Test User',
            priority: 'critical',
          },
        }),
      })
      const editData = await editResponse.json()
      console.log(
        'Task editing:',
        editData.success ? '✅ Success' : '❌ Failed'
      )
    }

    // 5. Check final task state and critical path calculation
    console.log('\n5️⃣ Checking final task state...')

    const finalResponse = await fetch(`${baseUrl}/tasks`)
    const finalData = await finalResponse.json()

    if (finalData.success) {
      console.log(`\n📊 Final Results:`)
      console.log(`Total tasks: ${finalData.tasks.length}`)

      const criticalTasks = finalData.tasks.filter(
        (task) => task.isOnCriticalPath
      )
      const parallelTasks = finalData.tasks.filter(
        (task) => !task.isOnCriticalPath && task.dependencies.length > 0
      )
      const independentTasks = finalData.tasks.filter(
        (task) => task.dependencies.length === 0 && !task.isOnCriticalPath
      )

      console.log(`Critical path tasks: ${criticalTasks.length}`)
      console.log(`Parallel tasks: ${parallelTasks.length}`)
      console.log(`Independent tasks: ${independentTasks.length}`)

      console.log('\n📋 Task Details:')
      finalData.tasks.forEach((task) => {
        const type = task.isOnCriticalPath
          ? '🔥 Critical'
          : task.dependencies.length > 0
          ? '🔄 Dependent'
          : '🆓 Independent'
        const slack = task.slack !== undefined ? ` (slack: ${task.slack})` : ''
        console.log(`  ${type}: ${task.name} - ${task.duration} days${slack}`)
      })
    }

    console.log('\n🎉 Feature testing completed!')
    console.log('\n💡 To test in browser:')
    console.log('1. Go to http://localhost:3000/playground')
    console.log('2. Click on tasks to edit them')
    console.log(
      '3. Try the "Karmaşık Örnek" button for complex project structure'
    )
    console.log(
      '4. Only tasks with zero slack should show as critical (red border)'
    )
  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

// Run the test
testNewFeatures()
