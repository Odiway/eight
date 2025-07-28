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

function generateCleanProjectPDF(data: ProjectDetailsData): jsPDF {
  const pdf = new jsPDF()
  let yPosition = 20

  // Header
  pdf.setFontSize(20)
  pdf.text(formatTurkishText('Proje Detay Raporu'), 20, yPosition)
  yPosition += 15

  pdf.setFontSize(12)
  pdf.text(formatTurkishText(`Proje: ${data.project.name}`), 20, yPosition)
  yPosition += 8
  pdf.text(formatTurkishText(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 20, yPosition)
  yPosition += 20

  // Project Statistics
  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Proje Istatistikleri'), 20, yPosition)
  yPosition += 15

  pdf.setFontSize(10)
  pdf.text(formatTurkishText(`Toplam Gorev: ${data.totalTasks}`), 25, yPosition)
  yPosition += 8
  pdf.text(formatTurkishText(`Tamamlanan: ${data.completedTasks}`), 25, yPosition)
  yPosition += 8
  pdf.text(formatTurkishText(`Devam Eden: ${data.inProgressTasks}`), 25, yPosition)
  yPosition += 8
  pdf.text(formatTurkishText(`Yapilacak: ${data.todoTasks}`), 25, yPosition)
  yPosition += 8
  pdf.text(formatTurkishText(`Tamamlanma Orani: %${data.completionPercentage}`), 25, yPosition)
  yPosition += 20

  // Project Details
  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Proje Bilgileri'), 20, yPosition)
  yPosition += 15

  pdf.setFontSize(10)
  pdf.text(formatTurkishText(`Durum: ${data.project.status}`), 25, yPosition)
  yPosition += 8
  
  if (data.project.description) {
    const desc = data.project.description.length > 80 ? 
      data.project.description.substring(0, 80) + '...' : data.project.description
    pdf.text(formatTurkishText(`Aciklama: ${desc}`), 25, yPosition)
    yPosition += 8
  }
  
  if (data.project.startDate) {
    pdf.text(formatTurkishText(`Baslangic: ${data.project.startDate.toLocaleDateString('tr-TR')}`), 25, yPosition)
    yPosition += 8
  }
  
  if (data.project.endDate) {
    pdf.text(formatTurkishText(`Bitis: ${data.project.endDate.toLocaleDateString('tr-TR')}`), 25, yPosition)
    yPosition += 8
  }
  yPosition += 15

  // Task Details
  if (data.tasks.length > 0) {
    if (yPosition > 250) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(14)
    pdf.text(formatTurkishText('Gorev Detaylari'), 20, yPosition)
    yPosition += 15

    data.tasks.slice(0, 10).forEach((task, index) => {
      if (yPosition > 260) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setFontSize(10)
      const title = task.title.length > 40 ? task.title.substring(0, 40) + '...' : task.title
      pdf.text(formatTurkishText(`${index + 1}. ${title}`), 25, yPosition)
      yPosition += 8
      pdf.text(formatTurkishText(`   Durum: ${task.status} | Oncelik: ${task.priority}`), 25, yPosition)
      yPosition += 8
      
      // Show all assigned users instead of just the primary one
      if (task.assignedUsers && task.assignedUsers.length > 0) {
        pdf.text(formatTurkishText(`   Atanan Kullanicilar:`), 25, yPosition)
        yPosition += 6
        task.assignedUsers.forEach((assignment, userIndex) => {
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = 20
          }
          const userInfo = `     ${userIndex + 1}. ${assignment.user.name} - ${assignment.user.department} (${assignment.user.position})`
          pdf.text(formatTurkishText(userInfo), 25, yPosition)
          yPosition += 6
        })
      } else if (task.assignedUser) {
        pdf.text(formatTurkishText(`   Sorumlu: ${task.assignedUser.name}`), 25, yPosition)
        yPosition += 6
      } else {
        pdf.text(formatTurkishText(`   Sorumlu: Atanmamis`), 25, yPosition)
        yPosition += 6
      }
      
      // Add estimated and actual hours if available
      if (task.estimatedHours || task.actualHours) {
        const hoursText = `   Tahmini: ${task.estimatedHours || 0}h | Gerceklesen: ${task.actualHours || 0}h`
        pdf.text(formatTurkishText(hoursText), 25, yPosition)
        yPosition += 6
      }
      
      yPosition += 8
    })

    if (data.tasks.length > 10) {
      pdf.setFontSize(8)
      pdf.text(formatTurkishText(`Not: Toplam ${data.tasks.length} gorevden ilk 10'u gosterilmektedir.`), 25, yPosition)
    }
  }

  // Add a section showing all project users
  if (data.allUsers && data.allUsers.length > 0) {
    if (yPosition > 220) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(14)
    pdf.text(formatTurkishText('Proje Ekibi'), 20, yPosition)
    yPosition += 15

    pdf.setFontSize(10)
    pdf.text(formatTurkishText(`Toplam ${data.allUsers.length} kullanici sistemde kayitli:`), 25, yPosition)
    yPosition += 10

    data.allUsers.forEach((user, index) => {
      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 20
      }
      const userInfo = `${index + 1}. ${user.name} - ${user.department} (${user.position})`
      pdf.text(formatTurkishText(userInfo), 25, yPosition)
      yPosition += 8
    })
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
    const pdf = generateCleanProjectPDF(data)
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
      
      const errorPdf = generateCleanProjectPDF(errorData)
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
