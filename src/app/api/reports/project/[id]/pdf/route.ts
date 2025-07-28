import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import { PrismaClient } from '@prisma/client'
import { formatTurkishText } from '@/lib/pdf-utils'

const prisma = new PrismaClient()

interface ProjectDetailsData {
  project: {
    id: string
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
    createdAt: Date
  }
  tasks: Array<{
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    estimatedHours: number | null
    actualHours: number | null
    startDate: Date | null
    endDate: Date | null
    assignedUser: {
      id: string
      name: string
    } | null
    assignedUsers: Array<{
      user: {
        id: string
        name: string
        department: string
        position: string
      }
    }>
  }>
  allUsers: Array<{
    id: string
    name: string
    department: string
    position: string
  }>
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  blockedTasks: number
  totalEstimatedHours: number
  totalActualHours: number
  completionPercentage: number
}

async function getProjectData(projectId: string): Promise<ProjectDetailsData> {
  try {
    // Fetch all users first
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        position: true
      }
    })

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true
              }
            },
            assignedUsers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    department: true,
                    position: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!project) {
      throw new Error('Proje bulunamadı')
    }

    const tasks = project.tasks
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length
    const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length
    const todoTasks = tasks.filter(task => task.status === 'TODO').length
    const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length
    const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
    const totalActualHours = tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0)
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      project,
      tasks,
      allUsers,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      blockedTasks,
      totalEstimatedHours,
      totalActualHours,
      completionPercentage
    }
  } catch (error) {
    console.error('Proje verileri alınırken hata:', error)
    // Return mock data for development/testing when database is not available
    const mockUsers = [
      { id: '1', name: 'Ahmet Yılmaz', department: 'Yazılım', position: 'Senior Developer' },
      { id: '2', name: 'Ayşe Kara', department: 'Tasarım', position: 'UI/UX Designer' },
      { id: '3', name: 'Mehmet Demir', department: 'Yazılım', position: 'Frontend Developer' },
      { id: '4', name: 'Fatma Öz', department: 'Test', position: 'QA Specialist' },
      { id: '5', name: 'Ali Çelik', department: 'DevOps', position: 'System Administrator' }
    ]

    return {
      project: {
        id: projectId,
        name: 'Örnek Proje',
        description: 'Bu bir test projesidir. Veritabanı bağlantısı mevcut olmadığında gösterilen örnek verilerdir.',
        status: 'IN_PROGRESS',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        createdAt: new Date()
      },
      tasks: [
        {
          id: '1',
          title: 'Örnek Görev 1',
          description: 'Bu bir örnek görevdir.',
          status: 'COMPLETED',
          priority: 'HIGH',
          estimatedHours: 8,
          actualHours: 7,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-15'),
          assignedUser: {
            id: '1',
            name: 'Örnek Kullanıcı'
          },
          assignedUsers: [
            { user: { id: '1', name: 'Ahmet Yılmaz', department: 'Yazılım', position: 'Senior Developer' } },
            { user: { id: '3', name: 'Mehmet Demir', department: 'Yazılım', position: 'Frontend Developer' } }
          ]
        },
        {
          id: '2', 
          title: 'Örnek Görev 2',
          description: 'Bu başka bir örnek görevdir.',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          estimatedHours: 12,
          actualHours: 5,
          startDate: new Date('2024-01-16'),
          endDate: new Date('2024-02-01'),
          assignedUser: {
            id: '2',
            name: 'Başka Kullanıcı'
          },
          assignedUsers: [
            { user: { id: '2', name: 'Ayşe Kara', department: 'Tasarım', position: 'UI/UX Designer' } },
            { user: { id: '4', name: 'Fatma Öz', department: 'Test', position: 'QA Specialist' } }
          ]
        },
        {
          id: '3',
          title: 'Örnek Görev 3', 
          description: 'Üçüncü örnek görev.',
          status: 'TODO',
          priority: 'LOW',
          estimatedHours: 6,
          actualHours: 0,
          startDate: new Date('2024-02-02'),
          endDate: new Date('2024-02-15'),
          assignedUser: null,
          assignedUsers: [
            { user: { id: '5', name: 'Ali Çelik', department: 'DevOps', position: 'System Administrator' } }
          ]
        }
      ],
      allUsers: mockUsers,
      totalTasks: 3,
      completedTasks: 1,
      inProgressTasks: 1,
      todoTasks: 1,
      blockedTasks: 0,
      totalEstimatedHours: 26,
      totalActualHours: 12,
      completionPercentage: 33
    }
  }
}

