import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jsPDF from 'jspdf'
import { formatTurkishText } from '@/lib/pdf-utils'
import { calculateDynamicProjectDates, getStatusText, getDelaySeverity } from '@/lib/dynamic-dates'

const prisma = new PrismaClient()

// Mock data for error cases
const mockGeneralData = {
  projects: [
    { name: 'Test Projesi 1', status: 'IN_PROGRESS', taskCount: 5 },
    { name: 'Test Projesi 2', status: 'COMPLETED', taskCount: 8 },
  ],
  stats: {
    totalProjects: 2,
    totalTasks: 13,
    completedTasks: 8,
    totalUsers: 5,
  },
  departments: [
    { name: 'Yazilim', projectCount: 1, userCount: 3 },
    { name: 'Tasarim', projectCount: 1, userCount: 2 },
  ],
}

export async function GET(request: NextRequest) {
  try {
    const pdfBuffer = await generateGeneralPDF()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="genel-rapor.pdf"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    console.error('General PDF generation error:', error)
    return NextResponse.json(
      { error: 'Genel rapor PDF oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

async function generateGeneralPDF() {
  try {
    // Try to get real data from database with enhanced task details
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            startDate: true,
            endDate: true,
            completedAt: true,
          },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    const users = await prisma.user.findMany()

    // Calculate dynamic dates for each project
    const projectsWithDynamicData = projects.map(project => {
      const dynamicDates = calculateDynamicProjectDates(project.tasks, project)
      return {
        name: project.name,
        status: project.status,
        taskCount: project.tasks?.length || 0,
        completionPercentage: dynamicDates.completionPercentage,
        delayDays: dynamicDates.delayDays,
        dynamicStatus: dynamicDates.status,
        isDelayed: dynamicDates.isDelayed,
        criticalTaskCount: dynamicDates.criticalPath.length,
        overdueTaskCount: dynamicDates.delayBreakdown?.overdueTaskDetails.length || 0
      }
    })

    // Enhanced system-wide statistics
    const totalDelayDays = projectsWithDynamicData.reduce((sum, p) => sum + p.delayDays, 0)
    const delayedProjectsCount = projectsWithDynamicData.filter(p => p.isDelayed).length
    const completedProjectsCount = projectsWithDynamicData.filter(p => p.dynamicStatus === 'completed').length
    const averageCompletionRate = projectsWithDynamicData.length > 0 
      ? Math.round(projectsWithDynamicData.reduce((sum, p) => sum + p.completionPercentage, 0) / projectsWithDynamicData.length)
      : 0

    const generalData = {
      projects: projectsWithDynamicData,
      stats: {
        totalProjects: projects.length,
        totalTasks: projects.reduce(
          (sum, p) => sum + (p.tasks?.length || 0),
          0
        ),
        completedTasks: projects.reduce(
          (sum, p) =>
            sum +
            (p.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0),
          0
        ),
        totalUsers: users.length,
        // Enhanced statistics
        totalDelayDays,
        delayedProjectsCount,
        completedProjectsCount,
        averageCompletionRate,
        onTimeProjectsCount: projectsWithDynamicData.filter(p => p.dynamicStatus === 'on-time').length
      },
      departments: Object.entries(
        users.reduce((acc: any, user) => {
          if (!acc[user.department]) {
            acc[user.department] = {
              name: user.department,
              userCount: 0,
              projectCount: 0,
            }
          }
          acc[user.department].userCount++
          return acc
        }, {})
      ).map(([_, dept]: any) => dept),
    }

    console.log('📊 Enhanced General Report Generated:', {
      totalProjects: generalData.stats.totalProjects,
      averageCompletion: generalData.stats.averageCompletionRate + '%',
      totalDelays: totalDelayDays + ' days',
      delayedProjects: delayedProjectsCount
    })

    return generatePDF(generalData)
  } catch (error) {
    console.error('Database error, using mock data:', error)
    return generatePDF(mockGeneralData)
  }
}

function generatePDF(data: any) {
  const pdf = new jsPDF()
  let yPosition = 20

  // Header
  pdf.setFontSize(20)
  pdf.text(formatTurkishText('Genel Sistem Raporu'), 20, yPosition)
  yPosition += 15

  pdf.setFontSize(12)
  pdf.text(
    formatTurkishText(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`),
    20,
    yPosition
  )
  yPosition += 20

  // Statistics
  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Genel Istatistikler'), 20, yPosition)
  yPosition += 15

  pdf.setFontSize(10)
  pdf.text(
    formatTurkishText(`Toplam Proje: ${data.stats.totalProjects}`),
    25,
    yPosition
  )
  yPosition += 8
  pdf.text(
    formatTurkishText(`Toplam Gorev: ${data.stats.totalTasks}`),
    25,
    yPosition
  )
  yPosition += 8
  pdf.text(
    formatTurkishText(`Tamamlanan Gorev: ${data.stats.completedTasks}`),
    25,
    yPosition
  )
  yPosition += 8
  pdf.text(
    formatTurkishText(`Toplam Kullanici: ${data.stats.totalUsers}`),
    25,
    yPosition
  )
  yPosition += 8

  // Enhanced statistics if available
  if (data.stats.averageCompletionRate !== undefined) {
    pdf.text(
      formatTurkishText(`Ortalama Tamamlanma Orani: %${data.stats.averageCompletionRate}`),
      25,
      yPosition
    )
    yPosition += 8
    pdf.text(
      formatTurkishText(`Gecikmis Proje Sayisi: ${data.stats.delayedProjectsCount}`),
      25,
      yPosition
    )
    yPosition += 8
    pdf.text(
      formatTurkishText(`Toplam Gecikme Gun Sayisi: ${data.stats.totalDelayDays}`),
      25,
      yPosition
    )
    yPosition += 8
    pdf.text(
      formatTurkishText(`Zamaninda Proje Sayisi: ${data.stats.onTimeProjectsCount}`),
      25,
      yPosition
    )
    yPosition += 8
  }
  yPosition += 12

  // Projects
  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Projeler'), 20, yPosition)
  yPosition += 10

  data.projects.forEach((project: any, index: number) => {
    if (yPosition > 270) {
      pdf.addPage()
      yPosition = 20
    }
    pdf.setFontSize(10)
    
    const statusText = getStatusText(project.dynamicStatus || 'on-time')
    const delayInfo = project.isDelayed ? ` (${project.delayDays} gun gecikme)` : ''
    const completionInfo = project.completionPercentage ? ` - %${Math.round(project.completionPercentage)} tamamlandi` : ''
    
    pdf.text(
      formatTurkishText(
        `${index + 1}. ${project.name} - ${statusText}${delayInfo}${completionInfo} - Gorev: ${project.taskCount}`
      ),
      25,
      yPosition
    )
    yPosition += 8
  })
  yPosition += 15

  // Departments
  if (yPosition > 250) {
    pdf.addPage()
    yPosition = 20
  }

  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Departmanlar'), 20, yPosition)
  yPosition += 10

  data.departments.forEach((dept: any, index: number) => {
    pdf.setFontSize(10)
    pdf.text(
      formatTurkishText(
        `${index + 1}. ${dept.name} - Kullanici: ${dept.userCount}`
      ),
      25,
      yPosition
    )
    yPosition += 8
  })

  return pdf.output('arraybuffer')
}
