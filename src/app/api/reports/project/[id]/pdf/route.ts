import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { PrismaClient } from '@prisma/client'
import { ensureMigrations } from '@/lib/database'
import { calculateDynamicProjectDates, type DynamicDateAnalysis } from '@/lib/dynamic-dates'

// Global Prisma client for Vercel production
const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
if (process.env.NODE_ENV === 'development') global.prisma = prisma

// Enhanced Turkish Character Support
function formatTurkishText(text: string): string {
  if (!text) return ''
  return text // Keep original Turkish characters in HTML/CSS
}

// Helper function to format names for compact display
function formatCompactName(fullName: string): string {
  if (!fullName) return 'Bilinmiyor'

  const nameParts = fullName.trim().split(' ')
  if (nameParts.length === 1) {
    return nameParts[0].length > 12
      ? nameParts[0].substring(0, 12) + '.'
      : nameParts[0]
  }

  const firstName = nameParts[0]
  const lastName = nameParts[nameParts.length - 1]

  // If first name is too long, truncate it
  const compactFirstName =
    firstName.length > 10 ? firstName.substring(0, 10) : firstName

  // Take only first letter of last name
  const lastNameInitial = lastName.charAt(0).toUpperCase()

  return `${compactFirstName} ${lastNameInitial}.`
}

// Helper function to get formatted position title
function getFormattedPosition(position: string): string {
  if (!position) return 'Belirtilmemiş'

  // Simply return the position as-is, just formatted nicely
  return formatTurkishText(position)
}

// Comprehensive Data Models
interface ProjectReportData {
  project: {
    id: string
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
    createdAt: Date
    budget?: number
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
    completedAt?: Date | null
    assignedUser: { id: string; name: string } | null
    assignedUsers: Array<{
      user: { id: string; name: string; department: string }
    }>
  }>
  teamMembers: Array<{
    id: string
    name: string
    department: string
    position: string
  }>
  departments: Array<{
    name: string
    count: number
  }>
  workloadData: {
    totalEstimated: number
    totalActual: number
    efficiency: number
    averageTaskHours: number
  }
  dynamicDates: DynamicDateAnalysis
}

