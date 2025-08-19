'use client'

import { useState, useEffect } from 'react'

interface ProjectDateAnalysis {
  plannedStartDate: Date | null    // From first task start date
  plannedEndDate: Date | null      // From last task end date  
  actualStartDate: Date | null     // From first completed task
  actualEndDate: Date | null       // From last task (estimated or actual)
  isDelayed: boolean
  delayDays: number
  completionPercentage: number
  criticalPath: string[]
  status: 'early' | 'on-time' | 'delayed' | 'completed'
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
      const remainingTasks = tasks.filter((task) => task.status !== 'COMPLETED')
      const criticalTasks: string[] = []
      const now = new Date()

      // Priority 1: Overdue tasks
      remainingTasks.forEach((task) => {
        if (task.endDate && new Date(task.endDate) < now) {
          criticalTasks.push(task.id)
        }
      })

      // Priority 2: High effort tasks not yet started
      const highEffortTasks = remainingTasks
        .filter((task) => !criticalTasks.includes(task.id) && task.status === 'TODO')
        .sort((a, b) => (b.estimatedHours || 0) - (a.estimatedHours || 0))
        .slice(0, Math.ceil(remainingTasks.length * 0.2))

      highEffortTasks.forEach((task) => criticalTasks.push(task.id))
      return criticalTasks
    }

    const calculateDynamicDates = () => {
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
      const completedTasks = tasks.filter((task) => task.status === 'COMPLETED')
      const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS')
      const remainingTasks = tasks.filter((task) => task.status === 'TODO')

      // Calculate completion percentage
      const completionPercentage = (completedTasks.length / tasks.length) * 100

      // Get planned dates from task dates (not static project dates)
      const tasksWithStartDates = tasks.filter(task => task.startDate)
      const tasksWithEndDates = tasks.filter(task => task.endDate)

      const plannedStartDate = tasksWithStartDates.length > 0 
        ? new Date(Math.min(...tasksWithStartDates.map(t => new Date(t.startDate!).getTime())))
        : null

      const plannedEndDate = tasksWithEndDates.length > 0
        ? new Date(Math.max(...tasksWithEndDates.map(t => new Date(t.endDate!).getTime())))
        : null

      // Get actual start date from first completed task
      const completedTasksWithDates = completedTasks.filter(task => task.completedAt || task.startDate)
      const actualStartDate = completedTasksWithDates.length > 0
        ? new Date(Math.min(...completedTasksWithDates.map(t => 
            new Date(t.completedAt || t.startDate!).getTime()
          )))
        : null

      // Calculate actual/estimated end date dynamically
      let actualEndDate: Date | null = null
      let isDelayed = false
      let delayDays = 0

      if (projectStatus === 'COMPLETED') {
        // For completed projects, use the last completion date
        const lastCompletedTask = completedTasks
          .filter(task => task.completedAt)
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0]
        
        actualEndDate = lastCompletedTask?.completedAt ? new Date(lastCompletedTask.completedAt) : plannedEndDate
        
        if (plannedEndDate && actualEndDate) {
          delayDays = Math.max(0, Math.ceil((actualEndDate.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24)))
          isDelayed = delayDays > 0
        }
      } else {
        // For ongoing projects, estimate based on remaining tasks
        const allTaskEndDates = [
          ...completedTasks.filter(t => t.completedAt).map(t => new Date(t.completedAt!)),
          ...inProgressTasks.filter(t => t.endDate).map(t => new Date(t.endDate!)),
          ...remainingTasks.filter(t => t.endDate).map(t => new Date(t.endDate!))
        ]

        if (allTaskEndDates.length > 0) {
          actualEndDate = new Date(Math.max(...allTaskEndDates.map(d => d.getTime())))
          
          if (plannedEndDate) {
            delayDays = Math.max(0, Math.ceil((actualEndDate.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24)))
            isDelayed = delayDays > 0
          }
        } else {
          actualEndDate = plannedEndDate
        }

        // Check if we're behind schedule even if tasks aren't overdue
        if (plannedEndDate && now > plannedEndDate && completionPercentage < 100) {
          const currentDelayDays = Math.ceil((now.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24))
          if (currentDelayDays > delayDays) {
            delayDays = currentDelayDays
            isDelayed = true
            
            // Estimate new end date based on current progress rate
            if (completionPercentage > 0) {
              const projectDuration = plannedEndDate.getTime() - (plannedStartDate?.getTime() || plannedEndDate.getTime() - 30 * 24 * 60 * 60 * 1000)
              const estimatedTotalDuration = (projectDuration / completionPercentage) * 100
              actualEndDate = new Date((actualStartDate?.getTime() || plannedStartDate?.getTime() || now.getTime()) + estimatedTotalDuration)
            }
          }
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
        status
      }
    }

    const result = calculateDynamicDates()
    setAnalysis(result)
  }, [projectId, tasks, projectStatus])

  return analysis
}

export default useProjectDates
