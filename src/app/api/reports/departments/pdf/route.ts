import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
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

export async function GET(request: NextRequest) {
  try {
    // Get departments data
    const data = await getDepartmentsData()
    
    // Generate clean PDF
    const pdfBuffer = generateCleanDepartmentsPDF(data)

    const filename = `departman-raporu-${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'PDF oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

async function getDepartmentsData() {
  // Get all users with their task assignments
  const users = await prisma.user.findMany({
    include: {
      taskAssignments: {
        include: {
          task: {
            include: {
              project: true,
            },
          },
        },
      },
    },
  })

  // Group by departments
  const departments: Record<string, {
    name: string
    userCount: number
    totalTasks: number
    completedTasks: number
    users: any[]
    projects: Set<string>
  }> = {}

  users.forEach(user => {
    if (!departments[user.department]) {
      departments[user.department] = {
        name: user.department,
        userCount: 0,
        totalTasks: 0,
        completedTasks: 0,
        users: [],
        projects: new Set()
      }
    }

    const dept = departments[user.department]
    dept.userCount++
    dept.totalTasks += user.taskAssignments.length
    dept.completedTasks += user.taskAssignments.filter(
      ta => ta.task.status === 'COMPLETED'
    ).length

    dept.users.push({
      id: user.id,
      name: user.name,
      email: user.email,
      position: user.position,
      totalTasks: user.taskAssignments.length,
      completedTasks: user.taskAssignments.filter(ta => ta.task.status === 'COMPLETED').length
    })

    // Add unique projects
    user.taskAssignments.forEach(ta => {
      dept.projects.add(ta.task.project.id)
    })
  })

  return {
    generatedAt: new Date().toISOString(),
    departments: Object.values(departments).map(dept => ({
      ...dept,
      projectCount: dept.projects.size,
      completionRate: dept.totalTasks > 0 ? Math.round((dept.completedTasks / dept.totalTasks) * 100) : 0
    }))
  }
}

function generateCleanDepartmentsPDF(data: any): Buffer {
  const doc = new jsPDF()
  setupTurkishPDF(doc)

  let currentY = addProfessionalHeader(
    doc, 
    'DEPARTMAN RAPORU', 
    'Departman Bazlı Analiz'
  )

  // Department Summary
  currentY = addSectionHeader(doc, 'DEPARTMAN ÖZETİ', currentY)

  if (data.departments && data.departments.length > 0) {
    const deptRows = data.departments.map((dept: any) => [
      dept.name,
      dept.userCount.toString(),
      dept.totalTasks.toString(),
      dept.completedTasks.toString(),
      `%${dept.completionRate}`,
      dept.projectCount.toString()
    ])

    currentY = addSimpleTable(
      doc,
      ['Departman', 'Kullanıcı', 'Görev', 'Tamamlanan', 'Oran', 'Proje'],
      deptRows,
      currentY,
      { columnWidths: [35, 25, 25, 25, 20, 20], fontSize: 8 }
    )

    // Department Details
    data.departments.forEach((dept: any, deptIndex: number) => {
      if (dept.users && dept.users.length > 0) {
        currentY = checkPageBreak(doc, currentY, 80)
        currentY = addSectionHeader(doc, `${dept.name.toUpperCase()} DEPARTMANI`, currentY)

        // Department stats
        const deptStats = [
          { label: 'Kullanıcı', value: dept.userCount.toString() },
          { label: 'Toplam Görev', value: dept.totalTasks.toString() },
          { label: 'Tamamlanan', value: dept.completedTasks.toString(), color: [34, 197, 94] as [number, number, number] },
          { label: 'Başarı %', value: dept.completionRate.toString(), color: [67, 56, 202] as [number, number, number] }
        ]

        currentY = addStatsBox(doc, deptStats, currentY)

        // Users in department (limit to top 10)
        const userRows = dept.users.slice(0, 10).map((user: any) => [
          user.name.length > 25 ? user.name.substring(0, 25) + '...' : user.name,
          user.position || 'Belirtilmemiş',
          user.totalTasks.toString(),
          user.completedTasks.toString(),
          user.totalTasks > 0 ? `%${Math.round((user.completedTasks / user.totalTasks) * 100)}` : '%0'
        ])

        currentY = checkPageBreak(doc, currentY, 60)
        currentY = addSimpleTable(
          doc,
          ['Kullanıcı', 'Pozisyon', 'Görev', 'Tamamlanan', 'Oran'],
          userRows,
          currentY,
          { columnWidths: [50, 35, 20, 25, 20], fontSize: 8 }
        )

        if (dept.users.length > 10) {
          currentY += 10
          doc.setTextColor(107, 114, 128)
          doc.setFontSize(9)
          addTurkishText(doc, `... ve ${dept.users.length - 10} kullanıcı daha`, 25, currentY)
        }

        currentY += 15
      }
    })
  }

  // Overall Summary
  currentY = checkPageBreak(doc, currentY, 60)
  currentY = addSectionHeader(doc, 'GENEL ÖZET', currentY)

  doc.setTextColor(55, 65, 81)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const totalUsers = data.departments.reduce((sum: number, dept: any) => sum + dept.userCount, 0)
  const totalTasks = data.departments.reduce((sum: number, dept: any) => sum + dept.totalTasks, 0)
  const totalCompleted = data.departments.reduce((sum: number, dept: any) => sum + dept.completedTasks, 0)
  const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0

  const summaryText = [
    `Sistemde ${data.departments.length} departman bulunmaktadır.`,
    `Toplam ${totalUsers} kullanıcı ${totalTasks} görev üzerinde çalışmaktadır.`,
    `${totalCompleted} görev tamamlanmış, genel başarı oranı %${overallRate}'dir.`,
    `Rapor tarihi: ${new Date().toLocaleDateString('tr-TR')}`
  ]

  summaryText.forEach((text, index) => {
    addTurkishText(doc, text, 25, currentY + (index * 12), { maxWidth: 160 })
  })

  // Add footer
  addProfessionalFooter(doc, 1, 1)

  return Buffer.from(doc.output('arraybuffer'))
}
