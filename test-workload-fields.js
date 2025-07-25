// Test script to verify maxDailyHours field is working
const { PrismaClient } = require('@prisma/client')

async function testMaxDailyHours() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing maxDailyHours field in Task model...')
    
    // Get the first project
    const project = await prisma.project.findFirst()
    if (!project) {
      console.log('❌ No project found')
      return
    }
    
    // Get the first user
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('❌ No user found')
      return
    }
    
    console.log(`✅ Using project: ${project.name}`)
    console.log(`✅ Using user: ${user.name}`)
    
    // Try to create a task with maxDailyHours
    const testTask = await prisma.task.create({
      data: {
        title: 'Test Task with Max Daily Hours',
        description: 'Testing maxDailyHours field',
        projectId: project.id,
        assignedId: user.id,
        priority: 'MEDIUM',
        status: 'TODO',
        estimatedHours: 16,
        maxDailyHours: 4, // 4 hours per day max
        startDate: new Date(),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days later
      }
    })
    
    console.log('✅ Task created successfully with maxDailyHours:', testTask.id)
    console.log(`   - Estimated Hours: ${testTask.estimatedHours}`)
    console.log(`   - Max Daily Hours: ${testTask.maxDailyHours}`)
    
    // Verify the field exists in the database
    const retrievedTask = await prisma.task.findUnique({
      where: { id: testTask.id },
      select: {
        id: true,
        title: true,
        estimatedHours: true,
        maxDailyHours: true,
        startDate: true,
        endDate: true
      }
    })
    
    console.log('✅ Task retrieved from database:')
    console.log(JSON.stringify(retrievedTask, null, 2))
    
    // Clean up test data
    await prisma.task.delete({
      where: { id: testTask.id }
    })
    
    console.log('✅ Test completed successfully - maxDailyHours field is working!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.message.includes('maxDailyHours')) {
      console.log('💡 The maxDailyHours field might not exist in the database schema')
      console.log('   Run: npx prisma migrate dev --name add_max_daily_hours')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testMaxDailyHours()
