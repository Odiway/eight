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

  // Calculate time units based on view mode
  const timeUnits = useMemo(() => {
    const units = []
    const start = new Date(projectStartDate)
    const end = new Date(projectEndDate)
    
    if (viewMode === 'days') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        units.push(new Date(d))
      }
    } else if (viewMode === 'weeks') {
      const startOfWeek = new Date(start)
      startOfWeek.setDate(start.getDate() - start.getDay())
      for (let d = new Date(startOfWeek); d <= end; d.setDate(d.getDate() + 7)) {
        units.push(new Date(d))
      }
    } else { // months
      const startYear = start.getFullYear()
      const startMonth = start.getMonth()
      const endYear = end.getFullYear()
      const endMonth = end.getMonth()
      
      for (let year = startYear; year <= endYear; year++) {
        const monthStart = year === startYear ? startMonth : 0
        const monthEnd = year === endYear ? endMonth : 11
        
        for (let month = monthStart; month <= monthEnd; month++) {
          units.push(new Date(year, month, 1))
        }
      }
    }
    
    return units
  }, [projectStartDate, projectEndDate, viewMode])

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

  // Calculate project position and width
  const getProjectDimensions = (project: MasterProject) => {
    const totalDays = Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const projectStartDays = Math.max(0, Math.ceil((project.startDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)))
    const projectDurationDays = Math.max(1, Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    const containerWidth = timeUnits.length * (viewMode === 'days' ? 80 : viewMode === 'weeks' ? 120 : 150) * zoomLevel
    const cellWidth = (viewMode === 'days' ? 80 : viewMode === 'weeks' ? 120 : 150) * zoomLevel
    
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
        return date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })
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
      
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          {/* Left Section - Title and Stats */}
          <div className="flex items-center gap-6">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Building className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Master Proje Gantt Şeması</h2>
              <div className="flex items-center gap-6 text-sm text-blue-100">
                <span className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4" />
                  {filteredAndSortedProjects.length} proje
                </span>
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {projects.filter(p => p.status === 'IN_PROGRESS').length} aktif
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {projects.filter(p => p.status === 'COMPLETED').length} tamamlanan
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Selector */}
            <div className="flex bg-white/20 rounded-lg p-1">
              {[
                { key: 'days', label: 'Günler', icon: Calendar },
                { key: 'weeks', label: 'Haftalar', icon: Grid },
                { key: 'months', label: 'Aylar', icon: BarChart3 }
              ].map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.key}
                    onClick={() => setViewMode(mode.key as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === mode.key
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {mode.label}
                  </button>
                )
              })}
            </div>

            {/* Filter Selector */}
            <div className="flex bg-white/20 rounded-lg p-1">
              {[
                { key: 'all', label: 'Tümü', icon: Grid },
                { key: 'active', label: 'Aktif', icon: Activity },
                { key: 'delayed', label: 'Geciken', icon: Clock },
                { key: 'high-priority', label: 'Yüksek Öncelik', icon: AlertTriangle }
              ].map((filter) => {
                const Icon = filter.icon
                return (
                  <button
                    key={filter.key}
                    onClick={() => setFilterMode(filter.key as any)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      filterMode === filter.key
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{filter.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="startDate" className="text-gray-900">Başlangıç Tarihi</option>
              <option value="priority" className="text-gray-900">Öncelik</option>
              <option value="progress" className="text-gray-900">İlerleme</option>
            </select>

            {/* Display Options */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowMilestones(!showMilestones)}
                className={`p-2 rounded-lg transition-all ${
                  showMilestones ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                }`}
                title="Kilometre Taşlarını Göster"
              >
                <Target className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowBudget(!showBudget)}
                className={`p-2 rounded-lg transition-all ${
                  showBudget ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                }`}
                title="Bütçe Bilgilerini Göster"
              >
                <DollarSign className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowTeams(!showTeams)}
                className={`p-2 rounded-lg transition-all ${
                  showTeams ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                }`}
                title="Takım Bilgilerini Göster"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCompactMode(!compactMode)}
                className={`p-2 rounded-lg transition-all ${
                  compactMode ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                }`}
                title="Kompakt Mod"
              >
                {compactMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="flex flex-col">
        {/* Timeline Header */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {/* Project Names Column Header */}
          <div className="w-96 p-4 font-semibold text-gray-700 bg-white border-r border-gray-200 flex items-center justify-between">
            <span>Projeler ({filteredAndSortedProjects.length})</span>
            <div className="flex gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Uzaklaştır"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Yakınlaştır"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Timeline Headers */}
          <div ref={timelineRef} className="flex-1 gantt-scroll overflow-x-auto">
            <div className="flex" style={{ 
              width: `${timeUnits.length * (viewMode === 'days' ? 80 : viewMode === 'weeks' ? 120 : 150) * zoomLevel}px`,
              minWidth: '100%'
            }}>
              {timeUnits.map((date, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 p-3 text-center text-sm font-medium border-r border-gray-200 ${
                    isWeekend(date) ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-700'
                  } ${isToday(date) ? 'bg-blue-100 text-blue-700 font-bold' : ''}`}
                  style={{ 
                    width: `${(viewMode === 'days' ? 80 : viewMode === 'weeks' ? 120 : 150) * zoomLevel}px`,
                    minWidth: `${(viewMode === 'days' ? 80 : viewMode === 'weeks' ? 120 : 150) * zoomLevel}px`
                  }}
                >
                  <div>{formatTimelineHeader(date)}</div>
                  {viewMode === 'months' && (
                    <div className="text-xs text-gray-500 mt-1">
                      {date.toLocaleDateString('tr-TR', { year: 'numeric' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projects and Chart Area */}
        <div ref={chartRef} className="flex gantt-scroll overflow-y-auto" style={{ 
          maxHeight: `${Math.max(400, filteredAndSortedProjects.length * (compactMode ? 80 : 120) + 40)}px`
        }}>
          {/* Project Names Column */}
          <div className="w-96 bg-white border-r border-gray-200">
            {filteredAndSortedProjects.map((project, index) => (
              <div
                key={project.id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group ${
                  compactMode ? 'py-3' : 'py-6'
                }`}
                onClick={() => handleProjectClick(project)}
                style={{ height: compactMode ? '80px' : '120px' }}
              >
                <div className="flex items-start gap-3 h-full">
                  {/* Status and Priority Indicators */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(project.status)} border-2 border-white shadow-sm`}></div>
                    {getPriorityIcon(project.priority)}
                  </div>
                  
                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors ${
                        compactMode ? 'text-base' : 'text-lg'
                      }`}>
                        {project.name}
                      </h3>
                      {project.isDelayed && (
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    {!compactMode && (
                      <>
                        {/* Progress Bar */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getStatusColor(project.status)} transition-all`}
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 font-medium min-w-[3rem]">
                            {project.progress}%
                          </span>
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {showTeams && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {project.teamCount} kişi
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {project.completedTasks}/{project.taskCount} görev
                          </span>
                          {showBudget && project.budget && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ₺{project.budget.toLocaleString('tr-TR')}
                            </span>
                          )}
                        </div>

                        {/* Manager */}
                        {project.manager && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {project.manager.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-600 truncate">
                              {project.manager.name}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Dates */}
                    <div className="text-xs text-gray-500 mt-1">
                      {project.startDate.toLocaleDateString('tr-TR')} - {project.endDate.toLocaleDateString('tr-TR')}
                      {project.isDelayed && project.delayDays && (
                        <span className="text-red-500 ml-2">
                          ({project.delayDays} gün gecikme)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Area */}
          <div className="flex-1 gantt-scroll overflow-x-auto relative">
            {/* Today Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 opacity-75"
              style={{
                left: `${Math.max(0, Math.min(100, ((currentDate.getTime() - projectStartDate.getTime()) / (projectEndDate.getTime() - projectStartDate.getTime())) * 100))}%`
              }}
            >
              <div className="absolute -top-2 -left-8 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-30">
                Bugün
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
              width: `${timeUnits.length * (viewMode === 'days' ? 80 : viewMode === 'weeks' ? 120 : 150) * zoomLevel}px`,
              minHeight: `${filteredAndSortedProjects.length * (compactMode ? 80 : 120)}px`,
              minWidth: '100%'
            }}>
              {filteredAndSortedProjects.map((project, index) => {
                const dimensions = getProjectDimensions(project)
                return (
                  <div
                    key={project.id}
                    className={`absolute flex items-center cursor-pointer group hover:z-10 ${
                      compactMode ? 'h-12' : 'h-16'
                    }`}
                    style={{
                      top: `${index * (compactMode ? 80 : 120) + (compactMode ? 20 : 30)}px`,
                      left: `${dimensions.left}px`,
                      width: `${dimensions.width}px`,
                    }}
                    onClick={() => handleProjectClick(project)}
                  >
                    {/* Project Bar */}
                    <div 
                      className={`relative w-full ${
                        compactMode ? 'h-10' : 'h-14'
                      } ${getStatusColor(project.status)} rounded-lg shadow-lg border-2 ${getPriorityColor(project.priority)} group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 overflow-hidden`}
                    >
                      {/* Progress Fill */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/40 transition-all"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                      
                      {/* Delay Indicator */}
                      {project.isDelayed && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                          <AlertTriangle className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      
                      {/* Project Text */}
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <span className={`text-white font-semibold truncate ${
                          compactMode ? 'text-sm' : 'text-base'
                        }`}>
                          {project.name}
                        </span>
                        {!compactMode && (
                          <div className="flex items-center gap-2 text-white/90 text-sm">
                            {showBudget && project.budget && (
                              <span>₺{(project.budget / 1000)}K</span>
                            )}
                            <span>{project.progress}%</span>
                          </div>
                        )}
                      </div>

                      {/* Hover Details */}
                      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-40 whitespace-nowrap pointer-events-none shadow-xl min-w-[250px]">
                        <div className="font-semibold text-white mb-1">{project.name}</div>
                        <div className="text-gray-300 text-xs mb-2">
                          {project.startDate.toLocaleDateString('tr-TR')} - {project.endDate.toLocaleDateString('tr-TR')}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-blue-300">İlerleme: {project.progress}%</div>
                          <div className="text-green-300">Takım: {project.teamCount} kişi</div>
                          <div className="text-purple-300">Görevler: {project.completedTasks}/{project.taskCount}</div>
                          {project.budget && (
                            <div className="text-yellow-300">Bütçe: ₺{project.budget.toLocaleString('tr-TR')}</div>
                          )}
                        </div>
                        {project.manager && (
                          <div className="text-indigo-300 text-xs mt-2">
                            Yönetici: {project.manager.name}
                          </div>
                        )}
                        {project.isDelayed && project.delayDays && (
                          <div className="text-red-300 text-xs mt-1 font-medium">
                            ⚠️ {project.delayDays} gün gecikme
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Milestones */}
                    {showMilestones && project.milestones.map((milestone, mIndex) => {
                      const milestonePosition = ((milestone.date.getTime() - project.startDate.getTime()) / (project.endDate.getTime() - project.startDate.getTime())) * 100
                      if (milestonePosition >= 0 && milestonePosition <= 100) {
                        return (
                          <div
                            key={milestone.id}
                            className="absolute top-0 w-0.5 h-full bg-yellow-400 z-10"
                            style={{ left: `${milestonePosition}%` }}
                            title={`${milestone.title} - ${milestone.date.toLocaleDateString('tr-TR')}`}
                          >
                            <div className={`absolute -top-1 -left-1.5 w-3 h-3 ${
                              milestone.completed ? 'bg-green-500' : 'bg-yellow-400'
                            } rounded-full border-2 border-white shadow-sm`}></div>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          {/* Status Legend */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Tamamlanan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Devam Eden</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm"></div>
              <span className="font-medium">Beklemede</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded-full shadow-sm"></div>
              <span className="font-medium">Planlama</span>
            </div>
            {showMilestones && (
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">Kilometre Taşları</span>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <button 
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              Dışa Aktar
            </button>
            <button 
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
              onClick={() => {
                setViewMode('months')
                setFilterMode('all')
                setZoomLevel(1)
                setCompactMode(false)
                setSortBy('startDate')
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterGanttChart