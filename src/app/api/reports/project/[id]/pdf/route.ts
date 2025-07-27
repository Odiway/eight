import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { 
  setupTurkishPDF, 
  addTurkishText
} from '@/lib/pdf-utils'

// Helper function to draw a progress bar chart
function drawProgressChart(doc: jsPDF, x: number, y: number, width: number, height: number, percentage: number, color: [number, number, number]) {
  // Background
  doc.setFillColor(240, 240, 240)
  doc.roundedRect(x, y, width, height, 3, 3, 'F')
  
  // Progress fill
  const progressWidth = (width * percentage) / 100
  doc.setFillColor(color[0], color[1], color[2])
  doc.roundedRect(x, y, progressWidth, height, 3, 3, 'F')
  
  // Border
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.roundedRect(x, y, width, height, 3, 3, 'D')
  
  // Percentage text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`${percentage}%`, x + width/2, y + height/2 + 2, { align: 'center' })
}

// Helper function to draw a donut chart
function drawDonutChart(doc: jsPDF, centerX: number, centerY: number, radius: number, data: Array<{value: number, color: [number, number, number], label: string}>) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return
  
  let currentAngle = -Math.PI / 2 // Start from top
  const innerRadius = radius * 0.6
  
  data.forEach((item) => {
    const angle = (item.value / total) * 2 * Math.PI
    const endAngle = currentAngle + angle
    
    // Draw arc segment
    doc.setFillColor(item.color[0], item.color[1], item.color[2])
    
    // Create path for donut segment
    const startX = centerX + Math.cos(currentAngle) * radius
    const startY = centerY + Math.sin(currentAngle) * radius
    const endX = centerX + Math.cos(endAngle) * radius
    const endY = centerY + Math.sin(endAngle) * radius
    const innerStartX = centerX + Math.cos(currentAngle) * innerRadius
    const innerStartY = centerY + Math.sin(currentAngle) * innerRadius
    const innerEndX = centerX + Math.cos(endAngle) * innerRadius
    const innerEndY = centerY + Math.sin(endAngle) * innerRadius
    
    // Draw the arc (simplified as polygon for jsPDF)
    const segments = 20
    const points: number[] = []
    
    // Outer arc
    for (let i = 0; i <= segments; i++) {
      const a = currentAngle + (angle * i) / segments
      points.push(centerX + Math.cos(a) * radius)
      points.push(centerY + Math.sin(a) * radius)
    }
    
    // Inner arc (reverse direction)
    for (let i = segments; i >= 0; i--) {
      const a = currentAngle + (angle * i) / segments
      points.push(centerX + Math.cos(a) * innerRadius)
      points.push(centerY + Math.sin(a) * innerRadius)
    }
    
    // Draw filled polygon
    doc.lines([[...points]], centerX + Math.cos(currentAngle) * radius, centerY + Math.sin(currentAngle) * radius, [1, 1], 'F')
    
    currentAngle = endAngle
  })
  
  // Center circle
  doc.setFillColor(255, 255, 255)
  doc.circle(centerX, centerY, innerRadius, 'F')
  
  // Center text
  doc.setTextColor(67, 56, 202)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(total.toString(), centerX, centerY - 2, { align: 'center' })
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('Toplam Görev', centerX, centerY + 8, { align: 'center' })
}

