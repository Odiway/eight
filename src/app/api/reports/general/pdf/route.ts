import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'

interface ReportsData {
  generatedAt: string
  summary: {
    totalProjects: number
    totalTasks: number
    totalUsers: number
    completedProjects: number
    completedTasks: number
    overdueTasks: number
  }
  projects: any[]
  departments: Record<
    string,
    {
      name: string
      userCount: number
      totalTasks: number
      completedTasks: number
    }
  >
}

async function getReportsData(): Promise<ReportsData> {
  // Projects with tasks and members
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

  // Users with their departments
  const users = await prisma.user.findMany({
    include: {
      assignedTasks: true,
    },
  })

  // Calculate summary statistics
  const totalProjects = projects.length
  const completedProjects = projects.filter(
    (p) => p.status === 'COMPLETED'
  ).length
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0)
  const completedTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === 'COMPLETED').length,
    0
  )
  const overdueTasks = projects.reduce(
    (sum, p) =>
      sum +
      p.tasks.filter((t) => {
        const endDate = t.endDate ? new Date(t.endDate) : null
        return endDate && endDate < new Date() && t.status !== 'COMPLETED'
      }).length,
    0
  )

  // Group users by department
  const departments: Record<
    string,
    {
      name: string
      userCount: number
      totalTasks: number
      completedTasks: number
    }
  > = {}

  users.forEach((user) => {
    if (!departments[user.department]) {
      departments[user.department] = {
        name: user.department,
        userCount: 0,
        totalTasks: 0,
        completedTasks: 0,
      }
    }
    departments[user.department].userCount++
    departments[user.department].totalTasks += user.assignedTasks.length
    departments[user.department].completedTasks += user.assignedTasks.filter(
      (t) => t.status === 'COMPLETED'
    ).length
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
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      updatedAt: p.updatedAt.toISOString(),
      tasks: p.tasks,
      members: p.members,
    })),
    departments,
  }
}

