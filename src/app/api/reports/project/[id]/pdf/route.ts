import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'

interface ProjectReportData {
  generatedAt: string
  project: {
    id: string
    name: string
    description: string
    status: string
    startDate: string
    endDate: string | null
    createdAt: string
    updatedAt: string
    progress: number
  }
  statistics: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    todoTasks: number
    reviewTasks: number
    overdueTasks: number
    progressPercentage: number
    teamSize: number
  }
  tasks: any[]
  team: any[]
  timeline: {
    projectDuration: number
    isOverdue: boolean
    estimatedCompletion: string
    actualProgress: number
  }
}

async function getProjectReportData(
  projectId: string
): Promise<ProjectReportData> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        include: {
          assignedUsers: {
            include: {
              user: true,
            },
          },
        },
      },
      members: {
        include: {
          user: true,
        },
      },
    },
  })

  if (!project) {
    throw new Error('Proje bulunamadı')
  }

  // Calculate statistics
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(
    (t) => t.status === 'COMPLETED'
  ).length
  const inProgressTasks = project.tasks.filter(
    (t) => t.status === 'IN_PROGRESS'
  ).length
  const todoTasks = project.tasks.filter((t) => t.status === 'TODO').length
  const reviewTasks = project.tasks.filter((t) => t.status === 'REVIEW').length

  const overdueTasks = project.tasks.filter((t) => {
    const endDate = t.endDate ? new Date(t.endDate) : null
    return endDate && endDate < new Date() && t.status !== 'COMPLETED'
  }).length

  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const teamSize = project.members.length

  // Calculate timeline
  const startDate = project.startDate ? new Date(project.startDate) : new Date()
  const endDate = project.endDate ? new Date(project.endDate) : new Date()
  const projectDuration = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const isOverdue = endDate < new Date() && project.status !== 'COMPLETED'

  return {
    generatedAt: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate?.toISOString() || '',
      endDate: project.endDate?.toISOString() || null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      progress: progressPercentage,
    },
    statistics: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      overdueTasks,
      progressPercentage,
      teamSize,
    },
    tasks: project.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate?.toISOString() || null,
      endDate: task.endDate?.toISOString() || null,
      assignedUser: null, // Legacy field
      assignedUsers: task.assignedUsers.map((au) => ({
        name: au.user.name,
        email: au.user.email,
        department: au.user.department,
      })),
      isOverdue: task.endDate
        ? new Date(task.endDate) < new Date() && task.status !== 'COMPLETED'
        : false,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    })),
    team: project.members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      department: member.user.department,
      position: member.user.position,
      tasksAssigned: project.tasks.filter((t) =>
        t.assignedUsers.some((au) => au.user.id === member.user.id)
      ).length,
      tasksCompleted: project.tasks.filter(
        (t) =>
          t.status === 'COMPLETED' &&
          t.assignedUsers.some((au) => au.user.id === member.user.id)
      ).length,
    })),
    timeline: {
      projectDuration,
      isOverdue,
      estimatedCompletion: project.endDate?.toISOString() || '',
      actualProgress: progressPercentage,
    },
  }
}

