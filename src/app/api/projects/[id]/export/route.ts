import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch project data
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignedUsers: {
              include: {
                user: true,
              },
            },
            workflowStep: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        members: {
          include: {
            user: true,
          },
        },
        workflowSteps: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create PDF
    const doc = new jsPDF()
    
    // Set font (use built-in fonts for better compatibility)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Proje Raporu', 20, 30)
    
    // Project basic info
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Proje Bilgileri', 20, 50)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    
    let yPosition = 65
    doc.text(`Proje Adı: ${project.name}`, 20, yPosition)
    yPosition += 10
    
    if (project.description) {
      doc.text(`Açıklama: ${project.description}`, 20, yPosition)
      yPosition += 10
    }
    
    doc.text(`Durum: ${getStatusText(project.status)}`, 20, yPosition)
    yPosition += 10
    
    doc.text(`Öncelik: ${getPriorityText(project.priority)}`, 20, yPosition)
    yPosition += 10
    
    if (project.startDate) {
      doc.text(`Başlangıç: ${new Date(project.startDate).toLocaleDateString('tr-TR')}`, 20, yPosition)
      yPosition += 10
    }
    
    if (project.endDate) {
      doc.text(`Bitiş: ${new Date(project.endDate).toLocaleDateString('tr-TR')}`, 20, yPosition)
      yPosition += 10
    }
    
    yPosition += 10
    
    // Team members
    if (project.members.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('Takım Üyeleri', 20, yPosition)
      yPosition += 15
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      
      project.members.forEach((member) => {
        doc.text(`• ${member.user.name} (${member.user.email})`, 25, yPosition)
        yPosition += 8
      })
      
      yPosition += 10
    }
    
    // Tasks
    if (project.tasks.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('Görevler', 20, yPosition)
      yPosition += 15
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      project.tasks.forEach((task, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 30
        }
        
        doc.setFont('helvetica', 'bold')
        doc.text(`${index + 1}. ${task.title}`, 25, yPosition)
        yPosition += 8
        
        doc.setFont('helvetica', 'normal')
        if (task.description) {
          // Split long descriptions
          const splitDescription = doc.splitTextToSize(`Açıklama: ${task.description}`, 160)
          doc.text(splitDescription, 30, yPosition)
          yPosition += splitDescription.length * 5
        }
        
        doc.text(`Durum: ${getStatusText(task.status)}`, 30, yPosition)
        yPosition += 6
        
        doc.text(`Öncelik: ${getPriorityText(task.priority)}`, 30, yPosition)
        yPosition += 6
        
        if (task.startDate) {
          doc.text(`Başlangıç: ${new Date(task.startDate).toLocaleDateString('tr-TR')}`, 30, yPosition)
          yPosition += 6
        }
        
        if (task.endDate) {
          doc.text(`Bitiş: ${new Date(task.endDate).toLocaleDateString('tr-TR')}`, 30, yPosition)
          yPosition += 6
        }
        
        if (task.assignedUsers.length > 0) {
          const assignees = task.assignedUsers.map(au => au.user.name).join(', ')
          doc.text(`Atananlar: ${assignees}`, 30, yPosition)
          yPosition += 6
        }
        
        if (task.workflowStep) {
          doc.text(`İş Akışı: ${task.workflowStep.name}`, 30, yPosition)
          yPosition += 6
        }
        
        yPosition += 8
      })
    }
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(`${i} / ${pageCount}`, 190, 280)
      doc.text(`Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`, 20, 280)
    }
    
    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proje-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`,
      },
    })
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'PLANNING': return 'Planlama'
    case 'IN_PROGRESS': return 'Devam Ediyor'
    case 'COMPLETED': return 'Tamamlandı'
    case 'ON_HOLD': return 'Beklemede'
    case 'CANCELLED': return 'İptal Edildi'
    default: return status
  }
}

function getPriorityText(priority: string): string {
  switch (priority) {
    case 'LOW': return 'Düşük'
    case 'MEDIUM': return 'Orta'
    case 'HIGH': return 'Yüksek'
    case 'URGENT': return 'Acil'
    default: return priority
  }
}
