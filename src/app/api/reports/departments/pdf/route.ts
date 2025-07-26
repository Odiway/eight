import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'

interface DepartmentInfo {
  name: string
  userCount: number
  totalTasks: number
  completedTasks: number
  users: Array<{
    id: string
    name: string
    email: string
    position: string | null
    totalTasks: number
    completedTasks: number
  }>
  projects: Set<string>
}

interface DepartmentData {
  [key: string]: DepartmentInfo
}

interface DepartmentReportData {
  generatedAt: string
  departments: {
    [key: string]: Omit<DepartmentInfo, 'projects'> & {
      projectCount: number
    }
  }
}

async function getDepartmentData(): Promise<DepartmentReportData> {
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

  const departments: DepartmentData = {}

  users.forEach((user) => {
    if (!departments[user.department]) {
      departments[user.department] = {
        name: user.department,
        userCount: 0,
        totalTasks: 0,
        completedTasks: 0,
        users: [],
        projects: new Set(),
      }
    }

    const dept = departments[user.department]
    dept.userCount++
    dept.totalTasks += user.taskAssignments.length
    dept.completedTasks += user.taskAssignments.filter(
      (ta) => ta.task.status === 'COMPLETED'
    ).length

    dept.users.push({
      id: user.id,
      name: user.name,
      email: user.email,
      position: user.position,
      totalTasks: user.taskAssignments.length,
      completedTasks: user.taskAssignments.filter((ta) => ta.task.status === 'COMPLETED')
        .length,
    })

    // Add unique projects
    user.taskAssignments.forEach((taskAssignment) => {
      dept.projects.add(taskAssignment.task.project.id)
    })
  })

  return {
    generatedAt: new Date().toISOString(),
    departments: Object.fromEntries(
      Object.entries(departments).map(([key, dept]) => [
        key,
        {
          ...dept,
          projectCount: dept.projects.size,
          projects: undefined, // Remove Set from response
        },
      ])
    ),
  }
}

