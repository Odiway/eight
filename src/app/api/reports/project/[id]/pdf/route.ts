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

  // Enhanced Header with gradient effect
  doc.setFillColor(67, 56, 202) // Indigo
  doc.rect(0, 0, pageWidth, 70, 'F')
  
  // Header accent
  doc.setFillColor(99, 102, 241) // Lighter indigo
  doc.rect(0, 55, pageWidth, 15, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('PROJE RAPORU', pageWidth / 2, 30, { align: 'center' })
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.text(project.name, pageWidth / 2, 50, { align: 'center' })
  
  yPosition = 90

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

  // Enhanced Statistics with modern card design
  if (yPosition > pageHeight - 120) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('📊 PROJE İSTATİSTİKLERİ', margin, yPosition)
  yPosition += 20

  const stats = [
    { label: 'Toplam Görev', value: statistics.totalTasks.toString(), color: [59, 130, 246] },
    { label: 'Tamamlanan', value: statistics.completedTasks.toString(), color: [16, 185, 129] },
    { label: 'Devam Eden', value: statistics.inProgressTasks.toString(), color: [245, 158, 11] },
    { label: 'Geciken', value: statistics.overdueTasks.toString(), color: [239, 68, 68] },
    { label: 'Ekip Büyüklüğü', value: statistics.teamSize.toString(), color: [139, 92, 246] },
    { label: 'Tamamlanma', value: `%${statistics.progressPercentage}`, color: [6, 182, 212] }
  ]

  const colWidth = usableWidth / 3
  const rowHeight = 35

  for (let i = 0; i < stats.length; i++) {
    const row = Math.floor(i / 3)
    const col = i % 3
    const x = margin + col * colWidth
    const y = yPosition + row * rowHeight

    // Enhanced card background with shadow effect
    doc.setFillColor(255, 255, 255)
    doc.rect(x + 2, y + 2, colWidth - 8, rowHeight - 8, 'F') // Shadow
    doc.setFillColor(248, 250, 252)
    doc.rect(x, y, colWidth - 6, rowHeight - 6, 'F')
    
    // Colored left border
    doc.setFillColor(stats[i].color[0], stats[i].color[1], stats[i].color[2])
    doc.rect(x, y, 4, rowHeight - 6, 'F')

    // Value with colored text
    doc.setTextColor(stats[i].color[0], stats[i].color[1], stats[i].color[2])
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(stats[i].value, x + colWidth / 2, y + 15, { align: 'center' })

    // Label
    doc.setTextColor(75, 85, 99)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(stats[i].label, x + colWidth / 2, y + 25, { align: 'center' })
  }

  yPosition += Math.ceil(stats.length / 3) * rowHeight + 25

  // Enhanced Tasks Table
  if (yPosition > pageHeight - 120) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('📋 GÖREV LİSTESİ', margin, yPosition)
  yPosition += 20

  // Enhanced Table Header
  const tableHeaders = ['Görev Adı', 'Durum', 'Atanan', 'Başlangıç', 'Bitiş']
  const colWidths = [usableWidth * 0.25, usableWidth * 0.15, usableWidth * 0.2, usableWidth * 0.2, usableWidth * 0.2]

  // Header background with gradient effect
  doc.setFillColor(67, 56, 202)
  doc.rect(margin, yPosition, usableWidth, 12, 'F')
  
  // Header text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')

  let xPos = margin
  for (let i = 0; i < tableHeaders.length; i++) {
    doc.text(tableHeaders[i], xPos + 4, yPosition + 8)
    xPos += colWidths[i]
  }

  yPosition += 12

  // Enhanced Table Content
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  for (let i = 0; i < Math.min(tasks.length, 15); i++) { // Increased limit to 15 tasks
    if (yPosition > pageHeight - 35) {
      doc.addPage()
      yPosition = margin
      
      // Redraw header on new page
      doc.setFillColor(67, 56, 202)
      doc.rect(margin, yPosition, usableWidth, 12, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      xPos = margin
      for (let j = 0; j < tableHeaders.length; j++) {
        doc.text(tableHeaders[j], xPos + 4, yPosition + 8)
        xPos += colWidths[j]
      }
      yPosition += 12
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
    }

    const task = tasks[i]
    
    // Enhanced alternating row colors with hover effect
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, yPosition, usableWidth, 18, 'F')
    } else {
      doc.setFillColor(255, 255, 255)
      doc.rect(margin, yPosition, usableWidth, 18, 'F')
    }

    // Add subtle border
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.1)
    doc.rect(margin, yPosition, usableWidth, 18, 'D')

    xPos = margin
    const assignedUsers = task.assignedUsers?.map((au: any) => au.user.name) || []
    const assignedUser = assignedUsers.length > 0 ? assignedUsers.join(', ') : 'Atanmamış'
    const rowData = [
      task.title.substring(0, 25) + (task.title.length > 25 ? '...' : ''),
      getStatusText(task.status),
      assignedUser.substring(0, 18) + (assignedUser.length > 18 ? '...' : ''),
      task.startDate ? new Date(task.startDate).toLocaleDateString('tr-TR') : '-',
      task.endDate ? new Date(task.endDate).toLocaleDateString('tr-TR') : '-'
    ]

    for (let j = 0; j < rowData.length; j++) {
      // Enhanced status color coding
      if (j === 1) {
        const color = getStatusColor(task.status)
        doc.setTextColor(color[0], color[1], color[2])
        doc.setFont('helvetica', 'bold')
      } else {
        doc.setTextColor(55, 65, 81)
        doc.setFont('helvetica', 'normal')
      }
      
      doc.text(rowData[j], xPos + 4, yPosition + 12)
      xPos += colWidths[j]
    }

    yPosition += 18
  }

  yPosition += 15

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
