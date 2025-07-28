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
  checkPageBreak,
  getStatusText
} from '@/lib/pdf-utils'

export async function GET(request: NextRequest) {
  try {
    // Get reports data
    const data = await getGeneralReportsData()
    
    // Generate clean PDF
    const pdfBuffer = generateCleanGeneralPDF(data)

    const filename = `genel-rapor-${new Date().toISOString().split('T')[0]}.pdf`

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

async function getGeneralReportsData() {
  // Get all projects with their tasks and members
  const projects = await prisma.project.findMany({
    include: {
      tasks: true,
      members: {
        include: {
          user: true,
        },
      },
    },
  })

  // Get all users
  const users = await prisma.user.findMany()

  // Calculate summary statistics
  const totalProjects = projects.length
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0)
  const completedTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter(t => t.status === 'COMPLETED').length,
    0
  )
  const overdueTasks = projects.reduce(
    (sum, p) =>
      sum +
      p.tasks.filter(t => {
        const endDate = t.endDate ? new Date(t.endDate) : null
        return endDate && endDate < new Date() && t.status !== 'COMPLETED'
      }).length,
    0
  )

  // Group users by department
  const departments: Record<string, {
    name: string
    userCount: number
    totalProjects: number
  }> = {}

  users.forEach(user => {
    if (!departments[user.department]) {
      departments[user.department] = {
        name: user.department,
        userCount: 0,
        totalProjects: 0
      }
    }
    departments[user.department].userCount++
  })

  projects.forEach(project => {
    project.members.forEach(member => {
      const dept = member.user.department
      if (departments[dept]) {
        departments[dept].totalProjects++
      }
    })
  })

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalProjects,
      totalTasks,
      totalUsers: users.length,
      completedProjects,
      completedTasks,
      overdueTasks,
    },
    projects: projects.slice(0, 20), // Limit for PDF
    departments: Object.values(departments).slice(0, 10) // Limit for PDF
  }
}

function generateCleanGeneralPDF(data: any): Buffer {
  const doc = new jsPDF()
  setupTurkishPDF(doc)

  let currentY = addProfessionalHeader(
    doc, 
    'GENEL RAPOR', 
    'Tüm Projeler ve Departmanlar'
  )

  // Summary Statistics
  currentY = addSectionHeader(doc, 'GENEL İSTATİSTİKLER', currentY)

  const stats = [
    { label: 'Toplam Proje', value: data.summary.totalProjects.toString() },
    { label: 'Tamamlanan Proje', value: data.summary.completedProjects.toString(), color: [34, 197, 94] as [number, number, number] },
    { label: 'Toplam Görev', value: data.summary.totalTasks.toString() },
    { label: 'Tamamlanan Görev', value: data.summary.completedTasks.toString(), color: [34, 197, 94] as [number, number, number] },
    { label: 'Toplam Kullanıcı', value: data.summary.totalUsers.toString() }
  ]

  currentY = addStatsBox(doc, stats, currentY)

  // Projects Overview
  if (data.projects && data.projects.length > 0) {
    currentY = checkPageBreak(doc, currentY, 60)
    currentY = addSectionHeader(doc, 'PROJELER', currentY)

    const projectRows = data.projects.map((project: any) => [
      project.name.length > 25 ? project.name.substring(0, 25) + '...' : project.name,
      getStatusText(project.status),
      project.tasks.length.toString(),
      project.tasks.filter((t: any) => t.status === 'COMPLETED').length.toString(),
      new Date(project.updatedAt).toLocaleDateString('tr-TR')
    ])

    currentY = addSimpleTable(
      doc,
      ['Proje Adı', 'Durum', 'Görev', 'Tamamlanan', 'Güncelleme'],
      projectRows,
      currentY,
      { columnWidths: [50, 30, 20, 25, 25], fontSize: 8 }
    )
  }

  // Departments Overview
  if (data.departments && data.departments.length > 0) {
    currentY = checkPageBreak(doc, currentY, 60)
    currentY = addSectionHeader(doc, 'DEPARTMANLAR', currentY)

    const deptRows = data.departments.map((dept: any) => [
      dept.name,
      dept.userCount.toString(),
      dept.totalProjects.toString()
    ])

    currentY = addSimpleTable(
      doc,
      ['Departman', 'Kullanıcı', 'Proje'],
      deptRows,
      currentY,
      { columnWidths: [80, 40, 40] }
    )
  }

  // Summary
  currentY = checkPageBreak(doc, currentY, 60)
  currentY = addSectionHeader(doc, 'ÖZET', currentY)

  doc.setTextColor(55, 65, 81)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const summaryText = [
    `Sistemde toplam ${data.summary.totalProjects} proje bulunmaktadır.`,
    `${data.summary.completedProjects} proje tamamlanmış, ${data.summary.totalTasks} görev mevcuttur.`,
    `${data.summary.totalUsers} kullanıcı sistemde aktif olarak çalışmaktadır.`,
    `Rapor tarihi: ${new Date().toLocaleDateString('tr-TR')}`
  ]

  summaryText.forEach((text, index) => {
    addTurkishText(doc, text, 25, currentY + (index * 12), { maxWidth: 160 })
  })

  // Add footer
  addProfessionalFooter(doc, 1, 1)

  return Buffer.from(doc.output('arraybuffer'))
}