function generateHTML(data: ProjectReportData): string {
  const { project, statistics, tasks, team, timeline } = data
  const generatedDate = new Date(data.generatedAt).toLocaleString('tr-TR')

  // Calculate additional metrics
  const efficiencyScore = statistics.totalTasks > 0 ? Math.round((statistics.completedTasks / statistics.totalTasks) * 100) : 0
  const taskDistribution = {
    completed: statistics.completedTasks,
    inProgress: statistics.inProgressTasks,
    todo: statistics.todoTasks,
    review: statistics.reviewTasks
  }
  
  // Team workload analysis
  const teamWorkload = team.map(member => {
    const memberTasks = tasks.filter(task => 
      task.assignedUsers.some((assignment: any) => assignment.user.id === member.user.id)
    )
    const completedTasks = memberTasks.filter(task => task.status === 'COMPLETED').length
    return {
      name: member.user.name,
      totalTasks: memberTasks.length,
      completedTasks: completedTasks,
      efficiency: memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0
    }
  }).sort((a, b) => b.efficiency - a.efficiency)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Proje Raporu - ${project.name}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
          background: #f8fafc;
        }
        .header {
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          border-radius: 20px;
          margin-bottom: 40px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .title {
          font-size: 3em;
          margin: 0;
          font-weight: 700;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .project-title {
          font-size: 2em;
          margin: 15px 0;
          opacity: 0.95;
        }
        .subtitle {
          font-size: 1.2em;
          margin: 10px 0 0 0;
          opacity: 0.9;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin: 40px 0;
        }
        .metric-card {
          background: white;
          padding: 25px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-left: 5px solid #667eea;
        }
        .metric-title {
          color: #1e293b;
          font-size: 1.1em;
          font-weight: 600;
          margin-bottom: 15px;
        }
        .metric-value {
          font-size: 2.5em;
          font-weight: 800;
          color: #667eea;
          margin: 10px 0;
        }
        .progress-ring {
          width: 100px;
          height: 100px;
          margin: 0 auto;
          position: relative;
        }
        .progress-ring-circle {
          width: 100%;
          height: 100%;
          fill: none;
          stroke-width: 8;
          stroke-linecap: round;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }
        .progress-ring-bg {
          stroke: #e2e8f0;
        }
        .progress-ring-fill {
          stroke: #667eea;
          stroke-dasharray: 314;
          stroke-dashoffset: 314;
          transition: stroke-dashoffset 0.5s ease-in-out;
        }
        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.2em;
          font-weight: 700;
          color: #1e293b;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 25px;
          margin: 30px 0;
        }
        .stat-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          padding: 25px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        .stat-value {
          font-size: 2.8em;
          font-weight: 800;
          color: #1e293b;
          margin: 10px 0;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .stat-label {
          color: #64748b;
          font-size: 0.95em;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }
        .chart-container {
          background: white;
          padding: 25px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          margin: 20px 0;
        }
        .chart-title {
          color: #1e293b;
          font-size: 1.4em;
          font-weight: 700;
          margin-bottom: 20px;
          text-align: center;
        }
        .section {
          margin: 40px 0;
        }
        .section-title {
          color: #1e40af;
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
          background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
          color: white;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85em;
          letter-spacing: 0.5px;
        }
        tr:hover {
          background-color: #f8fafc;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-completed {
          background-color: #d1fae5;
          color: #065f46;
        }
        .status-in-progress {
          background-color: #dbeafe;
          color: #1e40af;
        }
        .status-todo {
          background-color: #fef3c7;
          color: #92400e;
        }
        .status-review {
          background-color: #e0e7ff;
          color: #5b21b6;
        }
        .priority-urgent {
          background-color: #fee2e2;
          color: #dc2626;
        }
        .priority-high {
          background-color: #fed7d7;
          color: #c53030;
        }
        .priority-medium {
          background-color: #fef3c7;
          color: #d69e2e;
        }
        .priority-low {
          background-color: #d1fae5;
          color: #22c55e;
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
          transition: width 0.3s ease;
        }
        .project-info {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 25px;
          border-radius: 12px;
          margin: 20px 0;
          border-left: 5px solid #2563eb;
        }
        .project-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        .info-item {
          margin-bottom: 15px;
        }
        .info-label {
          font-weight: bold;
          color: #374151;
          margin-bottom: 5px;
        }
        .info-value {
          color: #6b7280;
        }
        .overdue {
          color: #dc2626;
          font-weight: bold;
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
        <h1 class="title">📊 Proje Raporu</h1>
        <h2 class="project-title">🚀 ${project.name}</h2>
        <p class="subtitle">📅 Rapor Tarihi: ${generatedDate}</p>
      </div>

      <!-- Project Overview Dashboard -->
      <div class="dashboard-grid">
        <div class="metric-card">
          <div class="metric-title">📈 Genel İlerleme</div>
          <div style="text-align: center;">
            <div class="progress-ring">
              <svg class="progress-ring-circle" viewBox="0 0 100 100">
                <circle class="progress-ring-bg" cx="50" cy="50" r="40"/>
                <circle class="progress-ring-fill" cx="50" cy="50" r="40" 
                  style="stroke-dashoffset: ${314 - (314 * efficiencyScore / 100)}"/>
              </svg>
              <div class="progress-text">${efficiencyScore}%</div>
            </div>
            <div style="margin-top: 15px; color: #64748b; font-size: 0.9em;">
              ${statistics.completedTasks}/${statistics.totalTasks} görev tamamlandı
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-title">⏰ Proje Durumu</div>
          <div style="text-align: center;">
            <div style="
              padding: 15px;
              border-radius: 12px;
              background: ${timeline.isOverdue ? '#fef2f2' : project.status === 'COMPLETED' ? '#f0fdf4' : '#eff6ff'};
              color: ${timeline.isOverdue ? '#dc2626' : project.status === 'COMPLETED' ? '#166534' : '#1d4ed8'};
              font-weight: 600;
              margin-bottom: 10px;
            ">
              ${project.status === 'COMPLETED' ? '✅ Tamamlandı' :
                timeline.isOverdue ? '⚠️ Gecikmiş' : 
                project.status === 'IN_PROGRESS' ? '🔄 Devam Ediyor' : 
                '📋 Planlanıyor'}
            </div>
            <div style="color: #64748b; font-size: 0.9em;">
              Süre: ${timeline.projectDuration} gün
              ${timeline.isOverdue ? '<br>⚠️ Hedef tarih geçildi' : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Key Metrics Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${statistics.totalTasks}</div>
          <div class="stat-label">📋 Toplam Görev</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #10b981;">${statistics.completedTasks}</div>
          <div class="stat-label">✅ Tamamlanan</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #3b82f6;">${statistics.inProgressTasks}</div>
          <div class="stat-label">🔄 Devam Eden</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #f59e0b;">${statistics.todoTasks}</div>
          <div class="stat-label">⏳ Bekleyen</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #8b5cf6;">${statistics.reviewTasks}</div>
          <div class="stat-label">👀 İnceleme</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: ${statistics.overdueTasks > 0 ? '#ef4444' : '#10b981'};">${statistics.overdueTasks}</div>
          <div class="stat-label">⚠️ Geciken</div>
        </div>
      </div>

      <!-- Team Performance Section -->
      <div class="section" style="margin: 40px 0;">
        <h2 style="color: #1e293b; font-size: 1.8em; margin-bottom: 25px; text-align: center;">
          👥 Ekip Performansı (${statistics.teamSize} üye)
        </h2>
        <div class="chart-container">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            ${teamWorkload.slice(0, 6).map(member => `
              <div style="
                background: #f8fafc; 
                padding: 20px; 
                border-radius: 12px; 
                border-left: 4px solid ${member.efficiency >= 80 ? '#10b981' : member.efficiency >= 60 ? '#f59e0b' : '#ef4444'};
              ">
                <div style="font-weight: 600; color: #1e293b; margin-bottom: 10px;">
                  ${member.name}
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #64748b; font-size: 0.9em;">Verimlilik:</span>
                  <span style="font-weight: 600; color: ${member.efficiency >= 80 ? '#10b981' : member.efficiency >= 60 ? '#f59e0b' : '#ef4444'};">
                    ${member.efficiency}%
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #64748b; font-size: 0.9em;">Görevler:</span>
                  <span style="font-weight: 600; color: #1e293b;">
                    ${member.completedTasks}/${member.totalTasks}
                  </span>
                </div>
                <div style="
                  width: 100%; 
                  height: 6px; 
                  background-color: #e2e8f0; 
                  border-radius: 3px; 
                  overflow: hidden;
                ">
                  <div style="
                    height: 100%; 
                    background: ${member.efficiency >= 80 ? '#10b981' : member.efficiency >= 60 ? '#f59e0b' : '#ef4444'}; 
                    width: ${member.efficiency}%; 
                    border-radius: 3px;
                  "></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
            <div class="info-item">
              <div class="info-label">Başlangıç Tarihi:</div>
              <div class="info-value">${
                project.startDate
                  ? new Date(project.startDate).toLocaleDateString('tr-TR')
                  : 'Belirtilmemiş'
              }</div>
            </div>
            <div class="info-item">
              <div class="info-label">Bitiş Tarihi:</div>
              <div class="info-value ${timeline.isOverdue ? 'overdue' : ''}">${
    project.endDate
      ? new Date(project.endDate).toLocaleDateString('tr-TR')
      : 'Belirtilmemiş'
  } ${timeline.isOverdue ? '(Gecikmiş!)' : ''}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Proje Süresi:</div>
              <div class="info-value">${timeline.projectDuration} gün</div>
            </div>
            <div class="info-item">
              <div class="info-label">İlerleme:</div>
              <div class="info-value">
                %${statistics.progressPercentage}
                <div class="progress-bar" style="margin-top: 5px;">
                  <div class="progress-fill" style="width: ${
                    statistics.progressPercentage
                  }%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${statistics.totalTasks}</div>
            <div class="stat-label">Toplam Görev</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${statistics.completedTasks}</div>
            <div class="stat-label">Tamamlanan</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${statistics.inProgressTasks}</div>
            <div class="stat-label">Devam Eden</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${statistics.todoTasks}</div>
            <div class="stat-label">Yapılacak</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${statistics.reviewTasks}</div>
            <div class="stat-label">İnceleme</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${statistics.overdueTasks}</div>
            <div class="stat-label">Geciken</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${statistics.teamSize}</div>
            <div class="stat-label">Ekip Üyesi</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Görev Detayları</h2>
        <table>
          <thead>
            <tr>
              <th>Görev Adı</th>
              <th>Durum</th>
              <th>Öncelik</th>
              <th>Atanan Kişiler</th>
              <th>Başlangıç</th>
              <th>Bitiş</th>
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map((task) => {
                const statusClass =
                  task.status === 'COMPLETED'
                    ? 'status-completed'
                    : task.status === 'IN_PROGRESS'
                    ? 'status-in-progress'
                    : task.status === 'TODO'
                    ? 'status-todo'
                    : 'status-review'

                const statusText =
                  task.status === 'COMPLETED'
                    ? 'Tamamlandı'
                    : task.status === 'IN_PROGRESS'
                    ? 'Devam Ediyor'
                    : task.status === 'TODO'
                    ? 'Yapılacak'
                    : 'İnceleme'

                const priorityClass =
                  task.priority === 'URGENT'
                    ? 'priority-urgent'
                    : task.priority === 'HIGH'
                    ? 'priority-high'
                    : task.priority === 'MEDIUM'
                    ? 'priority-medium'
                    : 'priority-low'

                const priorityText =
                  task.priority === 'URGENT'
                    ? 'Acil'
                    : task.priority === 'HIGH'
                    ? 'Yüksek'
                    : task.priority === 'MEDIUM'
                    ? 'Orta'
                    : 'Düşük'

                return `
                <tr ${
                  task.isOverdue ? 'style="background-color: #fef2f2;"' : ''
                }>
                  <td>
                    <strong>${task.title}</strong><br>
                    <small style="color: #6b7280;">${
                      task.description || ''
                    }</small>
                  </td>
                  <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    ${
                      task.isOverdue
                        ? '<br><small class="overdue">Gecikmiş!</small>'
                        : ''
                    }
                  </td>
                  <td>
                    <span class="status-badge ${priorityClass}">${priorityText}</span>
                  </td>
                  <td>
                    ${task.assignedUsers
                      .map(
                        (user: any) => `
                      <div style="margin-bottom: 5px;">
                        <strong>${user.name}</strong><br>
                        <small style="color: #6b7280;">${user.department}</small>
                      </div>
                    `
                      )
                      .join('')}
                  </td>
                  <td>${
                    task.startDate
                      ? new Date(task.startDate).toLocaleDateString('tr-TR')
                      : '-'
                  }</td>
                  <td>${
                    task.endDate
                      ? new Date(task.endDate).toLocaleDateString('tr-TR')
                      : '-'
                  }</td>
                </tr>
              `
              })
              .join('')}
          </tbody>
        </table>
      </div>

      ${
        team.length > 0
          ? `
      <div class="section">
        <h2 class="section-title">Ekip Üyeleri</h2>
        <table>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>E-posta</th>
              <th>Departman</th>
              <th>Pozisyon</th>
              <th>Atanan Görev</th>
              <th>Tamamlanan</th>
              <th>Başarı Oranı</th>
            </tr>
          </thead>
          <tbody>
            ${team
              .map((member: any) => {
                const successRate =
                  member.tasksAssigned > 0
                    ? Math.round(
                        (member.tasksCompleted / member.tasksAssigned) * 100
                      )
                    : 0
                return `
                <tr>
                  <td><strong>${member.name}</strong></td>
                  <td>${member.email}</td>
                  <td>${member.department}</td>
                  <td>${member.position || 'Belirtilmemiş'}</td>
                  <td>${member.tasksAssigned}</td>
                  <td>${member.tasksCompleted}</td>
                  <td>
                    %${successRate}
                    <div class="progress-bar" style="margin-top: 5px;">
                      <div class="progress-fill" style="width: ${successRate}%"></div>
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
          : ''
      }

      <div class="footer">
        <p>Bu rapor otomatik olarak ${generatedDate} tarihinde oluşturulmuştur.</p>
        <p><strong>Proje ID:</strong> ${project.id}</p>
      </div>
    </body>
    </html>
  `
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = id
    const data = await getProjectReportData(projectId)
    const html = generateHTML(data)

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Set content and wait for it to load
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    })

    await browser.close()

    // Clean project name for filename
    const cleanProjectName = data.project.name.replace(/[^a-zA-Z0-9]/g, '-')
    const filename = `proje-raporu-${cleanProjectName}-${
      new Date().toISOString().split('T')[0]
    }.pdf`

    // Return PDF with proper headers
    return new Response(pdf, {
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
