/**
 * Dynamic Project Date Calculations - Server-side Utility
 * 
 * This module provides enhanced project date analysis similar to useProjectDates hook
 * but optimized for server-side use in PDF reports and API endpoints.
 * 
 * Features:
 * - 4-factor delay calculation (task, schedule, progress, overdue)
 * - Maximum delay selection ("big number" approach)
 * - Overdue task analysis
 * - Critical path identification
 * - Real vs planned date comparison
 */

export interface DynamicDateAnalysis {
  actualStartDate: Date | null
  actualEndDate: Date | null
  plannedStartDate: Date | null
  plannedEndDate: Date | null
  isDelayed: boolean
  delayDays: number
  completionPercentage: number
  status: 'early' | 'on-time' | 'delayed' | 'completed'
  criticalPath: string[]
  delayBreakdown: {
    taskBasedDelay: number
    scheduleBasedDelay: number
    progressBasedDelay: number
    overdueTasksDelay: number
    dominantFactor: 'tasks' | 'schedule' | 'progress' | 'overdue'
    overdueTaskDetails: Array<{
      id: string
      title: string
      daysOverdue: number
    }>
  } | null
}

export interface TaskForDateCalculation {
  id: string
  title: string
  status: string
  priority?: string
  startDate?: Date | string | null
  endDate?: Date | string | null
  completedAt?: Date | string | null
  estimatedHours?: number | null
}

export interface ProjectForDateCalculation {
  id: string
  name: string
  status?: string
  startDate?: Date | string | null
  endDate?: Date | string | null
}

/**
 * Calculate dynamic project dates and enhanced delay analysis
 * 
 * @param tasks Array of project tasks
 * @param project Project data
 * @returns Comprehensive date analysis including 4-factor delay calculation
 */
