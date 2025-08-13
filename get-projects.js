const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    })
    console.log('📋 Projeler:')
    projects.forEach((p) => {
      console.log(`🔷 ${p.name} (ID: ${p.id})`)
      console.log(`   Başlangıç: ${p.startDate || 'Belirtilmemiş'}`)
      console.log(`   Bitiş: ${p.endDate || 'Belirtilmemiş'}`)
    })
  } catch (error) {
    console.error('Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getProjects()
