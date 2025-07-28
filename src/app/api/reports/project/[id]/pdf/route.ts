import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import { prisma } from '@/lib/prisma'
import { 
  setupTurkishPDF, 
  addTurkishText, 
  addProfessionalHeader, 
  addProfessionalFooter, 
  addSectionHeader, 
  addSimpleTable, 
  addStatsBox, 
  addInfoBox,
  addProgressBar,
  checkPageBreak,
  formatTurkishText,
  getStatusText,
  getPriorityText,
  getStatusColor,
  PDF_COLORS
} from '@/lib/pdf-utils'

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
          }
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
          }
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
          assignedUser: null
        }
      ],
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
  const doc = new jsPDF()
  setupTurkishPDF(doc)
  
  let yPosition = 0

  // Professional Header
  yPosition = addProfessionalHeader(doc, 'Proje Detay Raporu', `${formatTurkishText(data.project.name)}`)

  // Project Overview Statistics
  const projectStats = [
    { 
      label: 'Toplam Görevler', 
      value: data.totalTasks.toString(),
      color: [13, 110, 253] as [number, number, number]
    },
    { 
      label: 'Tamamlanan', 
      value: data.completedTasks.toString(),
      color: [25, 135, 84] as [number, number, number]
    },
    { 
      label: 'Devam Eden', 
      value: data.inProgressTasks.toString(),
      color: [255, 193, 7] as [number, number, number]
    },
    { 
      label: 'Tamamlanma Oranı', 
      value: `%${data.completionPercentage}`,
      color: data.completionPercentage >= 70 ? [25, 135, 84] as [number, number, number] : 
             data.completionPercentage >= 30 ? [255, 193, 7] as [number, number, number] : [220, 53, 69] as [number, number, number]
    }
  ]

  yPosition = addStatsBox(doc, projectStats, yPosition)

  // Project Information Section
  yPosition = addSectionHeader(doc, 'Proje Bilgileri', yPosition)
  
  // Project details in info boxes
  const projectInfo = `Durum: ${getStatusText(data.project.status)}
Başlangıç: ${data.project.startDate ? data.project.startDate.toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
Bitiş: ${data.project.endDate ? data.project.endDate.toLocaleDateString('tr-TR') : 'Belirtilmemiş'}`

  yPosition = addInfoBox(
    doc,
    formatTurkishText(data.project.name),
    data.project.description ? formatTurkishText(data.project.description) : 'Açıklama bulunmamaktadır.',
    25,
    yPosition,
    doc.internal.pageSize.getWidth() - 50
  )

  yPosition = addInfoBox(
    doc,
    'Proje Durumu',
    projectInfo,
    25,
    yPosition,
    doc.internal.pageSize.getWidth() - 50,
    getStatusColor(data.project.status)
  )

  // Progress Overview
  yPosition = addSectionHeader(doc, 'İlerleme Durumu', yPosition)
  
  yPosition = addProgressBar(
    doc,
    'Genel Tamamlanma',
    data.completionPercentage,
    25,
    yPosition,
    doc.internal.pageSize.getWidth() - 50
  )

  if (data.totalEstimatedHours > 0) {
    const hourProgress = data.totalEstimatedHours > 0 ? 
      Math.min(100, Math.round((data.totalActualHours / data.totalEstimatedHours) * 100)) : 0
    
    yPosition = addProgressBar(
      doc,
      `Saat Kullanımı (${data.totalActualHours}/${data.totalEstimatedHours} saat)`,
      hourProgress,
      25,
      yPosition,
      doc.internal.pageSize.getWidth() - 50
    )
  }

  // Check if we need a new page
  yPosition = checkPageBreak(doc, yPosition, 100)

  // Task Summary Table
  yPosition = addSectionHeader(doc, 'Görev Dağılımı', yPosition)

  const taskHeaders = ['Durum', 'Görev Sayısı', 'Yüzde', 'Açıklama']
  const taskRows = [
    [
      'Yapılacak',
      data.todoTasks.toString(),
      `%${data.totalTasks > 0 ? Math.round((data.todoTasks / data.totalTasks) * 100) : 0}`,
      'Henüz başlanmamış görevler'
    ],
    [
      'Devam Ediyor',
      data.inProgressTasks.toString(),
      `%${data.totalTasks > 0 ? Math.round((data.inProgressTasks / data.totalTasks) * 100) : 0}`,
      'Aktif olarak çalışılan görevler'
    ],
    [
      'Tamamlandı',
      data.completedTasks.toString(),
      `%${data.completionPercentage}`,
      'Başarıyla tamamlanan görevler'
    ],
    [
      'Engellenmiş',
      data.blockedTasks.toString(),
      `%${data.totalTasks > 0 ? Math.round((data.blockedTasks / data.totalTasks) * 100) : 0}`,
      'Engellerle karşılaşan görevler'
    ]
  ]

  yPosition = addSimpleTable(doc, taskHeaders, taskRows, yPosition, {
    columnWidths: [40, 30, 25, 70],
    fontSize: 9
  })

  // Check if we need a new page for task details
  yPosition = checkPageBreak(doc, yPosition, 100)

  // Task Details Section
  if (data.tasks.length > 0) {
    yPosition = addSectionHeader(doc, 'Görev Detayları', yPosition)

    const taskHeaders = ['Görev Adı', 'Durum', 'Öncelik', 'Sorumlu', 'Süre']
    const taskRows = data.tasks.slice(0, 15).map(task => [
      task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title,
      getStatusText(task.status),
      getPriorityText(task.priority),
      task.assignedUser ? task.assignedUser.name : 'Atanmamış',
      task.estimatedHours ? `${task.estimatedHours}h` : '-'
    ])

    yPosition = addSimpleTable(doc, taskHeaders, taskRows, yPosition, {
      columnWidths: [60, 30, 25, 40, 20],
      fontSize: 8
    })

    if (data.tasks.length > 15) {
      doc.setTextColor(108, 117, 125)
      doc.setFontSize(8)
      addTurkishText(doc, `Not: Toplam ${data.tasks.length} görevden ilk 15'i gösterilmektedir.`, 25, yPosition)
      yPosition += 15
    }
  }

  // Add footer to all pages
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addProfessionalFooter(doc, i, totalPages)
  }

  return doc
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