// Helper function to draw a timeline visualization
function drawTimeline(doc: jsPDF, x: number, y: number, width: number, height: number, startDate: Date, endDate: Date, currentProgress: number) {
  const now = new Date()
  const totalDuration = endDate.getTime() - startDate.getTime()
  const elapsed = now.getTime() - startDate.getTime()
  const timeProgress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100)
  
  // Background timeline
  doc.setFillColor(240, 240, 240)
  doc.roundedRect(x, y, width, height, 2, 2, 'F')
  
  // Time elapsed (gray)
  const timeWidth = (width * timeProgress) / 100
  doc.setFillColor(200, 200, 200)
  doc.roundedRect(x, y, timeWidth, height, 2, 2, 'F')
  
  // Work completed (green)
  const workWidth = (width * currentProgress) / 100
  doc.setFillColor(34, 197, 94)
  doc.roundedRect(x, y, workWidth, height, 2, 2, 'F')
  
  // Current time indicator
  doc.setDrawColor(67, 56, 202)
  doc.setLineWidth(2)
  doc.line(x + timeWidth, y - 2, x + timeWidth, y + height + 2)
  
  // Labels
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(8)
  doc.text(startDate.toLocaleDateString('tr-TR'), x, y + height + 10)
  doc.text(endDate.toLocaleDateString('tr-TR'), x + width, y + height + 10, { align: 'right' })
  doc.text('Bugün', x + timeWidth, y - 8, { align: 'center' })
}

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
  
  // Setup Turkish font support
  setupTurkishPDF(doc)
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const usableWidth = pageWidth - 2 * margin
  const { project, statistics, tasks, team, timeline } = data
  const generatedDate = new Date(data.generatedAt).toLocaleString('tr-TR')

  let yPosition = margin

  // Enhanced Header with professional branding
  // Main gradient background with modern colors
  const mainHeaderHeight = 85
  for (let i = 0; i < mainHeaderHeight; i++) {
    const ratio = i / mainHeaderHeight
    const r = Math.floor(15 + (67 - 15) * ratio)
    const g = Math.floor(23 + (56 - 23) * ratio)
    const b = Math.floor(42 + (202 - 42) * ratio)
    doc.setFillColor(r, g, b)
    doc.rect(0, i, pageWidth, 1, 'F')
  }
  
  // Decorative geometric elements
  doc.setFillColor(255, 255, 255, 0.1)
  // Large circle
  doc.circle(pageWidth - 40, 30, 50, 'F')
  // Small circles pattern
  for (let i = 0; i < 5; i++) {
    doc.circle(20 + i * 15, 20 + i * 8, 8, 'F')
  }
  
  // Modern hexagon pattern
  doc.setFillColor(255, 255, 255, 0.05)
  const hexSize = 12
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const hexX = 30 + col * hexSize * 1.5 + (row % 2) * hexSize * 0.75
      const hexY = 45 + row * hexSize * 0.866
      if (hexX < pageWidth - 80) {
        // Draw hexagon (simplified as circle for jsPDF)
        doc.circle(hexX, hexY, hexSize / 3, 'F')
      }
    }
  }
  
  // Company logo placeholder
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, 15, 35, 35, 5, 5, 'F')
  doc.setTextColor(67, 56, 202)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('TM', margin + 17.5, 35, { align: 'center' })
  
  // Title with enhanced typography
  doc.setTextColor(0, 0, 0, 0.3)
  doc.setFontSize(36)
  doc.setFont('helvetica', 'bold')
  doc.text('PROJE RAPORU', pageWidth / 2 + 3, 35, { align: 'center' })
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(36)
  doc.text('PROJE RAPORU', pageWidth / 2, 32, { align: 'center' })
  
  // Project name with elegant styling
  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  const projectNameText = project.name.toUpperCase()
  doc.text(projectNameText, pageWidth / 2, 52, { align: 'center' })
  
  // Status badge with dynamic color
  const statusColor = getStatusColor(project.status)
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  doc.roundedRect(pageWidth / 2 - 30, 58, 60, 12, 6, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(getStatusText(project.status), pageWidth / 2, 66, { align: 'center' })
  
  // Date and report info
  doc.setFillColor(255, 255, 255, 0.95)
  doc.roundedRect(pageWidth - 90, 72, 80, 10, 3, 3, 'F')
  doc.setTextColor(67, 56, 202)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Rapor Tarihi: ${generatedDate}`, pageWidth - 50, 78, { align: 'center' })
  
  yPosition = mainHeaderHeight + 20

  // Executive Summary Section with modern cards
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, yPosition, usableWidth, 85, 8, 8, 'F')
  
  // Section header with icon
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('� YÖNETİCİ ÖZETİ', margin + 15, yPosition + 20)
  
  // Progress visualization
  yPosition += 35
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Proje İlerlemesi', margin + 15, yPosition)
  yPosition += 15
  
  drawProgressChart(doc, margin + 15, yPosition, usableWidth - 120, 12, statistics.progressPercentage, [34, 197, 94])
  
  // Progress percentage display
  doc.setTextColor(34, 197, 94)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(`${statistics.progressPercentage}%`, pageWidth - 80, yPosition + 10)
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(10)
  doc.text('Tamamlandı', pageWidth - 80, yPosition + 20, { align: 'center' })
  
  yPosition += 35

  // Enhanced Statistics Dashboard
  if (yPosition > pageHeight - 150) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(31, 41, 55)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('📈 DETAYLI STATİSTİKLER', margin, yPosition)
  yPosition += 30

  // Task status donut chart
  const chartData: Array<{value: number, color: [number, number, number], label: string}> = [
    { value: statistics.completedTasks, color: [34, 197, 94], label: 'Tamamlanan' },
    { value: statistics.inProgressTasks, color: [59, 130, 246], label: 'Devam Eden' },
    { value: statistics.todoTasks, color: [156, 163, 175], label: 'Yapılacak' },
    { value: statistics.reviewTasks, color: [168, 85, 247], label: 'İnceleme' },
    { value: statistics.overdueTasks, color: [239, 68, 68], label: 'Geciken' }
  ]
  
  // Draw donut chart
  drawDonutChart(doc, margin + 60, yPosition + 50, 40, chartData)
  
  // Chart legend
  let legendX = margin + 130
  let legendY = yPosition + 20
  chartData.forEach((item, index) => {
    if (item.value > 0) {
      doc.setFillColor(item.color[0], item.color[1], item.color[2])
      doc.circle(legendX, legendY, 4, 'F')
      
      doc.setTextColor(31, 41, 55)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`${item.label}: ${item.value}`, legendX + 8, legendY + 2)
      
      legendY += 12
    }
  })

  // Enhanced statistics cards with better visual hierarchy
  yPosition += 110
  
  const stats = [
    { label: 'Toplam Görev', value: statistics.totalTasks.toString(), color: [59, 130, 246], bgColor: [239, 246, 255], icon: '📋' },
    { label: 'Tamamlanan', value: statistics.completedTasks.toString(), color: [16, 185, 129], bgColor: [236, 253, 245], icon: '✅' },
    { label: 'Devam Eden', value: statistics.inProgressTasks.toString(), color: [245, 158, 11], bgColor: [255, 251, 235], icon: '⚡' },
    { label: 'Geciken', value: statistics.overdueTasks.toString(), color: [239, 68, 68], bgColor: [254, 242, 242], icon: '⚠️' },
    { label: 'Ekip Büyüklüğü', value: statistics.teamSize.toString(), color: [139, 92, 246], bgColor: [245, 243, 255], icon: '👥' },
    { label: 'Başarı Oranı', value: `%${statistics.progressPercentage}`, color: [6, 182, 212], bgColor: [236, 254, 255], icon: '🎯' }
  ]

  const cardWidth = (usableWidth - 20) / 3
  const cardHeight = 55

  for (let i = 0; i < stats.length; i++) {
    const row = Math.floor(i / 3)
    const col = i % 3
    const x = margin + col * (cardWidth + 10)
    const y = yPosition + row * (cardHeight + 10)

    // Enhanced card with multiple shadow layers
    doc.setFillColor(0, 0, 0, 0.05)
    doc.roundedRect(x + 3, y + 3, cardWidth, cardHeight, 10, 10, 'F')
    doc.setFillColor(0, 0, 0, 0.03)
    doc.roundedRect(x + 1, y + 1, cardWidth, cardHeight, 10, 10, 'F')
    
    doc.setFillColor(stats[i].bgColor[0], stats[i].bgColor[1], stats[i].bgColor[2])
    doc.roundedRect(x, y, cardWidth, cardHeight, 10, 10, 'F')
    
    // Gradient overlay simulation
    doc.setFillColor(255, 255, 255, 0.5)
    doc.roundedRect(x, y, cardWidth, cardHeight / 2, 10, 10, 'F')
    
    // Subtle border with card color
    doc.setDrawColor(stats[i].color[0], stats[i].color[1], stats[i].color[2], 0.3)
    doc.setLineWidth(0.5)
    doc.roundedRect(x, y, cardWidth, cardHeight, 10, 10, 'D')
    
    // Icon background circle
    doc.setFillColor(stats[i].color[0], stats[i].color[1], stats[i].color[2], 0.1)
    doc.circle(x + 15, y + 15, 12, 'F')
    
    // Icon
    doc.setFontSize(16)
    doc.text(stats[i].icon, x + 15, y + 18, { align: 'center' })

    // Large value with premium typography
    doc.setTextColor(stats[i].color[0], stats[i].color[1], stats[i].color[2])
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(stats[i].value, x + cardWidth - 15, y + 20, { align: 'right' })

    // Elegant label
    doc.setTextColor(75, 85, 99)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(stats[i].label, x + cardWidth / 2, y + 38, { align: 'center' })
    
    // Micro progress indicator for relevant stats
    if (i === 1 || i === 5) { // Completed tasks or success rate
      const percentage = i === 1 ? (statistics.completedTasks / statistics.totalTasks) * 100 : statistics.progressPercentage
      doc.setFillColor(stats[i].color[0], stats[i].color[1], stats[i].color[2])
      const progressWidth = (cardWidth - 20) * (percentage / 100)
      doc.roundedRect(x + 10, y + cardHeight - 8, progressWidth, 3, 1.5, 1.5, 'F')
      doc.setFillColor(stats[i].color[0], stats[i].color[1], stats[i].color[2], 0.2)
      doc.roundedRect(x + 10, y + cardHeight - 8, cardWidth - 20, 3, 1.5, 1.5, 'F')
    }
  }

  yPosition += Math.ceil(stats.length / 3) * (cardHeight + 10) + 35

  // Timeline Visualization
  if (yPosition > pageHeight - 100) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(31, 41, 55)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('📅 PROJE ZAMANÇİZELGESİ', margin, yPosition)
  yPosition += 25

  const startDate = new Date(project.startDate)
  const endDate = project.endDate ? new Date(project.endDate) : new Date()
  
  drawTimeline(doc, margin, yPosition, usableWidth, 20, startDate, endDate, statistics.progressPercentage)
  yPosition += 50

  // Ultra-Modern Tasks Table with Enhanced Design
  if (yPosition > pageHeight - 120) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(31, 41, 55)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('📋 GÖREV DETAYLARİ', margin, yPosition)
  yPosition += 25

  // Modern Table Header with sophisticated gradient
  const tableHeaders = ['Görev Adı', 'Durum', 'Öncelik', 'Atanan Kişi', 'Başlangıç', 'Bitiş']
  const colWidths = [usableWidth * 0.25, usableWidth * 0.12, usableWidth * 0.1, usableWidth * 0.23, usableWidth * 0.15, usableWidth * 0.15]

  // Enhanced header with professional gradient
  const tableHeaderHeight = 18
  for (let i = 0; i < tableHeaderHeight; i++) {
    const ratio = i / tableHeaderHeight
    const r = Math.floor(15 + (67 - 15) * ratio)
    const g = Math.floor(23 + (56 - 23) * ratio)
    const b = Math.floor(42 + (202 - 42) * ratio)
    doc.setFillColor(r, g, b)
    doc.rect(margin, yPosition + i, usableWidth, 1, 'F')
  }
  
  // Header icons and text with shadow effect
  const headerIcons = ['📝', '📊', '⚡', '👤', '🚀', '🏁']
  doc.setTextColor(0, 0, 0, 0.2)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  let xPos = margin
  for (let i = 0; i < tableHeaders.length; i++) {
    doc.text(`${headerIcons[i]} ${tableHeaders[i]}`, xPos + 7, yPosition + 13)
    xPos += colWidths[i]
  }
  
  doc.setTextColor(255, 255, 255)
  xPos = margin
  for (let i = 0; i < tableHeaders.length; i++) {
    doc.text(`${headerIcons[i]} ${tableHeaders[i]}`, xPos + 5, yPosition + 11)
    xPos += colWidths[i]
  }

  yPosition += tableHeaderHeight

  // Enhanced Table Content with modern styling and priority indicators
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const maxTasksToShow = Math.min(tasks.length, 15)
  
  function getPriorityColor(priority: string): [number, number, number] {
    const priorityMap: { [key: string]: [number, number, number] } = {
      'HIGH': [239, 68, 68],
      'MEDIUM': [245, 158, 11],
      'LOW': [34, 197, 94]
    }
    return priorityMap[priority] || [156, 163, 175]
  }
  
  function getPriorityText(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'HIGH': 'Yüksek',
      'MEDIUM': 'Orta',
      'LOW': 'Düşük'
    }
    return priorityMap[priority] || priority
  }
  
  for (let i = 0; i < maxTasksToShow; i++) {
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = margin
      
      // Redraw header on new page
      for (let j = 0; j < tableHeaderHeight; j++) {
        const ratio = j / tableHeaderHeight
        const r = Math.floor(15 + (67 - 15) * ratio)
        const g = Math.floor(23 + (56 - 23) * ratio)
        const b = Math.floor(42 + (202 - 42) * ratio)
        doc.setFillColor(r, g, b)
        doc.rect(margin, yPosition + j, usableWidth, 1, 'F')
      }
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      xPos = margin
      for (let j = 0; j < tableHeaders.length; j++) {
        doc.text(`${headerIcons[j]} ${tableHeaders[j]}`, xPos + 5, yPosition + 11)
        xPos += colWidths[j]
      }
      yPosition += tableHeaderHeight
      doc.setTextColor(31, 41, 55)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
    }

    const task = tasks[i]
    const rowHeight = 22
    
    // Enhanced alternating row design with hover effect simulation
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
    } else {
      doc.setFillColor(255, 255, 255)
    }
    doc.roundedRect(margin, yPosition, usableWidth, rowHeight, 3, 3, 'F')

    // Subtle row border
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)
    doc.line(margin, yPosition + rowHeight, margin + usableWidth, yPosition + rowHeight)

    // Enhanced status indicator with better positioning
    const statusColor = getStatusColor(task.status)
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
    doc.circle(margin + 8, yPosition + rowHeight/2, 4, 'F')
    
    // Priority indicator
    const priorityColor = getPriorityColor(task.priority)
    doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2])
    doc.roundedRect(margin + 16, yPosition + 3, 4, rowHeight - 6, 2, 2, 'F')

    // Row content with enhanced typography
    xPos = margin + 25
    const assignedUsers = task.assignedUsers?.map((au: any) => au.user.name) || []
    const assignedUser = assignedUsers.length > 0 ? assignedUsers.slice(0, 2).join(', ') + (assignedUsers.length > 2 ? '...' : '') : 'Atanmamış'
    
    const rowData = [
      task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title,
      getStatusText(task.status),
      getPriorityText(task.priority),
      assignedUser.length > 20 ? assignedUser.substring(0, 20) + '...' : assignedUser,
      task.startDate ? new Date(task.startDate).toLocaleDateString('tr-TR') : '-',
      task.endDate ? new Date(task.endDate).toLocaleDateString('tr-TR') : '-'
    ]

    for (let j = 0; j < rowData.length; j++) {
      // Enhanced text styling based on column type
      if (j === 1) { // Status
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
        doc.setFont('helvetica', 'bold')
      } else if (j === 2) { // Priority
        doc.setTextColor(priorityColor[0], priorityColor[1], priorityColor[2])
        doc.setFont('helvetica', 'bold')
      } else if (j === 0) { // Task title
        doc.setTextColor(31, 41, 55)
        doc.setFont('helvetica', 'bold')
      } else {
        doc.setTextColor(75, 85, 99)
        doc.setFont('helvetica', 'normal')
      }
      
      doc.text(rowData[j], xPos + 5, yPosition + 14)
      xPos += colWidths[j]
    }

    // Add overdue indicator if applicable
    if (task.endDate && new Date(task.endDate) < new Date() && task.status !== 'COMPLETED') {
      doc.setTextColor(239, 68, 68)
      doc.setFontSize(12)
      doc.text('⚠️', margin + usableWidth - 15, yPosition + 14)
    }

    yPosition += rowHeight
  }

  if (tasks.length > maxTasksToShow) {
    yPosition += 10
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text(`... ve ${tasks.length - maxTasksToShow} görev daha. Tüm görevler için detaylı sistem raporunu inceleyin.`, margin, yPosition)
    yPosition += 15
  }

  // Enhanced Team Section with Skills and Performance Indicators
  if (team.length > 0) {
    yPosition += 25
    
    if (yPosition > pageHeight - 120) {
      doc.addPage()
      yPosition = margin
    }

    doc.setTextColor(31, 41, 55)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('👥 EKİP ÜYELERİ VE PERFORMANS', margin, yPosition)
    yPosition += 30

    // Team performance summary
    const totalTeamTasks = team.reduce((sum, member) => {
      const memberTasks = tasks.filter(task => 
        task.assignedUsers?.some((au: any) => au.user.id === member.user.id)
      )
      return sum + memberTasks.length
    }, 0)

    const completedTeamTasks = team.reduce((sum, member) => {
      const memberTasks = tasks.filter(task => 
        task.assignedUsers?.some((au: any) => au.user.id === member.user.id) && 
        task.status === 'COMPLETED'
      )
      return sum + memberTasks.length
    }, 0)

    // Team performance card
    doc.setFillColor(67, 56, 202, 0.1)
    doc.roundedRect(margin, yPosition, usableWidth, 40, 8, 8, 'F')
    
    doc.setTextColor(67, 56, 202)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('📊 Ekip Performansı', margin + 15, yPosition + 15)
    
    const teamPerformance = totalTeamTasks > 0 ? Math.round((completedTeamTasks / totalTeamTasks) * 100) : 0
    doc.setFontSize(24)
    doc.text(`%${teamPerformance}`, margin + usableWidth - 60, yPosition + 20)
    
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.text(`${completedTeamTasks}/${totalTeamTasks} görev tamamlandı`, margin + 15, yPosition + 30)
    
    yPosition += 55

    // Enhanced team member cards with performance metrics
    const memberCardWidth = (usableWidth - 20) / 2
    const memberCardHeight = 70

    for (let i = 0; i < team.length; i++) {
      const row = Math.floor(i / 2)
      const col = i % 2
      
      if (yPosition + (row + 1) * (memberCardHeight + 15) > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
        
        doc.setTextColor(31, 41, 55)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('👥 EKİP ÜYELERİ (devamı)', margin, yPosition)
        yPosition += 30
      }
      
      const x = margin + col * (memberCardWidth + 10)
      const y = yPosition + row * (memberCardHeight + 15)

      // Enhanced member card with modern design
      doc.setFillColor(0, 0, 0, 0.05)
      doc.roundedRect(x + 2, y + 2, memberCardWidth, memberCardHeight, 8, 8, 'F')
      
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(x, y, memberCardWidth, memberCardHeight, 8, 8, 'F')
      
      doc.setDrawColor(67, 56, 202, 0.2)
      doc.setLineWidth(0.5)
      doc.roundedRect(x, y, memberCardWidth, memberCardHeight, 8, 8, 'D')

      // Member avatar placeholder
      doc.setFillColor(67, 56, 202, 0.1)
      doc.circle(x + 20, y + 20, 15, 'F')
      doc.setTextColor(67, 56, 202)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      const initials = team[i].user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
      doc.text(initials, x + 20, y + 25, { align: 'center' })

      // Member information
      doc.setTextColor(31, 41, 55)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      const name = team[i].user.name.length > 18 ? team[i].user.name.substring(0, 18) + '...' : team[i].user.name
      doc.text(name, x + 40, y + 15)

      // Role with colored badge
      const roleColors = {
        'Manager': [239, 68, 68],
        'Developer': [59, 130, 246],
        'Designer': [245, 158, 11],
        'Tester': [16, 185, 129]
      }
      const roleColor = roleColors[team[i].role as keyof typeof roleColors] || [107, 114, 128]
      doc.setFillColor(roleColor[0], roleColor[1], roleColor[2], 0.1)
      doc.roundedRect(x + 40, y + 20, 50, 12, 6, 6, 'F')
      doc.setTextColor(roleColor[0], roleColor[1], roleColor[2])
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(team[i].role, x + 65, y + 28, { align: 'center' })

      // Member task statistics
      const memberTasks = tasks.filter(task => 
        task.assignedUsers?.some((au: any) => au.user.id === team[i].user.id)
      )
      const memberCompletedTasks = memberTasks.filter(task => task.status === 'COMPLETED')
      const memberProgress = memberTasks.length > 0 ? Math.round((memberCompletedTasks.length / memberTasks.length) * 100) : 0

      doc.setTextColor(107, 114, 128)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`${memberTasks.length} görev`, x + 40, y + 40)
      doc.text(`%${memberProgress} tamamlandı`, x + 40, y + 50)

      // Progress bar for member
      const progressBarWidth = 60
      doc.setFillColor(240, 240, 240)
      doc.roundedRect(x + 40, y + 55, progressBarWidth, 4, 2, 2, 'F')
      
      if (memberProgress > 0) {
        doc.setFillColor(34, 197, 94)
        doc.roundedRect(x + 40, y + 55, (progressBarWidth * memberProgress) / 100, 4, 2, 2, 'F')
      }
    }

    yPosition += Math.ceil(team.length / 2) * (memberCardHeight + 15) + 25
  }

  // Professional Footer with enhanced design
  if (yPosition > pageHeight - 80) {
    doc.addPage()
    yPosition = margin
  }

  // Key insights and recommendations section
  yPosition += 30
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, yPosition, usableWidth, 60, 8, 8, 'F')
  
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('💡 ÖNEMLİ DEĞERLENDİRMELER', margin + 15, yPosition + 18)
  
  // Key insights based on data
  const insights: string[] = []
  
  if (statistics.progressPercentage >= 80) {
    insights.push('✅ Proje başarılı bir şekilde ilerlemekte ve hedefe yakın')
  } else if (statistics.progressPercentage >= 50) {
    insights.push('⚡ Proje orta düzeyde ilerleme gösteriyor, hızlanma gerekli')
  } else {
    insights.push('⚠️ Proje beklenenin altında ilerliyor, acil aksiyon gerekli')
  }
  
  if (statistics.overdueTasks > 0) {
    insights.push(`📅 ${statistics.overdueTasks} geciken görev için öncelik belirlenmeli`)
  }
  
  if (statistics.teamSize < 3) {
    insights.push('👥 Ekip küçük, iş yükü dağılımı dikkatli planlanmalı')
  }
  
  if (timeline.isOverdue) {
    insights.push('🚨 Proje süresi aştı, revizyon planı hazırlanmalı')
  }

  doc.setTextColor(75, 85, 99)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  let insightY = yPosition + 35
  insights.forEach((insight, index) => {
    if (index < 3) { // Limit to 3 insights
      doc.text(insight, margin + 15, insightY)
      insightY += 12
    }
  })
  
  yPosition += 80

  // Modern Footer with gradient and professional styling
  const footerY = pageHeight - 35
  
  // Gradient footer background
  for (let i = 0; i < 25; i++) {
    const ratio = i / 25
    const opacity = 0.15 * (1 - ratio)
    doc.setFillColor(67, 56, 202, opacity)
    doc.rect(0, footerY - 15 + i, pageWidth, 1, 'F')
  }

  // Footer content
  doc.setTextColor(67, 56, 202)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('TEMSA PROJECT MANAGEMENT SYSTEM', margin, footerY - 5)
  
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Bu rapor ${generatedDate} tarihinde otomatik olarak oluşturulmuştur.`, margin, footerY + 5)
  
  // Page indicator
  doc.text('Rapor Sonu', pageWidth - margin, footerY + 5, { align: 'right' })
  
  // Company info
  doc.setTextColor(67, 56, 202)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('www.temsa.com', pageWidth - margin, footerY - 5, { align: 'right' })

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
