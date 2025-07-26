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
          assignedUser: true,
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
  
  // Calculate actual team from task assignments
  const uniqueTeamMembers = new Set<string>();
  const teamMembersMap = new Map<string, any>();
  
  tasks.forEach(task => {
    // Add assignedUser (legacy single assignment)
    if (task.assignedUser) {
      uniqueTeamMembers.add(task.assignedUser.id);
      teamMembersMap.set(task.assignedUser.id, {
        id: task.assignedUser.id,
        user: task.assignedUser,
        role: 'Ekip Üyesi'
      });
    }
    
    // Add assignedUsers (new multiple assignments)
    task.assignedUsers.forEach(assignment => {
      uniqueTeamMembers.add(assignment.user.id);
      teamMembersMap.set(assignment.user.id, {
        id: assignment.user.id,
        user: assignment.user,
        role: 'Ekip Üyesi'
      });
    });
  });
  
  const team = Array.from(teamMembersMap.values());

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

  // Modern Header with sophisticated gradient effect
  // Main gradient background
  for (let i = 0; i < 80; i++) {
    const ratio = i / 80
    const r = Math.floor(67 + (99 - 67) * ratio)
    const g = Math.floor(56 + (102 - 56) * ratio)
    const b = Math.floor(202 + (241 - 202) * ratio)
    doc.setFillColor(r, g, b)
    doc.rect(0, i, pageWidth, 1, 'F')
  }
  
  // Decorative elements
  doc.setFillColor(255, 255, 255, 0.1)
  doc.circle(pageWidth - 30, 25, 40, 'F')
  doc.circle(30, 60, 25, 'F')
  
  // Title with shadow effect
  doc.setTextColor(0, 0, 0, 0.2)
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  doc.text('PROJE RAPORU', pageWidth / 2 + 2, 32, { align: 'center' })
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(32)
  doc.text('PROJE RAPORU', pageWidth / 2, 30, { align: 'center' })
  
  // Project name with modern styling
  doc.setFontSize(18)
  doc.setFont('helvetica', 'normal')
  doc.text(project.name.toUpperCase(), pageWidth / 2, 52, { align: 'center' })
  
  // Date badge
  doc.setFillColor(255, 255, 255, 0.9)
  doc.roundedRect(pageWidth - 80, 65, 70, 12, 3, 3, 'F')
  doc.setTextColor(67, 56, 202)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(generatedDate, pageWidth - 45, 72, { align: 'center' })
  
  yPosition = 100

  // Modern Project Information Section
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, yPosition, usableWidth, 70, 5, 5, 'F')
  
  // Section header with icon
  doc.setTextColor(67, 56, 202)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('📋 PROJE BİLGİLERİ', margin + 10, yPosition + 20)
  
  yPosition += 35

  // Enhanced project details with modern layout
  const projectInfo = [
    { label: 'Proje Adı:', value: project.name, icon: '🎯' },
    { label: 'Durum:', value: getStatusText(project.status), icon: '📊' },
    { label: 'Başlangıç:', value: new Date(project.startDate).toLocaleDateString('tr-TR'), icon: '🚀' },
    { label: 'Bitiş:', value: project.endDate ? new Date(project.endDate).toLocaleDateString('tr-TR') : 'Belirlenmemiş', icon: '🏁' },
    { label: 'İlerleme:', value: `%${statistics.progressPercentage}`, icon: '📈' }
  ]

  doc.setFontSize(11)
  const infoYStart = yPosition

  for (let i = 0; i < projectInfo.length; i++) {
    const info = projectInfo[i]
    const xPos = margin + 15 + (i % 2) * (usableWidth / 2)
    const yPos = infoYStart + Math.floor(i / 2) * 12
    
    // Icon
    doc.setFont('helvetica', 'normal')
    doc.text(info.icon, xPos, yPos)
    
    // Label
    doc.setTextColor(75, 85, 99)
    doc.setFont('helvetica', 'bold')
    doc.text(info.label, xPos + 10, yPos)
    
    // Value with accent color
    doc.setTextColor(67, 56, 202)
    doc.setFont('helvetica', 'normal')
    doc.text(info.value, xPos + 60, yPos)
  }

  yPosition += 50

  // Ultra-Modern Statistics Cards with glassmorphism effect
  if (yPosition > pageHeight - 150) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(31, 41, 55)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('📊 ÖZETLE İSTATİSTİKLER', margin, yPosition)
  yPosition += 25

  const stats = [
    { label: 'Toplam Görev', value: statistics.totalTasks.toString(), color: [59, 130, 246], bgColor: [239, 246, 255] },
    { label: 'Tamamlanan', value: statistics.completedTasks.toString(), color: [16, 185, 129], bgColor: [236, 253, 245] },
    { label: 'Devam Eden', value: statistics.inProgressTasks.toString(), color: [245, 158, 11], bgColor: [255, 251, 235] },
    { label: 'Geciken', value: statistics.overdueTasks.toString(), color: [239, 68, 68], bgColor: [254, 242, 242] },
    { label: 'Ekip Büyüklüğü', value: statistics.teamSize.toString(), color: [139, 92, 246], bgColor: [245, 243, 255] },
    { label: 'Tamamlanma', value: `%${statistics.progressPercentage}`, color: [6, 182, 212], bgColor: [236, 254, 255] }
  ]

  const cardWidth = (usableWidth - 20) / 3
  const cardHeight = 45

  for (let i = 0; i < stats.length; i++) {
    const row = Math.floor(i / 3)
    const col = i % 3
    const x = margin + col * (cardWidth + 10)
    const y = yPosition + row * (cardHeight + 10)

    // Modern card with shadow and glassmorphism
    // Shadow
    doc.setFillColor(0, 0, 0, 0.1)
    doc.roundedRect(x + 2, y + 2, cardWidth, cardHeight, 8, 8, 'F')
    
    // Card background with gradient simulation
    doc.setFillColor(stats[i].bgColor[0], stats[i].bgColor[1], stats[i].bgColor[2])
    doc.roundedRect(x, y, cardWidth, cardHeight, 8, 8, 'F')
    
    // Subtle border
    doc.setDrawColor(stats[i].color[0], stats[i].color[1], stats[i].color[2], 0.3)
    doc.setLineWidth(0.5)
    doc.roundedRect(x, y, cardWidth, cardHeight, 8, 8, 'D')
    
    // Decorative corner accent
    doc.setFillColor(stats[i].color[0], stats[i].color[1], stats[i].color[2])
    doc.roundedRect(x, y, 25, 8, 8, 8, 'F')

    // Large value with modern typography
    doc.setTextColor(stats[i].color[0], stats[i].color[1], stats[i].color[2])
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(stats[i].value, x + cardWidth / 2, y + 20, { align: 'center' })

    // Elegant label
    doc.setTextColor(75, 85, 99)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(stats[i].label, x + cardWidth / 2, y + 32, { align: 'center' })
  }

  yPosition += Math.ceil(stats.length / 3) * (cardHeight + 10) + 30

  // Ultra-Modern Tasks Table
  if (yPosition > pageHeight - 120) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(31, 41, 55)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('📋 GÖREV DETAYLARİ', margin, yPosition)
  yPosition += 25

  // Modern Table Header with gradient
  const tableHeaders = ['Görev Adı', 'Durum', 'Atanan Kişi', 'Başlangıç', 'Bitiş']
  const colWidths = [usableWidth * 0.3, usableWidth * 0.15, usableWidth * 0.25, usableWidth * 0.15, usableWidth * 0.15]

  // Header with sophisticated gradient
  for (let i = 0; i < 15; i++) {
    const ratio = i / 15
    const r = Math.floor(67 + (99 - 67) * ratio)
    const g = Math.floor(56 + (102 - 56) * ratio)
    const b = Math.floor(202 + (241 - 202) * ratio)
    doc.setFillColor(r, g, b)
    doc.rect(margin, yPosition + i, usableWidth, 1, 'F')
  }
  
  // Header text with shadow
  doc.setTextColor(0, 0, 0, 0.2)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  let xPos = margin
  for (let i = 0; i < tableHeaders.length; i++) {
    doc.text(tableHeaders[i], xPos + 6, yPosition + 11)
    xPos += colWidths[i]
  }
  
  doc.setTextColor(255, 255, 255)
  xPos = margin
  for (let i = 0; i < tableHeaders.length; i++) {
    doc.text(tableHeaders[i], xPos + 5, yPosition + 10)
    xPos += colWidths[i]
  }

  yPosition += 15

  // Enhanced Table Content with modern styling
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const maxTasksToShow = Math.min(tasks.length, 12)
  
  for (let i = 0; i < maxTasksToShow; i++) {
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = margin
      
      // Redraw header on new page
      for (let j = 0; j < 15; j++) {
        const ratio = j / 15
        const r = Math.floor(67 + (99 - 67) * ratio)
        const g = Math.floor(56 + (102 - 56) * ratio)
        const b = Math.floor(202 + (241 - 202) * ratio)
        doc.setFillColor(r, g, b)
        doc.rect(margin, yPosition + j, usableWidth, 1, 'F')
      }
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      xPos = margin
      for (let j = 0; j < tableHeaders.length; j++) {
        doc.text(tableHeaders[j], xPos + 5, yPosition + 10)
        xPos += colWidths[j]
      }
      yPosition += 15
      doc.setTextColor(31, 41, 55)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
    }

    const task = tasks[i]
    const rowHeight = 20
    
    // Modern alternating row design
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
    } else {
      doc.setFillColor(255, 255, 255)
    }
    doc.roundedRect(margin, yPosition, usableWidth, rowHeight, 2, 2, 'F')

    // Status indicator with color coding
    const statusColor = getStatusColor(task.status)
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
    doc.circle(margin + 5, yPosition + rowHeight/2, 3, 'F')

    // Row content
    xPos = margin + 10
    const assignedUsers = task.assignedUsers?.map((au: any) => au.user.name) || []
    const assignedUser = assignedUsers.length > 0 ? assignedUsers.slice(0, 2).join(', ') : 'Atanmamış'
    
    const rowData = [
      task.title.length > 35 ? task.title.substring(0, 35) + '...' : task.title,
      getStatusText(task.status),
      assignedUser.length > 25 ? assignedUser.substring(0, 25) + '...' : assignedUser,
      task.startDate ? new Date(task.startDate).toLocaleDateString('tr-TR') : '-',
      task.endDate ? new Date(task.endDate).toLocaleDateString('tr-TR') : '-'
    ]

    for (let j = 0; j < rowData.length; j++) {
      // Status text with color
      if (j === 1) {
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
        doc.setFont('helvetica', 'bold')
      } else {
        doc.setTextColor(31, 41, 55)
        doc.setFont('helvetica', 'normal')
      }
      
      doc.text(rowData[j], xPos + 2, yPosition + 12)
      xPos += colWidths[j]
    }

    yPosition += rowHeight + 2
  }

  if (tasks.length > maxTasksToShow) {
    yPosition += 10
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text(`... ve ${tasks.length - maxTasksToShow} görev daha`, margin, yPosition)
    yPosition += 10
  }

  // Enhanced Team Section
  if (team.length > 0) {
    yPosition += 20
    
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = margin
    }

    doc.setTextColor(31, 41, 55)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('👥 EKİP ÜYELERİ', margin, yPosition)
    yPosition += 25

    // Team cards layout
    const memberCardWidth = (usableWidth - 20) / 3
    const memberCardHeight = 35

    for (let i = 0; i < team.length; i++) {
      const row = Math.floor(i / 3)
      const col = i % 3
      
      if (yPosition + (row + 1) * (memberCardHeight + 10) > pageHeight - 30) {
        doc.addPage()
        yPosition = margin
        
        doc.setTextColor(31, 41, 55)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('👥 EKİP ÜYELERİ (devamı)', margin, yPosition)
        yPosition += 25
      }
      
      const x = margin + col * (memberCardWidth + 10)
      const y = yPosition + row * (memberCardHeight + 10)

      // Member card with modern design
      doc.setFillColor(0, 0, 0, 0.05)
      doc.roundedRect(x + 1, y + 1, memberCardWidth, memberCardHeight, 6, 6, 'F')
      
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(x, y, memberCardWidth, memberCardHeight, 6, 6, 'F')
      
      doc.setDrawColor(67, 56, 202, 0.2)
      doc.setLineWidth(0.5)
      doc.roundedRect(x, y, memberCardWidth, memberCardHeight, 6, 6, 'D')

      // Role indicator
      const roleColors = {
        'Manager': [239, 68, 68],
        'Developer': [59, 130, 246],
        'Designer': [245, 158, 11],
        'Tester': [16, 185, 129]
      }
      const roleColor = roleColors[team[i].role as keyof typeof roleColors] || [107, 114, 128]
      doc.setFillColor(roleColor[0], roleColor[1], roleColor[2])
      doc.circle(x + 8, y + 8, 4, 'F')

      // Member name
      doc.setTextColor(31, 41, 55)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      const name = team[i].user.name.length > 18 ? team[i].user.name.substring(0, 18) + '...' : team[i].user.name
      doc.text(name, x + 16, y + 12)

      // Role
      doc.setTextColor(107, 114, 128)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(team[i].role, x + 16, y + 22)
    }

    yPosition += Math.ceil(team.length / 3) * (memberCardHeight + 10) + 20
  }

  // Modern Footer
  if (yPosition > pageHeight - 50) {
    doc.addPage()
    yPosition = margin
  }

  // Footer gradient
  for (let i = 0; i < 20; i++) {
    const ratio = i / 20
    const opacity = 0.1 * (1 - ratio)
    doc.setFillColor(67, 56, 202, opacity)
    doc.rect(0, pageHeight - 20 + i, pageWidth, 1, 'F')
  }

  doc.setTextColor(107, 114, 128)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(`Rapor oluşturulma tarihi: ${generatedDate}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

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