function generateHTML(data: any): string {
  const { departments } = data
  const generatedDate = new Date(data.generatedAt).toLocaleString('tr-TR')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Departman Analiz Raporu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #16a34a;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          color: #15803d;
          font-size: 2.5em;
          margin: 0;
          font-weight: bold;
        }
        .subtitle {
          color: #6b7280;
          font-size: 1.2em;
          margin: 10px 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .stat-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 20px;
          border-radius: 12px;
          border-left: 5px solid #16a34a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-value {
          font-size: 2.5em;
          font-weight: bold;
          color: #15803d;
          margin: 0;
        }
        .stat-label {
          color: #6b7280;
          font-size: 0.9em;
          margin: 5px 0 0 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .section {
          margin: 40px 0;
          page-break-inside: avoid;
        }
        .section-title {
          color: #15803d;
          font-size: 1.8em;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .department {
          background: white;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border-left: 5px solid #16a34a;
          page-break-inside: avoid;
        }
        .department-header {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .department-name {
          color: #15803d;
          font-size: 1.5em;
          font-weight: bold;
          margin: 0;
        }
        .department-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .department-stat {
          text-align: center;
          padding: 15px;
          background: #f0fdf4;
          border-radius: 8px;
          border: 1px solid #bbf7d0;
        }
        .department-stat-value {
          font-size: 1.8em;
          font-weight: bold;
          color: #16a34a;
        }
        .department-stat-label {
          font-size: 0.85em;
          color: #6b7280;
          margin-top: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
          color: white;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85em;
          letter-spacing: 0.5px;
        }
        tr:hover {
          background-color: #f9fafb;
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 5px;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
          transition: width 0.3s ease;
        }
        .performance-indicator {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 600;
        }
        .excellent { background-color: #d1fae5; color: #065f46; }
        .good { background-color: #dbeafe; color: #1e40af; }
        .average { background-color: #fef3c7; color: #92400e; }
        .poor { background-color: #fee2e2; color: #dc2626; }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">Departman Analiz Raporu</h1>
        <p class="subtitle">Rapor Tarihi: ${generatedDate}</p>
      </div>

      <div class="section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${Object.keys(departments).length}</div>
            <div class="stat-label">Toplam Departman</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Object.values(departments).reduce(
              (sum: number, dept: any) => sum + dept.userCount,
              0
            )}</div>
            <div class="stat-label">Toplam Kullanıcı</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Object.values(departments).reduce(
              (sum: number, dept: any) => sum + dept.totalTasks,
              0
            )}</div>
            <div class="stat-label">Toplam Görev</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Object.values(departments).reduce(
              (sum: number, dept: any) => sum + dept.completedTasks,
              0
            )}</div>
            <div class="stat-label">Tamamlanan Görev</div>
          </div>
        </div>
      </div>

      ${Object.entries(departments)
        .map(([deptName, dept]: [string, any]) => {
          const completionRate =
            dept.totalTasks > 0
              ? Math.round((dept.completedTasks / dept.totalTasks) * 100)
              : 0
          const performanceClass =
            completionRate >= 90
              ? 'excellent'
              : completionRate >= 70
              ? 'good'
              : completionRate >= 50
              ? 'average'
              : 'poor'

          const performanceText =
            completionRate >= 90
              ? 'Mükemmel'
              : completionRate >= 70
              ? 'İyi'
              : completionRate >= 50
              ? 'Orta'
              : 'Geliştirilmeli'

          return `
          <div class="department">
            <div class="department-header">
              <h2 class="department-name">${dept.name}</h2>
              <span class="performance-indicator ${performanceClass}">${performanceText} (%${completionRate})</span>
            </div>
            
            <div class="department-stats">
              <div class="department-stat">
                <div class="department-stat-value">${dept.userCount}</div>
                <div class="department-stat-label">Kullanıcı Sayısı</div>
              </div>
              <div class="department-stat">
                <div class="department-stat-value">${
                  dept.projectCount || 0
                }</div>
                <div class="department-stat-label">Aktif Proje</div>
              </div>
              <div class="department-stat">
                <div class="department-stat-value">${dept.totalTasks}</div>
                <div class="department-stat-label">Toplam Görev</div>
              </div>
              <div class="department-stat">
                <div class="department-stat-value">${dept.completedTasks}</div>
                <div class="department-stat-label">Tamamlanan</div>
              </div>
              <div class="department-stat">
                <div class="department-stat-value">%${completionRate}</div>
                <div class="department-stat-label">Tamamlama Oranı</div>
              </div>
            </div>

            <h3 style="color: #15803d; margin-top: 30px; margin-bottom: 15px;">Departman Çalışanları</h3>
            <table>
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>E-posta</th>
                  <th>Pozisyon</th>
                  <th>Görev Sayısı</th>
                  <th>Tamamlanan</th>
                  <th>Başarı Oranı</th>
                </tr>
              </thead>
              <tbody>
                ${dept.users
                  .map((user: any) => {
                    const userCompletionRate =
                      user.totalTasks > 0
                        ? Math.round(
                            (user.completedTasks / user.totalTasks) * 100
                          )
                        : 0
                    return `
                    <tr>
                      <td><strong>${user.name}</strong></td>
                      <td>${user.email}</td>
                      <td>${user.position || 'Belirtilmemiş'}</td>
                      <td>${user.totalTasks}</td>
                      <td>${user.completedTasks}</td>
                      <td>
                        %${userCompletionRate}
                        <div class="progress-bar">
                          <div class="progress-fill" style="width: ${userCompletionRate}%"></div>
                        </div>
                      </td>
                    </tr>
                  `
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        `
        })
        .join('')}

      <div class="footer">
        <p>Bu rapor otomatik olarak ${generatedDate} tarihinde oluşturulmuştur.</p>
      </div>
    </body>
    </html>
  `
}

function generateDepartmentsPDF(data: DepartmentReportData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Enhanced styling constants
  const colors = {
    primary: [30, 64, 175] as const,      // Blue-700
    secondary: [8, 145, 178] as const,    // Cyan-600  
    accent: [5, 150, 105] as const,       // Emerald-600
    warning: [217, 119, 6] as const,      // Amber-600
    danger: [220, 38, 38] as const,       // Red-600
    text: [31, 41, 55] as const,          // Gray-800
    lightText: [107, 114, 128] as const,  // Gray-500
    background: [248, 250, 252] as const, // Slate-50
    border: [226, 232, 240] as const      // Slate-200
  }

  // Header with gradient effect
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  // Add decorative elements
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2])
  doc.circle(pageWidth - 30, 15, 10, 'F')
  doc.circle(pageWidth - 15, 35, 6, 'F')
  
  // Company logo area
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(15, 10, 15, 15, 3, 3, 'F')
  doc.setFontSize(14)
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
  doc.setFont('helvetica', 'bold')
  doc.text('T', 22, 22)
  
  // Header text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('DEPARTMAN ANALİZİ', 40, 22)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Batarya Üretim - Performans Raporu', 40, 30)
  
  doc.setFontSize(10)
  doc.text(`Rapor Tarihi: ${new Date(data.generatedAt).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 40, 38)

  let yPosition = 60

  // Executive Summary Card
  doc.setFillColor(colors.background[0], colors.background[1], colors.background[2])
  doc.roundedRect(10, yPosition, pageWidth - 20, 40, 4, 4, 'F')
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
  doc.setLineWidth(0.5)
  doc.roundedRect(10, yPosition, pageWidth - 20, 40, 4, 4, 'S')
  
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('📊 GENEL DURUM ÖZETİ', 15, yPosition + 10)
  
  const departments = Object.values(data.departments) as Array<Omit<DepartmentInfo, 'projects'> & { projectCount: number }>
  const totalDepartments = departments.length
  const totalUsers = departments.reduce((sum, dept) => sum + dept.userCount, 0)
  const totalTasks = departments.reduce((sum, dept) => sum + dept.totalTasks, 0)
  const totalCompleted = departments.reduce((sum, dept) => sum + dept.completedTasks, 0)
  const overallCompletion = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0
  
  // Summary metrics
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  const metrics = [
    { label: 'Toplam Departman', value: totalDepartments.toString(), icon: '🏢' },
    { label: 'Toplam Çalışan', value: totalUsers.toString(), icon: '👥' },
    { label: 'Toplam Görev', value: totalTasks.toString(), icon: '📋' },
    { label: 'Genel Başarı', value: `%${overallCompletion}`, icon: '🎯' }
  ]
  
  metrics.forEach((metric, index) => {
    const x = 15 + (index % 2) * 90
    const y = yPosition + 20 + Math.floor(index / 2) * 12
    
    doc.text(metric.icon, x, y)
    doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])
    doc.text(metric.label + ':', x + 8, y)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.setFont('helvetica', 'bold')
    doc.text(metric.value, x + 45, y)
    doc.setFont('helvetica', 'normal')
  })

  yPosition += 50

  // Department Analysis Section
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('🏢 DEPARTMAN DETAYLARI', 15, yPosition)
  yPosition += 15

  departments.forEach((dept, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 90) {
      doc.addPage()
      yPosition = 25
    }

    // Department card
    const cardHeight = 70
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(10, yPosition, pageWidth - 20, cardHeight, 4, 4, 'F')
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.setLineWidth(0.5)
    doc.roundedRect(10, yPosition, pageWidth - 20, cardHeight, 4, 4, 'S')
    
    // Department header with colored accent
    const headerColor = index % 3 === 0 ? colors.primary : index % 3 === 1 ? colors.secondary : colors.accent
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
    doc.roundedRect(10, yPosition, pageWidth - 20, 15, 4, 4, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(dept.name, 15, yPosition + 10)
    
    // Department stats
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    
    const completionRate = dept.totalTasks > 0 ? Math.round((dept.completedTasks / dept.totalTasks) * 100) : 0
    
    // Stats grid
    const stats = [
      { icon: '👥', label: 'Çalışan', value: `${dept.userCount} kişi` },
      { icon: '📋', label: 'Toplam Görev', value: dept.totalTasks.toString() },
      { icon: '✅', label: 'Tamamlanan', value: dept.completedTasks.toString() },
      { icon: '📊', label: 'Başarı Oranı', value: `%${completionRate}` },
      { icon: '🎯', label: 'Aktif Proje', value: `${dept.projectCount || 0} proje` }
    ]
    
    stats.forEach((stat, statIndex) => {
      const x = 15 + (statIndex % 3) * 60
      const y = yPosition + 25 + Math.floor(statIndex / 3) * 12
      
      doc.setFontSize(9)
      doc.text(stat.icon, x, y)
      doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])
      doc.text(stat.label + ':', x + 8, y)
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      doc.setFont('helvetica', 'bold')
      doc.text(stat.value, x + 30, y)
      doc.setFont('helvetica', 'normal')
    })
    
    // Performance indicator circle
    const performanceColor = completionRate >= 80 ? colors.accent : 
                             completionRate >= 60 ? colors.warning : colors.danger
    
    doc.setFillColor(performanceColor[0], performanceColor[1], performanceColor[2])
    doc.circle(pageWidth - 25, yPosition + 35, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${completionRate}%`, pageWidth - 30, yPosition + 37)
    
    // Performance status text
    const performanceText = completionRate >= 80 ? 'Mükemmel' : 
                           completionRate >= 60 ? 'İyi' : 
                           completionRate >= 40 ? 'Orta' : 'Geliştirilmeli'
    
    doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(performanceText, pageWidth - 35, yPosition + 45)
    
    // Top performers section
    if (dept.users && dept.users.length > 0) {
      const topPerformers = dept.users
        .map(user => ({
          ...user,
          completion: user.totalTasks > 0 ? Math.round((user.completedTasks / user.totalTasks) * 100) : 0
        }))
        .sort((a, b) => b.completion - a.completion)
        .slice(0, 3)
      
      doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('🏆 En İyi Performans:', 15, yPosition + 55)
      
      topPerformers.forEach((performer, perfIndex) => {
        const perfX = 15 + perfIndex * 55
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        const shortName = performer.name.split(' ').slice(0, 2).join(' ')
        doc.text(shortName.length > 15 ? shortName.substring(0, 15) + '...' : shortName, perfX, yPosition + 62)
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
        doc.setFont('helvetica', 'bold')
        doc.text(`%${performer.completion}`, perfX, yPosition + 67)
      })
    }

    yPosition += cardHeight + 10
  })

  // Modern footer
  if (yPosition > pageHeight - 30) {
    doc.addPage()
    yPosition = pageHeight - 25
  } else {
    yPosition = pageHeight - 25
  }
  
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
  doc.setLineWidth(0.8)
  doc.line(15, yPosition, pageWidth - 15, yPosition)
  
  doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Batarya Üretim Proje Yönetim Sistemi', 15, yPosition + 8)
  doc.text(`Oluşturulma: ${new Date().toLocaleString('tr-TR')}`, pageWidth - 70, yPosition + 8)
  
  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2])
    doc.setFontSize(8)
    doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}

export async function GET(request: NextRequest) {
  try {
    const data = await getDepartmentData()
    const pdfBuffer = generateDepartmentsPDF(data)

    // Return PDF with proper headers
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="departman-analizi-${
          new Date().toISOString().split('T')[0]
        }.pdf"`,
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