function generatePDF(data: ReportsData): Buffer {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const usableWidth = pageWidth - 2 * margin
  const { summary, projects, departments } = data
  const generatedDate = new Date(data.generatedAt).toLocaleString('tr-TR')

  let yPosition = margin

  // Add Turkish font support
  doc.setFont('helvetica')
  
  // Header
  doc.setFillColor(102, 126, 234)
  doc.rect(0, 0, pageWidth, 60, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('GENEL PROJE RAPORU', pageWidth / 2, 25, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Tum projelerinizi yonetin ve takip edin', pageWidth / 2, 40, { align: 'center' })
  
  yPosition = 80

  // Summary Statistics
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('OZET ISTATISTIKLER', margin, yPosition)
  yPosition += 15

  const stats = [
    { label: 'Toplam Proje', value: summary.totalProjects.toString() },
    { label: 'Tamamlanan Proje', value: summary.completedProjects.toString() },
    { label: 'Toplam Gorev', value: summary.totalTasks.toString() },
    { label: 'Tamamlanan Gorev', value: summary.completedTasks.toString() },
    { label: 'Geciken Gorev', value: summary.overdueTasks.toString() },
    { label: 'Toplam Kullanici', value: summary.totalUsers.toString() }
  ]

  const colWidth = usableWidth / 3
  const rowHeight = 25

  for (let i = 0; i < stats.length; i++) {
    const row = Math.floor(i / 3)
    const col = i % 3
    const x = margin + col * colWidth
    const y = yPosition + row * rowHeight

    // Background for stat card
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.rect(x, y, colWidth - 5, rowHeight - 5, 'FD')

    // Value
    doc.setTextColor(30, 41, 91)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(stats[i].value, x + colWidth / 2, y + 10, { align: 'center' })

    // Label
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(stats[i].label, x + colWidth / 2, y + 18, { align: 'center' })
  }

  yPosition += Math.ceil(stats.length / 3) * rowHeight + 20

  // Projects Table
  if (yPosition > pageHeight - 100) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PROJELER', margin, yPosition)
  yPosition += 15

  // Table Header
  const tableHeaders = ['Proje Adi', 'Durum', 'Gorevler', 'Uyeler', 'Guncellenme']
  const colWidths = [usableWidth * 0.3, usableWidth * 0.15, usableWidth * 0.15, usableWidth * 0.15, usableWidth * 0.25]

  doc.setFillColor(30, 64, 175)
  doc.rect(margin, yPosition, usableWidth, 8, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')

  let xPos = margin
  for (let i = 0; i < tableHeaders.length; i++) {
    doc.text(tableHeaders[i], xPos + 2, yPosition + 6)
    xPos += colWidths[i]
  }

  yPosition += 8

  // Table Content
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')

  for (let i = 0; i < projects.length; i++) {
    if (yPosition > pageHeight - 30) {
      doc.addPage()
      yPosition = margin
    }

    const project = projects[i]
    
    // Alternate row colors
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, yPosition, usableWidth, 15, 'F')
    }

    xPos = margin
    const rowData = [
      project.name.substring(0, 25) + (project.name.length > 25 ? '...' : ''),
      getStatusText(project.status),
      `${project.tasks?.length || 0} gorev`,
      `${project.members?.length || 0} uye`,
      new Date(project.updatedAt).toLocaleDateString('tr-TR')
    ]

    for (let j = 0; j < rowData.length; j++) {
      // Add status color
      if (j === 1) {
        const color = getStatusColor(project.status)
        doc.setTextColor(color[0], color[1], color[2])
      } else {
        doc.setTextColor(0, 0, 0)
      }
      
      doc.text(rowData[j], xPos + 2, yPosition + 10)
      xPos += colWidths[j]
    }

    yPosition += 15
  }

  yPosition += 20

  // Departments Section
  if (yPosition > pageHeight - 100) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('DEPARTMAN ANALIZI', margin, yPosition)
  yPosition += 15

  const departmentList = Object.values(departments)
  for (let i = 0; i < departmentList.length; i++) {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = margin
    }

    const dept = departmentList[i] as any
    const efficiency = dept.totalTasks > 0 ? Math.round((dept.completedTasks / dept.totalTasks) * 100) : 0

    // Department card background
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(229, 231, 235)
    doc.rect(margin, yPosition, usableWidth, 25, 'FD')

    // Department name
    doc.setTextColor(30, 64, 175)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(dept.name, margin + 5, yPosition + 8)

    // Department stats
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    const statText = `${dept.userCount} kullanici | ${dept.totalTasks} gorev | %${efficiency} tamamlama`
    doc.text(statText, margin + 5, yPosition + 18)

    // Efficiency bar
    const barWidth = 100
    const barHeight = 4
    const barX = pageWidth - margin - barWidth - 10
    const barY = yPosition + 10

    doc.setFillColor(226, 232, 240)
    doc.rect(barX, barY, barWidth, barHeight, 'F')

    doc.setFillColor(37, 99, 235)
    doc.rect(barX, barY, (barWidth * efficiency) / 100, barHeight, 'F')

    doc.setFontSize(8)
    doc.text(`%${efficiency}`, barX + barWidth + 5, barY + 3)

    yPosition += 30
  }

  // Footer
  if (yPosition > pageHeight - 40) {
    doc.addPage()
    yPosition = margin
  }

  yPosition = pageHeight - 30
  doc.setFillColor(248, 250, 252)
  doc.rect(0, yPosition - 10, pageWidth, 40, 'F')

  doc.setTextColor(71, 85, 105)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Bu rapor ${generatedDate} tarihinde otomatik olusturulmustur.`, pageWidth / 2, yPosition, { align: 'center' })
  
  doc.setTextColor(148, 163, 184)
  doc.setFontSize(8)
  doc.text('Proje Yonetim Sistemi • Versiyon 2.0', pageWidth / 2, yPosition + 8, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}

function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'PLANNING': 'Planlama',
    'IN_PROGRESS': 'Devam Ediyor',
    'COMPLETED': 'Tamamlandi',
    'ON_HOLD': 'Beklemede'
  }
  return statusMap[status] || status
}

function getStatusColor(status: string): [number, number, number] {
  const colorMap: { [key: string]: [number, number, number] } = {
    'PLANNING': [146, 64, 14],
    'IN_PROGRESS': [30, 64, 175],
    'COMPLETED': [6, 95, 70],
    'ON_HOLD': [55, 65, 81]
  }
  return colorMap[status] || [0, 0, 0]
}
export async function GET(request: NextRequest) {
  try {
    const data = await getReportsData()
    const pdfBuffer = generatePDF(data)

    // Return PDF with proper headers
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="genel-rapor-${
          new Date().toISOString().split('T')[0]
        }.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'PDF oluşturulurken hata oluştu', details: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}
