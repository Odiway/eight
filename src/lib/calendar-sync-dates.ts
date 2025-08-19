/**
 * Calendar-synchronized date calculations
 * Matches the project calendar's simple approach:
 * - Planned End = Last task's end date
 * - Real End = Latest completion/task end date
 * - Only show overdue tasks, no complex analysis
 */

interface Task {
  id: string
  title: string
  startDate: string | null
  endDate: string | null
  completedAt: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
}

interface Project {
  id: string
  name: string
  startDate?: string | null
  endDate?: string | null
}

export interface CalendarSyncDates {
  // Simple calendar approach - no complex calculations
  plannedStartDate: Date | null    // Earliest task start
  plannedEndDate: Date | null      // Latest task end (like calendar)
  realStartDate: Date | null       // First actual start
  realEndDate: Date | null         // Latest actual completion
  
  // Simple overdue task list (no complex factors)
  overdueTasks: {
    id: string
    title: string
    daysOverdue: number
    endDate: string
  }[]
  
  // Simple status
  isDelayed: boolean
  totalOverdueDays: number
}

/**
 * Calculate project dates exactly like the calendar does
 * Simple approach: Last task end date = Project finish date
 */
export function calculateCalendarSyncDates(
  tasks: Task[], 
  project: Project
): CalendarSyncDates {
  console.log(`🗓️  Calendar Sync Calculation for: ${project.name}`)
  
  const now = new Date()
  
  // Filter valid tasks with dates
  const validTasks = tasks.filter(task => task.startDate || task.endDate)
  
  if (validTasks.length === 0) {
    console.log('⚠️  No valid tasks found')
    return {
      plannedStartDate: null,
      plannedEndDate: null,
      realStartDate: null,
      realEndDate: null,
      overdueTasks: [],
      isDelayed: false,
      totalOverdueDays: 0
    }
  }

  // CALENDAR APPROACH: Simple date extraction
  
  // 1. Planned dates = task schedule dates (like calendar shows)
  const tasksWithStartDates = validTasks.filter(t => t.startDate)
  const tasksWithEndDates = validTasks.filter(t => t.endDate)
  
  const plannedStartDate = tasksWithStartDates.length > 0
    ? new Date(Math.min(...tasksWithStartDates.map(t => new Date(t.startDate!).getTime())))
    : null
    
  // THIS IS THE KEY: Last task end date = Project planned finish (same as calendar)
  const plannedEndDate = tasksWithEndDates.length > 0
    ? new Date(Math.max(...tasksWithEndDates.map(t => new Date(t.endDate!).getTime())))
    : null

  console.log(`📅 Planned End (from last task): ${plannedEndDate?.toLocaleDateString('tr-TR')}`)

  // 2. Real dates = actual completion or current task dates
  const completedTasks = validTasks.filter(t => t.completedAt)
  const inProgressTasks = validTasks.filter(t => t.status === 'IN_PROGRESS' && t.endDate)
  const todoTasks = validTasks.filter(t => t.status === 'TODO' && t.endDate)
  
  const realStartDate = completedTasks.length > 0
    ? new Date(Math.min(...completedTasks.map(t => new Date(t.completedAt!).getTime())))
    : (tasksWithStartDates.length > 0 ? plannedStartDate : null)

  // Real end = latest of completed, in-progress, or remaining task dates
  const realEndDates: Date[] = []
  
  // Add completed task dates
  completedTasks.forEach(t => {
    if (t.completedAt) realEndDates.push(new Date(t.completedAt))
  })
  
  // Add in-progress and todo task end dates (they represent when work will actually finish)
  inProgressTasks.forEach(t => {
    if (t.endDate) realEndDates.push(new Date(t.endDate))
  })
  
  todoTasks.forEach(t => {
    if (t.endDate) realEndDates.push(new Date(t.endDate))
  })
  
  const realEndDate = realEndDates.length > 0
    ? new Date(Math.max(...realEndDates.map(d => d.getTime())))
    : plannedEndDate

  console.log(`📅 Real End (latest completion/task): ${realEndDate?.toLocaleDateString('tr-TR')}`)

  // 3. Simple overdue calculation (no complex factors)
  const overdueTasks = validTasks.filter(task => {
    if (task.status === 'COMPLETED' || !task.endDate) return false
    
    const taskEndDate = new Date(task.endDate)
    return taskEndDate < now
  }).map(task => ({
    id: task.id,
    title: task.title,
    daysOverdue: Math.ceil((now.getTime() - new Date(task.endDate!).getTime()) / (1000 * 60 * 60 * 24)),
    endDate: task.endDate!
  }))

  const totalOverdueDays = overdueTasks.reduce((sum, task) => sum + task.daysOverdue, 0)
  const isDelayed = overdueTasks.length > 0

  console.log(`⚠️  Overdue tasks: ${overdueTasks.length}`)
  console.log(`📊 Total overdue days: ${totalOverdueDays}`)

  return {
    plannedStartDate,
    plannedEndDate,
    realStartDate,
    realEndDate,
    overdueTasks,
    isDelayed,
    totalOverdueDays
  }
}

/**
 * Get formatted dates for display (matching calendar format)
 */
export function formatCalendarDate(date: Date | null): string {
  if (!date) return 'Belirlenmedi'
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  })
}

/**
 * Sync with specific target dates (as requested by user)
 * Override calculation with calendar-provided target dates
 */
export function syncWithCalendarTargets(
  calculatedDates: CalendarSyncDates,
  targetPlannedEnd: string, // "27.03.2026"
  targetRealEnd: string     // "20.04.2026"
): CalendarSyncDates {
  console.log(`🎯 Syncing with calendar targets: ${targetPlannedEnd} → ${targetRealEnd}`)
  
  // Parse Turkish date format (DD.MM.YYYY)
  const parseTurkishDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('.')
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }
  
  return {
    ...calculatedDates,
    plannedEndDate: parseTurkishDate(targetPlannedEnd),
    realEndDate: parseTurkishDate(targetRealEnd),
  }
}
