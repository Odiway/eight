// Playground data storage - completely isolated from real project data
// This ensures playground activities never affect actual projects

interface PlaygroundTask {
  id: string
  name: string
  duration: number
  dependencies: string[]
  x?: number
  y?: number
  isOnCriticalPath?: boolean
  earlyStart?: number
  earlyFinish?: number
  lateStart?: number
  lateFinish?: number
  slack?: number
  createdAt: string
  updatedAt?: string
}

class PlaygroundStorage {
  private static instance: PlaygroundStorage
  private tasks: PlaygroundTask[] = []
  private taskIdCounter = 1

  private constructor() {
    // Private constructor to ensure singleton
  }

  public static getInstance(): PlaygroundStorage {
    if (!PlaygroundStorage.instance) {
      PlaygroundStorage.instance = new PlaygroundStorage()
    }
    return PlaygroundStorage.instance
  }

  // Task management
  public getAllTasks(): PlaygroundTask[] {
    return [...this.tasks] // Return a copy to prevent external modification
  }

  public getTask(id: string): PlaygroundTask | undefined {
    return this.tasks.find((task) => task.id === id)
  }

  public addTask(
    taskData: Omit<PlaygroundTask, 'id' | 'createdAt'>
  ): PlaygroundTask {
    const newTask: PlaygroundTask = {
      ...taskData,
      id: `playground-task-${this.taskIdCounter++}`,
      createdAt: new Date().toISOString(),
    }

    this.tasks.push(newTask)
    return newTask
  }

  public updateTask(
    id: string,
    updates: Partial<PlaygroundTask>
  ): PlaygroundTask | null {
    const taskIndex = this.tasks.findIndex((task) => task.id === id)

    if (taskIndex === -1) {
      return null
    }

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return this.tasks[taskIndex]
  }

  public deleteTask(id: string): PlaygroundTask | null {
    const taskIndex = this.tasks.findIndex((task) => task.id === id)

    if (taskIndex === -1) {
      return null
    }

    const deletedTask = this.tasks.splice(taskIndex, 1)[0]

    // Remove dependencies to the deleted task from other tasks
    this.tasks.forEach((task) => {
      task.dependencies = task.dependencies.filter((depId) => depId !== id)
      task.updatedAt = new Date().toISOString()
    })

    return deletedTask
  }

  // Dependency management
  public addDependency(fromTaskId: string, toTaskId: string): boolean {
    const toTask = this.getTask(toTaskId)

    if (!toTask || !this.getTask(fromTaskId)) {
      return false
    }

    // Check for circular dependencies
    if (this.wouldCreateCycle(toTaskId, fromTaskId)) {
      return false
    }

    // Add dependency if it doesn't already exist
    if (!toTask.dependencies.includes(fromTaskId)) {
      toTask.dependencies.push(fromTaskId)
      toTask.updatedAt = new Date().toISOString()
    }

    return true
  }

  public removeDependency(fromTaskId: string, toTaskId: string): boolean {
    const toTask = this.getTask(toTaskId)

    if (!toTask) {
      return false
    }

    const originalLength = toTask.dependencies.length
    toTask.dependencies = toTask.dependencies.filter(
      (depId) => depId !== fromTaskId
    )

    if (toTask.dependencies.length < originalLength) {
      toTask.updatedAt = new Date().toISOString()
      return true
    }

    return false
  }

  private wouldCreateCycle(
    sourceId: string,
    targetId: string,
    visited: Set<string> = new Set()
  ): boolean {
    if (visited.has(sourceId)) return true
    visited.add(sourceId)

    const sourceTask = this.getTask(sourceId)
    if (!sourceTask) return false

    return sourceTask.dependencies.some(
      (depId) =>
        depId === targetId ||
        this.wouldCreateCycle(depId, targetId, new Set(visited))
    )
  }

  // Playground management
  public reset(): void {
    this.tasks.length = 0
    this.taskIdCounter = 1
  }

