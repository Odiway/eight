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
        position: true,
      },
    })

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedUsers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    department: true,
                    position: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!project) {
      throw new Error('Proje bulunamadı')
    }

    const tasks = project.tasks
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(
      (task) => task.status === 'COMPLETED'
    ).length
    const inProgressTasks = tasks.filter(
      (task) => task.status === 'IN_PROGRESS'
    ).length
    const todoTasks = tasks.filter((task) => task.status === 'TODO').length
    const blockedTasks = tasks.filter(
      (task) => task.status === 'BLOCKED'
    ).length
    const totalEstimatedHours = tasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    )
    const totalActualHours = tasks.reduce(
      (sum, task) => sum + (task.actualHours || 0),
      0
    )
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

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
      completionPercentage,
    }
  } catch (error) {
    console.error('Proje verileri alınırken hata:', error)
    // Return mock data for development/testing when database is not available
    const mockUsers = [
      {
        id: '1',
        name: 'Ahmet Yılmaz',
        department: 'Yazılım',
        position: 'Senior Developer',
      },
      {
        id: '2',
        name: 'Ayşe Kara',
        department: 'Tasarım',
        position: 'UI/UX Designer',
      },
      {
        id: '3',
        name: 'Mehmet Demir',
        department: 'Yazılım',
        position: 'Frontend Developer',
      },
      {
        id: '4',
        name: 'Fatma Öz',
        department: 'Test',
        position: 'QA Specialist',
      },
      {
        id: '5',
        name: 'Ali Çelik',
        department: 'DevOps',
        position: 'System Administrator',
      },
    ]

    return {
      project: {
        id: projectId,
        name: 'Örnek Proje',
        description:
          'Bu bir test projesidir. Veritabanı bağlantısı mevcut olmadığında gösterilen örnek verilerdir.',
        status: 'IN_PROGRESS',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        createdAt: new Date(),
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
            name: 'Örnek Kullanıcı',
          },
          assignedUsers: [
            {
              user: {
                id: '1',
                name: 'Ahmet Yılmaz',
                department: 'Yazılım',
                position: 'Senior Developer',
              },
            },
            {
              user: {
                id: '3',
                name: 'Mehmet Demir',
                department: 'Yazılım',
                position: 'Frontend Developer',
              },
            },
          ],
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
            name: 'Başka Kullanıcı',
          },
          assignedUsers: [
            {
              user: {
                id: '2',
                name: 'Ayşe Kara',
                department: 'Tasarım',
                position: 'UI/UX Designer',
              },
            },
            {
              user: {
                id: '4',
                name: 'Fatma Öz',
                department: 'Test',
                position: 'QA Specialist',
              },
            },
          ],
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
            {
              user: {
                id: '5',
                name: 'Ali Çelik',
                department: 'DevOps',
                position: 'System Administrator',
              },
            },
          ],
        },
      ],
      allUsers: mockUsers,
      totalTasks: 3,
      completedTasks: 1,
      inProgressTasks: 1,
      todoTasks: 1,
      blockedTasks: 0,
      totalEstimatedHours: 26,
      totalActualHours: 12,
      completionPercentage: 33,
    }
  }
}

