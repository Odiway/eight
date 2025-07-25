const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupCorruptedData() {
  console.log('🧹 Starting cleanup of corrupted calendar data...')

  try {
    // First, let's see what tasks exist
    const allTasks = await prisma.task.findMany({
      include: {
        assignedUser: true,
        project: true
      }
    })

    console.log(`📊 Found ${allTasks.length} tasks total`)

    // Find tasks with corrupted or placeholder titles
    const corruptedTasks = allTasks.filter(task => 
      !task.title || 
      task.title.includes('dsaşbkm') || 
      task.title.length < 3 ||
      task.title.includes('test') ||
      task.title.includes('Test')
    )

    console.log(`🔍 Found ${corruptedTasks.length} corrupted/test tasks:`)
    corruptedTasks.forEach(task => {
      console.log(`  - ID: ${task.id}, Title: "${task.title}", Project: ${task.project?.name || 'Unknown'}`)
    })

    if (corruptedTasks.length > 0) {
      console.log('\n🗑️ Deleting corrupted tasks...')
      
      for (const task of corruptedTasks) {
        await prisma.task.delete({
          where: { id: task.id }
        })
        console.log(`  ✅ Deleted task: "${task.title}"`)
      }
    }

    // Clean up any empty projects (projects with no tasks)
    const projects = await prisma.project.findMany({
      include: {
        tasks: true
      }
    })

    const emptyProjects = projects.filter(project => project.tasks.length === 0)
    
    if (emptyProjects.length > 0) {
      console.log(`\n🏗️ Found ${emptyProjects.length} empty projects:`)
      emptyProjects.forEach(project => {
        console.log(`  - ID: ${project.id}, Name: "${project.name}"`)
      })
      
      console.log('\n🗑️ Deleting empty projects...')
      for (const project of emptyProjects) {
        // Delete workflow steps first
        await prisma.workflowStep.deleteMany({
          where: { projectId: project.id }
        })
        
        // Delete project members
        await prisma.projectMember.deleteMany({
          where: { projectId: project.id }
        })
        
        // Delete the project
        await prisma.project.delete({
          where: { id: project.id }
        })
        console.log(`  ✅ Deleted empty project: "${project.name}"`)
      }
    }

    // Show final statistics
    const finalTaskCount = await prisma.task.count()
    const finalProjectCount = await prisma.project.count()
    
    console.log('\n✅ Cleanup completed!')
    console.log(`📊 Final statistics:`)
    console.log(`  - Tasks: ${finalTaskCount}`)
    console.log(`  - Projects: ${finalProjectCount}`)
    
    if (finalTaskCount === 0) {
      console.log('\n🎯 Database is now clean! All corrupted data has been removed.')
      console.log('You can now create new projects and tasks through the UI.')
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupCorruptedData()