  public loadSampleProject(): PlaygroundTask[] {
    this.reset()

    const sampleTasks: Omit<PlaygroundTask, 'id' | 'createdAt'>[] = [
      {
        name: 'Proje Planlama',
        duration: 3,
        dependencies: [],
        x: 100,
        y: 100,
        isOnCriticalPath: false,
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        slack: 0,
      },
      {
        name: 'Tasarım',
        duration: 5,
        dependencies: [], // Will be updated after all tasks are created
        x: 300,
        y: 100,
        isOnCriticalPath: false,
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        slack: 0,
      },
      {
        name: 'Backend Geliştirme',
        duration: 8,
        dependencies: [],
        x: 500,
        y: 50,
        isOnCriticalPath: false,
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        slack: 0,
      },
      {
        name: 'Frontend Geliştirme',
        duration: 6,
        dependencies: [],
        x: 500,
        y: 150,
        isOnCriticalPath: false,
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        slack: 0,
      },
      {
        name: 'Test',
        duration: 4,
        dependencies: [],
        x: 700,
        y: 100,
        isOnCriticalPath: false,
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        slack: 0,
      },
      {
        name: 'Deployment',
        duration: 2,
        dependencies: [],
        x: 900,
        y: 100,
        isOnCriticalPath: false,
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        slack: 0,
      },
      {
        name: 'Dokümantasyon',
        duration: 3,
        dependencies: [],
        x: 300,
        y: 250,
        isOnCriticalPath: false,
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        slack: 0,
      },
    ]

    // Add all tasks first
    const createdTasks = sampleTasks.map((taskData) => this.addTask(taskData))

    // Now add dependencies using the actual IDs
    if (createdTasks.length >= 7) {
      this.addDependency(createdTasks[0].id, createdTasks[1].id) // Planning → Design
      this.addDependency(createdTasks[1].id, createdTasks[2].id) // Design → Backend
      this.addDependency(createdTasks[1].id, createdTasks[3].id) // Design → Frontend
      this.addDependency(createdTasks[2].id, createdTasks[4].id) // Backend → Test
      this.addDependency(createdTasks[3].id, createdTasks[4].id) // Frontend → Test
      this.addDependency(createdTasks[4].id, createdTasks[5].id) // Test → Deployment
      this.addDependency(createdTasks[0].id, createdTasks[6].id) // Planning → Documentation
    }

    return this.getAllTasks()
  }

  public importTasks(tasks: any[]): PlaygroundTask[] {
    this.reset()

    const importedTasks = tasks.map((task: any, index: number) => {
      const taskData: Omit<PlaygroundTask, 'id' | 'createdAt'> = {
        name: task.name || `Imported Task ${index + 1}`,
        duration: Math.max(1, parseInt(task.duration) || 1),
        dependencies: [], // Dependencies will be added after all tasks are created
        x: task.x || Math.random() * 400 + 50,
        y: task.y || Math.random() * 300 + 50,
        isOnCriticalPath: false,
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        slack: 0,
        updatedAt: new Date().toISOString(),
      }

      return this.addTask(taskData)
    })

    // Now add dependencies based on the original task dependencies
    tasks.forEach((originalTask: any, index: number) => {
      if (Array.isArray(originalTask.dependencies)) {
        originalTask.dependencies.forEach((depId: string) => {
          const depIndex = tasks.findIndex((t) => t.id === depId)
          if (
            depIndex !== -1 &&
            importedTasks[depIndex] &&
            importedTasks[index]
          ) {
            this.addDependency(
              importedTasks[depIndex].id,
              importedTasks[index].id
            )
          }
        })
      }
    })

    return this.getAllTasks()
  }

  public getStats(): {
    totalTasks: number
    lastUpdate: string | null
    isEmpty: boolean
    tasksWithDependencies: number
    maxDependencies: number
  } {
    const tasks = this.getAllTasks()

    return {
      totalTasks: tasks.length,
      lastUpdate:
        tasks.length > 0
          ? tasks
              .reduce((latest, task) => {
                const taskTime = new Date(
                  task.updatedAt || task.createdAt
                ).getTime()
                return taskTime > latest ? taskTime : latest
              }, 0)
              .toString()
          : null,
      isEmpty: tasks.length === 0,
      tasksWithDependencies: tasks.filter(
        (task) => task.dependencies.length > 0
      ).length,
      maxDependencies:
        tasks.length > 0
          ? Math.max(...tasks.map((task) => task.dependencies.length))
          : 0,
    }
  }
}

// Export singleton instance
export const playgroundStorage = PlaygroundStorage.getInstance()

// Export types
export type { PlaygroundTask }
