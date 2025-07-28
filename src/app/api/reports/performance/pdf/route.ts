import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { 
  setupTurkishPDF, 
  addTurkishText,
  addProfessionalHeader,
  addProfessionalFooter,
  addSectionHeader,
  addSimpleTable,
  addStatsBox,
  checkPageBreak
} from '@/lib/pdf-utils'

export async function GET(request: NextRequest) {
  try {
    // Get performance data
    const data = await getPerformanceData()
    
    // Generate clean PDF
    const pdfBuffer = generateCleanPerformancePDF(data)

    const filename = `performans-raporu-${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'PDF oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

async function getPerformanceData() {
  // Get users with their task assignments
  const users = await prisma.user.findMany({
    include: {
      taskAssignments: {
        include: {
          task: {
            include: {
              project: true,
            },
          },
        },
      },
    },
  })

  // Get projects with tasks
  const projects = await prisma.project.findMany({
    include: {
      tasks: true,
    },
  })

  // Calculate user performance
  const userPerformance = users.map(user => {
    const totalTasks = user.taskAssignments.length
    const completedTasks = user.taskAssignments.filter(
      ta => ta.task.status === 'COMPLETED'
    ).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      id: user.id,
      name: user.name,
      department: user.department,
      totalTasks,
      completedTasks,
      completionRate
    }
  }).slice(0, 20) // Limit for PDF

  // Calculate project performance
  const projectPerformance = projects.map(project => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      totalTasks,
      completedTasks,
      completionRate
    }
  }).slice(0, 15) // Limit for PDF

  // Calculate summary
  const totalUsers = users.length
  const totalProjects = projects.length
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0)
  const completedTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter(t => t.status === 'COMPLETED').length,
    0
  )
  const averageCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    summary: {
      totalUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      averageCompletion
    },
    userPerformance,
    projectPerformance
  }
}

function generateCleanPerformancePDF(data: any): Buffer {
  const doc = new jsPDF()
  setupTurkishPDF(doc)

  let currentY = addProfessionalHeader(
    doc, 
    'PERFORMANS RAPORU', 
    'Kullanıcı ve Proje Performansı'
  )

  // Summary Statistics
  currentY = addSectionHeader(doc, 'GENEL PERFORMANS', currentY)

  const stats = [
    { label: 'Toplam Kullanıcı', value: data.summary.totalUsers.toString() },
    { label: 'Toplam Proje', value: data.summary.totalProjects.toString() },
    { label: 'Toplam Görev', value: data.summary.totalTasks.toString() },
    { label: 'Tamamlanan', value: data.summary.completedTasks.toString(), color: [34, 197, 94] as [number, number, number] },
    { label: 'Ortalama %', value: data.summary.averageCompletion.toString(), color: [67, 56, 202] as [number, number, number] }
  ]

  currentY = addStatsBox(doc, stats, currentY)

  // User Performance
  if (data.userPerformance && data.userPerformance.length > 0) {
    currentY = checkPageBreak(doc, currentY, 60)
    currentY = addSectionHeader(doc, 'KULLANICI PERFORMANSI', currentY)

    const userRows = data.userPerformance.map((user: any) => [
      user.name.length > 20 ? user.name.substring(0, 20) + '...' : user.name,
      user.department,
      user.totalTasks.toString(),
      user.completedTasks.toString(),
      `%${user.completionRate}`
    ])

    currentY = addSimpleTable(
      doc,
      ['Kullanıcı', 'Departman', 'Görev', 'Tamamlanan', 'Oran'],
      userRows,
      currentY,
      { columnWidths: [40, 35, 25, 25, 25], fontSize: 8 }
    )
  }

  // Project Performance
  if (data.projectPerformance && data.projectPerformance.length > 0) {
    currentY = checkPageBreak(doc, currentY, 60)
    currentY = addSectionHeader(doc, 'PROJE PERFORMANSI', currentY)

    const projectRows = data.projectPerformance.map((project: any) => [
      project.name.length > 25 ? project.name.substring(0, 25) + '...' : project.name,
      project.status === 'COMPLETED' ? 'Tamamlandı' : 
      project.status === 'IN_PROGRESS' ? 'Devam Ediyor' : 'Planlanıyor',
      project.totalTasks.toString(),
      project.completedTasks.toString(),
      `%${project.completionRate}`
    ])

    currentY = addSimpleTable(
      doc,
      ['Proje', 'Durum', 'Görev', 'Tamamlanan', 'Oran'],
      projectRows,
      currentY,
      { columnWidths: [50, 30, 25, 25, 20], fontSize: 8 }
    )
  }

  // Summary
  currentY = checkPageBreak(doc, currentY, 60)
  currentY = addSectionHeader(doc, 'ÖZET', currentY)

  doc.setTextColor(55, 65, 81)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const summaryText = [
    `Sistemdeki ${data.summary.totalUsers} kullanıcının performans analizi.`,
    `${data.summary.totalProjects} proje ve ${data.summary.totalTasks} görev analiz edilmiştir.`,
    `Genel tamamlanma oranı %${data.summary.averageCompletion}'dir.`,
    `Rapor tarihi: ${new Date().toLocaleDateString('tr-TR')}`
  ]

  summaryText.forEach((text, index) => {
    addTurkishText(doc, text, 25, currentY + (index * 12), { maxWidth: 160 })
  })

  // Add footer
  addProfessionalFooter(doc, 1, 1)

  return Buffer.from(doc.output('arraybuffer'))
}
