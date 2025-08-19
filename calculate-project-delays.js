#!/usr/bin/env node

/**
 * Calculate and update project delays based on current task status
 * This script analyzes all projects and calculates their delay in days
 */

// Load environment variables for local development
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function calculateProjectDelays() {
  console.log('🔄 Proje gecikme hesaplamaları başlatılıyor...')

  try {
    // Get all projects with their tasks
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          include: {
            assignedUser: true,
          },
        },
      },
    })

    console.log(`📊 ${projects.length} proje analiz ediliyor...`)

    for (const project of projects) {
      console.log(`\n🔍 Proje: ${project.name}`)

      if (!project.endDate) {
        console.log('  ⚠️  Bitiş tarihi yok, atlanıyor...')
        continue
      }

      const now = new Date()
      const projectEndDate = new Date(project.endDate)
      const completedTasks = project.tasks.filter(
        (task) => task.status === 'COMPLETED'
      )
      const remainingTasks = project.tasks.filter(
        (task) => task.status !== 'COMPLETED'
      )

      // Calculate completion percentage
      const completionPercentage =
        project.tasks.length > 0
          ? (completedTasks.length / project.tasks.length) * 100
          : 0

      console.log(
        `  📈 Tamamlanma: %${completionPercentage.toFixed(1)} (${
          completedTasks.length
        }/${project.tasks.length})`
      )

      let delayDays = 0

      if (project.status === 'COMPLETED') {
        // For completed projects, no delay
        delayDays = 0
        console.log('  ✅ Proje tamamlanmış, gecikme sıfır')
      } else {
        // Calculate estimated end date based on remaining tasks
        const remainingTasksWithDates = remainingTasks.filter(
          (task) => task.endDate
        )

        if (remainingTasksWithDates.length > 0) {
          // Find the latest task end date
          const latestTaskDate = new Date(
            Math.max(
              ...remainingTasksWithDates.map((task) =>
                new Date(task.endDate).getTime()
              )
            )
          )

          // Calculate delay
          if (latestTaskDate > projectEndDate) {
            delayDays = Math.ceil(
              (latestTaskDate.getTime() - projectEndDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          }
        } else {
          // No remaining tasks with dates, check if project end date has passed
          if (now > projectEndDate && completionPercentage < 100) {
            delayDays = Math.ceil(
              (now.getTime() - projectEndDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          }
        }

        if (delayDays > 0) {
          console.log(`  🔴 Gecikme: ${delayDays} gün`)
        } else {
          console.log('  🟢 Zamanında ilerliyor')
        }
      }

      // Update project with calculated delay
      await prisma.project.update({
        where: { id: project.id },
        data: { delayDays },
      })

      console.log(`  💾 Güncellendi: delayDays = ${delayDays}`)
    }

    console.log('\n✅ Tüm projeler güncellendi!')

    // Show summary
    const delayedProjects = await prisma.project.findMany({
      where: {
        delayDays: { gt: 0 },
        status: { not: 'COMPLETED' },
      },
      select: {
        name: true,
        delayDays: true,
        endDate: true,
      },
    })

    console.log(`\n📊 ÖZET:`)
    console.log(`   • Toplam proje: ${projects.length}`)
    console.log(`   • Gecikmeli proje: ${delayedProjects.length}`)

    if (delayedProjects.length > 0) {
      console.log(`\n🔴 GECİKMELİ PROJELER:`)
      delayedProjects.forEach((project) => {
        console.log(
          `   • ${project.name}: ${project.delayDays} gün (Hedef: ${new Date(
            project.endDate
          ).toLocaleDateString('tr-TR')})`
        )
      })
    }
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the calculation
calculateProjectDelays()
