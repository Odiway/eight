// Test script to verify workload calculation
const { PrismaClient } = require('@prisma/client')

async function testWorkloadCalculation() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing workload calculation...')
    
    // Get the first project and user
    const project = await prisma.project.findFirst()
    const user = await prisma.user.findFirst()
    
    if (!project || !user) {
      console.log('❌ No project or user found')
      return
    }
    
    console.log(`✅ Using project: ${project.name}`)
    console.log(`✅ Using user: ${user.name}`)
    
    // Create a task via API (simulation)
    const taskData = {
      title: 'Workload Test Task',
      description: 'Testing workload percentage calculation',
      projectId: project.id,
      assignedId: user.id,
      priority: 'MEDIUM',
      status: 'TODO',
      estimatedHours: 16,
      maxDailyHours: 4,
      startDate: new Date(),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days later
    }
    
    // Calculate workload percentage (same logic as API)
    function calculateWorkloadPercentage(task) {
      if (!task.startDate || !task.endDate || !task.estimatedHours) {
        return 0
      }

      const workingDays = getWorkingDaysBetween(task.startDate, task.endDate)
      if (workingDays === 0) return 0

      let dailyHours
      if (task.maxDailyHours) {
        dailyHours = Math.min(task.maxDailyHours, task.estimatedHours / workingDays)
      } else {
        dailyHours = task.estimatedHours / workingDays
      }
      
      const standardDailyHours = task.maxDailyHours || 8
      
      return Math.round((dailyHours / standardDailyHours) * 100)
    }

    function getWorkingDaysBetween(startDate, endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      let workingDays = 0

      const current = new Date(start)
      while (current <= end) {
        const dayOfWeek = current.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDays++
        }
        current.setDate(current.getDate() + 1)
      }

      return workingDays
    }

    const calculatedWorkload = calculateWorkloadPercentage(taskData)
    console.log(`✅ Calculated workload percentage: ${calculatedWorkload}%`)
    
    // Create the task with calculated workload
    const testTask = await prisma.task.create({
      data: {
        ...taskData,
        workloadPercentage: calculatedWorkload
      }
    })
    
    console.log('✅ Task created successfully with workload:')
    console.log(`   - ID: ${testTask.id}`)
    console.log(`   - Estimated Hours: ${testTask.estimatedHours}`)
    console.log(`   - Max Daily Hours: ${testTask.maxDailyHours}`)
    console.log(`   - Workload Percentage: ${testTask.workloadPercentage}%`)
    
    // Test the calculation logic
    const workingDays = getWorkingDaysBetween(taskData.startDate, taskData.endDate)
    const dailyHours = Math.min(taskData.maxDailyHours, taskData.estimatedHours / workingDays)
    
    console.log('\n📊 Calculation breakdown:')
    console.log(`   - Working days: ${workingDays}`)
    console.log(`   - Estimated hours: ${taskData.estimatedHours}`)
    console.log(`   - Max daily hours: ${taskData.maxDailyHours}`)
    console.log(`   - Actual daily hours needed: ${dailyHours}`)
    console.log(`   - Workload percentage: ${dailyHours}/${taskData.maxDailyHours} = ${calculatedWorkload}%`)
    
    // Clean up
    await prisma.task.delete({
      where: { id: testTask.id }
    })
    
    console.log('\n✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testWorkloadCalculation()
