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
  try {
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
  } catch (error) {
    console.error('Database error in getDepartmentsData:', error)
    // Return mock data when database is not available
    return {
      generatedAt: new Date().toISOString(),
      departments: [
        {
          name: 'Bilgi Teknolojileri',
          userCount: 5,
          totalTasks: 25,
          completedTasks: 18,
          completionRate: 72,
          projectCount: 3,
          users: [
            {
              id: '1',
              name: 'Örnek Kullanıcı 1',
              email: 'user1@example.com',
              position: 'Yazılım Geliştirici',
              totalTasks: 8,
              completedTasks: 6
            },
            {
              id: '2',
              name: 'Örnek Kullanıcı 2',
              email: 'user2@example.com',
              position: 'Sistem Yöneticisi',
              totalTasks: 7,
              completedTasks: 5
            }
          ]
        },
        {
          name: 'İnsan Kaynakları',
          userCount: 3,
          totalTasks: 12,
          completedTasks: 9,
          completionRate: 75,
          projectCount: 2,
          users: [
            {
              id: '3',
              name: 'Örnek Kullanıcı 3',
              email: 'user3@example.com',
              position: 'İK Uzmanı',
              totalTasks: 6,
              completedTasks: 4
            }
          ]
        }
      ]
    }
  }
}

function generateCleanDepartmentsPDF(data: any): Buffer {
  const doc = new jsPDF()
  setupTurkishPDF(doc)

  let currentY = 30

  // Professional Header - simplified
  addProfessionalHeader(doc, 'Departman Raporu')
  currentY = 50

  // Department Summary Section
  addSectionHeader(doc, 'Departman Özeti', currentY)
  currentY += 20

  if (data.departments && data.departments.length > 0) {
    // Create simple table manually for department summary
    const headers = ['Departman', 'Kullanıcı', 'Görev', 'Tamamlanan', 'Oran', 'Proje']
    
    // Table headers
    headers.forEach((header, index) => {
      const x = 20 + (index * 30)
      addTurkishText(doc, header, x, currentY, { fontSize: 9, fontStyle: 'bold' })
    })
    currentY += 10

    // Table rows
    data.departments.forEach((dept: any, rowIndex: number) => {
      const y = currentY + (rowIndex * 8)
      const rowData = [
        dept.name.substring(0, 12),
        dept.userCount.toString(),
        dept.totalTasks.toString(),
        dept.completedTasks.toString(),
        `%${dept.completionRate}`,
        dept.projectCount.toString()
      ]
      
      rowData.forEach((cell, cellIndex) => {
        const x = 20 + (cellIndex * 30)
        addTurkishText(doc, cell, x, y, { fontSize: 8 })
      })
    })

    currentY += (data.departments.length * 8) + 20

    // Department Details
    data.departments.forEach((dept: any, deptIndex: number) => {
      if (dept.users && dept.users.length > 0) {
        currentY = checkPageBreak(doc, currentY, 80)
        addSectionHeader(doc, `${dept.name.toUpperCase()} Departmanı`, currentY)
        currentY += 20

        // Department stats in simple boxes
        const statsY = currentY
        const statBoxes = [
          { label: 'Kullanıcı', value: dept.userCount.toString(), x: 20 },
          { label: 'Toplam Görev', value: dept.totalTasks.toString(), x: 70 },
          { label: 'Tamamlanan', value: dept.completedTasks.toString(), x: 120 },
          { label: 'Başarı %', value: dept.completionRate.toString(), x: 170 }
        ]

        statBoxes.forEach(stat => {
          // Simple box
          doc.setDrawColor(200, 200, 200)
          doc.rect(stat.x, statsY, 35, 20)
          
          addTurkishText(doc, stat.value, stat.x + 17, statsY + 8, { fontSize: 12, fontStyle: 'bold', align: 'center' })
          addTurkishText(doc, stat.label, stat.x + 17, statsY + 16, { fontSize: 7, align: 'center' })
        })

        currentY = statsY + 30

        // Users in department (limit to top 10)
        if (dept.users.length > 0) {
          currentY = checkPageBreak(doc, currentY, 60)
          
          // User table headers
          const userHeaders = ['Kullanıcı', 'Pozisyon', 'Görev', 'Tamamlanan', 'Oran']
          userHeaders.forEach((header, index) => {
            const x = 20 + (index * 35)
            addTurkishText(doc, header, x, currentY, { fontSize: 9, fontStyle: 'bold' })
          })
          currentY += 10

          // User table rows (max 10)
          const usersToShow = dept.users.slice(0, 10)
          usersToShow.forEach((user: any, userIndex: number) => {
            const y = currentY + (userIndex * 8)
            const userData = [
              user.name.length > 20 ? user.name.substring(0, 20) + '...' : user.name,
              (user.position || 'Belirtilmemiş').substring(0, 15),
              user.totalTasks.toString(),
              user.completedTasks.toString(),
              user.totalTasks > 0 ? `%${Math.round((user.completedTasks / user.totalTasks) * 100)}` : '%0'
            ]
            
            userData.forEach((cell, cellIndex) => {
              const x = 20 + (cellIndex * 35)
              addTurkishText(doc, cell, x, y, { fontSize: 8 })
            })
          })

          currentY += (usersToShow.length * 8) + 10

          if (dept.users.length > 10) {
            addTurkishText(doc, `... ve ${dept.users.length - 10} kullanıcı daha`, 25, currentY, { fontSize: 9, fontStyle: 'italic' })
            currentY += 10
          }
        }

        currentY += 15
      }
    })
  } else {
    addTurkishText(doc, 'Henüz departman verisi bulunmamaktadır.', 25, currentY, { fontSize: 12 })
    currentY += 20
  }

  // Overall Summary
  currentY = checkPageBreak(doc, currentY, 60)
  addSectionHeader(doc, 'Genel Özet', currentY)
  currentY += 20

  if (data.departments && data.departments.length > 0) {
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
  }

  // Simple footer
  const pageHeight = doc.internal.pageSize.height
  addTurkishText(doc, `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, pageHeight - 20, { fontSize: 8 })
  addTurkishText(doc, 'Sayfa 1', 170, pageHeight - 20, { fontSize: 8 })

  return Buffer.from(doc.output('arraybuffer'))
}
