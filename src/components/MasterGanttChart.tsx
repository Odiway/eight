'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Settings, 
  Zap, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Circle,
  BarChart3,
  Target,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Download,
  RotateCcw,
  Activity,
  Grid,
  List,
  TrendingUp,
  Building,
  DollarSign,
  User,
  FolderKanban
} from 'lucide-react'

// Master Project interface
export interface MasterProject {
  id: string
  name: string
  startDate: Date
  endDate: Date
  plannedEndDate?: Date // Original planned end date
  actualEndDate?: Date // Calculated actual/estimated end date
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'REVIEW'
  progress: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  teamCount: number
  taskCount: number
  completedTasks: number
  budget?: number
  spent?: number
  manager?: {
    id: string
    name: string
    avatar?: string
  }
  isDelayed?: boolean
  delayDays?: number
  milestones: Array<{
    id: string
    title: string
    date: Date
    completed: boolean
  }>
}

export interface MasterGanttChartProps {
  projects: MasterProject[]
  projectStartDate: Date
  projectEndDate: Date
  onProjectClick?: (projectId: string) => void
}

const MasterGanttChart: React.FC<MasterGanttChartProps> = ({
  projects,
  projectStartDate,
  projectEndDate,
  onProjectClick,
}) => {
  // State management
  const [viewMode, setViewMode] = useState<'days' | 'weeks' | 'months'>('months')
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'delayed' | 'completed'>('all')
  const [showMilestones, setShowMilestones] = useState(true)
  const [showBudget, setShowBudget] = useState(true)
  const [showTeams, setShowTeams] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [zoomLevel, setZoomLevel] = useState(1)
  const [sortBy, setSortBy] = useState<'startDate' | 'priority' | 'progress'>('startDate')
  
  // Refs for scrolling
  const chartRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const headerScrollRef = useRef<HTMLDivElement>(null)

  // Calculate time units based on view mode - Fixed to 2025
  const timeUnits = useMemo(() => {
    const units = []
    const start = new Date(2025, 0, 1) // January 1, 2025
    const end = new Date(2025, 11, 31) // December 31, 2025
    
    if (viewMode === 'days') {
      // Show all days of 2025
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        units.push(new Date(d))
      }
    } else if (viewMode === 'weeks') {
      // Show all weeks of 2025
      const startOfWeek = new Date(2024, 11, 30) // Start from the Monday of the first week of 2025
      const endOfYear = new Date(2026, 0, 5) // End at the Sunday of the last week of 2025
      for (let d = new Date(startOfWeek); d <= endOfYear; d.setDate(d.getDate() + 7)) {
        units.push(new Date(d))
      }
    } else { // months
      // Show all 12 months of 2025
      for (let month = 0; month < 12; month++) {
        units.push(new Date(2025, month, 1))
      }
    }
    
    return units
  }, [viewMode])

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects]
    
    // Apply filters
    switch (filterMode) {
      case 'active':
        filtered = filtered.filter(p => p.status === 'IN_PROGRESS')
        break
      case 'delayed':
        filtered = filtered.filter(p => p.isDelayed)
        break
      case 'completed':
        filtered = filtered.filter(p => p.status === 'COMPLETED')
        break
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'startDate':
          return a.startDate.getTime() - b.startDate.getTime()
        case 'priority':
          const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'progress':
          return b.progress - a.progress
        default:
          return 0
      }
    })
    
    return filtered
  }, [projects, filterMode, sortBy])

  // Calculate project position and width - Fixed to 2025 timeline
  const getProjectDimensions = (project: MasterProject) => {
    const yearStart = new Date(2025, 0, 1)
    const yearEnd = new Date(2025, 11, 31)
    const totalDays = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
    
    // Ensure project dates are within 2025, or default to reasonable values
    const projectStart = project.startDate && project.startDate.getFullYear() === 2025 
      ? project.startDate 
      : new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    
    const projectEnd = project.endDate && project.endDate.getFullYear() === 2025 
      ? project.endDate 
      : new Date(projectStart.getTime() + (30 + Math.floor(Math.random() * 90)) * 24 * 60 * 60 * 1000)
    
    const projectStartDays = Math.max(0, Math.ceil((projectStart.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)))
    const projectDurationDays = Math.max(1, Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)))
    
    const containerWidth = timeUnits.length * (viewMode === 'weeks' ? 100 : 120)
    const cellWidth = (viewMode === 'weeks' ? 100 : 120)
    
    return {
      left: Math.max(0, (projectStartDays / totalDays) * containerWidth),
      width: Math.max(cellWidth * 0.9, (projectDurationDays / totalDays) * containerWidth),
    }
  }

  // Get status color
  const getStatusColor = (status: MasterProject['status']) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500'
      case 'IN_PROGRESS': return 'bg-blue-500'
      case 'ON_HOLD': return 'bg-yellow-500'
      case 'REVIEW': return 'bg-purple-500'
      case 'PLANNING': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: MasterProject['priority']) => {
    switch (priority) {
      case 'URGENT': return 'border-red-500 shadow-red-500/30'
      case 'HIGH': return 'border-orange-500 shadow-orange-500/30'
      case 'MEDIUM': return 'border-yellow-500 shadow-yellow-500/30'
      default: return 'border-green-500 shadow-green-500/30'
    }
  }

  // Get priority icon
  const getPriorityIcon = (priority: MasterProject['priority']) => {
    switch (priority) {
      case 'URGENT': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'HIGH': return <TrendingUp className="w-4 h-4 text-orange-500" />
      case 'MEDIUM': return <BarChart3 className="w-4 h-4 text-yellow-500" />
      default: return <Circle className="w-4 h-4 text-green-500" />
    }
  }

  // Handle project click
  const handleProjectClick = (project: MasterProject) => {
    if (onProjectClick) {
      onProjectClick(project.id)
    } else {
      window.location.href = `/projects/${project.id}`
    }
  }

  // Format date for timeline headers
  const formatTimelineHeader = (date: Date) => {
    switch (viewMode) {
      case 'days':
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
      case 'weeks':
        const weekEnd = new Date(date)
        weekEnd.setDate(date.getDate() + 6)
        return `${date.getDate()}/${date.getMonth() + 1}`
      case 'months':
        const turkishMonths = [
          'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ]
        return `${turkishMonths[date.getMonth()]} 2025`
      default:
        return ''
    }
  }

  // Check if date is weekend
  const isWeekend = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // State for export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Synchronize horizontal scroll between header and body
  useEffect(() => {
    const chartElement = chartRef.current
    const headerElement = headerScrollRef.current

    if (!chartElement || !headerElement) return

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      target.scrollLeft = source.scrollLeft
    }

    const handleChartScroll = () => syncScroll(chartElement, headerElement)
    const handleHeaderScroll = () => syncScroll(headerElement, chartElement)

    chartElement.addEventListener('scroll', handleChartScroll)
    headerElement.addEventListener('scroll', handleHeaderScroll)

    return () => {
      chartElement.removeEventListener('scroll', handleChartScroll)
      headerElement.removeEventListener('scroll', handleHeaderScroll)
    }
  }, [])

  // Export functionality
  const handleExport = async (format: 'pdf' | 'png' | 'excel') => {
    setShowExportMenu(false)
    
    if (format === 'pdf' || format === 'png') {
      try {
        // Dynamic import to reduce bundle size
        const html2canvas = (await import('html2canvas')).default
        
        const element = chartRef.current
        if (!element) return

        // Create canvas from the chart element
        const canvas = await html2canvas(element, {
          useCORS: true,
          allowTaint: true
        })

        if (format === 'pdf') {
          // Create PDF
          const { default: jsPDF } = await import('jspdf')
          const imgData = canvas.toDataURL('image/png')
          const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'mm'
          })
          
          const pdfWidth = pdf.internal.pageSize.getWidth()
          const pdfHeight = pdf.internal.pageSize.getHeight()
          const imgWidth = canvas.width
          const imgHeight = canvas.height
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
          const imgX = (pdfWidth - imgWidth * ratio) / 2
          const imgY = 10

          pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
          pdf.save(`master-gantt-chart-${new Date().toISOString().split('T')[0]}.pdf`)
        } else {
          // Download as PNG
          const link = document.createElement('a')
          link.download = `master-gantt-chart-${new Date().toISOString().split('T')[0]}.png`
          link.href = canvas.toDataURL()
          link.click()
        }
      } catch (error) {
        console.error('Export failed:', error)
        alert('Dışa aktarma başarısız oldu. Lütfen tekrar deneyin.')
      }
    } else if (format === 'excel') {
      try {
        // Export project data to Excel
        const XLSX = await import('xlsx')
        
        const projectData = filteredAndSortedProjects.map(project => ({
          'Proje Adı': project.name,
          'Başlangıç Tarihi': project.startDate.toLocaleDateString('tr-TR'),
          'Planlanan Bitiş': project.plannedEndDate?.toLocaleDateString('tr-TR') || project.endDate.toLocaleDateString('tr-TR'),
          'Gerçek/Tahmini Bitiş': project.actualEndDate?.toLocaleDateString('tr-TR') || project.endDate.toLocaleDateString('tr-TR'),
          'Durum': project.status === 'IN_PROGRESS' ? 'Devam Ediyor' : 
                   project.status === 'COMPLETED' ? 'Tamamlandı' :
                   project.status === 'PLANNING' ? 'Planlama' : 
                   project.status === 'ON_HOLD' ? 'Beklemede' : 'İnceleme',
          'İlerleme (%)': project.progress,
          'Öncelik': project.priority === 'URGENT' ? 'Acil' :
                    project.priority === 'HIGH' ? 'Yüksek' :
                    project.priority === 'MEDIUM' ? 'Orta' : 'Düşük',
          'Takım Sayısı': project.teamCount,
          'Görev Sayısı': project.taskCount,
          'Tamamlanan Görevler': project.completedTasks,
          'Gecikmeli mi?': project.isDelayed ? 'Evet' : 'Hayır',
          'Gecikme (Gün)': project.delayDays || 0,
          'Bütçe': project.budget ? `₺${project.budget.toLocaleString('tr-TR')}` : 'N/A',
          'Harcanan': project.spent ? `₺${project.spent.toLocaleString('tr-TR')}` : 'N/A'
        }))

        const worksheet = XLSX.utils.json_to_sheet(projectData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Gantt Projeler')
        
        // Auto-size columns
        const colWidths = Object.keys(projectData[0] || {}).map(key => ({
          wch: Math.max(key.length, ...projectData.map(row => String(row[key as keyof typeof row] || '').length))
        }))
        worksheet['!cols'] = colWidths

        XLSX.writeFile(workbook, `master-gantt-projeler-${new Date().toISOString().split('T')[0]}.xlsx`)
      } catch (error) {
        console.error('Excel export failed:', error)
        alert('Excel dışa aktarma başarısız oldu. Lütfen tekrar deneyin.')
      }
    }
  }

  // Simple print function as fallback
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <style jsx>{`
        .gantt-scroll::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .gantt-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
        }
        .gantt-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 6px;
        }
        .gantt-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @media print {
          .gantt-scroll {
            overflow: visible !important;
          }
        }
        /* Ensure sticky positioning works correctly */
        .sticky {
          position: sticky;
          background: white;
        }
        /* Synchronize scroll between header and body */
        .sync-scroll {
          scrollbar-width: thin;
        }
      `}</style>
      
      {/* Simplified Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
        <div className="flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Proje Gantt Diyagramı</h2>
            <span className="text-sm text-blue-100">({filteredAndSortedProjects.length} proje)</span>
          </div>

          {/* Simple Controls */}
          <div className="flex items-center gap-3">
            {/* View Mode */}
            <div className="flex bg-white/20 rounded-lg">
              {['months', 'weeks'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-3 py-1 text-sm font-medium rounded ${
                    viewMode === mode
                      ? 'bg-white text-indigo-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {mode === 'months' ? 'Aylar' : 'Haftalar'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Container - Sticky Left Panel */}
      <div className="flex-1 flex flex-col">
        {/* Chart Header */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {/* Fixed Task Names Header */}
          <div className="w-80 p-3 font-semibold text-gray-700 bg-white border-r border-gray-200 flex-shrink-0 sticky left-0 z-20">
            <span>Görev Adı</span>
          </div>
          
          {/* Scrollable Timeline Headers */}
          <div ref={headerScrollRef} className="flex-1 overflow-x-auto gantt-scroll sync-scroll">
            <div className="flex" style={{ minWidth: `${timeUnits.length * (viewMode === 'weeks' ? 100 : 120)}px` }}>
              {timeUnits.map((date, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 p-2 text-center text-sm border-r border-gray-200 ${
                    isWeekend(date) && viewMode === 'days' ? 'bg-red-50' : 'bg-gray-50'
                  }`}
                  style={{ 
                    width: `${viewMode === 'weeks' ? 100 : 120}px`,
                    minWidth: `${viewMode === 'weeks' ? 100 : 120}px`
                  }}
                >
                  <div className="font-medium text-gray-700">{formatTimelineHeader(date)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Body */}
        <div className="flex flex-1" style={{ 
          minHeight: `${Math.max(400, filteredAndSortedProjects.length * 50)}px`
        }}>
          {/* Fixed Task Names Column */}
          <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 sticky left-0 z-10 overflow-y-auto">
            {filteredAndSortedProjects.map((project, index) => (
              <div
                key={project.id}
                className="px-3 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => handleProjectClick(project)}
                style={{ height: '50px' }}
              >
                <div className="flex items-center gap-3 h-full">
                  {/* Status Indicator */}
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`}></div>
                  
                  {/* Project Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate text-sm">
                      {project.name}
                    </h3>
                    <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                      <div>Planlanan: {project.plannedEndDate?.toLocaleDateString('tr-TR') || project.endDate?.toLocaleDateString('tr-TR')}</div>
                      <div className={`font-medium ${project.isDelayed ? 'text-red-600' : 'text-green-600'}`}>
                        Gerçek: {project.actualEndDate?.toLocaleDateString('tr-TR') || project.endDate?.toLocaleDateString('tr-TR')}
                        {project.delayDays && project.delayDays > 0 && (
                          <span className="ml-1 text-red-500">({project.delayDays} gün gecikme)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                    {project.status === 'IN_PROGRESS' ? 'Devam Ediyor' : 
                     project.status === 'COMPLETED' ? 'Tamamlandı' :
                     project.status === 'PLANNING' ? 'Planlama' : 'Beklemede'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Scrollable Chart Area */}
          <div ref={chartRef} className="flex-1 overflow-x-auto overflow-y-hidden gantt-scroll sync-scroll relative bg-white">
            <div className="relative" style={{ 
              minWidth: `${timeUnits.length * (viewMode === 'weeks' ? 100 : 120)}px`,
              height: `${filteredAndSortedProjects.length * 50}px`
            }}>
              {/* Today Line - Show current date in 2025 timeline */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 opacity-75"
                style={{
                  left: `${Math.max(0, Math.min(100, ((new Date(2025, 10, 12).getTime() - new Date(2025, 0, 1).getTime()) / (new Date(2025, 11, 31).getTime() - new Date(2025, 0, 1).getTime())) * 100))}%`
                }}
              >
                <div className="absolute -top-2 -left-8 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-30">
                  Bugün (12 Kas 2025)
                </div>
              </div>

              {/* Weekend/Holiday Columns */}
              <div className="absolute inset-0 flex pointer-events-none">
                {timeUnits.map((date, index) => (
                  isWeekend(date) && (
                    <div
                      key={`weekend-${index}`}
                      className="bg-red-50/40"
                      style={{ 
                        width: `${viewMode === 'weeks' ? 100 : 120}px`,
                        left: `${index * (viewMode === 'weeks' ? 100 : 120)}px`
                      }}
                    ></div>
                  )
                ))}
              </div>

              {/* Project Bars */}
              <div className="relative w-full h-full">
                {filteredAndSortedProjects.map((project, index) => {
                  const dimensions = getProjectDimensions(project)
                  return (
                    <div
                      key={project.id}
                      className="absolute flex items-center cursor-pointer group"
                      style={{
                        top: `${index * 50 + 15}px`,
                        left: `${dimensions.left}px`,
                        width: `${dimensions.width}px`,
                        height: '20px'
                      }}
                      onClick={() => handleProjectClick(project)}
                    >
                      {/* Simple Project Bar */}
                      <div 
                        className={`relative w-full h-full ${getStatusColor(project.status)} rounded group-hover:opacity-80 transition-opacity`}
                      >
                        {/* Progress indicator */}
                        <div 
                          className="absolute inset-0 bg-white/30 rounded"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                        
                        {/* Project Name on hover */}
                        <div className="absolute -top-8 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {project.name} ({project.progress}%)
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Status Legend */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span>Tamamlanan</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Devam Ediyor</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Beklemede</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>Planlama</span>
            </div>
          </div>
          
          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button 
              className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="w-4 h-4" />
              Dışa Aktar
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => handleExport('pdf')}
                >
                  <Download className="w-4 h-4 text-red-500" />
                  PDF olarak İndir
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => handleExport('png')}
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  Resim olarak İndir
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => handleExport('excel')}
                >
                  <Download className="w-4 h-4 text-green-500" />
                  Excel olarak İndir
                </button>
                <div className="border-t border-gray-200">
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    onClick={handlePrint}
                  >
                    <Download className="w-4 h-4 text-gray-500" />
                    Yazdır
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterGanttChart