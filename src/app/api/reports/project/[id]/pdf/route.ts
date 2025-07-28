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
  const pdf = new jsPDF()
  let yPosition = 20

  // Define colors and styling
  const primaryColor = [13, 110, 253] // Bootstrap primary blue
  const secondaryColor = [108, 117, 125] // Bootstrap secondary gray
  const successColor = [25, 135, 84] // Bootstrap success green
  const warningColor = [255, 193, 7] // Bootstrap warning yellow
  const dangerColor = [220, 53, 69] // Bootstrap danger red
  const lightGray = [248, 249, 250]

  // Helper function to add colored background
  const addColoredBackground = (x: number, y: number, width: number, height: number, color: number[]) => {
    pdf.setFillColor(color[0], color[1], color[2])
    pdf.rect(x, y - height + 2, width, height, 'F')
  }

  // Helper function for section headers
  const addSectionHeader = (title: string, y: number): number => {
    addColoredBackground(15, y + 8, 180, 12, primaryColor)
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text(formatTurkishText(title), 20, y + 5)
    pdf.setTextColor(0, 0, 0) // Reset to black
    return y + 20
  }

  // Main Header with Company Branding
  addColoredBackground(10, 25, 190, 25, primaryColor)
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(22)
  pdf.setFont('helvetica', 'bold')
  pdf.text(formatTurkishText('PROJE DETAY RAPORU'), 20, 20)
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(formatTurkishText('Kurumsal Proje Yonetim Sistemi'), 20, 35)
  pdf.text(formatTurkishText(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`), 140, 35)
  pdf.setTextColor(0, 0, 0) // Reset to black
  yPosition = 55

  // Project Title Box
  addColoredBackground(15, yPosition + 15, 180, 20, lightGray)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text(formatTurkishText(`PROJE: ${data.project.name}`), 20, yPosition + 8)
  yPosition += 35

  // Project Statistics Dashboard
  yPosition = addSectionHeader('PROJE ISTATISTIKLERI', yPosition)

  // Statistics cards layout
  const cardWidth = 42
  const cardHeight = 25
  const cardSpacing = 5
  const startX = 15

  // Total Tasks Card
  addColoredBackground(startX, yPosition + cardHeight, cardWidth, cardHeight, [52, 58, 64])
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.text(data.totalTasks.toString(), startX + 5, yPosition + 8)
  pdf.setFontSize(8)
  pdf.text(formatTurkishText('TOPLAM GOREV'), startX + 5, yPosition + 18)

  // Completed Tasks Card
  addColoredBackground(startX + cardWidth + cardSpacing, yPosition + cardHeight, cardWidth, cardHeight, successColor)
  pdf.text(data.completedTasks.toString(), startX + cardWidth + cardSpacing + 5, yPosition + 8)
  pdf.text(formatTurkishText('TAMAMLANAN'), startX + cardWidth + cardSpacing + 5, yPosition + 18)

  // In Progress Card
  addColoredBackground(startX + 2 * (cardWidth + cardSpacing), yPosition + cardHeight, cardWidth, cardHeight, warningColor)
  pdf.setTextColor(0, 0, 0) // Black text for yellow background
  pdf.text(data.inProgressTasks.toString(), startX + 2 * (cardWidth + cardSpacing) + 5, yPosition + 8)
  pdf.text(formatTurkishText('DEVAM EDEN'), startX + 2 * (cardWidth + cardSpacing) + 5, yPosition + 18)

  // Todo Tasks Card
  addColoredBackground(startX + 3 * (cardWidth + cardSpacing), yPosition + cardHeight, cardWidth, cardHeight, dangerColor)
  pdf.setTextColor(255, 255, 255)
  pdf.text(data.todoTasks.toString(), startX + 3 * (cardWidth + cardSpacing) + 5, yPosition + 8)
  pdf.text(formatTurkishText('YAPILACAK'), startX + 3 * (cardWidth + cardSpacing) + 5, yPosition + 18)

  pdf.setTextColor(0, 0, 0) // Reset to black
  yPosition += 40

  // Progress Bar
  const progressBarWidth = 160
  const progressBarHeight = 8
  const progressFill = (data.completionPercentage / 100) * progressBarWidth

  // Progress bar background
  pdf.setFillColor(233, 236, 239)
  pdf.rect(20, yPosition, progressBarWidth, progressBarHeight, 'F')
  
  // Progress bar fill
  pdf.setFillColor(successColor[0], successColor[1], successColor[2])
  pdf.rect(20, yPosition, progressFill, progressBarHeight, 'F')
  
  // Progress percentage text
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.text(formatTurkishText(`TAMAMLANMA ORANI: %${data.completionPercentage}`), 20, yPosition + 18)
  yPosition += 35

  // Project Information Section
  yPosition = addSectionHeader('PROJE BILGILERI', yPosition)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  
  // Status with colored indicator
  const statusColor = data.project.status === 'COMPLETED' ? successColor : 
                     data.project.status === 'IN_PROGRESS' ? warningColor : 
                     data.project.status === 'TODO' ? dangerColor : secondaryColor
  
  pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  pdf.circle(25, yPosition - 2, 2, 'F')
  pdf.text(formatTurkishText(`Durum: ${data.project.status}`), 30, yPosition)
  yPosition += 10

  if (data.project.description) {
    pdf.text(formatTurkishText('Aciklama:'), 20, yPosition)
    yPosition += 8
    const maxWidth = 170
    const descLines = pdf.splitTextToSize(formatTurkishText(data.project.description), maxWidth)
    pdf.text(descLines, 25, yPosition)
    yPosition += descLines.length * 6 + 5
  }

  if (data.project.startDate) {
    pdf.text(formatTurkishText(`Baslangic Tarihi: ${data.project.startDate.toLocaleDateString('tr-TR')}`), 20, yPosition)
    yPosition += 8
  }

  if (data.project.endDate) {
    pdf.text(formatTurkishText(`Bitis Tarihi: ${data.project.endDate.toLocaleDateString('tr-TR')}`), 20, yPosition)
    yPosition += 8
  }
  yPosition += 15

  // Task Details Section
  if (data.tasks.length > 0) {
    if (yPosition > 230) {
      pdf.addPage()
      yPosition = 20
    }

    yPosition = addSectionHeader('GOREV DETAYLARI', yPosition)

    data.tasks.slice(0, 10).forEach((task, index) => {
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }

      // Task card background
      addColoredBackground(15, yPosition + 35, 180, 35, [249, 250, 251])
      
      // Task number and title
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      const title = task.title.length > 45 ? task.title.substring(0, 45) + '...' : task.title
      pdf.text(formatTurkishText(`${index + 1}. ${title}`), 20, yPosition + 5)

      // Status and priority badges
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      
      // Status badge
      const taskStatusColor = task.status === 'COMPLETED' ? successColor :
                             task.status === 'IN_PROGRESS' ? warningColor :
                             task.status === 'TODO' ? dangerColor : secondaryColor
      addColoredBackground(20, yPosition + 18, 25, 8, taskStatusColor)
      pdf.setTextColor(255, 255, 255)
      pdf.text(task.status, 22, yPosition + 16)

      // Priority badge
      const priorityColor = task.priority === 'URGENT' ? [220, 38, 127] :
                           task.priority === 'HIGH' ? dangerColor :
                           task.priority === 'MEDIUM' ? warningColor :
                           task.priority === 'LOW' ? successColor : secondaryColor
      addColoredBackground(50, yPosition + 18, 25, 8, priorityColor)
      pdf.text(task.priority, 52, yPosition + 16)
      
      pdf.setTextColor(0, 0, 0) // Reset to black
      yPosition += 25

      // Assigned users
      if (task.assignedUsers && task.assignedUsers.length > 0) {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9)
        pdf.text(formatTurkishText('Atanan Kullanicilar:'), 20, yPosition)
        yPosition += 8

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        task.assignedUsers.slice(0, 3).forEach((assignment, userIndex) => {
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = 20
          }
          const userInfo = `• ${assignment.user.name} - ${assignment.user.department} (${assignment.user.position})`
          pdf.text(formatTurkishText(userInfo), 25, yPosition)
          yPosition += 6
        })

        if (task.assignedUsers.length > 3) {
          pdf.setFontSize(8)
          pdf.setTextColor(108, 117, 125)
          pdf.text(formatTurkishText(`+ ${task.assignedUsers.length - 3} diger kullanici`), 25, yPosition)
          pdf.setTextColor(0, 0, 0)
          yPosition += 6
        }
      } else if (task.assignedUser) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.text(formatTurkishText(`Sorumlu: ${task.assignedUser.name}`), 20, yPosition)
        yPosition += 8
      } else {
        pdf.setTextColor(220, 53, 69)
        pdf.text(formatTurkishText('Sorumlu: Atanmamis'), 20, yPosition)
        pdf.setTextColor(0, 0, 0)
        yPosition += 8
      }

      // Hours information
      if (task.estimatedHours || task.actualHours) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        const hoursText = `Tahmini: ${task.estimatedHours || 0}h | Gerceklesen: ${task.actualHours || 0}h`
        pdf.text(formatTurkishText(hoursText), 20, yPosition)
        yPosition += 8
      }

      yPosition += 15
    })

    if (data.tasks.length > 10) {
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(8)
      pdf.setTextColor(108, 117, 125)
      pdf.text(formatTurkishText(`Not: Toplam ${data.tasks.length} gorevden ilk 10'u gosterilmektedir.`), 20, yPosition)
      pdf.setTextColor(0, 0, 0)
      yPosition += 15
    }
  }

  // Project Team Section
  if (data.allUsers && data.allUsers.length > 0) {
    if (yPosition > 200) {
      pdf.addPage()
      yPosition = 20
    }

    yPosition = addSectionHeader('PROJE EKIBI', yPosition)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(formatTurkishText(`Toplam ${data.allUsers.length} kullanici sistemde kayitli:`), 20, yPosition)
    yPosition += 15

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    
    // Group users by department
    const usersByDept = data.allUsers.reduce((acc, user) => {
      if (!acc[user.department]) {
        acc[user.department] = []
      }
      acc[user.department].push(user)
      return acc
    }, {} as Record<string, typeof data.allUsers>)

    Object.entries(usersByDept).forEach(([department, users]) => {
      if (yPosition > 260) {
        pdf.addPage()
        yPosition = 20
      }

      // Department header
      addColoredBackground(15, yPosition + 8, 180, 10, [233, 236, 239])
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.text(formatTurkishText(`${department} (${users.length} kisi)`), 20, yPosition + 5)
      yPosition += 15

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      users.forEach((user, index) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(formatTurkishText(`  ${index + 1}. ${user.name} - ${user.position}`), 25, yPosition)
        yPosition += 6
      })
      yPosition += 5
    })
  }

  // Footer with generation info
  const pageCount = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(108, 117, 125)
    pdf.text(formatTurkishText(`Sayfa ${i}/${pageCount}`), 180, 285)
    pdf.text(formatTurkishText(`Olusturulma: ${new Date().toLocaleString('tr-TR')}`), 20, 285)
    pdf.setTextColor(0, 0, 0)
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