export function calculateDynamicProjectDates(
  tasks: TaskForDateCalculation[],
  project: ProjectForDateCalculation
): DynamicDateAnalysis {
  const now = new Date()
  
  console.log(`🎯 Calculating dynamic dates for project: ${project.name}`)
  console.log(`📊 Task count: ${tasks.length}`)
  
  // Normalize and validate task dates
  const validTasks = tasks.map(task => ({
    ...task,
    startDate: task.startDate ? new Date(task.startDate) : null,
    endDate: task.endDate ? new Date(task.endDate) : null,
    completedAt: task.completedAt ? new Date(task.completedAt) : null
  })).filter(task => task.startDate || task.endDate)

  console.log(`✅ Valid tasks with dates: ${validTasks.length}`)

  if (validTasks.length === 0) {
    console.log('⚠️  No valid tasks found, returning default analysis')
    return {
      actualStartDate: null,
      actualEndDate: null,
      plannedStartDate: project.startDate ? new Date(project.startDate) : null,
      plannedEndDate: project.endDate ? new Date(project.endDate) : null,
      isDelayed: false,
      delayDays: 0,
      completionPercentage: 0,
      status: 'on-time',
      criticalPath: [],
      delayBreakdown: null
    }
  }

  // Calculate actual project dates from tasks
  const taskStartDates = validTasks.map(t => t.startDate).filter(d => d) as Date[]
  const taskEndDates = validTasks.map(t => t.endDate).filter(d => d) as Date[]
  const completedDates = validTasks.map(t => t.completedAt).filter(d => d) as Date[]

  const actualStartDate = taskStartDates.length > 0 
    ? new Date(Math.min(...taskStartDates.map(d => d.getTime()))) 
    : null

  // For actual end date, use the latest of: task end dates or completed dates
  const allEndDates = [...taskEndDates, ...completedDates]
  const actualEndDate = allEndDates.length > 0 
    ? new Date(Math.max(...allEndDates.map(d => d.getTime()))) 
    : null

  console.log(`📅 Actual start: ${actualStartDate?.toISOString() || 'N/A'}`)
  console.log(`📅 Actual end: ${actualEndDate?.toISOString() || 'N/A'}`)

  // Calculate completion percentage
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  console.log(`📈 Completion: ${completedTasks}/${totalTasks} = ${completionPercentage.toFixed(1)}%`)

  // Enhanced 4-factor delay calculation
  const plannedEndDate = project.endDate ? new Date(project.endDate) : null
  
  // Factor 1: Task-based delay (difference between actual vs planned task completion)
  const taskBasedDelay = plannedEndDate && actualEndDate 
    ? Math.max(0, Math.ceil((actualEndDate.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // Factor 2: Schedule-based delay (based on current date vs planned date)
  const scheduleBasedDelay = plannedEndDate 
    ? Math.max(0, Math.ceil((now.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // Factor 3: Progress-based delay (estimated delay based on completion rate)
  const progressBasedDelay = completionPercentage < 100 && plannedEndDate && actualStartDate
    ? Math.ceil((100 - completionPercentage) / Math.max(completionPercentage, 1) * 
        Math.ceil((now.getTime() - actualStartDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // Factor 4: Overdue tasks delay
  const overdueTasks = tasks.filter(task => {
    if (task.status === 'COMPLETED') return false
    const taskEndDate = task.endDate ? new Date(task.endDate) : null
    return taskEndDate && taskEndDate < now
  })
  
  const overdueTasksDelay = overdueTasks.reduce((total, task) => {
    const taskEndDate = new Date(task.endDate!)
    const daysOverdue = Math.ceil((now.getTime() - taskEndDate.getTime()) / (1000 * 60 * 60 * 24))
    return total + daysOverdue
  }, 0)

  console.log(`🔍 Delay Analysis:`)
  console.log(`   Task-based: ${taskBasedDelay} days`)
  console.log(`   Schedule-based: ${scheduleBasedDelay} days`)
  console.log(`   Progress-based: ${progressBasedDelay} days`)
  console.log(`   Overdue tasks: ${overdueTasksDelay} days`)
  console.log(`   Overdue task count: ${overdueTasks.length}`)

  // Take maximum delay (the "big number" approach as requested)
  const delayDays = Math.max(taskBasedDelay, scheduleBasedDelay, progressBasedDelay, overdueTasksDelay)

  // Determine dominant factor
  let dominantFactor: 'tasks' | 'schedule' | 'progress' | 'overdue' = 'tasks'
  if (scheduleBasedDelay === delayDays) dominantFactor = 'schedule'
  else if (progressBasedDelay === delayDays) dominantFactor = 'progress'
  else if (overdueTasksDelay === delayDays) dominantFactor = 'overdue'

  console.log(`🏆 Maximum delay: ${delayDays} days (dominant: ${dominantFactor})`)

  // Calculate project status
  let status: 'early' | 'on-time' | 'delayed' | 'completed' = 'on-time'
  if (completionPercentage === 100) {
    status = 'completed'
  } else if (delayDays > 0) {
    status = 'delayed'
  } else if (plannedEndDate && actualEndDate && actualEndDate < plannedEndDate) {
    status = 'early'
  }

  // Calculate critical path - tasks that are high priority and not completed
  const criticalPath = tasks
    .filter(t => 
      t.status !== 'COMPLETED' && 
      (t.priority === 'HIGH' || t.priority === 'URGENT' || t.priority === 'CRITICAL')
    )
    .map(t => t.title)
    .slice(0, 5) // Limit to top 5 critical tasks

  console.log(`🎯 Critical path tasks: ${criticalPath.length}`)
  console.log(`📊 Final status: ${status}`)

  const delayBreakdown = {
    taskBasedDelay,
    scheduleBasedDelay,
    progressBasedDelay,
    overdueTasksDelay,
    dominantFactor,
    overdueTaskDetails: overdueTasks.map(task => ({
      id: task.id,
      title: task.title,
      daysOverdue: Math.ceil((now.getTime() - new Date(task.endDate!).getTime()) / (1000 * 60 * 60 * 24))
    }))
  }

  return {
    actualStartDate,
    actualEndDate,
    plannedStartDate: project.startDate ? new Date(project.startDate) : null,
    plannedEndDate,
    isDelayed: delayDays > 0,
    delayDays,
    completionPercentage,
    status,
    criticalPath,
    delayBreakdown
  }
}

/**
 * Format delay breakdown for display in reports
 * 
 * @param breakdown Delay breakdown data
 * @returns Formatted breakdown text
 */
export function formatDelayBreakdown(breakdown: DynamicDateAnalysis['delayBreakdown']): string {
  if (!breakdown) return 'Gecikme analizi mevcut değil'

  const factors = [
    { name: 'Görev Tabanlı', value: breakdown.taskBasedDelay, key: 'tasks' },
    { name: 'Program Tabanlı', value: breakdown.scheduleBasedDelay, key: 'schedule' },
    { name: 'İlerleme Tabanlı', value: breakdown.progressBasedDelay, key: 'progress' },
    { name: 'Gecikmiş Görevler', value: breakdown.overdueTasksDelay, key: 'overdue' }
  ]

  const maxValue = Math.max(...factors.map(f => f.value))
  const dominantFactorName = factors.find(f => f.key === breakdown.dominantFactor)?.name || 'Bilinmiyor'

  return `En yüksek gecikme: ${maxValue} gün (${dominantFactorName})`
}

/**
 * Get status color for UI elements
 * 
 * @param status Project status
 * @param delayDays Number of delay days
 * @returns CSS color value
 */
export function getStatusColor(status: DynamicDateAnalysis['status'], delayDays: number): string {
  switch (status) {
    case 'completed':
      return '#10b981' // Green
    case 'delayed':
      return delayDays > 30 ? '#dc2626' : '#f59e0b' // Red for critical, amber for moderate
    case 'early':
      return '#10b981' // Green
    default:
      return '#6b7280' // Gray
  }
}

/**
 * Get status text in Turkish
 * 
 * @param status Project status
 * @returns Turkish status text
 */
export function getStatusText(status: DynamicDateAnalysis['status']): string {
  switch (status) {
    case 'completed':
      return 'Tamamlandı'
    case 'delayed':
      return 'Gecikmiş'
    case 'early':
      return 'Erken'
    case 'on-time':
      return 'Zamanında'
    default:
      return 'Bilinmiyor'
  }
}

/**
 * Get delay severity level
 * 
 * @param delayDays Number of delay days
 * @returns Severity level
 */
export function getDelaySeverity(delayDays: number): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (delayDays === 0) return 'none'
  if (delayDays <= 7) return 'low'
  if (delayDays <= 21) return 'medium'
  if (delayDays <= 45) return 'high'
  return 'critical'
}
