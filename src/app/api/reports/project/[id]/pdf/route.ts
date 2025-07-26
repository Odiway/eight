import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'

interface ProjectReportData {
  generatedAt: string
  project: {
    id: string
    name: string
    description: string
    status: string
    startDate: string
    endDate: string | null
    createdAt: string
    updatedAt: string
    progress: number
  }
  statistics: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    todoTasks: number
    reviewTasks: number
    overdueTasks: number
    progressPercentage: number
    teamSize: number
  }
  tasks: any[]
  team: any[]
  timeline: {
    projectDuration: number
    isOverdue: boolean
    estimatedCompletion: string
    actualProgress: number
  }
}

async function getProjectReportData(projectId: string): Promise<ProjectReportData> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        include: {
          assignedUsers: {
            include: {
              user: true,
            },
          },
        },
      },
      members: {
        include: {
          user: true,
        },
      },
    },
  })

  if (!project) {
    throw new Error('Proje bulunamadı')
  }

  const tasks = project.tasks
  const team = project.members

  // Calculate statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const todoTasks = tasks.filter((t) => t.status === 'TODO').length
  const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length
  
  const overdueTasks = tasks.filter((t) => {
    const endDate = t.endDate ? new Date(t.endDate) : null
    return endDate && endDate < new Date() && t.status !== 'COMPLETED'
  }).length

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Calculate timeline
  const startDate = project.startDate ? new Date(project.startDate) : new Date()
  const endDate = project.endDate ? new Date(project.endDate) : new Date()
  const projectDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== 'COMPLETED'

  return {
    generatedAt: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate?.toISOString() || new Date().toISOString(),
      endDate: project.endDate?.toISOString() || null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      progress: progressPercentage,
    },
    statistics: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      overdueTasks,
      progressPercentage,
      teamSize: team.length,
    },
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      startDate: t.startDate?.toISOString(),
      endDate: t.endDate?.toISOString(),
      assignedUsers: t.assignedUsers,
    })),
    team: team.map((m) => ({
      id: m.id,
      role: m.role,
      user: m.user,
    })),
    timeline: {
      projectDuration,
      isOverdue: Boolean(isOverdue),
      estimatedCompletion: project.endDate?.toISOString() || '',
      actualProgress: progressPercentage,
    },
  }
}

function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'PLANNING': 'Planlama',
    'IN_PROGRESS': 'Devam Ediyor',
    'COMPLETED': 'Tamamlandi',
    'ON_HOLD': 'Beklemede',
    'TODO': 'Yapilacak',
    'REVIEW': 'Inceleme'
  }
  return statusMap[status] || status
}

function getStatusColor(status: string): [number, number, number] {
  const colorMap: { [key: string]: [number, number, number] } = {
    'PLANNING': [146, 64, 14],
    'IN_PROGRESS': [30, 64, 175],
    'COMPLETED': [6, 95, 70],
    'ON_HOLD': [55, 65, 81],
    'TODO': [107, 114, 128],
    'REVIEW': [168, 85, 247]
  }
  return colorMap[status] || [0, 0, 0]
}

function generateProjectPDF(data: ProjectReportData): Buffer {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const usableWidth = pageWidth - 2 * margin
  const { project, statistics, tasks, team, timeline } = data
  const generatedDate = new Date(data.generatedAt).toLocaleString('tr-TR')

  let yPosition = margin

  // Header
  doc.setFillColor(102, 126, 234)
  doc.rect(0, 0, pageWidth, 60, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('PROJE RAPORU', pageWidth / 2, 25, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(project.name, pageWidth / 2, 40, { align: 'center' })
  
  yPosition = 80

  // Project Information
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PROJE BILGILERI', margin, yPosition)
  yPosition += 15

  // Project details
  const projectInfo = [
    { label: 'Proje Adi:', value: project.name },
    { label: 'Durum:', value: getStatusText(project.status) },
    { label: 'Baslangic:', value: new Date(project.startDate).toLocaleDateString('tr-TR') },
    { label: 'Bitis:', value: project.endDate ? new Date(project.endDate).toLocaleDateString('tr-TR') : 'Belirlenmemis' },
    { label: 'Ilerleme:', value: `%${statistics.progressPercentage}` }
  ]

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  for (const info of projectInfo) {
    doc.setFont('helvetica', 'bold')
    doc.text(info.label, margin, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(info.value, margin + 40, yPosition)
    yPosition += 8
  }

  yPosition += 10

  // Statistics
  if (yPosition > pageHeight - 100) {
    doc.addPage()
    yPosition = margin
  }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ISTATISTIKLER', margin, yPosition)
  yPosition += 15

  const stats = [
    { label: 'Toplam Gorev', value: statistics.totalTasks.toString() },
    { label: 'Tamamlanan', value: statistics.completedTasks.toString() },
    { label: 'Devam Eden', value: statistics.inProgressTasks.toString() },
    { label: 'Geciken', value: statistics.overdueTasks.toString() },
    { label: 'Ekip Buyuklugu', value: statistics.teamSize.toString() },
    { label: 'Tamamlanma', value: `%${statistics.progressPercentage}` }
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

  // Tasks Table
  if (yPosition > pageHeight - 100) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('GOREVLER', margin, yPosition)
  yPosition += 15

  // Table Header
  const tableHeaders = ['Gorev Adi', 'Durum', 'Atanan', 'Baslangic', 'Bitis']
  const colWidths = [usableWidth * 0.25, usableWidth * 0.15, usableWidth * 0.2, usableWidth * 0.2, usableWidth * 0.2]

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

  for (let i = 0; i < Math.min(tasks.length, 10); i++) { // Limit to 10 tasks to fit on page
    if (yPosition > pageHeight - 30) {
      doc.addPage()
      yPosition = margin
    }

    const task = tasks[i]
    
    // Alternate row colors
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, yPosition, usableWidth, 15, 'F')
    }

    xPos = margin
    const assignedUsers = task.assignedUsers?.map((au: any) => au.user.name) || []
    const assignedUser = assignedUsers.length > 0 ? assignedUsers.join(', ') : 'Atanmamis'
    const rowData = [
      task.title.substring(0, 20) + (task.title.length > 20 ? '...' : ''),
      getStatusText(task.status),
      assignedUser.substring(0, 15) + (assignedUser.length > 15 ? '...' : ''),
      task.startDate ? new Date(task.startDate).toLocaleDateString('tr-TR') : '-',
      task.endDate ? new Date(task.endDate).toLocaleDateString('tr-TR') : '-'
    ]

    for (let j = 0; j < rowData.length; j++) {
      // Add status color
      if (j === 1) {
        const color = getStatusColor(task.status)
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

  // Team Section
  if (yPosition > pageHeight - 100) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('EKIP UYELERI', margin, yPosition)
  yPosition += 15

  for (let i = 0; i < Math.min(team.length, 5); i++) { // Limit to 5 team members
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = margin
    }

    const member = team[i]

    // Member card background
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(229, 231, 235)
    doc.rect(margin, yPosition, usableWidth, 20, 'FD')

    // Member name and role
    doc.setTextColor(30, 64, 175)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(member.user.name, margin + 5, yPosition + 8)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`${member.user.department} | ${member.role}`, margin + 5, yPosition + 15)

    yPosition += 25
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = id
    const data = await getProjectReportData(projectId)
    const pdfBuffer = generateProjectPDF(data)

    // Clean project name for filename
    const cleanProjectName = data.project.name.replace(/[^a-zA-Z0-9]/g, '-')
    const filename = `proje-raporu-${cleanProjectName}-${
      new Date().toISOString().split('T')[0]
    }.pdf`

    // Return PDF with proper headers
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