function generateCorporateProjectPDF(data: ProjectDetailsData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4')
  let yPosition = 20

  // Enhanced Professional Corporate Colors with gradients
  const corporateBlue = [13, 71, 161] // Deep Blue
  const corporateBlueLight = [33, 150, 243] // Light Blue
  const corporateGray = [55, 71, 79] // Professional Dark Gray
  const accentBlue = [25, 118, 210] // Vibrant Blue
  const successGreen = [56, 142, 60] // Professional Green
  const warningOrange = [245, 124, 0] // Modern Orange
  const dangerRed = [211, 47, 47] // Professional Red
  const lightGray = [250, 250, 250] // Ultra Light Background
  const darkText = [38, 50, 56] // Rich Dark Text
  const borderGray = [224, 224, 224] // Subtle Border
  const accentGold = [255, 193, 7] // Premium Gold

  // Helper Functions for Enhanced Professional Layout
  const drawShadowBorder = (
    x: number,
    y: number,
    width: number,
    height: number,
    color: number[] = borderGray,
    shadowOffset: number = 0.5
  ) => {
    // Draw shadow
    if (shadowOffset > 0) {
      pdf.setFillColor(200, 200, 200)
      pdf.rect(x + shadowOffset, y + shadowOffset, width, height, 'F')
    }

    // Draw main border
    pdf.setDrawColor(color[0], color[1], color[2])
    pdf.setLineWidth(0.8)
    pdf.rect(x, y, width, height)
  }

  const addGradientBackground = (
    x: number,
    y: number,
    width: number,
    height: number,
    color1: number[],
    color2: number[]
  ) => {
    // Simulate gradient with multiple rectangles
    const steps = 10
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1)
      const r = Math.round(color1[0] + (color2[0] - color1[0]) * ratio)
      const g = Math.round(color1[1] + (color2[1] - color1[1]) * ratio)
      const b = Math.round(color1[2] + (color2[2] - color1[2]) * ratio)

      pdf.setFillColor(r, g, b)
      pdf.rect(x, y + (i * height) / steps, width, height / steps, 'F')
    }
  }

  const addSection = (
    title: string,
    y: number,
    withBackground: boolean = true
  ): number => {
    if (withBackground) {
      // Enhanced section with gradient background
      addGradientBackground(
        10,
        y - 5,
        190,
        12,
        corporateBlue,
        corporateBlueLight
      )

      // Section border with shadow
      drawShadowBorder(10, y - 5, 190, 12, corporateBlue, 0.3)

      // Section title with better typography
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)

      // Add small icon-like element
      pdf.setFillColor(accentGold[0], accentGold[1], accentGold[2])
      pdf.circle(18, y + 1, 1.5, 'F')

      pdf.text(formatTurkishText(title.toUpperCase()), 22, y + 2)
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

  const addEnhancedMetricCard = (
    x: number,
    y: number,
    width: number,
    height: number,
    value: string,
    label: string,
    color: number[],
    icon?: string
  ) => {
    // Card shadow
    pdf.setFillColor(180, 180, 180)
    pdf.rect(x + 1, y + 1, width, height, 'F')

    // Gradient background for card
    addGradientBackground(x, y, width, height, color, [
      Math.min(255, color[0] + 40),
      Math.min(255, color[1] + 40),
      Math.min(255, color[2] + 40),
    ])

    // Card border with enhanced styling
    pdf.setDrawColor(255, 255, 255)
    pdf.setLineWidth(1.2)
    pdf.rect(x, y, width, height)

    // Inner accent line
    pdf.setDrawColor(color[0] - 30, color[1] - 30, color[2] - 30)
    pdf.setLineWidth(0.5)
    pdf.line(x + 2, y + height - 2, x + width - 2, y + height - 2)

    // Icon area (top corner)
    if (icon) {
      pdf.setFillColor(255, 255, 255)
      pdf.circle(x + width - 6, y + 6, 3, 'F')
      pdf.setTextColor(color[0], color[1], color[2])
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text(icon, x + width - 8, y + 8)
    }

    // Value (large number) - enhanced typography
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(24)
    const valueWidth = pdf.getTextWidth(value)
    pdf.text(value, x + (width - valueWidth) / 2, y + height / 2 - 1)

    // Small decorative line under value
    pdf.setDrawColor(255, 255, 255)
    pdf.setLineWidth(0.8)
    pdf.line(x + 8, y + height / 2 + 2, x + width - 8, y + height / 2 + 2)

    // Label (smaller text) - enhanced positioning
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    const labelText = formatTurkishText(label)
    const labelWidth = pdf.getTextWidth(labelText)
    pdf.text(labelText, x + (width - labelWidth) / 2, y + height - 3)

    pdf.setTextColor(darkText[0], darkText[1], darkText[2])
  }

  const addInfoRow = (
    label: string,
    value: string,
    y: number,
    isBold: boolean = false,
    highlight: boolean = false
  ): number => {
    // Highlight background for important rows
    if (highlight) {
      pdf.setFillColor(255, 248, 225)
      pdf.rect(13, y - 3, 184, 8, 'F')
    }

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(corporateGray[0], corporateGray[1], corporateGray[2])
    pdf.text(formatTurkishText(label + ':'), 15, y)

    pdf.setFont('helvetica', isBold ? 'bold' : 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(darkText[0], darkText[1], darkText[2])

    // Enhanced text wrapping with better spacing
    const maxWidth = 120
    const wrappedText = pdf.splitTextToSize(formatTurkishText(value), maxWidth)
    pdf.text(wrappedText, 70, y)

    return y + wrappedText.length * 6 + 2
  }

  // ENHANCED DOCUMENT HEADER - PROFESSIONAL LETTERHEAD
  // Main header gradient
  addGradientBackground(0, 0, 210, 35, corporateBlue, corporateBlueLight)

  // Decorative top accent line
  pdf.setFillColor(accentGold[0], accentGold[1], accentGold[2])
  pdf.rect(0, 0, 210, 2, 'F')

  // Enhanced Company Logo Area with better styling
  pdf.setFillColor(255, 255, 255)
  pdf.rect(15, 8, 25, 20, 'F')
  pdf.setDrawColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.setLineWidth(2)
  pdf.rect(15, 8, 25, 20)

  // Logo placeholder with better design
  pdf.setTextColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.text('LOGO', 21, 19)

  // Decorative elements around logo
  pdf.setDrawColor(accentGold[0], accentGold[1], accentGold[2])
  pdf.setLineWidth(1)
  pdf.line(16, 9, 39, 9)
  pdf.line(16, 27, 39, 27)

  // Enhanced Document Title with better typography
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.text(formatTurkishText('PROJE YONETIM RAPORU'), 50, 18)

  // Subtitle with accent color
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(230, 230, 230)
  pdf.text(formatTurkishText('Kurumsal Proje Takip Sistemi'), 50, 26)

  // Enhanced Date and Reference section with better layout
  const currentDate = new Date().toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Date/Reference background
  pdf.setFillColor(255, 255, 255)
  pdf.rect(135, 12, 70, 16, 'F')
  pdf.setDrawColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.setLineWidth(0.8)
  pdf.rect(135, 12, 70, 16)

  pdf.setTextColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text(formatTurkishText('RAPOR TARIHI'), 140, 17)
  pdf.text(formatTurkishText('REFERANS NO'), 140, 25)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(formatTurkishText(currentDate), 170, 17)
  pdf.text(formatTurkishText(`PRJ-${data.project.id.toUpperCase()}`), 170, 25)

  pdf.setTextColor(darkText[0], darkText[1], darkText[2])
  yPosition = 50

  // ENHANCED PROJECT IDENTIFICATION SECTION
  // Background with subtle pattern
  pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2])
  pdf.rect(10, yPosition - 5, 190, 25, 'F')

  // Accent border
  pdf.setFillColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.rect(10, yPosition - 5, 4, 25, 'F')

  drawShadowBorder(10, yPosition - 5, 190, 25, corporateBlue, 0.5)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.text(
    formatTurkishText(`PROJE ADI: ${data.project.name.toUpperCase()}`),
    18,
    yPosition + 5
  )

  // Enhanced status indicator
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  const statusText =
    data.project.status === 'COMPLETED'
      ? 'TAMAMLANDI'
      : data.project.status === 'IN_PROGRESS'
      ? 'DEVAM EDIYOR'
      : data.project.status === 'TODO'
      ? 'BASLAMADI'
      : data.project.status

  const statusColor =
    data.project.status === 'COMPLETED'
      ? successGreen
      : data.project.status === 'IN_PROGRESS'
      ? warningOrange
      : data.project.status === 'TODO'
      ? dangerRed
      : corporateGray

  // Status badge
  pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  pdf.rect(15, yPosition + 12, 35, 6, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text(formatTurkishText(`DURUM: ${statusText}`), 17, yPosition + 16)

  pdf.setTextColor(darkText[0], darkText[1], darkText[2])
  yPosition += 35

  // ENHANCED EXECUTIVE SUMMARY - KEY METRICS
  yPosition = addSection('YONETICI OZETI', yPosition)

  // Enhanced Metric Cards with icons and better styling
  const cardY = yPosition + 5
  const cardWidth = 42
  const cardHeight = 28
  const cardSpacing = 4

  // Total Tasks Card with icon
  addEnhancedMetricCard(
    15,
    cardY,
    cardWidth,
    cardHeight,
    data.totalTasks.toString(),
    'TOPLAM GOREV',
    corporateGray,
    '∑'
  )

  // Completed Tasks Card with checkmark icon
  addEnhancedMetricCard(
    15 + cardWidth + cardSpacing,
    cardY,
    cardWidth,
    cardHeight,
    data.completedTasks.toString(),
    'TAMAMLANAN',
    successGreen,
    '✓'
  )

  // In Progress Tasks Card with clock icon
  addEnhancedMetricCard(
    15 + 2 * (cardWidth + cardSpacing),
    cardY,
    cardWidth,
    cardHeight,
    data.inProgressTasks.toString(),
    'DEVAM EDEN',
    warningOrange,
    '⟳'
  )

  // Pending Tasks Card with pause icon
  addEnhancedMetricCard(
    15 + 3 * (cardWidth + cardSpacing),
    cardY,
    cardWidth,
    cardHeight,
    data.todoTasks.toString(),
    'BEKLEYEN',
    dangerRed,
    '⏸'
  )

  yPosition += cardHeight + 20

  // ENHANCED Progress Bar with Professional Styling
  const progressBarY = yPosition
  const progressBarWidth = 150
  const progressBarHeight = 14
  const progressFill = (data.completionPercentage / 100) * progressBarWidth

  // Progress bar label with icon
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])

  // Progress icon
  pdf.setFillColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.circle(12, progressBarY - 2, 2, 'F')

  pdf.text(formatTurkishText('PROJE TAMAMLANMA ORANI'), 18, progressBarY - 5)

  // Enhanced progress bar with shadow and gradient
  // Shadow
  pdf.setFillColor(200, 200, 200)
  pdf.rect(16, progressBarY + 4, progressBarWidth, progressBarHeight, 'F')

  // Progress bar background with rounded appearance
  pdf.setFillColor(borderGray[0], borderGray[1], borderGray[2])
  pdf.rect(15, progressBarY + 3, progressBarWidth, progressBarHeight, 'F')

  // Progress bar border
  drawShadowBorder(
    15,
    progressBarY + 3,
    progressBarWidth,
    progressBarHeight,
    corporateGray,
    0
  )

  // Enhanced progress bar fill with gradient
  const progressColor =
    data.completionPercentage >= 80
      ? successGreen
      : data.completionPercentage >= 50
      ? warningOrange
      : dangerRed

  if (progressFill > 0) {
    addGradientBackground(
      15,
      progressBarY + 3,
      progressFill,
      progressBarHeight,
      progressColor,
      [
        Math.min(255, progressColor[0] + 50),
        Math.min(255, progressColor[1] + 50),
        Math.min(255, progressColor[2] + 50),
      ]
    )
  }

  // Progress percentage with enhanced styling
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(progressColor[0], progressColor[1], progressColor[2])

  // Percentage background circle
  pdf.setFillColor(255, 255, 255)
  pdf.circle(185, progressBarY + 10, 8, 'F')
  pdf.setDrawColor(progressColor[0], progressColor[1], progressColor[2])
  pdf.setLineWidth(1)
  pdf.circle(185, progressBarY + 10, 8, 'S')

  pdf.text(`%${data.completionPercentage}`, 175, progressBarY + 12)
  pdf.setTextColor(darkText[0], darkText[1], darkText[2])
  yPosition += 35

  // ENHANCED PROJECT INFORMATION TABLE
  yPosition = addSection('PROJE BILGILERI', yPosition)

  // Calculate proper box height based on content
  let estimatedHeight = 55
  if (data.project.description && data.project.description.length > 60) {
    estimatedHeight += 10
  }

  // Enhanced information box with gradient and shadow
  pdf.setFillColor(200, 200, 200)
  pdf.rect(11, yPosition - 4, 190, estimatedHeight, 'F')

  addGradientBackground(
    10,
    yPosition - 5,
    190,
    estimatedHeight,
    lightGray,
    [255, 255, 255]
  )
  drawShadowBorder(10, yPosition - 5, 190, estimatedHeight, corporateBlue, 0)

  let infoY = yPosition + 3

  if (data.project.description) {
    const shortDesc =
      data.project.description.length > 80
        ? data.project.description.substring(0, 77) + '...'
        : data.project.description
    infoY = addInfoRow('PROJE ACIKLAMASI', shortDesc, infoY, false, true)
    infoY += 2
  }

  if (data.project.startDate) {
    infoY = addInfoRow(
      'BASLANGIC TARIHI',
      data.project.startDate.toLocaleDateString('tr-TR'),
      infoY
    )
  }

  if (data.project.endDate) {
    infoY = addInfoRow(
      'HEDEFLENEN BITIS TARIHI',
      data.project.endDate.toLocaleDateString('tr-TR'),
      infoY
    )
  }

  infoY = addInfoRow(
    'TOPLAM TAHMINI SURE',
    `${data.totalEstimatedHours} saat`,
    infoY
  )
  infoY = addInfoRow(
    'TOPLAM HARCANAN SURE',
    `${data.totalActualHours} saat`,
    infoY
  )

  // Enhanced efficiency calculation with visual indicators
  const efficiency =
    data.totalEstimatedHours > 0
      ? Math.round((data.totalActualHours / data.totalEstimatedHours) * 100)
      : 0
  const efficiencyText =
    efficiency <= 100 ? 'HEDEF DAHILINDE ✓' : 'HEDEF ASIMI ⚠'
  const efficiencyColor = efficiency <= 100 ? successGreen : dangerRed
  pdf.setTextColor(efficiencyColor[0], efficiencyColor[1], efficiencyColor[2])
  infoY = addInfoRow(
    'VERIMLILIK DURUMU',
    `%${efficiency} - ${efficiencyText}`,
    infoY,
    true,
    true
  )
  pdf.setTextColor(darkText[0], darkText[1], darkText[2])

  yPosition += estimatedHeight + 15

  // ENHANCED TASK BREAKDOWN SECTION
  if (data.tasks.length > 0) {
    if (yPosition > 200) {
      pdf.addPage()
      yPosition = 20
    }

    yPosition = addSection('GOREV DETAY ANALIZI', yPosition)

    // Enhanced task table with better styling
    const tableStartY = yPosition
    const colWidths = [8, 65, 25, 20, 25, 25, 22]
    const colX = [10, 18, 83, 108, 128, 153, 178]
    const headers = [
      '#',
      'GOREV ADI',
      'DURUM',
      'ONCELIK',
      'SORUMLU',
      'TAH.SURE',
      'GER.SURE',
    ]

    // Enhanced table header with gradient
    addGradientBackground(
      10,
      tableStartY - 2,
      190,
      8,
      corporateGray,
      corporateBlue
    )
    drawShadowBorder(10, tableStartY - 2, 190, 8, corporateBlue, 0.3)

    // Table headers with better spacing
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    headers.forEach((header, i) => {
      pdf.text(formatTurkishText(header), colX[i] + 1, tableStartY + 3)
    })

    pdf.setTextColor(darkText[0], darkText[1], darkText[2])
    let rowY = tableStartY + 10

    // Enhanced task rows with better visual hierarchy
    data.tasks.slice(0, 15).forEach((task, index) => {
      if (rowY > 270) {
        pdf.addPage()
        rowY = 20
      }

      // Enhanced alternating row colors with subtle gradients
      if (index % 2 === 0) {
        pdf.setFillColor(252, 252, 252)
        pdf.rect(10, rowY - 3, 190, 7, 'F')
      } else {
        pdf.setFillColor(248, 250, 252)
        pdf.rect(10, rowY - 3, 190, 7, 'F')
      }

      // Priority color indicators
      const priorityColor =
        task.priority === 'HIGH'
          ? dangerRed
          : task.priority === 'MEDIUM'
          ? warningOrange
          : successGreen
      pdf.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2])
      pdf.rect(10, rowY - 3, 2, 7, 'F')

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7)

      // Enhanced row data with status icons
      const taskTitle =
        task.title.length > 35
          ? task.title.substring(0, 32) + '...'
          : task.title
      const assignedUser =
        task.assignedUsers.length > 0
          ? task.assignedUsers[0].user.name.split(' ')[0]
          : task.assignedUser
          ? task.assignedUser.name.split(' ')[0]
          : 'Yok'

      const statusIcon =
        task.status === 'COMPLETED'
          ? '✓'
          : task.status === 'IN_PROGRESS'
          ? '⟳'
          : task.status === 'TODO'
          ? '○'
          : '⚠'

      const rowData = [
        (index + 1).toString(),
        taskTitle,
        `${statusIcon} ${
          task.status === 'COMPLETED'
            ? 'TAMAM'
            : task.status === 'IN_PROGRESS'
            ? 'DEVAM'
            : task.status === 'TODO'
            ? 'BEKLE'
            : task.status
        }`,
        task.priority === 'HIGH'
          ? '● YUKSEK'
          : task.priority === 'MEDIUM'
          ? '● ORTA'
          : task.priority === 'LOW'
          ? '● DUSUK'
          : task.priority,
        assignedUser,
        `${task.estimatedHours || 0}h`,
        `${task.actualHours || 0}h`,
      ]

      rowData.forEach((data, i) => {
        if (i === 2) {
          // Status column
          pdf.setTextColor(
            task.status === 'COMPLETED'
              ? successGreen[0]
              : task.status === 'IN_PROGRESS'
              ? warningOrange[0]
              : dangerRed[0],
            task.status === 'COMPLETED'
              ? successGreen[1]
              : task.status === 'IN_PROGRESS'
              ? warningOrange[1]
              : dangerRed[1],
            task.status === 'COMPLETED'
              ? successGreen[2]
              : task.status === 'IN_PROGRESS'
              ? warningOrange[2]
              : dangerRed[2]
          )
        } else if (i === 3) {
          // Priority column
          pdf.setTextColor(priorityColor[0], priorityColor[1], priorityColor[2])
        } else {
          pdf.setTextColor(darkText[0], darkText[1], darkText[2])
        }

        pdf.text(formatTurkishText(data), colX[i] + 1, rowY)
      })

      rowY += 7
    })

    // Enhanced table border
    drawShadowBorder(
      10,
      tableStartY - 2,
      190,
      rowY - tableStartY + 2,
      corporateBlue,
      0.5
    )

    if (data.tasks.length > 15) {
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(8)
      pdf.setTextColor(corporateGray[0], corporateGray[1], corporateGray[2])

      // Note background
      pdf.setFillColor(255, 248, 225)
      pdf.rect(10, rowY + 5, 190, 8, 'F')

      pdf.text(
        formatTurkishText(
          `📋 Not: ${data.tasks.length} gorevden ilk 15'i gosterilmektedir.`
        ),
        15,
        rowY + 10
      )
      pdf.setTextColor(darkText[0], darkText[1], darkText[2])
    }

    yPosition = rowY + 20
  }

  // ENHANCED TEAM COMPOSITION SECTION
  if (data.allUsers && data.allUsers.length > 0) {
    if (yPosition > 220) {
      pdf.addPage()
      yPosition = 20
    }

    yPosition = addSection('EKIP KOMPOZISYONU', yPosition)

    // Enhanced department breakdown
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

      // Enhanced department header with icons and better colors
      const deptColors = [
        corporateBlue,
        accentBlue,
        successGreen,
        warningOrange,
        dangerRed,
        corporateGray,
        accentGold,
      ]
      const deptColor = deptColors[deptIndex % deptColors.length]

      // Department header with gradient and shadow
      pdf.setFillColor(200, 200, 200)
      pdf.rect(16, yPosition - 1, 180, 8, 'F')

      addGradientBackground(15, yPosition - 2, 180, 8, deptColor, [
        Math.min(255, deptColor[0] + 40),
        Math.min(255, deptColor[1] + 40),
        Math.min(255, deptColor[2] + 40),
      ])

      drawShadowBorder(15, yPosition - 2, 180, 8, deptColor, 0.3)

      // Department icon
      const deptIcons = ['💻', '🎨', '⚙️', '🔧', '📊', '🏢', '👥']
      const deptIcon = deptIcons[deptIndex % deptIcons.length]

      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.text(
        formatTurkishText(
          `${deptIcon} ${department.toUpperCase()} (${users.length} KISI)`
        ),
        20,
        yPosition + 3
      )

      pdf.setTextColor(darkText[0], darkText[1], darkText[2])
      yPosition += 12

      // Enhanced team members layout with better visual hierarchy
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      const membersPerRow = 2

      users.forEach((user, index) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }

        const col = index % membersPerRow
        const xPos = 25 + col * 85

        if (col === 0 && index > 0) {
          yPosition += 5
        }

        // Member background
        pdf.setFillColor(250, 250, 250)
        pdf.rect(xPos - 2, yPosition - 2, 80, 4, 'F')

        // Member bullet with color
        pdf.setFillColor(deptColor[0], deptColor[1], deptColor[2])
        pdf.circle(xPos + 1, yPosition, 0.8, 'F')

        pdf.setTextColor(darkText[0], darkText[1], darkText[2])
        pdf.text(
          formatTurkishText(`${user.name} - ${user.position}`),
          xPos + 4,
          yPosition
        )

        if (col === membersPerRow - 1 || index === users.length - 1) {
          yPosition += 5
        }
      })

      yPosition += 8
    })
  }

  // ENHANCED DOCUMENT FOOTER WITH SIGNATURES
  const finalPageCount = pdf.internal.getNumberOfPages()

  // Add enhanced signature section on last page
  pdf.setPage(finalPageCount)
  const footerY = 245

  // Signature section background
  pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2])
  pdf.rect(10, footerY - 5, 190, 25, 'F')
  drawShadowBorder(10, footerY - 5, 190, 25, corporateBlue, 0.3)

  // Enhanced signature boxes
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.text(formatTurkishText('HAZIRLAYAN'), 30, footerY)
  pdf.text(formatTurkishText('ONAYLAYAN'), 130, footerY)

  // Enhanced signature lines with decorative elements
  pdf.setLineWidth(1)
  pdf.setDrawColor(corporateBlue[0], corporateBlue[1], corporateBlue[2])
  pdf.line(20, footerY + 15, 80, footerY + 15)
  pdf.line(120, footerY + 15, 180, footerY + 15)

  // Decorative corners
  pdf.circle(20, footerY + 15, 1, 'F')
  pdf.circle(80, footerY + 15, 1, 'F')
  pdf.circle(120, footerY + 15, 1, 'F')
  pdf.circle(180, footerY + 15, 1, 'F')

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(corporateGray[0], corporateGray[1], corporateGray[2])
  pdf.text(formatTurkishText('Proje Koordinatoru'), 35, footerY + 20)
  pdf.text(formatTurkishText('Proje Muduru'), 140, footerY + 20)

  // Enhanced document footer on all pages
  for (let i = 1; i <= finalPageCount; i++) {
    pdf.setPage(i)

    // Enhanced footer with gradient line
    addGradientBackground(10, 278, 190, 2, corporateBlue, corporateBlueLight)

    // Footer background
    pdf.setFillColor(250, 250, 250)
    pdf.rect(10, 280, 190, 15, 'F')

    // Footer text with better layout
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(corporateGray[0], corporateGray[1], corporateGray[2])

    pdf.text(formatTurkishText('🏢 Kurumsal Proje Yonetim Sistemi'), 15, 285)
    pdf.text(formatTurkishText(`📄 Sayfa ${i} / ${finalPageCount}`), 90, 285)
    pdf.text(
      formatTurkishText(`🕒 ${new Date().toLocaleString('tr-TR')}`),
      140,
      285
    )

    // Enhanced confidentiality notice
    pdf.setFillColor(dangerRed[0], dangerRed[1], dangerRed[2])
    pdf.rect(15, 288, 60, 4, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6)
    pdf.text(
      formatTurkishText('🔒 GIZLI - Sadece yetkili personel icin'),
      17,
      290
    )
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
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF oluşturulurken hata:', error)

    // Generate error PDF instead of returning JSON error
    try {
      const errorData: ProjectDetailsData = {
        project: {
          id: 'error',
          name: 'Hata - PDF Oluşturulamadı',
          description:
            'Veritabanı bağlantısı veya diğer bir hata nedeniyle PDF oluşturulamadı.',
          status: 'ERROR',
          startDate: new Date(),
          endDate: new Date(),
          createdAt: new Date(),
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
        completionPercentage: 0,
      }

      const errorPdf = generateCorporateProjectPDF(errorData)
      const errorPdfBuffer = errorPdf.output('arraybuffer')

      return new NextResponse(errorPdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="hata-raporu.pdf"',
        },
      })
    } catch (pdfError) {
      return NextResponse.json({ error: 'PDF oluşturulamadı' }, { status: 500 })
    }
  }
}
