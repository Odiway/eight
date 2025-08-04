'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  Filter,
  Download,
  Settings,
  AlertTriangle,
  Clock,
  Users,
  Target,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react'

interface GanttTask {
  id: string
  title: string
  startDate: Date
  endDate: Date
  progress: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED'
  assignedUsers: Array<{
    user: {
      id: string
      name: string
      avatar?: string
    }
  }>
  dependencies: string[]
  estimatedHours: number
  actualHours?: number
  isOnCriticalPath?: boolean
  milestones?: Array<{
    id: string
    title: string
    date: Date
    completed: boolean
  }>
}

interface GanttChartProps {
  tasks: GanttTask[]
  projectStartDate: Date
  projectEndDate: Date
  onTaskUpdate?: (taskId: string, updates: Partial<GanttTask>) => void
  onDependencyCreate?: (fromTaskId: string, toTaskId: string) => void
  onMilestoneAdd?: (taskId: string, milestone: { title: string; date: Date }) => void
}

type ViewMode = 'days' | 'weeks' | 'months'
type FilterMode = 'all' | 'critical' | 'delayed' | 'assigned-to-me'

export default function AdvancedGanttChart({
  tasks,
  projectStartDate,
  projectEndDate,
  onTaskUpdate,
  onDependencyCreate,
  onMilestoneAdd
}: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('weeks')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [showDependencies, setShowDependencies] = useState(true)
  const [showCriticalPath, setShowCriticalPath] = useState(true)
  const [dragState, setDragState] = useState<{
    taskId: string | null
    mode: 'move' | 'resize-start' | 'resize-end' | null
    startX: number
    originalStartDate: Date | null
    originalEndDate: Date | null
  }>({
    taskId: null,
    mode: null,
    startX: 0,
    originalStartDate: null,
    originalEndDate: null
  })

  // Calculate time periods based on view mode
  const timeScale = useMemo(() => {
    const periods: Array<{ date: Date; label: string; isWeekend?: boolean }> = []
    const start = new Date(projectStartDate)
    const end = new Date(projectEndDate)
    
    // Add buffer for better visualization
    start.setDate(start.getDate() - 7)
    end.setDate(end.getDate() + 7)
    
    let current = new Date(start)
    
    switch (viewMode) {
      case 'days':
        while (current <= end) {
          periods.push({
            date: new Date(current),
            label: current.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
            isWeekend: current.getDay() === 0 || current.getDay() === 6
          })
          current.setDate(current.getDate() + 1)
        }
        break
      case 'weeks':
        // Start from Monday of the week
        current.setDate(current.getDate() - current.getDay() + 1)
        while (current <= end) {
          periods.push({
            date: new Date(current),
            label: `${current.getDate()}/${current.getMonth() + 1}`
          })
          current.setDate(current.getDate() + 7)
        }
        break
      case 'months':
        current.setDate(1)
        while (current <= end) {
          periods.push({
            date: new Date(current),
            label: current.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })
          })
          current.setMonth(current.getMonth() + 1)
        }
        break
    }
    
    return periods
  }, [projectStartDate, projectEndDate, viewMode])

  // Filter tasks based on current filter mode
  const filteredTasks = useMemo(() => {
    switch (filterMode) {
      case 'critical':
        return tasks.filter(task => task.isOnCriticalPath || task.priority === 'URGENT')
      case 'delayed':
        return tasks.filter(task => {
          const today = new Date()
          return task.endDate < today && task.status !== 'COMPLETED'
        })
      case 'assigned-to-me':
        // This would need user context - placeholder for now
        return tasks.filter(task => task.assignedUsers.length > 0)
      default:
        return tasks
    }
  }, [tasks, filterMode])

  // Calculate task position and width
  const getTaskDimensions = (task: GanttTask) => {
    const startTime = task.startDate.getTime()
    const endTime = task.endDate.getTime()
    const projectStartTime = timeScale[0].date.getTime()
    const projectEndTime = timeScale[timeScale.length - 1].date.getTime()
    
    const totalDuration = projectEndTime - projectStartTime
    const taskStart = startTime - projectStartTime
    const taskDuration = endTime - startTime
    
    const left = (taskStart / totalDuration) * 100
    const width = (taskDuration / totalDuration) * 100
    
    return { left: Math.max(0, left), width: Math.max(1, width) }
  }

  // Get priority color
  const getPriorityColor = (priority: string, status: string) => {
    if (status === 'COMPLETED') return 'bg-green-500'
    if (status === 'BLOCKED') return 'bg-red-500'
    
    switch (priority) {
      case 'URGENT': return 'bg-red-600'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-blue-500'
      case 'LOW': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  // Handle task drag operations
  const handleMouseDown = (e: React.MouseEvent, taskId: string, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault()
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    setDragState({
      taskId,
      mode,
      startX: e.clientX,
      originalStartDate: new Date(task.startDate),
      originalEndDate: new Date(task.endDate)
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.taskId || !dragState.mode) return

    const deltaX = e.clientX - dragState.startX
    const timelineWidth = e.currentTarget.getBoundingClientRect().width
    const totalDuration = timeScale[timeScale.length - 1].date.getTime() - timeScale[0].date.getTime()
    const deltaTime = (deltaX / timelineWidth) * totalDuration

    // Calculate new dates based on drag mode
    let newStartDate = new Date(dragState.originalStartDate!.getTime())
    let newEndDate = new Date(dragState.originalEndDate!.getTime())

    switch (dragState.mode) {
      case 'move':
        newStartDate.setTime(newStartDate.getTime() + deltaTime)
        newEndDate.setTime(newEndDate.getTime() + deltaTime)
        break
      case 'resize-start':
        newStartDate.setTime(newStartDate.getTime() + deltaTime)
        break
      case 'resize-end':
        newEndDate.setTime(newEndDate.getTime() + deltaTime)
        break
    }

    // Update task (you'd want to implement optimistic updates here)
    if (onTaskUpdate) {
      onTaskUpdate(dragState.taskId, {
        startDate: newStartDate,
        endDate: newEndDate
      })
    }
  }

  const handleMouseUp = () => {
    setDragState({
      taskId: null,
      mode: null,
      startX: 0,
      originalStartDate: null,
      originalEndDate: null
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header Controls */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <h2 className="text-xl font-bold">Gelişmiş Gantt Şeması</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* View Mode Selector */}
            <div className="flex bg-white/20 rounded-lg p-1">
              {(['days', 'weeks', 'months'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === mode ? 'bg-white text-blue-600' : 'text-white hover:bg-white/20'
                  }`}
                >
                  {mode === 'days' ? 'Günler' : mode === 'weeks' ? 'Haftalar' : 'Aylar'}
                </button>
              ))}
            </div>

            {/* Filter Selector */}
            <div className="flex bg-white/20 rounded-lg p-1">
              {([
                { key: 'all', label: 'Tümü' },
                { key: 'critical', label: 'Kritik' },
                { key: 'delayed', label: 'Geciken' },
                { key: 'assigned-to-me', label: 'Bana Atanan' }
              ] as Array<{ key: FilterMode; label: string }>).map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilterMode(filter.key)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    filterMode === filter.key ? 'bg-white text-blue-600' : 'text-white hover:bg-white/20'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showDependencies}
                onChange={(e) => setShowDependencies(e.target.checked)}
                className="rounded"
              />
              Bağımlılıklar
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showCriticalPath}
                onChange={(e) => setShowCriticalPath(e.target.checked)}
                className="rounded"
              />
              Kritik Yol
            </label>
          </div>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {/* Task Names Column */}
          <div className="w-80 border-r border-gray-200 p-4 bg-white">
            <h3 className="font-semibold text-gray-900">Görevler</h3>
          </div>

          {/* Timeline Scale */}
          <div className="flex-1 flex">
            {timeScale.map((period, index) => (
              <div
                key={index}
                className={`flex-1 p-2 text-center border-r border-gray-200 text-sm font-medium ${
                  period.isWeekend ? 'bg-gray-100 text-gray-500' : 'text-gray-700'
                }`}
              >
                {period.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <div 
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {filteredTasks.map((task, taskIndex) => {
          const dimensions = getTaskDimensions(task)
          const isSelected = selectedTask === task.id
          const isOverdue = new Date() > task.endDate && task.status !== 'COMPLETED'

          return (
            <div
              key={task.id}
              className={`flex border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-blue-50' : ''
              }`}
            >
              {/* Task Info Column */}
              <div className="w-80 border-r border-gray-200 p-4 bg-white">
                <div
                  className="cursor-pointer"
                  onClick={() => setSelectedTask(isSelected ? null : task.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority, task.status)}`}
                    />
                    <h4 className="font-medium text-gray-900 text-sm truncate flex-1">
                      {task.title}
                    </h4>
                    {task.isOnCriticalPath && showCriticalPath && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    {isOverdue && (
                      <Clock className="w-4 h-4 text-orange-500" />
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {task.startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - 
                      {task.endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span>{task.progress}%</span>
                  </div>

                  {/* Assigned Users */}
                  {task.assignedUsers.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {task.assignedUsers.slice(0, 3).map((assignment, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          title={assignment.user.name}
                        >
                          {assignment.user.name.charAt(0)}
                        </div>
                      ))}
                      {task.assignedUsers.length > 3 && (
                        <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                          +{task.assignedUsers.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Column */}
              <div className="flex-1 relative p-2">
                {/* Weekend Background */}
                {timeScale.map((period, index) => (
                  period.isWeekend && (
                    <div
                      key={index}
                      className="absolute top-0 bottom-0 bg-gray-100/50 pointer-events-none"
                      style={{
                        left: `${(index / timeScale.length) * 100}%`,
                        width: `${(1 / timeScale.length) * 100}%`
                      }}
                    />
                  )
                ))}

                {/* Task Bar */}
                <div
                  className={`relative h-8 rounded-lg shadow-sm border-2 cursor-move transition-all ${
                    getPriorityColor(task.priority, task.status)
                  } ${
                    isSelected ? 'ring-2 ring-blue-400 shadow-lg' : ''
                  } ${
                    task.isOnCriticalPath && showCriticalPath ? 'ring-2 ring-red-400' : ''
                  }`}
                  style={{
                    left: `${dimensions.left}%`,
                    width: `${dimensions.width}%`
                  }}
                  onMouseDown={(e) => handleMouseDown(e, task.id, 'move')}
                >
                  {/* Progress Bar */}
                  <div
                    className="h-full bg-white/30 rounded-lg transition-all"
                    style={{ width: `${task.progress}%` }}
                  />

                  {/* Task Label */}
                  <div className="absolute inset-0 flex items-center px-2">
                    <span className="text-white text-xs font-medium truncate">
                      {task.title}
                    </span>
                  </div>

                  {/* Resize Handles */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l-lg"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleMouseDown(e, task.id, 'resize-start')
                    }}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-lg"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleMouseDown(e, task.id, 'resize-end')
                    }}
                  />

                  {/* Milestones */}
                  {task.milestones?.map((milestone, idx) => {
                    const milestoneTime = milestone.date.getTime()
                    const projectStartTime = timeScale[0].date.getTime()
                    const projectEndTime = timeScale[timeScale.length - 1].date.getTime()
                    const milestonePosition = ((milestoneTime - projectStartTime) / (projectEndTime - projectStartTime)) * 100

                    return (
                      <div
                        key={idx}
                        className={`absolute top-0 bottom-0 w-1 ${
                          milestone.completed ? 'bg-green-400' : 'bg-yellow-400'
                        }`}
                        style={{ left: `${milestonePosition}%` }}
                        title={milestone.title}
                      />
                    )
                  })}
                </div>

                {/* Dependencies */}
                {showDependencies && task.dependencies.map((depId) => {
                  const depTask = tasks.find(t => t.id === depId)
                  if (!depTask) return null

                  const depTaskIndex = tasks.findIndex(t => t.id === depId)
                  const currentTaskY = taskIndex * 56 + 28 // Approximate row height
                  const depTaskY = depTaskIndex * 56 + 28

                  const depDimensions = getTaskDimensions(depTask)
                  const currentDimensions = getTaskDimensions(task)

                  return (
                    <svg
                      key={depId}
                      className="absolute inset-0 pointer-events-none"
                      style={{ zIndex: 1 }}
                    >
                      <path
                        d={`M ${depDimensions.left + depDimensions.width}% ${depTaskY - currentTaskY + 28}
                           L ${currentDimensions.left}% 28`}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                      />
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon
                            points="0 0, 10 3.5, 0 7"
                            fill="#3b82f6"
                          />
                        </marker>
                      </defs>
                    </svg>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Task Details Sidebar */}
      {selectedTask && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          {(() => {
            const task = tasks.find(t => t.id === selectedTask)
            if (!task) return null

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Görev Detayları</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Durum:</span> {task.status}</div>
                    <div><span className="font-medium">Öncelik:</span> {task.priority}</div>
                    <div><span className="font-medium">İlerleme:</span> {task.progress}%</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Zaman Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Başlangıç:</span> {task.startDate.toLocaleDateString('tr-TR')}</div>
                    <div><span className="font-medium">Bitiş:</span> {task.endDate.toLocaleDateString('tr-TR')}</div>
                    <div><span className="font-medium">Tahmini Süre:</span> {task.estimatedHours}h</div>
                    {task.actualHours && (
                      <div><span className="font-medium">Gerçek Süre:</span> {task.actualHours}h</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Atanan Kişiler</h4>
                  <div className="space-y-2">
                    {task.assignedUsers.map((assignment, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {assignment.user.name.charAt(0)}
                        </div>
                        {assignment.user.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