// ===== ULTRA-PREMIUM HTML TEMPLATE =====
function generateExecutiveHTMLReport(data: ProjectReportData): string {
  // Calculate KPIs
  const totalTasks = data.tasks.length
  const completedTasks = data.tasks.filter(
    (t) => t.status === 'COMPLETED'
  ).length
  const inProgressTasks = data.tasks.filter(
    (t) => t.status === 'IN_PROGRESS'
  ).length
  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  const efficiency = data.workloadData.efficiency

  // Calculate status distribution for chart
  const statusStats = data.tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Status translation to Turkish
  const getStatusText = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'Yapılacak'
      case 'COMPLETED':
        return 'Tamamlandı'
      case 'IN_PROGRESS':
        return 'Devam Ediyor'
      case 'PENDING':
        return 'Beklemede'
      case 'ON_HOLD':
        return 'Askıda'
      default:
        return status
    }
  }

  // Priority translation to Turkish
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'Yüksek'
      case 'MEDIUM':
        return 'Orta'
      case 'LOW':
        return 'Düşük'
      default:
        return priority
    }
  }

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Executive Project Report - ${formatTurkishText(
      data.project.name
    )}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            background: #ffffff;
        }
        
        /* ===== PREMIUM COLOR SYSTEM ===== */
        :root {
            --executive-navy: #0a1929;
            --corporate-blue: #1565c0;
            --premium-blue: #1976d2;
            --accent-blue: #42a5f5;
            --professional-white: #ffffff;
            --platinum-silver: #e8eaf6;
            --rose-gold: #f8bbd9;
            --success-forest: #2e7d32;
            --warning-amber: #f57c00;
            --danger-crimson: #d32f2f;
            --charcoal-black: #212121;
            --executive-gray: #424242;
            --corporate-gray: #616161;
            --light-silver: #e0e0e0;
            --pearl-white: #fafafa;
        }
        
        /* ===== COVER PAGE ===== */
        .cover-page {
            height: 100vh;
            background: linear-gradient(135deg, var(--executive-navy) 0%, var(--corporate-blue) 50%, var(--premium-blue) 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            padding: 60px;
            position: relative;
            overflow: hidden;
            page-break-after: always;
        }
        
        .cover-page::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%),
                linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%);
        }
        
        .company-branding {
            background: rgba(255, 255, 255, 0.98);
            padding: 50px 60px;
            border-radius: 30px;
            backdrop-filter: blur(20px);
            border: 3px solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
            margin-bottom: 80px;
            z-index: 2;
            text-align: center;
            position: relative;
        }
        
        .company-branding::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, var(--professional-white), var(--corporate-blue), var(--professional-white));
            border-radius: 32px;
            z-index: -1;
        }
        
        .company-logo {
            margin-bottom: 20px;
        }
        
        .logo-temsa {
            font-size: 52px;
            font-weight: 900;
            color: var(--corporate-blue);
            letter-spacing: 4px;
            margin-right: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        .logo-one {
            font-size: 52px;
            font-weight: 300;
            color: var(--professional-white);
            letter-spacing: 4px;
            position: relative;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        .logo-one::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--corporate-blue) 0%, var(--professional-white) 100%);
            border-radius: 2px;
        }
        
        .company-tagline {
            font-size: 22px;
            color: var(--executive-gray);
            margin-bottom: 12px;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-weight: 700;
        }
        
        .company-subtitle {
            font-size: 16px;
            color: var(--corporate-gray);
            font-style: italic;
            font-weight: 500;
        }
        
        .decorative-line {
            width: 200px;
            height: 4px;
            background: linear-gradient(90deg, var(--corporate-blue) 0%, var(--professional-white) 50%, var(--corporate-blue) 100%);
            margin: 0 auto 60px;
            border-radius: 2px;
            z-index: 2;
        }
        
        .main-title {
            z-index: 2;
            margin-bottom: 60px;
            text-align: center;
        }
        
        .main-title h1 {
            font-size: 88px;
            font-weight: 900;
            color: white;
            text-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
            line-height: 1.0;
            margin-bottom: 20px;
            letter-spacing: -3px;
        }
        
        .main-title h2 {
            font-size: 62px;
            font-weight: 700;
            color: var(--professional-white);
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
            line-height: 1.1;
            margin-bottom: 25px;
            letter-spacing: -1px;
        }
        
        .title-accent {
            font-size: 20px;
            color: rgba(255, 255, 255, 0.95);
            font-weight: 600;
            letter-spacing: 3px;
            text-transform: uppercase;
            border: 3px solid rgba(255, 255, 255, 0.4);
            padding: 15px 40px;
            border-radius: 30px;
            backdrop-filter: blur(15px);
            display: inline-block;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .project-name {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.9) 100%);
            padding: 40px 50px;
            border-radius: 25px;
            backdrop-filter: blur(20px);
            border: 3px solid rgba(255, 255, 255, 0.4);
            margin-bottom: 60px;
            z-index: 2;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            position: relative;
        }
        
        .project-name::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, var(--corporate-blue), var(--professional-white), var(--corporate-blue));
            border-radius: 27px;
            z-index: -1;
        }
        
        .project-label {
            font-size: 18px;
            color: var(--corporate-blue);
            font-weight: 800;
            letter-spacing: 3px;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        
        .project-title {
            font-size: 32px;
            color: var(--charcoal-black);
            font-weight: 800;
            letter-spacing: 1px;
            line-height: 1.2;
        }
            font-weight: 800;
            letter-spacing: 1px;
        }
        
        .executive-summary {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 233, 142, 0.15) 100%);
            padding: 45px;
            border-radius: 25px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            border: 3px solid rgba(255, 255, 255, 0.4);
            max-width: 700px;
            z-index: 2;
            margin: 0 auto;
        }
        
        .executive-summary h3 {
            font-size: 26px;
            font-weight: 800;
            color: var(--corporate-blue);
            margin-bottom: 25px;
            text-align: center;
            letter-spacing: 1px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 18px;
        }
        
        .summary-item {
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 16px;
            color: var(--charcoal-black);
            font-weight: 500;
            padding: 12px 0;
            border-bottom: 1px solid rgba(25, 118, 210, 0.1);
        }
        
        .summary-item:last-child {
            border-bottom: none;
        }
        
        .summary-icon {
            font-size: 20px;
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--corporate-blue) 0%, var(--premium-blue) 100%);
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .cover-footer {
            position: absolute;
            bottom: 40px;
            left: 60px;
            right: 60px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 2;
        }
        
        .footer-date {
            background: rgba(255, 255, 255, 0.15);
            padding: 15px 25px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .footer-label {
            color: rgba(255, 255, 255, 0.8);
            font-size: 12px;
            font-weight: 600;
            display: block;
            margin-bottom: 5px;
            letter-spacing: 1px;
        }
        
        .footer-value {
            color: white;
            font-size: 14px;
            font-weight: 700;
        }
        
        .footer-classification {
            background: linear-gradient(135deg, var(--danger-crimson) 0%, #c62828 100%);
            padding: 12px 25px;
            border-radius: 25px;
            box-shadow: 0 8px 20px rgba(211, 47, 47, 0.3);
        }
        
        .footer-branding {
            background: rgba(255, 255, 255, 0.2);
            padding: 15px 25px;
            border-radius: 12px;
            backdrop-filter: blur(15px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            text-align: center;
        }
        
        .footer-brand {
            color: white;
            font-size: 16px;
            font-weight: 900;
            display: block;
            letter-spacing: 2px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .footer-system {
            color: var(--professional-white);
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 1px;
            margin-top: 2px;
            display: block;
        }
        
        .classification-badge {
            color: white;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 1px;
        }
        
        /* ===== CONTENT PAGES ===== */
        .content-page {
            padding: 60px;
            min-height: 100vh;
            page-break-before: always;
            position: relative;
        }
        
        .page-header {
            position: absolute;
            top: 20px;
            left: 60px;
            right: 60px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            background: linear-gradient(135deg, var(--corporate-blue) 0%, var(--premium-blue) 100%);
            border-radius: 10px;
            z-index: 10;
        }
        
        .page-header-brand {
            color: white;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 1px;
        }
        
        .page-header-title {
            color: var(--professional-white);
            font-size: 12px;
            font-weight: 600;
        }
        
        /* ===== EXECUTIVE DASHBOARD ===== */
        .dashboard-header {
            background: linear-gradient(135deg, var(--corporate-blue) 0%, var(--premium-blue) 100%);
            color: white;
            padding: 40px;
            border-radius: 20px;
            margin-bottom: 40px;
            margin-top: 60px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .dashboard-header h1 {
            font-size: 42px;
            font-weight: 800;
            margin-bottom: 10px;
        }
        
        .dashboard-header p {
            font-size: 18px;
            opacity: 0.9;
        }
        
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-bottom: 60px;
        }
        
        .kpi-card {
            background: linear-gradient(135deg, var(--success-forest) 0%, #4caf50 100%);
            padding: 30px;
            border-radius: 16px;
            color: white;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
        }
        
        .kpi-card.efficiency {
            background: linear-gradient(135deg, var(--corporate-blue) 0%, var(--premium-blue) 100%);
        }
        
        .kpi-card.tasks {
            background: linear-gradient(135deg, var(--warning-amber) 0%, #ff9800 100%);
        }
        
        .kpi-card.team {
            background: linear-gradient(135deg, #ad1457 0%, #e91e63 100%);
        }
        
        .kpi-card::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: translate(30px, -30px);
        }
        
        .kpi-icon {
            font-size: 32px;
            margin-bottom: 15px;
            display: block;
        }
        
        .kpi-value {
            font-size: 36px;
            font-weight: 900;
            margin-bottom: 8px;
            line-height: 1;
        }
        
        .kpi-label {
            font-size: 14px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        
        .kpi-subtitle {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 5px;
        }
        
        /* ===== ANALYTICS SECTION ===== */
        .analytics-section {
            margin-bottom: 60px;
        }
        
        .section-header {
            background: linear-gradient(135deg, var(--pearl-white) 0%, var(--light-silver) 100%);
            padding: 30px 40px;
            border-radius: 12px;
            margin-bottom: 30px;
            border-left: 6px solid var(--corporate-blue);
        }
        
        .section-header h2 {
            font-size: 28px;
            font-weight: 800;
            color: var(--corporate-blue);
            margin-bottom: 8px;
        }
        
        .section-header p {
            font-size: 16px;
            color: var(--corporate-gray);
        }
        
        .analytics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        
        .chart-container {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            border: 1px solid var(--light-silver);
        }
        
        .chart-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--corporate-blue);
            margin-bottom: 20px;
        }
        
        .progress-bars {
            space-y: 16px;
        }
        
        .progress-item {
            margin-bottom: 16px;
        }
        
        .progress-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .progress-bar {
            width: 100%;
            height: 12px;
            background: var(--light-silver);
            border-radius: 6px;
            overflow: hidden;
            position: relative;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 6px;
            position: relative;
            background: linear-gradient(90deg, var(--success-forest) 0%, #4caf50 100%);
        }
        
        .progress-fill.in-progress {
            background: linear-gradient(90deg, var(--corporate-blue) 0%, var(--premium-blue) 100%);
        }
        
        .progress-fill.pending {
            background: linear-gradient(90deg, var(--warning-amber) 0%, #ff9800 100%);
        }
        
        .progress-fill.on-hold {
            background: linear-gradient(90deg, var(--danger-crimson) 0%, #f44336 100%);
        }
        
        .team-matrix {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 20px;
        }
        
        .matrix-cell {
            background: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            border: 1px solid var(--light-silver);
        }
        
        .matrix-score {
            font-size: 24px;
            font-weight: 900;
            color: var(--corporate-blue);
            margin-bottom: 8px;
        }
        
        .matrix-dept {
            font-size: 12px;
            color: var(--corporate-gray);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }
        
        .matrix-stats {
            font-size: 10px;
            color: var(--executive-gray);
        }
        
        /* ===== WORKLOAD ANALYTICS ===== */
        .workload-cards {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .workload-card {
            background: linear-gradient(135deg, var(--corporate-blue) 0%, var(--premium-blue) 100%);
            color: white;
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        .workload-card.estimated {
            background: linear-gradient(135deg, var(--success-forest) 0%, #4caf50 100%);
        }
        
        .workload-card.actual {
            background: linear-gradient(135deg, var(--warning-amber) 0%, #ff9800 100%);
        }
        
        .workload-card.efficiency {
            background: linear-gradient(135deg, #ad1457 0%, #e91e63 100%);
        }
        
        .workload-icon {
            font-size: 24px;
            margin-bottom: 12px;
            display: block;
        }
        
        .workload-value {
            font-size: 24px;
            font-weight: 900;
            margin-bottom: 8px;
        }
        
        .workload-metric {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        /* ===== TEAM MEMBERS ===== */
        .team-members-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 40px;
        }
        
        .team-member-card {
            background: white;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            border: 1px solid var(--light-silver);
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 60px;
        }
        
        .member-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--corporate-blue) 0%, var(--premium-blue) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .member-initial {
            color: white;
            font-size: 14px;
            font-weight: 700;
        }
        
        .member-info {
            flex: 1;
        }
        
        .member-name {
            font-size: 12px;
            font-weight: 600;
            color: var(--charcoal-black);
            margin-bottom: 1px;
            line-height: 1.1;
        }
        
        .member-position {
            font-size: 10px;
            font-weight: 500;
            color: var(--executive-gray);
            margin-bottom: 1px;
            text-transform: capitalize;
            letter-spacing: 0.2px;
        }
        
        .member-department {
            font-size: 9px;
            color: var(--corporate-gray);
            text-transform: capitalize;
        }
        
        /* ===== TASK TABLE ===== */
        .task-table {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            border: 1px solid var(--light-silver);
        }
        
        .table-header {
            background: linear-gradient(135deg, var(--corporate-blue) 0%, var(--premium-blue) 100%);
            color: white;
            padding: 20px;
        }
        
        .table-header h3 {
            font-size: 20px;
            font-weight: 700;
        }
        
        .table-content {
            overflow-x: auto;
        }
        
        .task-row {
            display: grid;
            grid-template-columns: 2.5fr 1fr 1fr 2fr 120px 80px;
            gap: 15px;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid var(--light-silver);
            font-size: 14px;
        }
        
        .task-row:nth-child(even) {
            background: var(--pearl-white);
        }
        
        .task-row.header {
            background: var(--light-silver);
            font-weight: 700;
            color: var(--charcoal-black);
            border-bottom: 2px solid var(--corporate-blue);
        }
        
        .task-assignees {
            font-size: 13px;
            line-height: 1.3;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .task-title {
            font-weight: 600;
            color: var(--charcoal-black);
            line-height: 1.3;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-badge.completed {
            background: rgba(46, 125, 50, 0.1);
            color: var(--success-forest);
        }
        
        .status-badge.in-progress {
            background: rgba(21, 101, 192, 0.1);
            color: var(--corporate-blue);
        }
        
        .status-badge.pending {
            background: rgba(245, 124, 0, 0.1);
            color: var(--warning-amber);
        }
        
        .status-badge.on-hold {
            background: rgba(211, 47, 47, 0.1);
            color: var(--danger-crimson);
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
        }
        
        .priority-badge {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }
        
        .priority-badge.high {
            background: rgba(211, 47, 47, 0.1);
            color: var(--danger-crimson);
        }
        
        .priority-badge.medium {
            background: rgba(245, 124, 0, 0.1);
            color: var(--warning-amber);
        }
        
        .priority-badge.low {
            background: rgba(46, 125, 50, 0.1);
            color: var(--success-forest);
        }
        
        .mini-progress {
            width: 100%;
            height: 6px;
            background: var(--light-silver);
            border-radius: 3px;
            overflow: hidden;
        }
        
        .mini-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--success-forest) 0%, #4caf50 100%);
            border-radius: 3px;
        }
        
        /* ===== PROJECT TIMELINE STYLES ===== */
        .timeline-overview {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .timeline-card {
            background: linear-gradient(135deg, var(--corporate-blue) 0%, var(--premium-blue) 100%);
            color: white;
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        .timeline-card.start-date {
            background: linear-gradient(135deg, var(--success-forest) 0%, #4caf50 100%);
        }
        
        .timeline-card.estimated-date {
            background: linear-gradient(135deg, var(--warning-amber) 0%, #ff9800 100%);
        }
        
        .timeline-card.remaining-days {
            background: linear-gradient(135deg, #ad1457 0%, #e91e63 100%);
        }
        
        .timeline-card.critical-path {
            background: linear-gradient(135deg, var(--danger-crimson) 0%, #f44336 100%);
        }
        
        .timeline-icon {
            font-size: 24px;
            margin-bottom: 12px;
            display: block;
        }
        
        .timeline-value {
            font-size: 28px;
            font-weight: 900;
            margin-bottom: 8px;
        }
        
        .timeline-label {
            font-size: 14px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .project-phases {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            border: 1px solid var(--light-silver);
        }
        
        .project-phases h3 {
            color: var(--executive-navy);
            margin-bottom: 24px;
            font-size: 18px;
            font-weight: 700;
        }
        
        .phases-timeline {
            display: flex;
            align-items: center;
            gap: 30px;
            position: relative;
        }
        
        .phases-timeline::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--light-silver);
            z-index: 1;
        }
        
        .phase-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            z-index: 2;
            flex: 1;
        }
        
        .phase-indicator {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--light-silver);
            border: 4px solid white;
            margin-bottom: 12px;
            transition: all 0.3s ease;
        }
        
        .phase-item.completed .phase-indicator {
            background: var(--success-forest);
        }
        
        .phase-item.current .phase-indicator {
            background: var(--corporate-blue);
            animation: pulse 2s infinite;
        }
        
        .phase-content {
            text-align: center;
        }
        
        .phase-name {
            font-weight: 600;
            color: var(--executive-navy);
            margin-bottom: 4px;
        }
        
        .phase-progress {
            font-size: 12px;
            color: var(--corporate-gray);
        }
        
        .phase-item.completed .phase-name {
            color: var(--success-forest);
        }
        
        .phase-item.current .phase-name {
            color: var(--corporate-blue);
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        /* ===== FOOTER ===== */
        .premium-footer {
            background: linear-gradient(135deg, var(--executive-navy) 0%, var(--corporate-blue) 100%);
            color: white;
            padding: 30px 60px;
            margin-top: 60px;
            border-radius: 20px 20px 0 0;
        }
        
        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .footer-brand {
            font-size: 18px;
            font-weight: 800;
        }
        
        .footer-meta {
            font-size: 12px;
            opacity: 0.8;
        }
        
        /* ===== PRINT STYLES ===== */
        @media print {
            .cover-page {
                page-break-after: always;
            }
            
            .content-page {
                page-break-before: always;
            }
            
            .analytics-section {
                page-break-inside: avoid;
            }
        }
        
        /* ===== RESPONSIVE ADJUSTMENTS ===== */
        @media (max-width: 1024px) {
            .kpi-grid {
                grid-template-columns: 1fr;
            }
            
            .analytics-grid {
                grid-template-columns: 1fr;
            }
            
            .workload-cards {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .team-members-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
        
        @media (max-width: 768px) {
            .team-members-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <!-- ===== COVER PAGE ===== -->
    <div class="cover-page">
        <div class="company-branding">
            <div class="company-logo">
                <span class="logo-temsa">TEMSA</span>
                <span class="logo-one">ONE</span>
            </div>
            <div class="company-tagline">EXECUTIVE SOLUTIONS</div>
            <div class="company-subtitle">Professional Project Analytics & Management</div>
        </div>
        
        <div class="decorative-line"></div>
        
        <div class="main-title">
            <h1>YÖNETİCİ</h1>
            <h2>PROJE ANALİTİĞİ</h2>
            <div class="title-accent">KAPSAMLI PERFORMANS RAPORU</div>
        </div>
        
        <div class="project-name">
            <div class="project-label">PROJE:</div>
            <div class="project-title">${formatTurkishText(
              data.project.name
            ).toUpperCase()}</div>
        </div>
        
        <div class="cover-footer">
            <div class="footer-date">
                <span class="footer-label">RAPOR TARİHİ:</span>
                <span class="footer-value">${new Date()
                  .toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                  .toUpperCase()}</span>
            </div>
            <div class="footer-branding">
                <span class="footer-brand">TEMSA ONE</span>
                <span class="footer-system">Executive Analytics</span>
            </div>
            <div class="footer-classification">
                <span class="classification-badge">GİZLİ - YÖNETİCİ DÜZEYİ</span>
            </div>
        </div>
    </div>
    
    <!-- ===== EXECUTIVE DASHBOARD ===== -->
    <div class="content-page">
        <div class="page-header">
            <span class="page-header-brand">TEMSA ONE</span>
            <span class="page-header-title">Executive Project Analytics</span>
        </div>
        
        <div class="dashboard-header">
            <h1>YÖNETİCİ PANOSU</h1>
            <p>Gerçek Zamanlı Performans Metrikleri ve Analitiği</p>
        </div>
        
        <div class="kpi-grid">
            <div class="kpi-card">
                <span class="kpi-icon">✓</span>
                <div class="kpi-value">${data.dynamicDates.completionPercentage.toFixed(1)}%</div>
                <div class="kpi-label">Proje Tamamlanma</div>
                <div class="kpi-subtitle">${completedTasks}/${totalTasks} Görev</div>
            </div>
            
            <div class="kpi-card tasks">
                <span class="kpi-icon">⚠</span>
                <div class="kpi-value">${data.dynamicDates.isDelayed ? data.dynamicDates.delayDays : inProgressTasks}</div>
                <div class="kpi-label">${data.dynamicDates.isDelayed ? 'Gecikme Günü' : 'Aktif Görevler'}</div>
                <div class="kpi-subtitle">${data.dynamicDates.isDelayed ? 'Hesaplanan' : 'Devam Eden'}</div>
            </div>
            
            <div class="kpi-card team">
                <span class="kpi-icon">👥</span>
                <div class="kpi-value">${data.teamMembers.length}</div>
                <div class="kpi-label">Takım Üyeleri</div>
                <div class="kpi-subtitle">Kaynak Havuzu</div>
            </div>
        </div>
        
        <!-- ===== TEAM MEMBERS SECTION ===== -->
        <div class="analytics-section">
            <div class="section-header">
                <h2>TAKIM ÜYELERİ</h2>
                <p>Proje Ekibi Üyeleri ve Pozisyonları</p>
            </div>
            
            <div class="team-members-grid">
                ${data.teamMembers
                  .map((member) => {
                    const compactName = formatCompactName(member.name)
                    const positionTitle = getFormattedPosition(member.position)
                    const department = formatTurkishText(
                      member.department || 'Genel'
                    )

                    return `
                    <div class="team-member-card">
                        <div class="member-avatar">
                            <span class="member-initial">${member.name
                              .charAt(0)
                              .toUpperCase()}</span>
                        </div>
                        <div class="member-info">
                            <div class="member-name">${compactName}</div>
                            <div class="member-position">${positionTitle}</div>
                            <div class="member-department">${department}</div>
                        </div>
                    </div>
                  `
                  })
                  .join('')}
            </div>
        </div>
        
        <!-- ===== PROJECT TIMELINE SECTION ===== -->
        <div class="analytics-section">
            <div class="section-header">
                <h2>PROJE ZAMAN ÇİZELGESİ</h2>
                <p>Tahmini Tamamlanma Tarihleri ve Kritik Yol Analizi</p>
            </div>
            
            <div class="timeline-overview">
                <div class="timeline-card start-date">
                    <span class="timeline-icon">🚀</span>
                    <div class="timeline-value">${
                      data.dynamicDates.actualStartDate
                        ? new Date(data.dynamicDates.actualStartDate).toLocaleDateString(
                            'tr-TR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )
                        : data.project.startDate
                        ? new Date(data.project.startDate).toLocaleDateString(
                            'tr-TR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )
                        : 'Belirtilmemiş'
                    }</div>
                    <div class="timeline-label">Gerçek Başlangıç</div>
                </div>
                
                <div class="timeline-card estimated-date">
                    <span class="timeline-icon">📅</span>
                    <div class="timeline-value">${
                      data.dynamicDates.actualEndDate
                        ? new Date(data.dynamicDates.actualEndDate).toLocaleDateString(
                            'tr-TR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )
                        : data.project.endDate
                        ? new Date(data.project.endDate).toLocaleDateString(
                            'tr-TR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )
                        : 'Hesaplanıyor...'
                    }</div>
                    <div class="timeline-label">Gerçek Bitiş</div>
                </div>
                
                <div class="timeline-card remaining-days">
                    <span class="timeline-icon">⏰</span>
                    <div class="timeline-value">${
                      data.dynamicDates.isDelayed
                        ? `+${data.dynamicDates.delayDays}`
                        : data.dynamicDates.actualEndDate
                        ? Math.max(0, Math.ceil(
                            (new Date(data.dynamicDates.actualEndDate).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          ))
                        : '---'
                    }</div>
                    <div class="timeline-label">${
                      data.dynamicDates.isDelayed ? 'Gecikme Günü' : 'Kalan Gün'
                    }</div>
                </div>
                
                <div class="timeline-card critical-path">
                    <span class="timeline-icon">🔴</span>
                    <div class="timeline-value">${data.dynamicDates.criticalPath.length}</div>
                    <div class="timeline-label">Kritik Görev</div>
                </div>
            </div>
            
            <!-- ===== GELİŞMİŞ BİTİŞ TARİHİ ANALİZİ ===== -->
            <div class="date-analysis-section" style="margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 15px; border: 2px solid #cbd5e1;">
                <h3 style="color: #1e293b; margin-bottom: 20px; font-size: 22px; font-weight: 700;">🎯 Gelişmiş Tarih ve Gecikme Analizi</h3>
                
                <!-- Temel Tarih Karşılaştırması -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">📅 Planlanan Bitiş Tarihi</div>
                        <div style="font-size: 18px; font-weight: 700;">${
                          data.dynamicDates.plannedEndDate
                            ? new Date(data.dynamicDates.plannedEndDate).toLocaleDateString(
                                'tr-TR',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )
                            : 'Belirtilmemiş'
                        }</div>
                        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">İlk belirlenen hedef</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, ${(() => {
                      const status = data.dynamicDates.status
                      const delayDays = data.dynamicDates.delayDays
                      if (status === 'completed') return '#10b981 0%, #059669 100%'
                      if (status === 'delayed') return '#dc2626 0%, #991b1b 100%'
                      if (status === 'early') return '#10b981 0%, #059669 100%'
                      if (delayDays > 30) return '#dc2626 0%, #991b1b 100%'
                      if (delayDays > 0) return '#f59e0b 0%, #d97706 100%'
                      return '#10b981 0%, #059669 100%'
                    })()} ); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">⏱️ Gerçek Bitiş Tarihi</div>
                        <div style="font-size: 18px; font-weight: 700;">${
                          data.dynamicDates.actualEndDate
                            ? new Date(data.dynamicDates.actualEndDate).toLocaleDateString(
                                'tr-TR',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )
                            : data.dynamicDates.status === 'completed'
                            ? 'Tamamlandı'
                            : 'Hesaplanıyor...'
                        }</div>
                        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Görev bazlı hesaplama</div>
                    </div>
                </div>

                <!-- 4 Faktörlü Gecikme Analizi -->
                ${data.dynamicDates.delayBreakdown ? `
                <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #e5e7eb;">
                    <h4 style="color: #374151; margin-bottom: 20px; font-size: 18px; font-weight: 600;">📊 4 Faktörlü Gecikme Analizi</h4>
                    
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div style="background: ${data.dynamicDates.delayBreakdown.dominantFactor === 'tasks' ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'}; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 20px; font-weight: 700;">${data.dynamicDates.delayBreakdown.taskBasedDelay}</div>
                            <div style="font-size: 11px; opacity: 0.9;">Görev Bazlı</div>
                            ${data.dynamicDates.delayBreakdown.dominantFactor === 'tasks' ? '<div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">🏆 Dominant</div>' : ''}
                        </div>
                        
                        <div style="background: ${data.dynamicDates.delayBreakdown.dominantFactor === 'schedule' ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'}; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 20px; font-weight: 700;">${data.dynamicDates.delayBreakdown.scheduleBasedDelay}</div>
                            <div style="font-size: 11px; opacity: 0.9;">Program Bazlı</div>
                            ${data.dynamicDates.delayBreakdown.dominantFactor === 'schedule' ? '<div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">🏆 Dominant</div>' : ''}
                        </div>
                        
                        <div style="background: ${data.dynamicDates.delayBreakdown.dominantFactor === 'progress' ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'}; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 20px; font-weight: 700;">${data.dynamicDates.delayBreakdown.progressBasedDelay}</div>
                            <div style="font-size: 11px; opacity: 0.9;">İlerleme Bazlı</div>
                            ${data.dynamicDates.delayBreakdown.dominantFactor === 'progress' ? '<div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">🏆 Dominant</div>' : ''}
                        </div>
                        
                        <div style="background: ${data.dynamicDates.delayBreakdown.dominantFactor === 'overdue' ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'}; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 20px; font-weight: 700;">${data.dynamicDates.delayBreakdown.overdueTasksDelay}</div>
                            <div style="font-size: 11px; opacity: 0.9;">Gecikmiş Görev</div>
                            ${data.dynamicDates.delayBreakdown.dominantFactor === 'overdue' ? '<div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">🏆 Dominant</div>' : ''}
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 8px;">
                        <div style="font-size: 14px; color: #374151; margin-bottom: 5px;">📈 Maksimum Gecikme (Seçilen Büyük Sayı)</div>
                        <div style="font-size: 32px; font-weight: 900; color: #dc2626;">${data.dynamicDates.delayDays} GÜN</div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Dominant Faktör: ${(() => {
                          switch(data.dynamicDates.delayBreakdown.dominantFactor) {
                            case 'tasks': return 'Görev Tabanlı Gecikme'
                            case 'schedule': return 'Program Tabanlı Gecikme' 
                            case 'progress': return 'İlerleme Tabanlı Gecikme'
                            case 'overdue': return 'Gecikmiş Görevler'
                            default: return 'Belirtilmemiş'
                          }
                        })()}</div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Durum Özeti ve Öncelikli Eylemler -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                        <div style="font-size: 24px; font-weight: 700; color: #059669;">${data.dynamicDates.completionPercentage.toFixed(0)}%</div>
                        <div style="font-size: 12px; color: #64748b;">Tamamlanma Oranı</div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                        <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${data.dynamicDates.criticalPath.length}</div>
                        <div style="font-size: 12px; color: #64748b;">Kritik Görev</div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                        <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${data.tasks.filter(t => t.status === 'IN_PROGRESS').length}</div>
                        <div style="font-size: 12px; color: #64748b;">Devam Eden</div>
                    </div>
                </div>
                
                <!-- Gecikmiş Görevler Detayı -->
                ${data.dynamicDates.delayBreakdown && data.dynamicDates.delayBreakdown.overdueTaskDetails.length > 0 ? `
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 10px; border: 1px solid #f87171;">
                    <h5 style="color: #dc2626; font-weight: 600; margin-bottom: 15px; font-size: 16px;">⚠️ Gecikmiş Görevler (${data.dynamicDates.delayBreakdown.overdueTaskDetails.length} adet)</h5>
                    <div style="display: grid; gap: 10px;">
                        ${data.dynamicDates.delayBreakdown.overdueTaskDetails.slice(0, 5).map(task => `
                            <div style="background: rgba(255,255,255,0.7); padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                                <div style="color: #7f1d1d; font-weight: 500; font-size: 14px; flex: 1;">${formatTurkishText(task.title)}</div>
                                <div style="color: #dc2626; font-weight: 700; font-size: 14px;">${task.daysOverdue} gün</div>
                            </div>
                        `).join('')}
                        ${data.dynamicDates.delayBreakdown.overdueTaskDetails.length > 5 ? `
                            <div style="color: #7f1d1d; font-size: 12px; text-align: center; margin-top: 8px;">
                                +${data.dynamicDates.delayBreakdown.overdueTaskDetails.length - 5} görev daha...
                            </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Proje Durum Uyarıları -->
                ${(() => {
                  const status = data.dynamicDates.status
                  const delayDays = data.dynamicDates.delayDays
                  const isDelayed = data.dynamicDates.isDelayed

                  if (status === 'completed') {
                    return `
                        <div style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 1px solid #10b981; border-radius: 8px;">
                            <div style="color: #059669; font-weight: 600; margin-bottom: 8px;">✅ Proje Tamamlandı</div>
                            <ul style="color: #065f46; font-size: 14px; margin: 0; padding-left: 20px;">
                                <li>Proje başarıyla tamamlanmıştır</li>
                                <li>Tüm görevler bitirilmiştir</li>
                                <li>Final raporlama hazırlanabilir</li>
                            </ul>
                        </div>`
                  } else if (isDelayed && delayDays > 30) {
                    return `
                        <div style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 1px solid #f87171; border-radius: 8px;">
                            <div style="color: #dc2626; font-weight: 600; margin-bottom: 8px;">🚨 Kritik Gecikme (${delayDays} gün)</div>
                            <ul style="color: #7f1d1d; font-size: 14px; margin: 0; padding-left: 20px;">
                                <li>Acil müdahale gerekiyor</li>
                                <li>Kaynak tahsisi yeniden değerlendirilmeli</li>
                                <li>Proje planı revize edilmeli</li>
                                <li>Üst yönetim bilgilendirilmeli</li>
                            </ul>
                        </div>`
                  } else if (isDelayed) {
                    return `
                        <div style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border: 1px solid #f59e0b; border-radius: 8px;">
                            <div style="color: #d97706; font-weight: 600; margin-bottom: 8px;">⚠️ Gecikme Tespit Edildi (${delayDays} gün)</div>
                            <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px;">
                                <li>İlerleme takibi artırılmalı</li>
                                <li>Kritik görevlere odaklanılmalı</li>
                                <li>Kaynak dağılımı gözden geçirilmeli</li>
                                <li>Günlük durum raporlaması başlatılmalı</li>
                            </ul>
                        </div>`
                  } else {
                    return `
                        <div style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 1px solid #10b981; border-radius: 8px;">
                            <div style="color: #059669; font-weight: 600; margin-bottom: 8px;">✅ Proje Yolunda</div>
                            <ul style="color: #065f46; font-size: 14px; margin: 0; padding-left: 20px;">
                                <li>Proje planlandığı gibi ilerliyor</li>
                                <li>Mevcut tempo korunmalı</li>
                                <li>Haftalık takip sürdürülmeli</li>
                                <li>Risk faktörleri düzenli izlenmeli</li>
                            </ul>
                        </div>`
                  }
                })()}
            </div>
            
            <div class="project-phases">
                <h3>Proje Fazları ve Tahmini Süreler</h3>
                <div class="phases-timeline">
                    ${(() => {
                      const phases = [
                        {
                          name: 'Planlama',
                          percentage: 20,
                          status: completionRate > 20 ? 'completed' : 'current',
                        },
                        {
                          name: 'Geliştirme',
                          percentage: 60,
                          status:
                            completionRate > 60
                              ? 'completed'
                              : completionRate > 20
                              ? 'current'
                              : 'pending',
                        },
                        {
                          name: 'Test',
                          percentage: 85,
                          status:
                            completionRate > 85
                              ? 'completed'
                              : completionRate > 60
                              ? 'current'
                              : 'pending',
                        },
                        {
                          name: 'Teslimat',
                          percentage: 100,
                          status:
                            completionRate === 100
                              ? 'completed'
                              : completionRate > 85
                              ? 'current'
                              : 'pending',
                        },
                      ]

                      return phases
                        .map(
                          (phase) => `
                            <div class="phase-item ${phase.status}">
                                <div class="phase-indicator"></div>
                                <div class="phase-content">
                                    <div class="phase-name">${phase.name}</div>
                                    <div class="phase-progress">${phase.percentage}%</div>
                                </div>
                            </div>
                        `
                        )
                        .join('')
                    })()}
                </div>
            </div>
        </div>

        <!-- ===== ANALYTICS SECTION ===== -->
        <div class="analytics-section">
            <div class="section-header">
                <h2>GELİŞMİŞ PROJE ANALİTİĞİ</h2>
                <p>Kapsamlı Performans İçgörüleri ve Stratejik Metrikler</p>
            </div>
            
            <div class="analytics-grid">
                <div class="chart-container">
                    <div class="chart-title">Görev İlerleme Dağılımı</div>
                    <div class="progress-bars">
                        ${Object.entries(statusStats)
                          .map(([status, count]) => {
                            const percentage =
                              totalTasks > 0 ? (count / totalTasks) * 100 : 0
                            const statusClass = status
                              .toLowerCase()
                              .replace('_', '-')
                            const statusLabel = getStatusText(status)
                            return `
                            <div class="progress-item">
                                <div class="progress-label">
                                    <span>${statusLabel}</span>
                                    <span>${count} (${percentage.toFixed(
                              1
                            )}%)</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill ${statusClass}" style="width: ${percentage}%"></div>
                                </div>
                            </div>
                          `
                          })
                          .join('')}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ===== WORKLOAD ANALYTICS ===== -->
        <div class="analytics-section">
            <div class="section-header">
                <h2>İŞ YÜKÜ ANALİTİK PANOSU</h2>
                <p>Kaynak Tahsisi ve Performans Optimizasyonu</p>
            </div>
            
            <div class="workload-cards">
                <div class="workload-card estimated">
                    <span class="workload-icon">⏱</span>
                    <div class="workload-value">${
                      data.workloadData.totalEstimated
                    }s</div>
                    <div class="workload-metric">Toplam Tahmini</div>
                </div>
                
                <div class="workload-card">
                    <span class="workload-icon">📊</span>
                    <div class="workload-value">${data.workloadData.averageTaskHours.toFixed(
                      1
                    )}s</div>
                    <div class="workload-metric">Ortalama Görev</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- ===== DETAILED TASK BREAKDOWN ===== -->
    <div class="content-page">
        <div class="section-header">
            <h2>DETAYLI GÖREV DAĞILIMI</h2>
            <p>Kapsamlı Görev Analizi ve Atama Detayları</p>
        </div>
        
        <div class="task-table">
            <div class="table-header">
                <h3>Görev Genel Bakış ve Durum Takibi</h3>
            </div>
            
            <div class="table-content">
                <div class="task-row header">
                    <div>GÖREV</div>
                    <div>DURUM</div>
                    <div>ÖNCELİK</div>
                    <div>ATANAN</div>
                    <div>İLERLEME</div>
                    <div>SAAT</div>
                </div>
                
                ${data.tasks
                  .map((task) => {
                    const progress =
                      task.status === 'COMPLETED'
                        ? 100
                        : task.status === 'IN_PROGRESS'
                        ? 60
                        : task.status === 'PENDING'
                        ? 20
                        : 0

                    const statusClass = task.status
                      .toLowerCase()
                      .replace('_', '-')
                    const priorityClass = task.priority.toLowerCase()

                    return `
                    <div class="task-row">
                        <div class="task-title">${formatTurkishText(
                          task.title
                        )}</div>
                        <div>
                            <span class="status-badge ${statusClass}">
                                <span class="status-dot"></span>
                                ${getStatusText(task.status)}
                            </span>
                        </div>
                        <div>
                            <span class="priority-badge ${priorityClass}">
                                ${getPriorityText(task.priority)}
                            </span>
                        </div>
                        <div class="task-assignees">${
                          task.assignedUsers && task.assignedUsers.length > 0
                            ? task.assignedUsers
                                .map((au) => formatTurkishText(au.user.name))
                                .join(', ')
                            : task.assignedUser
                            ? formatTurkishText(task.assignedUser.name)
                            : 'Atanmadı'
                        }</div>
                        <div>
                            <div class="mini-progress">
                                <div class="mini-progress-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                        <div>${
                          task.estimatedHours ? `${task.estimatedHours}s` : '-'
                        }</div>
                    </div>
                  `
                  })
                  .join('')}
            </div>
        </div>
        
        <div class="premium-footer">
            <div class="footer-content">
                <div class="footer-brand">TEMSA ONE YÖNETİCİ ÇÖZÜMLERİ</div>
                <div class="footer-meta">
                    <div>Oluşturuldu: ${new Date().toLocaleString(
                      'tr-TR'
                    )}</div>
                    <div>GİZLİ - YÖNETİCİ DÜZEYİ</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `
}

// Helper function to build report data
async function buildReportData(
  projectId: string
): Promise<ProjectReportData | null> {
  try {
    const projectData = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignedUser: {
              select: { id: true, name: true },
            },
            assignedUsers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    department: true,
                    position: true,
                  },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                department: true,
                position: true,
              },
            },
          },
        },
      },
    })

    if (!projectData) return null

    // Process team members
    const teamMembers = projectData.members.map((pm: any) => ({
      id: pm.user.id,
      name: pm.user.name,
      department: pm.user.department,
      position: pm.user.position,
    }))

    // Calculate departments
    const departmentCounts = teamMembers.reduce((acc: any, member: any) => {
      const dept = member.department || 'Atanmadı'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const departments = Object.entries(departmentCounts).map(
      ([name, count]) => ({
        name,
        count: count as number,
      })
    )

    // Calculate workload analytics
    const totalEstimated = projectData.tasks.reduce(
      (sum: any, task: any) => sum + (task.estimatedHours || 0),
      0
    )
    const totalActual = projectData.tasks.reduce(
      (sum: any, task: any) => sum + (task.actualHours || 0),
      0
    )
    const efficiency =
      totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 100
    const averageTaskHours =
      projectData.tasks.length > 0
        ? totalEstimated / projectData.tasks.length
        : 0

    const workloadData = {
      totalEstimated,
      totalActual,
      efficiency,
      averageTaskHours,
    }

    // Calculate dynamic dates using our enhanced algorithm
    const dynamicDates = calculateDynamicProjectDates(projectData.tasks, projectData)

    console.log('📊 PDF Report Dynamic Dates Generated:', {
      projectName: projectData.name,
      delayDays: dynamicDates.delayDays,
      status: dynamicDates.status,
      completion: `${dynamicDates.completionPercentage.toFixed(1)}%`
    })

    return {
      project: projectData,
      tasks: projectData.tasks,
      teamMembers,
      departments,
      workloadData,
      dynamicDates,
    }
  } catch (error) {
    console.error('Failed to build report data:', error)
    return null
  }
}

// ===== MAIN API HANDLER =====
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let browser: any = null

  try {
    // Ensure database migrations are applied
    console.log('Checking database migrations...')
    await ensureMigrations()

    const projectId = params.id
    console.log('Fetching project data for ID:', projectId)

    // Build comprehensive report data
    const reportData = await buildReportData(projectId)
    if (!reportData) {
      console.log('Project not found for ID:', projectId)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log('Project data fetched successfully:', reportData.project.name)

    // Generate HTML report
    console.log('Generating HTML content...')
    const htmlContent = generateExecutiveHTMLReport(reportData)

    // Launch Puppeteer with Vercel-optimized settings
    console.log('Launching Puppeteer browser...')

    const isVercel = !!process.env.VERCEL || !!process.env.AWS_REGION
    let browser: any

    if (isVercel) {
      console.log('Running on Vercel/AWS, using Chromium')
      browser = await puppeteer.launch({
        args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
        defaultViewport: { width: 1200, height: 1600 },
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    } else {
      console.log('Running locally, using local Puppeteer')
      const puppeteerLocal = require('puppeteer')
      browser = await puppeteerLocal.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      })
    }

    console.log('Creating new page...')
    const page = await browser.newPage()

    // Set viewport for consistent rendering
    console.log('Setting viewport...')
    await page.setViewport({ width: 1200, height: 1600 })

    // Set content and wait for fonts to load
    console.log('Setting HTML content...')
    await page.setContent(htmlContent, {
      waitUntil: ['domcontentloaded'],
      timeout: 30000,
    })

    // Generate PDF with premium settings
    console.log('Generating PDF...')
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
      preferCSSPageSize: true,
    })

    // Generate premium filename
    const sanitizedName = formatTurkishText(reportData.project.name)
      .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()

    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `Yonetici_Proje_Raporu_${sanitizedName}_${timestamp}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    })
  } catch (error) {
    console.error('Executive PDF generation error:', error)

    const err = error as Error
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    })

    // If this is a Puppeteer-specific error, try to provide an HTML fallback
    if (
      err.message?.includes('Failed to launch') ||
      err.message?.includes('Protocol error') ||
      err.message?.includes('Target closed')
    ) {
      console.log('Puppeteer failed, providing HTML fallback')

      // Return HTML version as fallback
      const reportData = await buildReportData(params.id)
      if (reportData) {
        const htmlContent = generateExecutiveHTMLReport(reportData)
        return new NextResponse(htmlContent, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': 'inline; filename="project_report.html"',
          },
        })
      }
    }

    // Provide more specific error information
    let errorMessage = 'Failed to generate executive PDF report'
    if (err.message?.includes('Protocol error')) {
      errorMessage = 'Browser connection failed - Puppeteer issue'
    } else if (err.message?.includes('Navigation timeout')) {
      errorMessage = 'PDF generation timeout - content too complex'
    } else if (err.message?.includes('Project not found')) {
      errorMessage = 'Project not found in database'
    } else if (err.message?.includes('PrismaClient')) {
      errorMessage = 'Database connection error'
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    )
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
