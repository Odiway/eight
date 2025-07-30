'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  RefreshCw, 
  TrendingDown,
  Eye,
  Zap,
  Target,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Timer,
  Layers,
  Filter,
  Circle,
  X
} from 'lucide-react'
import { WorkloadAnalyzer, WorkloadData, getWorkloadColor, getWorkloadLabel } from '@/lib/workload-analysis'
import ImprovedWorkloadViewer from '@/components/ImprovedWorkloadViewer'

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'BLOCKED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate?: Date
  endDate?: Date
  assignedId?: string
  estimatedHours?: number
  actualHours?: number
  delayReason?: string
  delayDays: number
  workloadPercentage: number
  isBottleneck: boolean
  originalEndDate?: Date
  assignedUser?: {
    id: string
    name: string
    maxHoursPerDay: number
  }
  assignedUsers?: Array<{
    userId: string
    user: {
      id: string
      name: string
    }
  }>
}

interface Project {
  id: string
  name: string
  startDate?: Date
  endDate?: Date
  originalEndDate?: Date
  delayDays: number
  autoReschedule: boolean
}

interface EnhancedCalendarProps {
  tasks: Task[]
  project: Project
  users: any[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onProjectReschedule: (rescheduleType: string) => void
}

function ImprovedEnhancedCalendar({ 
  tasks, 
  project, 
  users, 
  onTaskUpdate, 
  onProjectReschedule 
}: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'workload' | 'timeline'>('calendar')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([])
  const [dayTasks, setDayTasks] = useState<Task[]>([])
  const [showDayModal, setShowDayModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [calendarLayout, setCalendarLayout] = useState<'standard' | 'compact' | 'detailed'>('detailed')

  // Calculate workload data
  useEffect(() => {
    if (project.startDate && project.endDate) {
      const startDate = new Date(project.startDate)
      const endDate = new Date(project.endDate)
      
      const tasksForAnalyzer = tasks.map(task => ({
        ...task,
        projectId: project.id,
        createdById: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        workflowStepId: null,
        completedAt: null,
        assignedId: task.assignedId || null,
        startDate: task.startDate || null,
        endDate: task.endDate || null,
        description: task.description || null,
        originalEndDate: task.originalEndDate || null,
        estimatedHours: task.estimatedHours ?? null,
        actualHours: task.actualHours ?? null,
        delayReason: task.delayReason ?? null,
        delayDays: task.delayDays ?? 0,
        workloadPercentage: task.workloadPercentage ?? 0,
        isBottleneck: task.isBottleneck ?? false,
      }))

      // Calculate workload using static methods
      const dailyWorkload = []
      const currentDay = new Date(startDate)
      while (currentDay <= endDate) {
        // Use WorkloadAnalyzer static method to calculate daily workload
        const dayWorkload = users.map(user => {
          const userTasks = tasksForAnalyzer.filter(task => {
            if (!task.startDate || !task.endDate) return false
            
            // Check both assignment systems: legacy assignedId and new assignedUsers
            const isAssignedToUser = task.assignedId === user.id || 
              (task.assignedUsers && task.assignedUsers.some((assignment: any) => assignment.userId === user.id))
            
            if (!isAssignedToUser) return false
            
            const taskStart = new Date(task.startDate)
            const taskEnd = new Date(task.endDate)
            const checkDate = new Date(currentDay)
            
            taskStart.setHours(0, 0, 0, 0)
            taskEnd.setHours(0, 0, 0, 0)
            checkDate.setHours(0, 0, 0, 0)
            
            return checkDate >= taskStart && checkDate <= taskEnd
          })

          const totalHours = userTasks.reduce((sum, task) => {
            if (!task.estimatedHours) return sum + 4 // Default 4 hours
            
            const taskStart = new Date(task.startDate!)
            const taskEnd = new Date(task.endDate!)
            const workingDays = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)))
            
            return sum + (task.estimatedHours / workingDays)
          }, 0)

          const maxHours = user.maxHoursPerDay || 8
          const workloadPercent = Math.round((totalHours / maxHours) * 100)

          return {
            userId: user.id,
            userName: user.name,
            date: currentDay.toISOString().split('T')[0],
            workloadPercent,
            hoursAllocated: totalHours,
            hoursAvailable: maxHours,
            isOverloaded: workloadPercent > 100,
            tasks: userTasks
          } as WorkloadData
        })
        
        dailyWorkload.push(...dayWorkload)
        currentDay.setDate(currentDay.getDate() + 1)
      }
      
      setWorkloadData(dailyWorkload)
    }
  }, [tasks, users, project])

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.startDate || !task.endDate) return false
      
      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      const checkDate = new Date(date)
      
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)
      checkDate.setHours(0, 0, 0, 0)
      
      const dateMatch = checkDate >= taskStart && checkDate <= taskEnd
      
      // Apply filters
      const statusMatch = statusFilter === 'all' || task.status === statusFilter
      const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter
      
      return dateMatch && statusMatch && priorityMatch
    })
  }

  // New function to check if a task is overdue
  const isTaskOverdue = (task: Task, currentDate: Date = new Date()): boolean => {
    if (!task.endDate || task.status === 'COMPLETED') return false
    
    const taskDeadline = new Date(task.endDate)
    const today = new Date(currentDate)
    
    // Set both dates to the start of their respective days for accurate comparison
    taskDeadline.setHours(23, 59, 59, 999) // End of deadline day
    today.setHours(23, 59, 59, 999) // End of current day
    
    // A task is overdue only if the current day is completely past the deadline
    return today > taskDeadline
  }

  // Function to get overdue tasks for a specific date
  const getOverdueTasksForDate = (date: Date): Task[] => {
    // Always use the actual current date/time for overdue comparison, not the calendar cell date
    const currentDate = new Date() // This should always be "now"
    return tasks.filter(task => {
      if (!task.endDate || task.status === 'COMPLETED') return false
      
      const taskDeadline = new Date(task.endDate)
      
      // Set deadline to end of deadline day
      taskDeadline.setHours(23, 59, 59, 999) // End of deadline day
      
      // Show overdue tasks only when current date is completely past the deadline
      // This means if today is 30.07.2025 and deadline is 31.07.2025, it's NOT overdue
      // Only becomes overdue from 01.08.2025 onwards
      const isOverdue = currentDate > taskDeadline
      const statusMatch = statusFilter === 'all' || task.status === statusFilter
      const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter
      
      return isOverdue && statusMatch && priorityMatch
    })
  }

  // Function to check if a date is a deadline for any task
  const getDeadlineTasksForDate = (date: Date): Task[] => {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    
    return tasks.filter(task => {
      if (!task.endDate) return false
      
      const taskDeadline = new Date(task.endDate)
      taskDeadline.setHours(0, 0, 0, 0)
      
      const isDeadlineDate = checkDate.getTime() === taskDeadline.getTime()
      const statusMatch = statusFilter === 'all' || task.status === statusFilter
      const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter
      
      return isDeadlineDate && statusMatch && priorityMatch
    })
  }

  const getWorkloadForDate = (date: Date): WorkloadData[] => {
    const dateStr = date.toISOString().split('T')[0]
    return workloadData.filter(w => w.date === dateStr)
  }

  const handleTaskStatusChange = (taskId: string, newStatus: Task['status']) => {
    onTaskUpdate(taskId, { status: newStatus })
  }

  const handleDayClick = (date: Date) => {
    const dayTasks = getTasksForDate(date)
    const overdueTasks = getOverdueTasksForDate(date)
    const allDayTasks = [...dayTasks, ...overdueTasks].filter((task, index, self) => 
      index === self.findIndex(t => t.id === task.id)
    ) // Remove duplicates
    
    setSelectedDate(date)
    setDayTasks(allDayTasks)
    setShowDayModal(true)
  }

  const closeDayModal = () => {
    setShowDayModal(false)
    setSelectedDate(null)
    setDayTasks([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-3 h-3" />
      case 'IN_PROGRESS': return <PlayCircle className="w-3 h-3" />
      case 'REVIEW': return <Eye className="w-3 h-3" />
      case 'BLOCKED': return <PauseCircle className="w-3 h-3" />
      default: return <Circle className="w-3 h-3" />
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <Zap className="w-3 h-3 text-red-500" />
      case 'HIGH': return <AlertTriangle className="w-3 h-3 text-orange-500" />
      case 'MEDIUM': return <Target className="w-3 h-3 text-blue-500" />
      default: return <Timer className="w-3 h-3 text-gray-400" />
    }
  }

  const renderCalendarDay = (date: Date) => {
    const dayTasks = getTasksForDate(date)
    const overdueTasks = getOverdueTasksForDate(date)
    const deadlineTasks = getDeadlineTasksForDate(date)
    const allDayTasks = [...dayTasks, ...overdueTasks].filter((task, index, self) => 
      index === self.findIndex(t => t.id === task.id)
    ) // Remove duplicates
    
    const workload = getWorkloadForDate(date)
    const isToday = date.toDateString() === new Date().toDateString()
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
    
    // Enhanced task categorization
    const urgentTasks = allDayTasks.filter(t => t.priority === 'URGENT')
    const highPriorityTasks = allDayTasks.filter(t => t.priority === 'HIGH')
    const completedTasks = allDayTasks.filter(t => t.status === 'COMPLETED')
    const blockedTasks = allDayTasks.filter(t => t.status === 'BLOCKED')
    const overdueTasksNotCompleted = overdueTasks.filter(t => t.status !== 'COMPLETED')
    const upcomingDeadlines = deadlineTasks.filter(t => t.status !== 'COMPLETED')
    
    // Calculate enhanced workload metrics
    const avgWorkload = workload.length > 0 
      ? Math.round(workload.reduce((sum, w) => sum + w.workloadPercent, 0) / workload.length)
      : 0

    const maxUserWorkload = workload.length > 0 
      ? Math.max(...workload.map(w => w.workloadPercent))
      : 0

    const overloadedUsers = workload.filter(w => w.workloadPercent > 100).length
    const isBottleneck = avgWorkload > 80 && allDayTasks.length > 0
    const isHighRisk = maxUserWorkload > 120 || overloadedUsers > 1
    
    // New: Determine day status based on overdue and deadline awareness
    const hasOverdueTasks = overdueTasksNotCompleted.length > 0
    const hasDeadlines = upcomingDeadlines.length > 0
    const hasUrgentOverdue = overdueTasksNotCompleted.some(t => t.priority === 'URGENT' || t.priority === 'HIGH')

    const dayHeight = calendarLayout === 'compact' ? 'min-h-[80px]' : 
                    calendarLayout === 'standard' ? 'min-h-[120px]' : 'min-h-[160px]'

    return (
      <div
        key={date.toISOString()}
        className={`
          calendar-day ${dayHeight} p-2 border border-gray-200 cursor-pointer transition-all duration-300 rounded-lg relative overflow-hidden
          ${isToday ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-md' : ''}
          ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
          ${hasUrgentOverdue ? 'ring-2 ring-red-600 bg-gradient-to-br from-red-100 to-red-200 border-red-400 animate-pulse' : ''}
          ${hasOverdueTasks && !hasUrgentOverdue ? 'ring-2 ring-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300' : ''}
          ${hasDeadlines && !hasOverdueTasks ? 'ring-2 ring-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300' : ''}
          ${isHighRisk && !hasOverdueTasks ? 'ring-2 ring-red-500 bg-gradient-to-br from-red-50 to-red-100' : ''}
          ${isBottleneck && !isHighRisk && !hasOverdueTasks && !hasDeadlines ? 'ring-2 ring-orange-400 bg-gradient-to-br from-orange-50 to-orange-100' : ''}
          ${allDayTasks.length > 0 ? 'hover:shadow-lg hover:scale-[1.02]' : 'hover:bg-gray-50'}
          ${avgWorkload > 100 && !hasOverdueTasks ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' : ''}
        `}
        onClick={() => {
          setSelectedDate(date)
          if (allDayTasks.length > 0) {
            handleDayClick(date)
          }
        }}
        title={
          hasUrgentOverdue ? `⚠️ ${overdueTasksNotCompleted.length} acil gecikmiş görev - Hemen müdahale gerekli!` :
          hasOverdueTasks ? `⏰ ${overdueTasksNotCompleted.length} gecikmiş görev - İncelemeniz gerekiyor` :
          hasDeadlines ? `📅 ${upcomingDeadlines.length} görev teslim tarihi - Son gün!` :
          allDayTasks.length > 0 ? `${allDayTasks.length} görev - Detayları görüntülemek için tıklayın` : ''
        }
      >
        {/* Enhanced Date Header with Status Indicators */}
        <div className="flex justify-between items-start mb-2 relative z-10">
          <span className={`text-sm font-semibold ${
            isToday ? 'text-blue-700' : 
            hasUrgentOverdue ? 'text-red-800 animate-pulse' :
            hasOverdueTasks ? 'text-orange-700' :
            hasDeadlines ? 'text-yellow-700' :
            isHighRisk ? 'text-red-700' :
            isBottleneck ? 'text-orange-700' :
            'text-gray-700'
          }`}>
            {date.getDate()}
            {isToday && <span className="ml-1 text-xs">●</span>}
          </span>
          
          {/* Enhanced Day Indicators */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* Overdue Task Badge */}
            {hasUrgentOverdue && (
              <span className="text-xs px-2 py-1 rounded-full font-bold shadow-sm bg-red-600 text-white animate-bounce border-2 border-red-700" 
                    title={`${overdueTasksNotCompleted.length} acil gecikmiş görev`}>
                🚨 {overdueTasksNotCompleted.length}
              </span>
            )}
            {hasOverdueTasks && !hasUrgentOverdue && (
              <span className="text-xs px-2 py-1 rounded-full font-bold shadow-sm bg-orange-500 text-white border-2 border-orange-600" 
                    title={`${overdueTasksNotCompleted.length} gecikmiş görev`}>
                ⏰ {overdueTasksNotCompleted.length}
              </span>
            )}
            
            {/* Deadline Badge */}
            {hasDeadlines && !hasOverdueTasks && (
              <span className="text-xs px-2 py-1 rounded-full font-bold shadow-sm bg-yellow-500 text-white border-2 border-yellow-600" 
                    title={`${upcomingDeadlines.length} görev teslim tarihi`}>
                📅 {upcomingDeadlines.length}
              </span>
            )}
            
            {/* Regular Task Count */}
            {allDayTasks.length > 0 && !hasOverdueTasks && !hasDeadlines && (
              <span className={`text-xs px-2 py-1 rounded-full font-bold shadow-sm ${
                isHighRisk ? 'bg-red-500 text-white' :
                isBottleneck ? 'bg-orange-500 text-white' :
                allDayTasks.length > 5 ? 'bg-purple-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {allDayTasks.length}
              </span>
            )}
            
            {/* Risk Indicators */}
            {isHighRisk && !hasOverdueTasks && (
              <div className="flex items-center gap-1" title={`Yüksek Risk - Aşırı Yük: ${overloadedUsers} kişi`}>
                <AlertTriangle className="w-3 h-3 text-red-600" />
              </div>
            )}
            {isBottleneck && !isHighRisk && !hasOverdueTasks && !hasDeadlines && (
              <div className="flex items-center gap-1" title={`Darboğaz Günü - İş Yükü: ${avgWorkload}%`}>
                <TrendingDown className="w-3 h-3 text-orange-600" />
              </div>
            )}
            {urgentTasks.length > 0 && !hasOverdueTasks && (
              <Zap className="w-3 h-3 text-red-500" />
            )}
          </div>
        </div>

        {/* Enhanced Workload Visualization */}
        {workload.length > 0 && avgWorkload > 0 && calendarLayout !== 'compact' && (
          <div className="mb-2 relative z-10">
            <div className="flex items-center gap-1 mb-1">
              <Users className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600 font-medium">
                {avgWorkload}% doluluk
              </span>
              {overloadedUsers > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-1 rounded font-bold">
                  +{overloadedUsers}
                </span>
              )}
            </div>
            
            {/* Multi-level workload bars */}
            <div className="space-y-1">
              {/* Average workload bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-300 relative"
                  style={{
                    width: `${Math.min(avgWorkload, 100)}%`,
                    background: avgWorkload > 100 ? 
                      'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)' :
                      avgWorkload > 85 ? 
                      'linear-gradient(90deg, #ea580c 0%, #f97316 100%)' :
                      avgWorkload > 70 ? 
                      'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)' :
                      avgWorkload > 50 ? 
                      'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)' :
                      'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)'
                  }}
                />
                {avgWorkload > 100 && (
                  <div className="absolute right-0 top-0 h-2 w-1 bg-red-700 rounded-r-full animate-pulse"></div>
                )}
              </div>
              
              {/* Individual user indicators for detailed view */}
              {calendarLayout === 'detailed' && workload.length > 0 && (
                <div className="flex gap-1">
                  {workload.slice(0, 4).map((user, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: 
                          user.workloadPercent > 100 ? '#dc2626' :
                          user.workloadPercent > 85 ? '#ea580c' :
                          user.workloadPercent > 70 ? '#d97706' :
                          user.workloadPercent > 50 ? '#16a34a' :
                          '#22c55e'
                      }}
                      title={`${user.userName}: ${user.workloadPercent}%`}
                    />
                  ))}
                  {workload.length > 4 && (
                    <div className="w-1 h-1 rounded-full bg-gray-400" title={`+${workload.length - 4} kişi daha`} />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Task Preview Cards with Overdue/Deadline Awareness */}
        <div className="space-y-1 relative z-10">
          {calendarLayout === 'detailed' ? (
            // Detailed task cards with enhanced overdue styling
            allDayTasks.slice(0, 3).map(task => {
              const isOverdue = isTaskOverdue(task)
              const isDeadlineToday = deadlineTasks.some(dt => dt.id === task.id)
              const isUrgentOverdue = isOverdue && (task.priority === 'URGENT' || task.priority === 'HIGH')
              
              return (
                <div
                  key={task.id}
                  className={`task-card text-xs p-2 rounded-md border shadow-sm transition-all duration-200 hover:shadow-md relative ${
                    isUrgentOverdue ? 'bg-gradient-to-r from-red-200 to-red-100 text-red-900 border-red-400 animate-pulse ring-2 ring-red-500' :
                    isOverdue ? 'bg-gradient-to-r from-orange-200 to-orange-100 text-orange-900 border-orange-400 ring-2 ring-orange-400' :
                    isDeadlineToday ? 'bg-gradient-to-r from-yellow-200 to-yellow-100 text-yellow-900 border-yellow-400 ring-2 ring-yellow-400' :
                    task.status === 'COMPLETED' ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200' :
                    task.status === 'IN_PROGRESS' ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200' :
                    task.status === 'REVIEW' ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-purple-200' :
                    task.status === 'BLOCKED' ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200' :
                    'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-200'
                  }`}
                  title={
                    isUrgentOverdue ? `🚨 ACIL GECİKMİŞ: ${task.title} - Hemen müdahale gerekli!` :
                    isOverdue ? `⏰ GECİKMİŞ: ${task.title} - Teslim tarihi geçti` :
                    isDeadlineToday ? `📅 TESLİM TARİHİ: ${task.title} - Bugün son gün!` :
                    task.title
                  }
                >
                  {/* Enhanced Status Badge */}
                  {(isUrgentOverdue || isOverdue || isDeadlineToday) && (
                    <div className="absolute -top-1 -right-1 z-10">
                      {isUrgentOverdue && (
                        <span className="bg-red-600 text-white text-xs px-1 py-0.5 rounded-full font-bold animate-bounce shadow-lg">
                          🚨
                        </span>
                      )}
                      {isOverdue && !isUrgentOverdue && (
                        <span className="bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full font-bold shadow-lg">
                          ⏰
                        </span>
                      )}
                      {isDeadlineToday && !isOverdue && (
                        <span className="bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full font-bold shadow-lg">
                          📅
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(task.status)}
                      {getPriorityIcon(task.priority)}
                    </div>
                    <div className="flex items-center gap-1">
                      {task.estimatedHours && (
                        <span className="text-xs opacity-75">
                          {task.estimatedHours}h
                        </span>
                      )}
                      {isOverdue && task.endDate && (
                        <span className="text-xs font-bold bg-red-100 text-red-700 px-1 rounded">
                          -{Math.ceil((new Date().getTime() - new Date(task.endDate).getTime()) / (1000 * 60 * 60 * 24))}g
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`font-medium truncate ${isUrgentOverdue ? 'font-bold' : ''}`}>
                    {isUrgentOverdue && '🚨 '}
                    {isOverdue && !isUrgentOverdue && '⏰ '}
                    {isDeadlineToday && !isOverdue && '📅 '}
                    {task.title}
                  </div>
                  {task.assignedUsers && task.assignedUsers.length > 0 && (
                    <div className="mt-1 flex -space-x-1">
                      {task.assignedUsers.slice(0, 2).map((assignment, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 bg-gray-300 rounded-full border border-white text-xs flex items-center justify-center font-bold"
                          title={assignment.user.name}
                        >
                          {assignment.user.name.charAt(0)}
                        </div>
                      ))}
                      {task.assignedUsers.length > 2 && (
                        <div className="w-4 h-4 bg-gray-400 rounded-full border border-white text-xs flex items-center justify-center font-bold">
                          +
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            // Compact task indicators with overdue awareness
            allDayTasks.slice(0, calendarLayout === 'compact' ? 2 : 4).map(task => {
              const isOverdue = isTaskOverdue(task)
              const isDeadlineToday = deadlineTasks.some(dt => dt.id === task.id)
              const isUrgentOverdue = isOverdue && (task.priority === 'URGENT' || task.priority === 'HIGH')
              
              return (
                <div
                  key={task.id}
                  className={`text-xs p-1 rounded truncate flex items-center gap-1 relative ${
                    isUrgentOverdue ? 'bg-red-200 text-red-900 border border-red-400 animate-pulse' :
                    isOverdue ? 'bg-orange-200 text-orange-900 border border-orange-400' :
                    isDeadlineToday ? 'bg-yellow-200 text-yellow-900 border border-yellow-400' :
                    task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'REVIEW' ? 'bg-purple-100 text-purple-800' :
                    task.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                  title={
                    isUrgentOverdue ? `🚨 ACIL GECİKMİŞ: ${task.title}` :
                    isOverdue ? `⏰ GECİKMİŞ: ${task.title}` :
                    isDeadlineToday ? `📅 TESLİM TARİHİ: ${task.title}` :
                    task.title
                  }
                >
                  {/* Compact Status Indicator */}
                  {isUrgentOverdue && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-3 h-3 rounded-full flex items-center justify-center animate-bounce">
                      !
                    </span>
                  )}
                  {isOverdue && !isUrgentOverdue && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-3 h-3 rounded-full flex items-center justify-center">
                      ⏰
                    </span>
                  )}
                  {isDeadlineToday && !isOverdue && (
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs w-3 h-3 rounded-full flex items-center justify-center">
                      📅
                    </span>
                  )}
                  
                  {getStatusIcon(task.status)}
                  <span className="truncate flex-1">
                    {isUrgentOverdue && '🚨 '}
                    {isOverdue && !isUrgentOverdue && '⏰ '}
                    {isDeadlineToday && !isOverdue && '📅 '}
                    {task.title}
                  </span>
                  {task.priority === 'URGENT' && <Zap className="w-2 h-2 text-red-500" />}
                </div>
              )
            })
          )}
          
          {allDayTasks.length > (calendarLayout === 'compact' ? 2 : calendarLayout === 'standard' ? 4 : 3) && (
            <div className="text-xs text-gray-600 font-medium bg-gray-100 rounded px-2 py-1 text-center">
              +{allDayTasks.length - (calendarLayout === 'compact' ? 2 : calendarLayout === 'standard' ? 4 : 3)} daha...
            </div>
          )}
        </div>

        {/* Background gradient for better visual separation */}
        {dayTasks.length > 0 && (
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/20 pointer-events-none" />
        )}
      </div>
    )
  }

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDay = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return (
      <div className="grid grid-cols-7 gap-2 bg-gray-50 p-4 rounded-xl">
        {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].map(day => (
          <div key={day} className="p-3 text-center font-bold text-gray-700 bg-white rounded-lg shadow-sm">
            {day}
          </div>
        ))}
        {days.map(day => renderCalendarDay(day))}
      </div>
    )
  }

  const renderTimelineView = () => {
    // Get unique dates with tasks
    const taskDates = new Map<string, Task[]>()
    
    tasks.forEach(task => {
      if (task.startDate && task.endDate) {
        const start = new Date(task.startDate)
        const end = new Date(task.endDate)
        const current = new Date(start)
        
        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0]
          if (!taskDates.has(dateStr)) {
            taskDates.set(dateStr, [])
          }
          taskDates.get(dateStr)!.push(task)
          current.setDate(current.getDate() + 1)
        }
      }
    })

    const sortedDates = Array.from(taskDates.keys()).sort()
    
    return (
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center gap-4 mb-6 sticky top-0 bg-white z-10 py-2 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Zaman Çizelgesi Görünümü</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Acil</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Yüksek</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Normal</span>
            </div>
          </div>
        </div>
        
        {sortedDates.map(dateStr => {
          const date = new Date(dateStr)
          const dateTasks = taskDates.get(dateStr) || []
          const uniqueTasks = Array.from(new Set(dateTasks.map(t => t.id))).map(id => 
            dateTasks.find(t => t.id === id)!
          )
          
          return (
            <div key={dateStr} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">
                    {date.toLocaleDateString('tr-TR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <span className="text-sm text-gray-600">
                    {uniqueTasks.length} görev
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {uniqueTasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      const taskDate = new Date(dateStr)
                      setSelectedDate(taskDate)
                      setDayTasks([task])
                      setShowDayModal(true)
                    }}
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(task.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 truncate">{task.title}</h5>
                      {task.description && (
                        <p className="text-sm text-gray-600 truncate">{task.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getPriorityIcon(task.priority)}
                      
                      {task.estimatedHours && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {task.estimatedHours}h
                        </span>
                      )}
                      
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'REVIEW' ? 'bg-purple-100 text-purple-700' :
                        task.status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status === 'TODO' ? 'Yapılacak' :
                         task.status === 'IN_PROGRESS' ? 'Devam Ediyor' :
                         task.status === 'REVIEW' ? 'İncelemede' :
                         task.status === 'BLOCKED' ? 'Engellenmiş' : 'Tamamlandı'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        
        {sortedDates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Henüz tarihlendirilmiş görev bulunmuyor</p>
          </div>
        )}
      </div>
    )
  }

  const renderWorkloadView = () => {
    return (
      <div className="space-y-6">
        <ImprovedWorkloadViewer 
          users={users}
          tasks={tasks}
          currentDate={selectedDate || currentDate}
          onDateChange={(date) => {
            setSelectedDate(date)
            setCurrentDate(date)
          }}
        />
      </div>
    )
  }

  // Calculate monthly stats for enhanced analysis
  const monthlyStats = React.useMemo(() => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    const uniqueTasksInMonth = new Set<string>()
    let bottleneckDays = 0
    let highRiskDays = 0
    let totalWorkload = 0
    let maxDailyTasks = 0
    let urgentTaskDays = 0
    const totalDays = endOfMonth.getDate()
    
    for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
      const tasksForDay = getTasksForDate(new Date(date))
      
      tasksForDay.forEach(task => uniqueTasksInMonth.add(task.id))
      maxDailyTasks = Math.max(maxDailyTasks, tasksForDay.length)
      
      const urgentTasks = tasksForDay.filter(t => t.priority === 'URGENT')
      if (urgentTasks.length > 0) urgentTaskDays++
      
      const dayWorkload = workloadData.filter(w => {
        const workloadDate = new Date(w.date)
        return workloadDate.toDateString() === date.toDateString()
      })
      
      if (dayWorkload.length > 0) {
        const avgWorkload = dayWorkload.reduce((sum, w) => sum + w.workloadPercent, 0) / dayWorkload.length
        const maxUserWorkload = Math.max(...dayWorkload.map(w => w.workloadPercent))
        const overloadedUsers = dayWorkload.filter(w => w.workloadPercent > 100).length
        
        totalWorkload += avgWorkload
        
        if (maxUserWorkload > 120 || overloadedUsers > 1) {
          highRiskDays++
        } else if (avgWorkload > 80) {
          bottleneckDays++
        }
      }
    }
    
    return {
      totalTasks: uniqueTasksInMonth.size,
      bottleneckDays,
      highRiskDays,
      urgentTaskDays,
      avgDailyTasks: uniqueTasksInMonth.size / totalDays,
      maxDailyTasks,
      avgWorkload: totalWorkload / totalDays
    }
  }, [currentDate, workloadData, tasks, statusFilter, priorityFilter])

  return (
    <div className="bg-white rounded-xl shadow-xl p-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Proje Takvimi
          </h2>
          <p className="text-gray-600 mt-1">{project.name}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Layout Selector */}
          {viewMode === 'calendar' && (
            <div className="flex border rounded-lg overflow-hidden bg-gray-50">
              {[
                { key: 'compact', label: 'Kompakt', icon: Layers },
                { key: 'standard', label: 'Standart', icon: Calendar },
                { key: 'detailed', label: 'Detaylı', icon: Eye }
              ].map(layout => {
                const Icon = layout.icon
                return (
                  <button
                    key={layout.key}
                    onClick={() => setCalendarLayout(layout.key as any)}
                    className={`px-3 py-2 text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                      calendarLayout === layout.key
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {layout.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* View Mode Selector */}
          <div className="flex border rounded-lg overflow-hidden bg-gray-50">
            {[
              { key: 'calendar', label: 'Takvim', icon: Calendar },
              { key: 'workload', label: 'İş Yükü', icon: BarChart3 },
              { key: 'timeline', label: 'Zaman Çizelgesi', icon: Clock }
            ].map(mode => {
              const Icon = mode.icon
              return (
                <button
                  key={mode.key}
                  onClick={() => {
                    setViewMode(mode.key as any)
                    if (mode.key === 'workload') {
                      setSelectedDate(currentDate)
                    }
                  }}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                    viewMode === mode.key
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {mode.label}
                </button>
              )
            })}
          </div>

          {/* Auto-reschedule Button */}
          <button
            onClick={() => onProjectReschedule('auto')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Yeniden Planla
          </button>
        </div>
      </div>

      {/* Project Status Bar */}
      {project.delayDays > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              Proje {project.delayDays} gün gecikmede
            </span>
            {project.originalEndDate && project.endDate && (
              <span className="text-yellow-600">
                (Orijinal: {new Date(project.originalEndDate).toLocaleDateString('tr-TR')} → 
                Yeni: {new Date(project.endDate).toLocaleDateString('tr-TR')})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      {viewMode === 'calendar' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtreler:</span>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="TODO">Yapılacak</option>
              <option value="IN_PROGRESS">Devam Ediyor</option>
              <option value="REVIEW">İncelemede</option>
              <option value="COMPLETED">Tamamlandı</option>
              <option value="BLOCKED">Engellenmiş</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="URGENT">Acil</option>
              <option value="HIGH">Yüksek</option>
              <option value="MEDIUM">Orta</option>
              <option value="LOW">Düşük</option>
            </select>

            <button
              onClick={() => {
                setStatusFilter('all')
                setPriorityFilter('all')
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Monthly Analysis */}
      {viewMode === 'calendar' && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Aylık Performans Analizi</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
              <div className="text-sm text-gray-600">Toplam Görev</div>
              <div className="text-2xl font-bold text-blue-600">
                {monthlyStats.totalTasks}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm border border-red-100">
              <div className="text-sm text-gray-600">Yüksek Risk</div>
              <div className="text-2xl font-bold text-red-600">
                {monthlyStats.highRiskDays}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm border border-orange-100">
              <div className="text-sm text-gray-600">Darboğaz</div>
              <div className="text-2xl font-bold text-orange-600">
                {monthlyStats.bottleneckDays}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-100">
              <div className="text-sm text-gray-600">Acil Görev</div>
              <div className="text-2xl font-bold text-purple-600">
                {monthlyStats.urgentTaskDays}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
              <div className="text-sm text-gray-600">Ortalama/Gün</div>
              <div className="text-2xl font-bold text-green-600">
                {monthlyStats.avgDailyTasks.toFixed(1)}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm border border-yellow-100">
              <div className="text-sm text-gray-600">En Yoğun</div>
              <div className="text-2xl font-bold text-yellow-600">
                {monthlyStats.maxDailyTasks}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
              <div className="text-sm text-gray-600">Ort. Doluluk</div>
              <div className="text-2xl font-bold text-indigo-600">
                {monthlyStats.avgWorkload.toFixed(0)}%
              </div>
            </div>
          </div>
          
          {/* Risk Assessment */}
          <div className="mt-4 space-y-2">
            {monthlyStats.highRiskDays > 0 && (
              <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    ⚠️ {monthlyStats.highRiskDays} yüksek riskli gün tespit edildi - Acil önlem gerekli
                  </span>
                </div>
              </div>
            )}
            {monthlyStats.bottleneckDays > 0 && monthlyStats.highRiskDays === 0 && (
              <div className="p-3 bg-orange-100 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    ⚡ {monthlyStats.bottleneckDays} darboğaz günü - İş dağılımı optimizasyonu öneriliyor
                  </span>
                </div>
              </div>
            )}
            {monthlyStats.highRiskDays === 0 && monthlyStats.bottleneckDays === 0 && (
              <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    ✅ Optimum iş yükü dağılımı - Tebrikler!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      {viewMode === 'calendar' && (
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            ← Önceki Ay
          </button>
          
          <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
            {currentDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
          </h3>
          
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            Sonraki Ay →
          </button>
        </div>
      )}

      {/* Content */}
      {viewMode === 'calendar' && renderCalendarGrid()}
      {viewMode === 'workload' && renderWorkloadView()}
      {viewMode === 'timeline' && renderTimelineView()}

      {/* Enhanced Day Details Modal */}
      {showDayModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedDate.toLocaleDateString('tr-TR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {dayTasks.length} görev • {getWorkloadForDate(selectedDate).length} kişi aktif
                  </p>
                </div>
                <button
                  onClick={closeDayModal}
                  className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/20 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {/* Enhanced Workload Summary */}
              {(() => {
                const selectedDateStr = selectedDate.toISOString().split('T')[0]
                const activeWorkload = workloadData.filter(w => 
                  w.date === selectedDateStr && w.workloadPercent > 0
                )
                
                return activeWorkload.length > 0 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Günün İş Yükü Dağılımı
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeWorkload.map((userWorkload: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded-lg shadow-sm border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800">
                              {userWorkload.userName}
                            </span>
                            <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                              userWorkload.workloadPercent > 100 ? 'bg-red-100 text-red-700' :
                              userWorkload.workloadPercent > 85 ? 'bg-orange-100 text-orange-700' :
                              userWorkload.workloadPercent > 70 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {userWorkload.workloadPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div
                              className="h-3 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(userWorkload.workloadPercent, 100)}%`,
                                backgroundColor: 
                                  userWorkload.workloadPercent > 100 ? '#dc2626' :
                                  userWorkload.workloadPercent > 85 ? '#ea580c' :
                                  userWorkload.workloadPercent > 70 ? '#d97706' :
                                  userWorkload.workloadPercent > 50 ? '#16a34a' :
                                  '#22c55e'
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-600">
                            {userWorkload.hoursAllocated.toFixed(1)}h / {userWorkload.hoursAvailable}h
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Enhanced Tasks Section with Overdue Awareness */}
              <div className="space-y-6">
                {(() => {
                  const regularTasks = dayTasks.filter(task => !isTaskOverdue(task) && !getDeadlineTasksForDate(selectedDate).some(dt => dt.id === task.id))
                  const overdueTasks = dayTasks.filter(task => isTaskOverdue(task))
                  const deadlineToday = getDeadlineTasksForDate(selectedDate).filter(task => !isTaskOverdue(task))
                  
                  return (
                    <>
                      {/* Urgent Overdue Tasks Section */}
                      {overdueTasks.length > 0 && (
                        <div className="bg-gradient-to-r from-red-100 to-red-50 border-2 border-red-300 rounded-xl p-4 animate-pulse">
                          <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            🚨 Gecikmiş Görevler ({overdueTasks.length})
                          </h4>
                          <p className="text-red-700 text-sm mb-3">Bu görevler teslim tarihini geçmiştir ve acil müdahale gerektirmektedir!</p>
                          <div className="space-y-3">
                            {overdueTasks.map(task => {
                              const daysOverdue = task.endDate ? Math.ceil((new Date().getTime() - new Date(task.endDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
                              const isUrgentOverdue = task.priority === 'URGENT' || task.priority === 'HIGH'
                              
                              return (
                                <div key={task.id} className={`bg-white border-2 rounded-lg p-4 shadow-sm ${isUrgentOverdue ? 'border-red-500 animate-bounce' : 'border-red-300'}`}>
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {isUrgentOverdue && <span className="text-red-600 font-bold text-lg">🚨</span>}
                                      <h5 className="font-semibold text-red-800">{task.title}</h5>
                                      <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full font-bold">
                                        {daysOverdue} gün gecikmiş
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {getPriorityIcon(task.priority)}
                                      {getStatusIcon(task.status)}
                                    </div>
                                  </div>
                                  {task.description && (
                                    <p className="text-red-700 text-sm mb-2">{task.description}</p>
                                  )}
                                  <div className="flex items-center justify-between text-xs text-red-600">
                                    <span>Teslim tarihi: {task.endDate ? new Date(task.endDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</span>
                                    {task.assignedUser && <span>Sorumlu: {task.assignedUser.name}</span>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Today's Deadlines Section */}
                      {deadlineToday.length > 0 && (
                        <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                          <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            📅 Bugün Teslim Edilecek Görevler ({deadlineToday.length})
                          </h4>
                          <p className="text-yellow-700 text-sm mb-3">Bu görevlerin teslim tarihi bugündür - son gün!</p>
                          <div className="space-y-3">
                            {deadlineToday.map(task => (
                              <div key={task.id} className="bg-white border-2 border-yellow-400 rounded-lg p-4 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-yellow-600 font-bold">📅</span>
                                    <h5 className="font-semibold text-yellow-800">{task.title}</h5>
                                    <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">
                                      Son gün!
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getPriorityIcon(task.priority)}
                                    {getStatusIcon(task.status)}
                                  </div>
                                </div>
                                {task.description && (
                                  <p className="text-yellow-700 text-sm mb-2">{task.description}</p>
                                )}
                                <div className="flex items-center justify-between text-xs text-yellow-600">
                                  <span>Teslim tarihi: Bugün</span>
                                  {task.assignedUser && <span>Sorumlu: {task.assignedUser.name}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Regular Tasks Section */}
                      {regularTasks.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Günün Diğer Görevleri ({regularTasks.length})
                          </h4>
                          <div className="space-y-3">
                            {regularTasks.map(task => (
                              <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-semibold text-gray-800">{task.title}</h5>
                                  <div className="flex items-center gap-2">
                                    {getPriorityIcon(task.priority)}
                                    {getStatusIcon(task.status)}
                                  </div>
                                </div>
                                {task.description && (
                                  <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                                )}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>
                                    {task.startDate && task.endDate ? 
                                      `${new Date(task.startDate).toLocaleDateString('tr-TR')} - ${new Date(task.endDate).toLocaleDateString('tr-TR')}` :
                                      'Tarih belirtilmemiş'
                                    }
                                  </span>
                                  {task.assignedUser && <span>Sorumlu: {task.assignedUser.name}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No Tasks Message */}
                      {dayTasks.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-40" />
                          <p>Bu tarihte görev bulunmuyor.</p>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImprovedEnhancedCalendar
