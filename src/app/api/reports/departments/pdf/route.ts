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
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const usableWidth = pageWidth - 2 * margin

  let yPosition = margin

  // Header
  doc.setFillColor(102, 126, 234)
  doc.rect(0, 0, pageWidth, 60, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('DEPARTMAN ANALIZI', pageWidth / 2, 25, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Departman performans raporu', pageWidth / 2, 40, { align: 'center' })
  
  yPosition = 80

  // Department data
  const departments = Object.values(data.departments) as Array<Omit<DepartmentInfo, 'projects'> & { projectCount: number }>
  
  for (const dept of departments) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    // Department header
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.rect(margin, yPosition, usableWidth, 40, 'FD')

    doc.setTextColor(30, 64, 175)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(dept.name, margin + 5, yPosition + 15)

    const completionRate = dept.totalTasks > 0 ? Math.round((dept.completedTasks / dept.totalTasks) * 100) : 0
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${dept.userCount} kullanici | ${dept.totalTasks} gorev | %${completionRate} tamamlama`, margin + 5, yPosition + 30)

    yPosition += 50
  }

  // Footer
  yPosition = pageHeight - 30
  doc.setFillColor(248, 250, 252)
  doc.rect(0, yPosition - 10, pageWidth, 40, 'F')

  doc.setTextColor(71, 85, 105)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Bu rapor ${new Date(data.generatedAt).toLocaleString('tr-TR')} tarihinde otomatik olusturulmustur.`, pageWidth / 2, yPosition, { align: 'center' })

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
