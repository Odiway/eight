const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateProjectDates() {
  try {
    console.log('🔄 Proje tarihlerini güncelleniyor...')
    
    // Get all projects
    const projects = await prisma.project.findMany()
    
    for (const project of projects) {
      // Generate realistic dates for 2024-2025
      const currentYear = new Date().getFullYear()
      const startDate = new Date(
        currentYear, 
        Math.floor(Math.random() * 12), // Random month
        Math.floor(Math.random() * 28) + 1 // Random day 1-28
      )
      
      // End date 2-12 months after start date
      const duration = (Math.random() * 10 + 2) * 30 * 24 * 60 * 60 * 1000 // 2-12 months in milliseconds
      const endDate = new Date(startDate.getTime() + duration)
      
      await prisma.project.update({
        where: { id: project.id },
        data: {
          startDate: startDate,
          endDate: endDate,
          updatedAt: new Date()
        }
      })
      
      console.log(`✅ ${project.name}: ${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}`)
    }
    
    console.log(`🎉 ${projects.length} proje tarihi güncellendi!`)
    
    // Also update task dates to be within project ranges
    console.log('🔄 Görev tarihlerini güncelleniyor...')
    
    const updatedProjects = await prisma.project.findMany({
      include: { tasks: true }
    })
    
    for (const project of updatedProjects) {
      if (project.tasks.length > 0 && project.startDate && project.endDate) {
        const projectDuration = project.endDate.getTime() - project.startDate.getTime()
        
        for (let i = 0; i < project.tasks.length; i++) {
          const task = project.tasks[i]
          
          // Distribute tasks evenly across project timeline
          const taskStartOffset = (projectDuration / project.tasks.length) * i
          const taskStart = new Date(project.startDate.getTime() + taskStartOffset)
          
          // Task duration: 1-14 days
          const taskDuration = (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000
          const taskEnd = new Date(Math.min(
            taskStart.getTime() + taskDuration,
            project.endDate.getTime()
          ))
          
          await prisma.task.update({
            where: { id: task.id },
            data: {
              startDate: taskStart,
              endDate: taskEnd,
              updatedAt: new Date()
            }
          })
        }
        
        console.log(`✅ ${project.name}: ${project.tasks.length} görev tarihi güncellendi`)
      }
    }
    
    console.log('🎉 Tüm tarihler başarıyla güncellendi!')
    
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateProjectDates()