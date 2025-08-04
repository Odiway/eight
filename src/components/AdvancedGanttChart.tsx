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
  Play,
  Pause,
  Grid,
  List
} from 'lucide-react'

// Enhanced task interface for Gantt chart
export interface GanttTask {
  id: string
  title: string
  startDate: Date
  endDate: Date
  progress: number
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedUser?: {
    id: string
    name: string
    avatar?: string
  }
  dependencies?: string[]
  estimatedHours?: number
  actualHours?: number
  isBottleneck?: boolean
  isCriticalPath?: boolean
  delayDays?: number
  milestones?: Array<{
    id: string
    title: string
    date: Date
    completed: boolean
  }>
}

// Update handlers interface
export interface GanttTaskUpdate {
  startDate?: Date
  endDate?: Date
  progress?: number
  status?: GanttTask['status']
  assignedUserId?: string
}

export interface AdvancedGanttChartProps {
  tasks: GanttTask[]
  projectStartDate: Date
  projectEndDate: Date
  onTaskUpdate?: (taskId: string, updates: GanttTaskUpdate) => void
  onDependencyCreate?: (fromTaskId: string, toTaskId: string) => void
  onMilestoneAdd?: (taskId: string, milestone: { title: string; date: Date }) => void
}

const AdvancedGanttChart: React.FC<AdvancedGanttChartProps> = ({
  tasks,
  projectStartDate,
  projectEndDate,
  onTaskUpdate,
  onDependencyCreate,
  onMilestoneAdd,
}) => {
  // State management
  const [viewMode, setViewMode] = useState<'days' | 'weeks' | 'months'>('weeks')
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'delayed'>('all')
  const [showDependencies, setShowDependencies] = useState(true)
  const [showCriticalPath, setShowCriticalPath] = useState(true)
  const [showResources, setShowResources] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [zoomLevel, setZoomLevel] = useState(1)
  
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
      for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
        units.push(new Date(d))
      }
    }
    
    return units
  }, [projectStartDate, projectEndDate, viewMode])

  // Filter tasks based on current filter mode
  const filteredTasks = useMemo(() => {
    switch (filterMode) {
      case 'critical':
        return tasks.filter(task => task.isCriticalPath || task.priority === 'URGENT')
      case 'delayed':
        return tasks.filter(task => task.delayDays && task.delayDays > 0)
      default:
        return tasks
    }
  }, [tasks, filterMode])

  // Calculate task position and width
  const getTaskDimensions = (task: GanttTask) => {
    const totalDays = Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const taskStartDays = Math.ceil((task.startDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const taskDurationDays = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const containerWidth = timeUnits.length * (viewMode === 'days' ? 40 : viewMode === 'weeks' ? 80 : 120) * zoomLevel
    
    return {
      left: (taskStartDays / totalDays) * containerWidth,
      width: Math.max((taskDurationDays / totalDays) * containerWidth, 20),
    }
  }

  // Get status color
  const getStatusColor = (status: GanttTask['status']) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500'
      case 'IN_PROGRESS': return 'bg-blue-500'
      case 'REVIEW':
      case 'IN_REVIEW': return 'bg-purple-500'
      case 'BLOCKED': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: GanttTask['priority']) => {
    switch (priority) {
      case 'URGENT': return 'border-red-500 shadow-red-500/30'
      case 'HIGH': return 'border-orange-500 shadow-orange-500/30'
      case 'MEDIUM': return 'border-yellow-500 shadow-yellow-500/30'
      default: return 'border-green-500 shadow-green-500/30'
    }
  }

  // Handle task drag
  const handleTaskDragStart = (taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleTaskDragEnd = () => {
    setDraggedTask(null)
  }

  // Handle task click
  const handleTaskClick = (task: GanttTask) => {
    console.log('Task clicked:', task)
  }

  // Format date for timeline headers
  const formatTimelineHeader = (date: Date) => {
    switch (viewMode) {
      case 'days':
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
      case 'weeks':
        const weekEnd = new Date(date)
        weekEnd.setDate(date.getDate() + 6)
        return `${date.getDate()}/${date.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`
      case 'months':
        return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
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

  return (
    <div className="w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Section - Title and Info */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Gelişmiş Gantt Şeması</h2>
              <p className="text-indigo-100 text-sm">
                {filteredTasks.length} görev • {viewMode === 'days' ? 'Günlük' : viewMode === 'weeks' ? 'Haftalık' : 'Aylık'} görünüm
              </p>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Selector */}
            <div className="flex bg-white/20 rounded-lg p-1">
              {['days', 'weeks', 'months'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {mode === 'days' ? 'Günler' : mode === 'weeks' ? 'Haftalar' : 'Aylar'}
                </button>
              ))}
            </div>

            {/* Filter Selector */}
            <div className="flex bg-white/20 rounded-lg p-1">
              {[
                { key: 'all', label: 'Tümü', icon: Grid },
                { key: 'critical', label: 'Kritik', icon: AlertTriangle },
                { key: 'delayed', label: 'Geciken', icon: Clock }
              ].map((filter) => {
                const Icon = filter.icon
                return (
                  <button
                    key={filter.key}
                    onClick={() => setFilterMode(filter.key as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      filterMode === filter.key
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                )
              })}
            </div>

            {/* Display Options */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDependencies(!showDependencies)}
                className={`p-2 rounded-lg transition-all ${
                  showDependencies ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                }`}
                title="Bağımlılıkları Göster"
              >
                <Target className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCriticalPath(!showCriticalPath)}
                className={`p-2 rounded-lg transition-all ${
                  showCriticalPath ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                }`}
                title="Kritik Yolu Göster"
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowResources(!showResources)}
                className={`p-2 rounded-lg transition-all ${
                  showResources ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                }`}
                title="Kaynakları Göster"
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
          {/* Task Names Column Header */}
          <div className="w-80 p-4 font-semibold text-gray-700 bg-white border-r border-gray-200 flex items-center justify-between">
            <span>Görevler ({filteredTasks.length})</span>
            <div className="flex gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                className="p-1 hover:bg-gray-100 rounded"
                title="Uzaklaştır"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                className="p-1 hover:bg-gray-100 rounded"
                title="Yakınlaştır"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Timeline Headers */}
          <div ref={timelineRef} className="flex-1 overflow-x-auto">
            <div className="flex" style={{ width: `${timeUnits.length * (viewMode === 'days' ? 40 : viewMode === 'weeks' ? 80 : 120) * zoomLevel}px` }}>
              {timeUnits.map((date, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 p-2 text-center text-xs font-medium border-r border-gray-200 ${
                    isWeekend(date) ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-700'
                  } ${isToday(date) ? 'bg-blue-100 text-blue-700 font-bold' : ''}`}
                  style={{ 
                    width: `${(viewMode === 'days' ? 40 : viewMode === 'weeks' ? 80 : 120) * zoomLevel}px`,
                    minWidth: `${(viewMode === 'days' ? 40 : viewMode === 'weeks' ? 80 : 120) * zoomLevel}px`
                  }}
                >
                  {formatTimelineHeader(date)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks and Chart Area */}
        <div ref={chartRef} className="flex max-h-96 overflow-y-auto">
          {/* Task Names Column */}
          <div className="w-80 bg-white border-r border-gray-200">
            {filteredTasks.map((task, index) => (
              <div
                key={task.id}
                className={`p-3 border-b border-gray-100 ${compactMode ? 'py-2' : 'py-3'} hover:bg-gray-50 transition-colors cursor-pointer`}
                onClick={() => handleTaskClick(task)}
                style={{ height: compactMode ? '50px' : '60px' }}
              >
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
                  
                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-gray-900 truncate ${compactMode ? 'text-sm' : 'text-base'}`}>
                        {task.title}
                      </p>
                      {task.isCriticalPath && showCriticalPath && (
                        <Zap className="w-4 h-4 text-orange-500" />
                      )}
                      {task.isBottleneck && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    
                    {!compactMode && (
                      <div className="flex items-center gap-3 mt-1">
                        {/* Progress */}
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getStatusColor(task.status)} transition-all`}
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{task.progress}%</span>
                        </div>
                        
                        {/* Assigned User */}
                        {showResources && task.assignedUser && (
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {task.assignedUser.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-500 truncate max-w-16" title={task.assignedUser.name}>
                              {task.assignedUser.name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Area */}
          <div className="flex-1 overflow-x-auto relative">
            {/* Today Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 opacity-75"
              style={{
                left: `${((currentDate.getTime() - projectStartDate.getTime()) / (projectEndDate.getTime() - projectStartDate.getTime())) * 100}%`
              }}
            >
              <div className="absolute -top-2 -left-8 bg-red-500 text-white text-xs px-2 py-1 rounded">
                Bugün
              </div>
            </div>

            {/* Weekend Columns */}
            <div className="absolute inset-0 flex pointer-events-none">
              {timeUnits.map((date, index) => (
                isWeekend(date) && (
                  <div
                    key={`weekend-${index}`}
                    className="bg-gray-100/50"
                    style={{ 
                      width: `${(viewMode === 'days' ? 40 : viewMode === 'weeks' ? 80 : 120) * zoomLevel}px`,
                      left: `${index * (viewMode === 'days' ? 40 : viewMode === 'weeks' ? 80 : 120) * zoomLevel}px`
                    }}
                  ></div>
                )
              ))}
            </div>

            {/* Task Bars */}
            <div className="relative" style={{ width: `${timeUnits.length * (viewMode === 'days' ? 40 : viewMode === 'weeks' ? 80 : 120) * zoomLevel}px` }}>
              {filteredTasks.map((task, index) => {
                const dimensions = getTaskDimensions(task)
                return (
                  <div
                    key={task.id}
                    className={`absolute flex items-center ${compactMode ? 'h-8' : 'h-12'} cursor-move group hover:z-10`}
                    style={{
                      top: `${index * (compactMode ? 50 : 60) + (compactMode ? 11 : 14)}px`,
                      left: `${dimensions.left}px`,
                      width: `${dimensions.width}px`,
                    }}
                    draggable
                    onDragStart={() => handleTaskDragStart(task.id)}
                    onDragEnd={handleTaskDragEnd}
                  >
                    {/* Task Bar */}
                    <div 
                      className={`relative w-full ${compactMode ? 'h-6' : 'h-8'} ${getStatusColor(task.status)} rounded-lg shadow-sm border-2 ${getPriorityColor(task.priority)} group-hover:shadow-lg transition-all overflow-hidden`}
                    >
                      {/* Progress Fill */}
                      <div 
                        className="absolute inset-0 bg-white/20 transition-all"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                      
                      {/* Task Text */}
                      <div className="absolute inset-0 flex items-center justify-between px-2">
                        <span className={`text-white font-medium truncate ${compactMode ? 'text-xs' : 'text-sm'}`}>
                          {task.title}
                        </span>
                        {!compactMode && task.estimatedHours && (
                          <span className="text-white/80 text-xs">
                            {task.estimatedHours}h
                          </span>
                        )}
                      </div>

                      {/* Hover Details */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-gray-300">
                          {task.startDate.toLocaleDateString('tr-TR')} - {task.endDate.toLocaleDateString('tr-TR')}
                        </div>
                        {task.estimatedHours && (
                          <div className="text-gray-300">{task.estimatedHours} saat</div>
                        )}
                        <div className="text-gray-300">İlerleme: {task.progress}%</div>
                      </div>
                    </div>

                    {/* Milestones */}
                    {task.milestones && task.milestones.map((milestone, mIndex) => (
                      <div
                        key={milestone.id}
                        className="absolute top-0 w-0.5 h-full bg-yellow-500"
                        style={{
                          left: `${((milestone.date.getTime() - task.startDate.getTime()) / (task.endDate.getTime() - task.startDate.getTime())) * 100}%`
                        }}
                        title={milestone.title}
                      >
                        <div className="absolute -top-2 -left-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"></div>
                      </div>
                    ))}
                  </div>
                )
              })}

              {/* Dependencies Lines */}
              {showDependencies && filteredTasks.map(task => 
                task.dependencies?.map(depId => {
                  const depTask = filteredTasks.find(t => t.id === depId)
                  if (!depTask) return null
                  
                  const taskIndex = filteredTasks.findIndex(t => t.id === task.id)
                  const depIndex = filteredTasks.findIndex(t => t.id === depId)
                  const taskDimensions = getTaskDimensions(task)
                  const depDimensions = getTaskDimensions(depTask)
                  
                  return (
                    <svg
                      key={`${depId}-${task.id}`}
                      className="absolute inset-0 pointer-events-none"
                      style={{ zIndex: 5 }}
                    >
                      <line
                        x1={depDimensions.left + depDimensions.width}
                        y1={depIndex * (compactMode ? 50 : 60) + (compactMode ? 25 : 30)}
                        x2={taskDimensions.left}
                        y2={taskIndex * (compactMode ? 50 : 60) + (compactMode ? 25 : 30)}
                        stroke={task.isCriticalPath ? "#ef4444" : "#6b7280"}
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                        className="opacity-70"
                      />
                    </svg>
                  )
                })
              )}

              {/* Arrow marker definition */}
              <svg className="absolute" width="0" height="0">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="10"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#6b7280"
                    />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span>Tamamlanan: {tasks.filter(t => t.status === 'COMPLETED').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Devam Eden: {tasks.filter(t => t.status === 'IN_PROGRESS').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Bekleyen: {tasks.filter(t => t.status === 'TODO').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span>Kritik: {tasks.filter(t => t.isCriticalPath).length}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4" />
              Dışa Aktar
            </button>
            <button 
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              onClick={() => {
                setViewMode('weeks')
                setFilterMode('all')
                setZoomLevel(1)
                setCompactMode(false)
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

export default AdvancedGanttChart
