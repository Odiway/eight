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
  checkPageBreak 
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
    throw error
  }
}

function generateCleanProjectPDF(data: ProjectDetailsData): jsPDF {
  const doc = new jsPDF()
  setupTurkishPDF(doc)
  
  let yPosition = 30

  // Professional Header
  addProfessionalHeader(doc, 'Proje Detay Raporu')
  yPosition = 50

  // Project Basic Information
  addSectionHeader(doc, 'Proje Bilgileri', yPosition)
  yPosition += 20

  addTurkishText(doc, `Proje Adı: ${data.project.name}`, 20, yPosition, { fontSize: 14, fontStyle: 'bold' })
  yPosition += 10

  if (data.project.description) {
    const description = data.project.description.length > 80 
      ? data.project.description.substring(0, 80) + '...' 
      : data.project.description
    addTurkishText(doc, `Açıklama: ${description}`, 20, yPosition, { fontSize: 10 })
    yPosition += 10
  }

  addTurkishText(doc, `Durum: ${data.project.status}`, 20, yPosition, { fontSize: 10 })
  yPosition += 8

  if (data.project.startDate) {
    addTurkishText(doc, `Başlangıç: ${data.project.startDate.toLocaleDateString('tr-TR')}`, 20, yPosition, { fontSize: 10 })
    yPosition += 8
  }

  if (data.project.endDate) {
    addTurkishText(doc, `Bitiş: ${data.project.endDate.toLocaleDateString('tr-TR')}`, 20, yPosition, { fontSize: 10 })
    yPosition += 8
  }

  yPosition += 10

  // Project Statistics
  addSectionHeader(doc, 'Proje İstatistikleri', yPosition)
  yPosition += 20

  // Stats boxes
  const statsData = [
    { label: 'Toplam Görev', value: data.totalTasks.toString(), x: 20 },
    { label: 'Tamamlanan', value: data.completedTasks.toString(), x: 70 },
    { label: 'Devam Eden', value: data.inProgressTasks.toString(), x: 120 },
    { label: 'Tamamlanma', value: `%${data.completionPercentage}`, x: 170 }
  ]

  // Stats boxes - using simple text instead of complex addStatsBox
  statsData.forEach((stat, index) => {
    const x = stat.x
    const y = yPosition
    
    // Simple box with border
    doc.setDrawColor(200, 200, 200)
    doc.rect(x, y, 40, 25)
    
    addTurkishText(doc, stat.value, x + 20, y + 10, { fontSize: 14, fontStyle: 'bold', align: 'center' })
    addTurkishText(doc, stat.label, x + 20, y + 20, { fontSize: 8, align: 'center' })
  })

  yPosition += 35

  yPosition = checkPageBreak(doc, yPosition, 60)

  // Task Summary Table
  addSectionHeader(doc, 'Görev Özeti', yPosition)
  yPosition += 20

  const taskSummaryData = [
    ['Durum', 'Görev Sayısı', 'Yüzde'],
    ['Yapılacak', data.todoTasks.toString(), `%${data.totalTasks > 0 ? Math.round((data.todoTasks / data.totalTasks) * 100) : 0}`],
    ['Devam Eden', data.inProgressTasks.toString(), `%${data.totalTasks > 0 ? Math.round((data.inProgressTasks / data.totalTasks) * 100) : 0}`],
    ['Tamamlanan', data.completedTasks.toString(), `%${data.completionPercentage}`],
    ['Engellenen', data.blockedTasks.toString(), `%${data.totalTasks > 0 ? Math.round((data.blockedTasks / data.totalTasks) * 100) : 0}`]
  ]

  // Task Summary Table - using simple manual table instead of addSimpleTable
  taskSummaryData.forEach((row, rowIndex) => {
    const y = yPosition + (rowIndex * 8)
    row.forEach((cell, cellIndex) => {
      const x = 20 + (cellIndex * 50)
      const isHeader = rowIndex === 0
      addTurkishText(doc, cell, x, y, { 
        fontSize: isHeader ? 10 : 9, 
        fontStyle: isHeader ? 'bold' : 'normal' 
      })
    })
  })
  yPosition += (taskSummaryData.length * 8) + 20

  yPosition = checkPageBreak(doc, yPosition, 60)

  // Work Hours Summary
  if (data.totalEstimatedHours > 0 || data.totalActualHours > 0) {
    addSectionHeader(doc, 'Çalışma Saatleri', yPosition)
    yPosition += 20

    addTurkishText(doc, `Tahmini Toplam Saat: ${data.totalEstimatedHours}`, 20, yPosition, { fontSize: 12 })
    yPosition += 10

    addTurkishText(doc, `Gerçekleşen Toplam Saat: ${data.totalActualHours}`, 20, yPosition, { fontSize: 12 })
    yPosition += 10

    if (data.totalEstimatedHours > 0) {
      const efficiencyPercentage = Math.round((data.totalActualHours / data.totalEstimatedHours) * 100)
      addTurkishText(doc, `Verimlilik Oranı: %${efficiencyPercentage}`, 20, yPosition, { fontSize: 12, fontStyle: 'bold' })
      yPosition += 15
    }
  }

  yPosition = checkPageBreak(doc, yPosition, 80)

  // Task Details (limited to first 10 tasks for space)
  if (data.tasks.length > 0) {
    addSectionHeader(doc, 'Görev Detayları', yPosition)
    yPosition += 20

    const tasksToShow = data.tasks.slice(0, 10)
    
    tasksToShow.forEach((task, index) => {
      yPosition = checkPageBreak(doc, yPosition, 40)

      addTurkishText(doc, `${index + 1}. ${task.title}`, 20, yPosition, { fontSize: 11, fontStyle: 'bold' })
      yPosition += 8

      addTurkishText(doc, `Durum: ${getStatusText(task.status)}  |  Öncelik: ${getPriorityText(task.priority)}`, 25, yPosition, { fontSize: 9 })
      yPosition += 6

      if (task.assignedUser) {
        addTurkishText(doc, `Sorumlu: ${task.assignedUser.name}`, 25, yPosition, { fontSize: 9 })
        yPosition += 6
      }

      if (task.estimatedHours) {
        addTurkishText(doc, `Tahmini Süre: ${task.estimatedHours} saat`, 25, yPosition, { fontSize: 9 })
        yPosition += 6
      }

      if (task.endDate) {
        addTurkishText(doc, `Bitiş Tarihi: ${task.endDate.toLocaleDateString('tr-TR')}`, 25, yPosition, { fontSize: 9 })
        yPosition += 6
      }

      yPosition += 8
    })

    if (data.tasks.length > 10) {
      yPosition += 10
      addTurkishText(doc, `... ve ${data.tasks.length - 10} görev daha`, 20, yPosition, { fontSize: 10, fontStyle: 'italic' })
    }
  }

  // Professional Footer - using simple footer
  const pageHeight = doc.internal.pageSize.height
  addTurkishText(doc, `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, pageHeight - 20, { fontSize: 8 })
  addTurkishText(doc, 'Sayfa 1', 170, pageHeight - 20, { fontSize: 8 })

  return doc
}

function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'TODO': 'Yapılacak',
    'IN_PROGRESS': 'Devam Ediyor',
    'REVIEW': 'İncelemede',
    'COMPLETED': 'Tamamlandı',
    'BLOCKED': 'Engellenmiş'
  }
  return statusMap[status] || status
}

function getPriorityText(priority: string): string {
  const priorityMap: { [key: string]: string } = {
    'LOW': 'Düşük',
    'MEDIUM': 'Orta',
    'HIGH': 'Yüksek',
    'URGENT': 'Acil'
  }
  return priorityMap[priority] || priority
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

    const data = await getProjectData(projectId)
    const pdf = generateCleanProjectPDF(data)
    const pdfBuffer = pdf.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proje-raporu-${data.project.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`
      }
    })
  } catch (error) {
    console.error('PDF oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'PDF oluşturulamadı' }, 
      { status: 500 }
    )
  }
}