function generateCorporateProjectPDF(data: ProjectDetailsData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4')
  let yPosition = 20

  // Professional Corporate Colors
  const corporateBlue = [0, 71, 171]      // Professional Navy Blue
  const corporateGray = [64, 64, 64]      // Dark Gray
  const accentBlue = [0, 123, 255]        // Accent Blue
  const successGreen = [40, 167, 69]      // Success Green
  const warningOrange = [255, 133, 27]    // Warning Orange
  const dangerRed = [220, 53, 69]         // Danger Red
  const lightGray = [248, 249, 250]       // Light Background
  const darkText = [33, 37, 41]           // Dark Text
  const borderGray = [222, 226, 230]      // Border Gray
  
  // Helper Functions for Professional Layout
  const drawBorder = (x: number, y: number, width: number, height: number, color: number[] = borderGray) => {
    pdf.setDrawColor(color[0], color[1], color[2])
    pdf.setLineWidth(0.5)
    pdf.rect(x, y, width, height)
  }

  const addSection = (title: string, y: number, withBackground: boolean = true): number => {
    if (withBackground) {
      // Section background
      pdf.setFillColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
      pdf.rect(10, y - 5, 190, 12, 'F')
      
      // Section border
      drawBorder(10, y - 5, 190, 12, corporateBlue)
      
      // Section title
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.text(formatTurkishText(title.toUpperCase()), 15, y + 2)
      pdf.setTextColor(darkText[0], darkText[1], darkText[2])
    } else {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      pdf.setTextColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
      pdf.text(formatTurkishText(title), 15, y)
      pdf.setTextColor(darkText[0], darkText[1], darkText[2])
    }
    return y + 15
  }

  const addMetricCard = (x: number, y: number, width: number, height: number, 
                        value: string, label: string, color: number[]) => {
    // Card background
    pdf.setFillColor(color[0], color[1], color[2])
    pdf.rect(x, y, width, height, 'F')
    
    // Card border
    drawBorder(x, y, width, height, [255, 255, 255])
    
    // Value (large number) - centered properly
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(22)
    const valueWidth = pdf.getTextWidth(value)
    pdf.text(value, x + (width - valueWidth) / 2, y + height / 2 - 2)
    
    // Label (smaller text) - centered and positioned properly
    pdf.setFontSize(7)
    const labelText = formatTurkishText(label)
    const labelWidth = pdf.getTextWidth(labelText)
    pdf.text(labelText, x + (width - labelWidth) / 2, y + height - 4)
    
    pdf.setTextColor(darkText[0], darkText[1], darkText[2])
  }

  const addInfoRow = (label: string, value: string, y: number, isBold: boolean = false): number => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text(formatTurkishText(label + ':'), 15, y)
    
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal')
    pdf.setFontSize(9)
    // Ensure proper text wrapping for long values
    const maxWidth = 120
    const wrappedText = pdf.splitTextToSize(formatTurkishText(value), maxWidth)
    pdf.text(wrappedText, 70, y)
    
    // Return proper spacing based on wrapped text
    return y + (wrappedText.length * 6) + 2
  }

  // DOCUMENT HEADER - PROFESSIONAL LETTERHEAD
  pdf.setFillColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.rect(0, 0, 210, 35, 'F')
  
  // Company Logo Area (placeholder)
  pdf.setFillColor(255, 255, 255)
  pdf.rect(15, 8, 25, 20, 'F')
  pdf.setTextColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('LOGO', 23, 19)
  
  // Document Title
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.text(formatTurkishText('PROJE YONETIM RAPORU'), 50, 18)
  
  // Document Info
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(formatTurkishText('Kurumsal Proje Takip Sistemi'), 50, 26)
  
  // Date and Reference
  const currentDate = new Date().toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  pdf.text(formatTurkishText(`Rapor Tarihi: ${currentDate}`), 140, 18)
  pdf.text(formatTurkishText(`Referans: PRJ-${data.project.id.toUpperCase()}`), 140, 26)
  
  pdf.setTextColor(darkText[0], darkText[1], darkText[2])
  yPosition = 50

  // PROJECT IDENTIFICATION SECTION
  pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2])
  pdf.rect(10, yPosition - 5, 190, 25, 'F')
  drawBorder(10, yPosition - 5, 190, 25)
  
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.text(formatTurkishText(`PROJE ADI: ${data.project.name.toUpperCase()}`), 15, yPosition + 5)
  
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(corporateGray[0], corporateGray[1], corporateGray[2])
  const statusText = data.project.status === 'COMPLETED' ? 'TAMAMLANDI' :
                     data.project.status === 'IN_PROGRESS' ? 'DEVAM EDIYOR' :
                     data.project.status === 'TODO' ? 'BASLAMADI' : data.project.status
  pdf.text(formatTurkishText(`DURUM: ${statusText}`), 15, yPosition + 15)
  pdf.setTextColor(darkText[0], darkText[1], darkText[2])
  yPosition += 35

  // EXECUTIVE SUMMARY - KEY METRICS - FIXED LAYOUT
  yPosition = addSection('YONETICI OZETI', yPosition)
  
  // Metric Cards Row with proper spacing
  const cardY = yPosition + 5
  const cardWidth = 42
  const cardHeight = 28
  const cardSpacing = 4
  
  // Total Tasks Card
  addMetricCard(15, cardY, cardWidth, cardHeight, 
               data.totalTasks.toString(), 'TOPLAM GOREV', corporateGray)
  
  // Completed Tasks Card
  addMetricCard(15 + cardWidth + cardSpacing, cardY, cardWidth, cardHeight,
               data.completedTasks.toString(), 'TAMAMLANAN', successGreen)
  
  // In Progress Tasks Card
  addMetricCard(15 + 2 * (cardWidth + cardSpacing), cardY, cardWidth, cardHeight,
               data.inProgressTasks.toString(), 'DEVAM EDEN', warningOrange)
  
  // Pending Tasks Card
  addMetricCard(15 + 3 * (cardWidth + cardSpacing), cardY, cardWidth, cardHeight,
               data.todoTasks.toString(), 'BEKLEYEN', dangerRed)
  
  yPosition += cardHeight + 20

  // Progress Bar with Professional Styling - FIXED LAYOUT
  const progressBarY = yPosition
  const progressBarWidth = 150
  const progressBarHeight = 12
  const progressFill = (data.completionPercentage / 100) * progressBarWidth
  
  // Progress bar label with proper spacing
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text(formatTurkishText('PROJE TAMAMLANMA ORANI'), 15, progressBarY - 5)
  
  // Progress bar background
  pdf.setFillColor(borderGray[0], borderGray[1], borderGray[2])
  pdf.rect(15, progressBarY + 3, progressBarWidth, progressBarHeight, 'F')
  drawBorder(15, progressBarY + 3, progressBarWidth, progressBarHeight)
  
  // Progress bar fill
  const progressColor = data.completionPercentage >= 80 ? successGreen :
                       data.completionPercentage >= 50 ? warningOrange : dangerRed
  pdf.setFillColor(progressColor[0], progressColor[1], progressColor[2])
  pdf.rect(15, progressBarY + 3, progressFill, progressBarHeight, 'F')
  
  // Progress percentage with correct positioning
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(progressColor[0], progressColor[1], progressColor[2])
  pdf.text(`%${data.completionPercentage}`, 175, progressBarY + 11)
  pdf.setTextColor(darkText[0], darkText[1], darkText[2])
  yPosition += 35

  // PROJECT INFORMATION TABLE - FIXED LAYOUT
  yPosition = addSection('PROJE BILGILERI', yPosition)
  
  // Calculate proper box height based on content
  let estimatedHeight = 55
  if (data.project.description && data.project.description.length > 60) {
    estimatedHeight += 10
  }
  
  // Information box with dynamic height
  pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2])
  pdf.rect(10, yPosition - 5, 190, estimatedHeight, 'F')
  drawBorder(10, yPosition - 5, 190, estimatedHeight)
  
  let infoY = yPosition + 3
  
  if (data.project.description) {
    // Truncate long descriptions to prevent overflow
    const shortDesc = data.project.description.length > 80 ? 
                     data.project.description.substring(0, 77) + '...' : 
                     data.project.description
    infoY = addInfoRow('PROJE ACIKLAMASI', shortDesc, infoY)
    infoY += 2
  }
  
  if (data.project.startDate) {
    infoY = addInfoRow('BASLANGIC TARIHI', 
                      data.project.startDate.toLocaleDateString('tr-TR'), infoY)
  }
  
  if (data.project.endDate) {
    infoY = addInfoRow('HEDEFLENEN BITIS TARIHI', 
                      data.project.endDate.toLocaleDateString('tr-TR'), infoY)
  }
  
  infoY = addInfoRow('TOPLAM TAHMINI SURE', `${data.totalEstimatedHours} saat`, infoY)
  infoY = addInfoRow('TOPLAM HARCANAN SURE', `${data.totalActualHours} saat`, infoY)
  
  // Efficiency calculation with better positioning
  const efficiency = data.totalEstimatedHours > 0 ? 
                    Math.round((data.totalActualHours / data.totalEstimatedHours) * 100) : 0
  const efficiencyText = efficiency <= 100 ? 'HEDEF DAHILINDE' : 'HEDEF ASIMI'
  const efficiencyColor = efficiency <= 100 ? successGreen : dangerRed
  pdf.setTextColor(efficiencyColor[0], efficiencyColor[1], efficiencyColor[2])
  infoY = addInfoRow('VERIMLILIK DURUMU', `%${efficiency} - ${efficiencyText}`, infoY, true)
  pdf.setTextColor(darkText[0], darkText[1], darkText[2])
  
  yPosition += estimatedHeight + 15

  // TASK BREAKDOWN SECTION
  if (data.tasks.length > 0) {
    if (yPosition > 200) {
      pdf.addPage()
      yPosition = 20
    }

    yPosition = addSection('GOREV DETAY ANALIZI', yPosition)

    // Task table header
    const tableStartY = yPosition
    const colWidths = [8, 65, 25, 20, 25, 25, 22]
    const colX = [10, 18, 83, 108, 128, 153, 178]
    const headers = ['#', 'GOREV ADI', 'DURUM', 'ONCELIK', 'SORUMLU', 'TAH.SURE', 'GER.SURE']
    
    // Table header background
    pdf.setFillColor(corporateGray[0], corporateGray[1], corporateGray[2])
    pdf.rect(10, tableStartY - 2, 190, 8, 'F')
    
    // Table headers
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    headers.forEach((header, i) => {
      pdf.text(formatTurkishText(header), colX[i], tableStartY + 3)
    })
    
    pdf.setTextColor(darkText[0], darkText[1], darkText[2])
    let rowY = tableStartY + 10

    // Task rows (limit to first 15 for space)
    data.tasks.slice(0, 15).forEach((task, index) => {
      if (rowY > 270) {
        pdf.addPage()
        rowY = 20
      }

      // Alternating row colors
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250)
        pdf.rect(10, rowY - 3, 190, 7, 'F')
      }

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7)
      
      // Row data
      const taskTitle = task.title.length > 35 ? task.title.substring(0, 32) + '...' : task.title
      const assignedUser = task.assignedUsers.length > 0 ? 
                          task.assignedUsers[0].user.name.split(' ')[0] : 
                          (task.assignedUser ? task.assignedUser.name.split(' ')[0] : 'Yok')
      
      const rowData = [
        (index + 1).toString(),
        taskTitle,
        task.status === 'COMPLETED' ? 'TAMAM' : 
        task.status === 'IN_PROGRESS' ? 'DEVAM' : 
        task.status === 'TODO' ? 'BEKLE' : task.status,
        task.priority === 'HIGH' ? 'YUKSEK' : 
        task.priority === 'MEDIUM' ? 'ORTA' : 
        task.priority === 'LOW' ? 'DUSUK' : task.priority,
        assignedUser,
        `${task.estimatedHours || 0}h`,
        `${task.actualHours || 0}h`
      ]
      
      rowData.forEach((data, i) => {
        pdf.text(formatTurkishText(data), colX[i], rowY)
      })
      
      rowY += 7
    })

    // Table border
    drawBorder(10, tableStartY - 2, 190, rowY - tableStartY + 2)
    
    if (data.tasks.length > 15) {
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(8)
      pdf.setTextColor(corporateGray[0], corporateGray[1], corporateGray[2])
      pdf.text(formatTurkishText(`Not: ${data.tasks.length} gorevden ilk 15'i gosterilmektedir.`), 15, rowY + 8)
      pdf.setTextColor(darkText[0], darkText[1], darkText[2])
    }

    yPosition = rowY + 20
  }

  // TEAM COMPOSITION SECTION
  if (data.allUsers && data.allUsers.length > 0) {
    if (yPosition > 220) {
      pdf.addPage()
      yPosition = 20
    }

    yPosition = addSection('EKIP KOMPOZISYONU', yPosition)

    // Department breakdown
    const usersByDept = data.allUsers.reduce((acc, user) => {
      if (!acc[user.department]) {
        acc[user.department] = []
      }
      acc[user.department].push(user)
      return acc
    }, {} as Record<string, typeof data.allUsers>)

    Object.entries(usersByDept).forEach(([department, users], deptIndex) => {
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }

      // Department header with count
      const deptColor = [
        corporateBlue, accentBlue, successGreen, warningOrange, 
        dangerRed, corporateGray
      ][deptIndex % 6]
      
      pdf.setFillColor(deptColor[0], deptColor[1], deptColor[2])
      pdf.rect(15, yPosition - 2, 180, 8, 'F')
      
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.text(formatTurkishText(`${department.toUpperCase()} (${users.length} KISI)`), 20, yPosition + 3)
      
      pdf.setTextColor(darkText[0], darkText[1], darkText[2])
      yPosition += 12

      // Team members in columns
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      const membersPerRow = 2
      
      users.forEach((user, index) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }
        
        const col = index % membersPerRow
        const xPos = 25 + (col * 85)
        
        if (col === 0 && index > 0) {
          yPosition += 5
        }
        
        pdf.text(formatTurkishText(`• ${user.name} - ${user.position}`), xPos, yPosition)
        
        if (col === membersPerRow - 1 || index === users.length - 1) {
          yPosition += 5
        }
      })
      
      yPosition += 8
    })
  }

  // DOCUMENT FOOTER WITH SIGNATURES
  const finalPageCount = pdf.internal.getNumberOfPages()
  
  // Add signature section on last page
  pdf.setPage(finalPageCount)
  const footerY = 250
  
  // Signature boxes
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text(formatTurkishText('HAZIRLAYAN'), 30, footerY)
  pdf.text(formatTurkishText('ONAYLAYAN'), 130, footerY)
  
  // Signature lines
  pdf.setLineWidth(0.5)
  pdf.line(20, footerY + 15, 80, footerY + 15)
  pdf.line(120, footerY + 15, 180, footerY + 15)
  
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(formatTurkishText('Proje Koordinatoru'), 35, footerY + 20)
  pdf.text(formatTurkishText('Proje Muduru'), 140, footerY + 20)

  // Document footer on all pages
  for (let i = 1; i <= finalPageCount; i++) {
    pdf.setPage(i)
    
    // Footer line
    pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2])
    pdf.setLineWidth(0.5)
    pdf.line(10, 280, 200, 280)
    
    // Footer text
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(corporateGray[0], corporateGray[1], corporateGray[2])
    
    pdf.text(formatTurkishText('Kurumsal Proje Yonetim Sistemi'), 15, 285)
    pdf.text(formatTurkishText(`Sayfa ${i} / ${finalPageCount}`), 95, 285)
    pdf.text(formatTurkishText(`Olusturulma: ${new Date().toLocaleString('tr-TR')}`), 140, 285)
    
    // Confidentiality notice
    pdf.text(formatTurkishText('GIZLI - Sadece yetkili personel icin'), 15, 290)
  }

  return pdf
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    if (!projectId) {
      return NextResponse.json({ error: 'Proje ID gerekli' }, { status: 400 })
    }

    // Always try to get data, fallback to mock if needed
    const data = await getProjectData(projectId)
    const pdf = generateCorporateProjectPDF(data)
    const pdfBuffer = pdf.output('arraybuffer')

    const projectName = data.project.name.replace(/[^a-zA-Z0-9]/g, '-')
    const filename = `proje-raporu-${projectName}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('PDF oluşturulurken hata:', error)
    
    // Generate error PDF instead of returning JSON error
    try {
      const errorData: ProjectDetailsData = {
        project: {
          id: 'error',
          name: 'Hata - PDF Oluşturulamadı',
          description: 'Veritabanı bağlantısı veya diğer bir hata nedeniyle PDF oluşturulamadı.',
          status: 'ERROR',
          startDate: new Date(),
          endDate: new Date(),
          createdAt: new Date()
        },
        tasks: [],
        allUsers: [],
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        blockedTasks: 0,
        totalEstimatedHours: 0,
        totalActualHours: 0,
        completionPercentage: 0
      }
      
      const errorPdf = generateCorporateProjectPDF(errorData)
      const errorPdfBuffer = errorPdf.output('arraybuffer')
      
      return new NextResponse(errorPdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="hata-raporu.pdf"'
        }
      })
    } catch (pdfError) {
      return NextResponse.json(
        { error: 'PDF oluşturulamadı' }, 
        { status: 500 }
      )
    }
  }
}
