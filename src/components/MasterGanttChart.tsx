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
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'delayed' | 'high-priority'>('all')
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
      case 'high-priority':
        filtered = filtered.filter(p => p.priority === 'HIGH' || p.priority === 'URGENT')
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

  // Export functionality
  const handleExport = () => {
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

      {/* Main Chart Container */}
      <div className="flex flex-col">
        {/* Timeline Header */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {/* Project Names Column Header */}
          <div className="w-80 p-3 font-semibold text-gray-700 bg-white border-r border-gray-200">
            <span>Görev Adı</span>
          </div>
          
          {/* Timeline Headers */}
          <div ref={timelineRef} className="flex-1 overflow-x-auto">
            <div className="flex" style={{ 
              minWidth: `${timeUnits.length * (viewMode === 'weeks' ? 100 : 120)}px`
            }}>
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

        {/* Projects and Chart Area */}
        <div ref={chartRef} className="flex overflow-y-auto" style={{ 
          height: `${Math.min(600, Math.max(300, filteredAndSortedProjects.length * 50))}px`
        }}>
          {/* Project Names Column */}
          <div className="w-80 bg-white border-r border-gray-200">
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
                    <div className="text-xs text-gray-500 mt-0.5">
                      {project.startDate?.toLocaleDateString('tr-TR')} - {project.endDate?.toLocaleDateString('tr-TR')}
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

          {/* Chart Area */}
          <div className="flex-1 overflow-x-auto relative bg-white">
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
            <div className="absolute inset-0 flex pointer-events-none" style={{ 
              minHeight: `${filteredAndSortedProjects.length * (compactMode ? 80 : 120)}px` 
            }}>
              {timeUnits.map((date, index) => (
                isWeekend(date) && (
                  <div
                    key={`weekend-${index}`}
                    className="bg-red-50/40"
                    style={{ 
                      width: `${(viewMode === 'days' ? 80 : viewMode === 'weeks' ? 120 : 150) * zoomLevel}px`,
                      left: `${index * (viewMode === 'days' ? 80 : viewMode === 'weeks' ? 120 : 150) * zoomLevel}px`
                    }}
                  ></div>
                )
              ))}
            </div>

            {/* Project Bars */}
            <div className="relative" style={{ 
              minWidth: `${timeUnits.length * (viewMode === 'weeks' ? 100 : 120)}px`,
              minHeight: `${filteredAndSortedProjects.length * 50}px`
            }}>
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
          
          {/* Export button */}
          <button 
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            onClick={handleExport}
          >
            Dışa Aktar
          </button>
        </div>
      </div>
    </div>
  )
}

export default MasterGanttChart