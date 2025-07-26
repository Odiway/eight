import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'

interface PerformanceData {
  generatedAt: string
  summary: {
    totalUsers: number
    totalProjects: number
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    averageTaskCompletion: number
  }
  userPerformance: Array<{
    id: string
    name: string
    email: string
    department: string
    position: string | null
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    completionRate: number
    projectCount: number
    averageTaskDuration: number
  }>
  projectPerformance: Array<{
    id: string
    name: string
    status: string
    totalTasks: number
    completedTasks: number
    completionRate: number
    teamSize: number
    isOverdue: boolean
    daysFromStart: number
  }>
  departmentPerformance: Array<{
    name: string
    userCount: number
    totalTasks: number
    completedTasks: number
    completionRate: number
    averageUserPerformance: number
  }>
}

async function getPerformanceData(): Promise<PerformanceData> {
  // Get users with their tasks and projects
  const users = await prisma.user.findMany({
    include: {
      assignedTasks: {
        include: {
          project: true,
        },
      },
      projects: {
        include: {
          project: true,
        },
      },
    },
  })

  // Get projects with their tasks and members
  const projects = await prisma.project.findMany({
    include: {
      tasks: true,
      members: {
        include: {
          user: true,
        },
      },
    },
  })

  // Calculate user performance
  const userPerformance = users.map((user) => {
    const totalTasks = user.assignedTasks.length
    const completedTasks = user.assignedTasks.filter(
      (t) => t.status === 'COMPLETED'
    ).length
    const overdueTasks = user.assignedTasks.filter((t) => {
      const endDate = t.endDate ? new Date(t.endDate) : null
      return endDate && endDate < new Date() && t.status !== 'COMPLETED'
    }).length

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const projectCount = user.projects.length

    // Calculate average task duration (simplified)
    const completedTasksWithDates = user.assignedTasks.filter(
      (t) => t.status === 'COMPLETED' && t.startDate && t.updatedAt
    )
    const averageTaskDuration =
      completedTasksWithDates.length > 0
        ? Math.round(
            completedTasksWithDates.reduce((sum, task) => {
              const start = new Date(task.startDate!)
              const end = new Date(task.updatedAt)
              return (
                sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
              )
            }, 0) / completedTasksWithDates.length
          )
        : 0

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      position: user.position,
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate,
      projectCount,
      averageTaskDuration,
    }
  })

  // Calculate project performance
  const projectPerformance = projects.map((project) => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(
      (t) => t.status === 'COMPLETED'
    ).length
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const teamSize = project.members.length

    const isOverdue = project.endDate
      ? new Date(project.endDate) < new Date() && project.status !== 'COMPLETED'
      : false

    const daysFromStart = project.startDate
      ? Math.ceil(
          (new Date().getTime() - new Date(project.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      totalTasks,
      completedTasks,
      completionRate,
      teamSize,
      isOverdue,
      daysFromStart,
    }
  })

  // Calculate department performance
  const departmentStats: { [key: string]: { users: any[]; tasks: any[] } } = {}

  users.forEach((user) => {
    if (!departmentStats[user.department]) {
      departmentStats[user.department] = { users: [], tasks: [] }
    }
    departmentStats[user.department].users.push(user)
    departmentStats[user.department].tasks.push(...user.assignedTasks)
  })

  const departmentPerformance = Object.entries(departmentStats).map(
    ([deptName, data]) => {
      const userCount = data.users.length
      const totalTasks = data.tasks.length
      const completedTasks = data.tasks.filter(
        (t) => t.status === 'COMPLETED'
      ).length
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      const userPerformanceRates = data.users.map((user) => {
        const userTasks = user.assignedTasks.length
        const userCompleted = user.assignedTasks.filter(
          (t: any) => t.status === 'COMPLETED'
        ).length
        return userTasks > 0 ? Math.round((userCompleted / userTasks) * 100) : 0
      })

      const averageUserPerformance =
        userPerformanceRates.length > 0
          ? Math.round(
              userPerformanceRates.reduce((sum, rate) => sum + rate, 0) /
                userPerformanceRates.length
            )
          : 0

      return {
        name: deptName,
        userCount,
        totalTasks,
        completedTasks,
        completionRate,
        averageUserPerformance,
      }
    }
  )

  // Calculate summary statistics
  const totalUsers = users.length
  const totalProjects = projects.length
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0)
  const completedTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === 'COMPLETED').length,
    0
  )
  const overdueTasks = projects.reduce(
    (sum, p) =>
      sum +
      p.tasks.filter((t) => {
        const endDate = t.endDate ? new Date(t.endDate) : null
        return endDate && endDate < new Date() && t.status !== 'COMPLETED'
      }).length,
    0
  )
  const averageTaskCompletion =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      averageTaskCompletion,
    },
    userPerformance,
    projectPerformance,
    departmentPerformance,
  }
}

function generateHTML(data: PerformanceData): string {
  const {
    summary,
    userPerformance,
    projectPerformance,
    departmentPerformance,
  } = data
  const generatedDate = new Date(data.generatedAt).toLocaleString('tr-TR')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Performans Analiz Raporu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #7c3aed;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          color: #6d28d9;
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
          background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%);
          padding: 20px;
          border-radius: 12px;
          border-left: 5px solid #7c3aed;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-value {
          font-size: 2.5em;
          font-weight: bold;
          color: #6d28d9;
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
          color: #6d28d9;
          font-size: 1.8em;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
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
          background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%);
          color: white;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85em;
          letter-spacing: 0.5px;
        }
        tr:hover {
          background-color: #faf5ff;
        }
        .performance-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 600;
          text-transform: uppercase;
        }
        .excellent { background-color: #d1fae5; color: #065f46; }
        .good { background-color: #dbeafe; color: #1e40af; }
        .average { background-color: #fef3c7; color: #92400e; }
        .poor { background-color: #fee2e2; color: #dc2626; }
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
          background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%);
          transition: width 0.3s ease;
        }
        .overdue {
          color: #dc2626;
          font-weight: bold;
        }
        .department-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .department-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border-left: 5px solid #7c3aed;
        }
        .department-name {
          font-size: 1.2em;
          font-weight: bold;
          color: #6d28d9;
          margin-bottom: 15px;
        }
        .department-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .department-stat {
          text-align: center;
          padding: 10px;
          background: #faf5ff;
          border-radius: 8px;
        }
        .department-stat-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #7c3aed;
        }
        .department-stat-label {
          font-size: 0.8em;
          color: #6b7280;
          margin-top: 5px;
        }
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
        <h1 class="title">Performans Analiz Raporu</h1>
        <p class="subtitle">Rapor Tarihi: ${generatedDate}</p>
      </div>

      <div class="section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${summary.totalUsers}</div>
            <div class="stat-label">Toplam Kullanıcı</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${summary.totalProjects}</div>
            <div class="stat-label">Toplam Proje</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${summary.totalTasks}</div>
            <div class="stat-label">Toplam Görev</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${summary.completedTasks}</div>
            <div class="stat-label">Tamamlanan</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${summary.overdueTasks}</div>
            <div class="stat-label">Geciken Görev</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">%${summary.averageTaskCompletion}</div>
            <div class="stat-label">Ortalama Tamamlama</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Departman Performansı</h2>
        <div class="department-grid">
          ${departmentPerformance
            .map(
              (dept) => `
            <div class="department-card">
              <div class="department-name">${dept.name}</div>
              <div class="department-stats">
                <div class="department-stat">
                  <div class="department-stat-value">${dept.userCount}</div>
                  <div class="department-stat-label">Kullanıcı</div>
                </div>
                <div class="department-stat">
                  <div class="department-stat-value">${dept.totalTasks}</div>
                  <div class="department-stat-label">Görev</div>
                </div>
                <div class="department-stat">
                  <div class="department-stat-value">%${dept.completionRate}</div>
                  <div class="department-stat-label">Tamamlama</div>
                </div>
                <div class="department-stat">
                  <div class="department-stat-value">%${dept.averageUserPerformance}</div>
                  <div class="department-stat-label">Ort. Performans</div>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Kullanıcı Performansı</h2>
        <table>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Departman</th>
              <th>Pozisyon</th>
              <th>Görev Sayısı</th>
              <th>Tamamlanan</th>
              <th>Geciken</th>
              <th>Başarı Oranı</th>
              <th>Proje Sayısı</th>
              <th>Ort. Süre (Gün)</th>
            </tr>
          </thead>
          <tbody>
            ${userPerformance
              .sort((a, b) => b.completionRate - a.completionRate)
              .map((user) => {
                const performanceClass =
                  user.completionRate >= 90
                    ? 'excellent'
                    : user.completionRate >= 70
                    ? 'good'
                    : user.completionRate >= 50
                    ? 'average'
                    : 'poor'

                const performanceText =
                  user.completionRate >= 90
                    ? 'Mükemmel'
                    : user.completionRate >= 70
                    ? 'İyi'
                    : user.completionRate >= 50
                    ? 'Orta'
                    : 'Geliştirilmeli'

                return `
                  <tr>
                    <td><strong>${user.name}</strong></td>
                    <td>${user.department}</td>
                    <td>${user.position || 'Belirtilmemiş'}</td>
                    <td>${user.totalTasks}</td>
                    <td>${user.completedTasks}</td>
                    <td ${user.overdueTasks > 0 ? 'class="overdue"' : ''}>${
                  user.overdueTasks
                }</td>
                    <td>
                      <span class="performance-badge ${performanceClass}">${performanceText}</span>
                      <div>%${user.completionRate}</div>
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: ${
                          user.completionRate
                        }%"></div>
                      </div>
                    </td>
                    <td>${user.projectCount}</td>
                    <td>${user.averageTaskDuration}</td>
                  </tr>
                `
              })
              .join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Proje Performansı</h2>
        <table>
          <thead>
            <tr>
              <th>Proje Adı</th>
              <th>Durum</th>
              <th>Görev İlerlemesi</th>
              <th>Ekip Büyüklüğü</th>
              <th>Başlangıçtan Gün</th>
              <th>Performans</th>
            </tr>
          </thead>
          <tbody>
            ${projectPerformance
              .sort((a, b) => b.completionRate - a.completionRate)
              .map((project) => {
                const performanceClass =
                  project.completionRate >= 90
                    ? 'excellent'
                    : project.completionRate >= 70
                    ? 'good'
                    : project.completionRate >= 50
                    ? 'average'
                    : 'poor'

                const statusText =
                  project.status === 'COMPLETED'
                    ? 'Tamamlandı'
                    : project.status === 'IN_PROGRESS'
                    ? 'Devam Ediyor'
                    : project.status === 'PLANNING'
                    ? 'Planlanıyor'
                    : 'Beklemede'

                return `
                  <tr ${
                    project.isOverdue
                      ? 'style="background-color: #fef2f2;"'
                      : ''
                  }>
                    <td>
                      <strong>${project.name}</strong>
                      ${
                        project.isOverdue
                          ? '<br><small class="overdue">Gecikmiş!</small>'
                          : ''
                      }
                    </td>
                    <td>${statusText}</td>
                    <td>
                      ${project.completedTasks}/${project.totalTasks} (%${
                  project.completionRate
                })
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: ${
                          project.completionRate
                        }%"></div>
                      </div>
                    </td>
                    <td>${project.teamSize} kişi</td>
                    <td>${project.daysFromStart} gün</td>
                    <td>
                      <span class="performance-badge ${performanceClass}">
                        ${
                          project.completionRate >= 90
                            ? 'Mükemmel'
                            : project.completionRate >= 70
                            ? 'İyi'
                            : project.completionRate >= 50
                            ? 'Orta'
                            : 'Geliştirilmeli'
                        }
                      </span>
                    </td>
                  </tr>
                `
              })
              .join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Bu rapor otomatik olarak ${generatedDate} tarihinde oluşturulmuştur.</p>
      </div>
    </body>
    </html>
  `
}

function generatePerformancePDF(data: PerformanceData): Buffer {
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
  doc.text('PERFORMANS RAPORU', pageWidth / 2, 25, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Kullanici ve proje performans analizi', pageWidth / 2, 40, { align: 'center' })
  
  yPosition = 80

  // Summary Statistics
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('OZET ISTATISTIKLER', margin, yPosition)
  yPosition += 15

  const stats = [
    { label: 'Toplam Kullanici', value: data.summary.totalUsers.toString() },
    { label: 'Toplam Proje', value: data.summary.totalProjects.toString() },
    { label: 'Toplam Gorev', value: data.summary.totalTasks.toString() },
    { label: 'Tamamlanan Gorev', value: data.summary.completedTasks.toString() },
    { label: 'Geciken Gorev', value: data.summary.overdueTasks.toString() },
    { label: 'Ort. Tamamlama', value: `%${Math.round(data.summary.averageTaskCompletion)}` }
  ]

  const colWidth = usableWidth / 3
  const rowHeight = 25

  for (let i = 0; i < stats.length; i++) {
    const row = Math.floor(i / 3)
    const col = i % 3
    const x = margin + col * colWidth
    const y = yPosition + row * rowHeight

    // Background for stat card
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.rect(x, y, colWidth - 5, rowHeight - 5, 'FD')

    // Value
    doc.setTextColor(30, 41, 91)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(stats[i].value, x + colWidth / 2, y + 10, { align: 'center' })

    // Label
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(stats[i].label, x + colWidth / 2, y + 18, { align: 'center' })
  }

  yPosition += Math.ceil(stats.length / 3) * rowHeight + 20

  // Top Performers
  if (yPosition > pageHeight - 100) {
    doc.addPage()
    yPosition = margin
  }

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('EN YUKSEK PERFORMANS', margin, yPosition)
  yPosition += 15

  const topPerformers = data.userPerformance
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 5)

  for (const user of topPerformers) {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = margin
    }

    // User card background
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(229, 231, 235)
    doc.rect(margin, yPosition, usableWidth, 20, 'FD')

    // User name and performance
    doc.setTextColor(30, 64, 175)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(user.name, margin + 5, yPosition + 8)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`${user.department} | %${Math.round(user.completionRate)} tamamlama | ${user.totalTasks} gorev`, margin + 5, yPosition + 15)

    yPosition += 25
  }

  // Footer
  if (yPosition > pageHeight - 40) {
    doc.addPage()
    yPosition = margin
  }

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
    const data = await getPerformanceData()
    const pdfBuffer = generatePerformancePDF(data)

    // Return PDF with proper headers
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="performans-raporu-${
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
