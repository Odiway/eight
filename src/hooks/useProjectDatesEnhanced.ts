'use client'

import { useState, useEffect } from 'react'

interface ProjectDateAnalysis {
  plannedStartDate: Date | null    
  plannedEndDate: Date | null      
  actualStartDate: Date | null     
  actualEndDate: Date | null       
  isDelayed: boolean
  delayDays: number
  completionPercentage: number
  criticalPath: string[]
  status: 'early' | 'on-time' | 'delayed' | 'completed'
  delayBreakdown?: {
    taskBasedDelay: number
    scheduleBasedDelay: number
    progressBasedDelay: number
    overdueTasksDelay: number
    dominantFactor: 'tasks' | 'schedule' | 'progress' | 'overdue'
    overdueTaskDetails: Array<{id: string, title: string, daysOverdue: number}>
  }
}

interface Task {
  id: string
  title: string
  status: string
  startDate?: Date | string | null
  endDate?: Date | string | null
  estimatedHours?: number | null | undefined
  completedAt?: Date | string | null
}

interface UseProjectDatesOptions {
  projectId: string
  tasks: Task[]
  projectStatus?: string
}

export function useProjectDates({
  projectId,
  tasks,
  projectStatus = 'IN_PROGRESS',
}: UseProjectDatesOptions): ProjectDateAnalysis | null {
  const [analysis, setAnalysis] = useState<ProjectDateAnalysis | null>(null)

  useEffect(() => {
    const calculateCriticalPath = (tasks: Task[]): string[] => {
      const remainingTasks = tasks.filter((task: Task) => task.status !== 'COMPLETED')
      const criticalTasks: string[] = []
      const now = new Date()

      remainingTasks.forEach((task: Task) => {
        if (task.endDate && new Date(task.endDate) < now) {
          criticalTasks.push(task.id)
        }
      })

      const highEffortTasks = remainingTasks
        .filter((task: Task) => !criticalTasks.includes(task.id) && task.status === 'TODO')
        .sort((a: Task, b: Task) => (b.estimatedHours || 0) - (a.estimatedHours || 0))
        .slice(0, Math.ceil(remainingTasks.length * 0.2))

      highEffortTasks.forEach((task: Task) => criticalTasks.push(task.id))
      return criticalTasks
    }

    const calculateDynamicDates = (): ProjectDateAnalysis => {
      if (tasks.length === 0) {
        return {
          plannedStartDate: null,
          plannedEndDate: null,
          actualStartDate: null,
          actualEndDate: null,
          isDelayed: false,
          delayDays: 0,
          completionPercentage: 0,
          criticalPath: [],
          status: 'on-time' as const
        }
      }

      const now = new Date()
      const completedTasks = tasks.filter((task: Task) => task.status === 'COMPLETED')
      const inProgressTasks = tasks.filter((task: Task) => task.status === 'IN_PROGRESS')
      const remainingTasks = tasks.filter((task: Task) => task.status === 'TODO')

      const completionPercentage = (completedTasks.length / tasks.length) * 100

      // Get planned dates from task dates
      const tasksWithStartDates = tasks.filter((task: Task) => task.startDate)
      const tasksWithEndDates = tasks.filter((task: Task) => task.endDate)

      const plannedStartDate = tasksWithStartDates.length > 0 
        ? new Date(Math.min(...tasksWithStartDates.map((t: Task) => new Date(t.startDate!).getTime())))
        : null

      const plannedEndDate = tasksWithEndDates.length > 0
        ? new Date(Math.max(...tasksWithEndDates.map((t: Task) => new Date(t.endDate!).getTime())))
        : null

      // Get actual start date from first completed task
      const completedTasksWithDates = completedTasks.filter((task: Task) => task.completedAt || task.startDate)
      const actualStartDate = completedTasksWithDates.length > 0
        ? new Date(Math.min(...completedTasksWithDates.map((t: Task) => 
            new Date(t.completedAt || t.startDate!).getTime()
          )))
        : null

      let actualEndDate: Date | null = null
      let isDelayed = false
      let delayDays = 0
      let delayBreakdown

      if (projectStatus === 'COMPLETED') {
        const lastCompletedTask = completedTasks
          .filter((task: Task) => task.completedAt)
          .sort((a: Task, b: Task) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0]
        
        actualEndDate = lastCompletedTask?.completedAt ? new Date(lastCompletedTask.completedAt) : plannedEndDate
        
        if (plannedEndDate && actualEndDate) {
          delayDays = Math.max(0, Math.ceil((actualEndDate.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24)))
          isDelayed = delayDays > 0
        }
      } else {
        // ENHANCED DELAY CALCULATION - Multiple factors, take MAXIMUM
        
        // Factor 1: Task-based delays
        const allTaskEndDates = [
          ...completedTasks.filter((t: Task) => t.completedAt).map((t: Task) => new Date(t.completedAt!)),
          ...inProgressTasks.filter((t: Task) => t.endDate).map((t: Task) => new Date(t.endDate!)),
          ...remainingTasks.filter((t: Task) => t.endDate).map((t: Task) => new Date(t.endDate!))
        ]

        let taskBasedDelay = 0
        if (allTaskEndDates.length > 0) {
          const latestTaskDate = new Date(Math.max(...allTaskEndDates.map((d: Date) => d.getTime())))
          if (plannedEndDate) {
            taskBasedDelay = Math.max(0, Math.ceil((latestTaskDate.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24)))
          }
        }

        // Factor 2: Schedule-based delay 
        let scheduleBasedDelay = 0
        if (plannedEndDate && now > plannedEndDate && completionPercentage < 100) {
          scheduleBasedDelay = Math.ceil((now.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24))
        }

        // Factor 3: Progress-based delay estimation
        let progressBasedDelay = 0
        if (plannedEndDate && completionPercentage > 0 && completionPercentage < 100) {
          const projectDuration = plannedEndDate.getTime() - (plannedStartDate?.getTime() || plannedEndDate.getTime() - 30 * 24 * 60 * 60 * 1000)
          const estimatedTotalDuration = (projectDuration / completionPercentage) * 100
          const estimatedEndDate = new Date((actualStartDate?.getTime() || plannedStartDate?.getTime() || now.getTime()) + estimatedTotalDuration)
          progressBasedDelay = Math.max(0, Math.ceil((estimatedEndDate.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 1000)))
        }

        // Factor 4: Individual overdue tasks
        let overdueTasksDelay = 0
        const overdueTaskDetails: Array<{id: string, title: string, daysOverdue: number}> = []
        remainingTasks.concat(inProgressTasks).forEach((task: Task) => {
          if (task.endDate && new Date(task.endDate) < now) {
            const taskDelay = Math.ceil((now.getTime() - new Date(task.endDate).getTime()) / (1000 * 60 * 60 * 24))
            overdueTasksDelay = Math.max(overdueTasksDelay, taskDelay)
            overdueTaskDetails.push({
              id: task.id,
              title: task.title,
              daysOverdue: taskDelay
            })
          }
        })

        // TAKE THE MAXIMUM DELAY!
        delayDays = Math.max(taskBasedDelay, scheduleBasedDelay, progressBasedDelay, overdueTasksDelay)
        isDelayed = delayDays > 0

        // Determine dominant factor
        let dominantFactor: 'tasks' | 'schedule' | 'progress' | 'overdue' = 'tasks'
        if (delayDays === overdueTasksDelay && overdueTasksDelay > 0) {
          dominantFactor = 'overdue'
        } else if (delayDays === scheduleBasedDelay && scheduleBasedDelay > 0) {
          dominantFactor = 'schedule'
        } else if (delayDays === progressBasedDelay && progressBasedDelay > 0) {
          dominantFactor = 'progress'
        }

        // Calculate actualEndDate based on maximum delay
        if (plannedEndDate) {
          actualEndDate = new Date(plannedEndDate.getTime() + (delayDays * 24 * 60 * 60 * 1000))
        } else {
          actualEndDate = allTaskEndDates.length > 0 
            ? new Date(Math.max(...allTaskEndDates.map((d: Date) => d.getTime())))
            : null
        }

        delayBreakdown = {
          taskBasedDelay,
          scheduleBasedDelay,
          progressBasedDelay,
          overdueTasksDelay,
          dominantFactor,
          overdueTaskDetails: overdueTaskDetails.sort((a, b) => b.daysOverdue - a.daysOverdue)
        }
      }

      // Determine status
      let status: 'early' | 'on-time' | 'delayed' | 'completed' = 'on-time'
      if (projectStatus === 'COMPLETED') {
        status = 'completed'
      } else if (isDelayed) {
        status = 'delayed'
      } else if (plannedEndDate && actualEndDate && actualEndDate < plannedEndDate) {
        status = 'early'
      }

      return {
        plannedStartDate,
        plannedEndDate,
        actualStartDate,
        actualEndDate,
        isDelayed,
        delayDays,
        completionPercentage,
        criticalPath: calculateCriticalPath(tasks),
        status,
        delayBreakdown
      }
    }

    const result = calculateDynamicDates()
    setAnalysis(result)
  }, [projectId, tasks, projectStatus])

  return analysis
}

export default useProjectDates
