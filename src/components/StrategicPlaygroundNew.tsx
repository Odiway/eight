'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'

// Types
interface Task {
  id: string
  name: string
  duration: number
  x: number
  y: number
  dependencies: string[]
  taskType: 'critical' | 'parallel' | 'flexible'
  description?: string
  assignedTo?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  estimatedCost?: number
  milestone?: boolean
  isOnCriticalPath?: boolean
  earlyStart?: number
  slack?: number
  parallelWith?: string[]
}

interface ProjectAnalysis {
  criticalPath: string[]
  totalDuration: number
  projectEndDate: Date
}

type CanvasMode = 'view' | 'select' | 'draw'

interface DrawingConnection {
  isDrawing: boolean
  from: string | null
  currentPos: { x: number; y: number } | null
}

const StrategicPlaygroundNew: React.FC = () => {
  // Basic state
  const [tasks, setTasks] = useState<Task[]>([])
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'error' | 'unknown'
  >('unknown')
  const [loading, setLoading] = useState(false)
  const [projectStartDate, setProjectStartDate] = useState(new Date())

  // Canvas state
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('view')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [drawingConnection, setDrawingConnection] = useState<DrawingConnection>(
    {
      isDrawing: false,
      from: null,
      currentPos: null,
    }
  )

  // Interaction state
  const [isPanning, setIsPanning] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [potentialDragTask, setPotentialDragTask] = useState<string | null>(
    null
  )

  // Form state
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskDuration, setNewTaskDuration] = useState(1)
  const [newTaskType, setNewTaskType] = useState<
    'critical' | 'parallel' | 'flexible'
  >('flexible')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<
    'low' | 'medium' | 'high' | 'critical'
  >('medium')
  const [newTaskEstimatedCost, setNewTaskEstimatedCost] = useState(0)
  const [newTaskMilestone, setNewTaskMilestone] = useState(false)

  // Edit state
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTaskName, setEditTaskName] = useState('')
  const [editTaskDuration, setEditTaskDuration] = useState(1)
  const [editTaskType, setEditTaskType] = useState<
    'critical' | 'parallel' | 'flexible'
  >('flexible')
  const [editTaskDescription, setEditTaskDescription] = useState('')
  const [editTaskAssignedTo, setEditTaskAssignedTo] = useState('')
  const [editTaskPriority, setEditTaskPriority] = useState<
    'low' | 'medium' | 'high' | 'critical'
  >('medium')
  const [editTaskParallelWith, setEditTaskParallelWith] = useState<string[]>([])
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null)

  // Calculate project analysis
  const analysis: ProjectAnalysis = React.useMemo(() => {
    const criticalPath = calculateCriticalPath(tasks)
    const totalDuration = criticalPath.reduce((sum, taskId) => {
      const task = tasks.find((t) => t.id === taskId)
      return sum + (task?.duration || 0)
    }, 0)

    const projectEndDate = new Date(projectStartDate)
    projectEndDate.setDate(projectEndDate.getDate() + totalDuration)

    return {
      criticalPath,
      totalDuration,
      projectEndDate,
    }
  }, [tasks, projectStartDate])

  // Calculate critical path
  function calculateCriticalPath(tasks: Task[]): string[] {
    // Simple implementation - in real app this would be more sophisticated
    const criticalTasks = tasks.filter((task) => task.taskType === 'critical')
    return criticalTasks.map((task) => task.id)
  }

  // Display tasks with critical path calculation
  const displayTasks = React.useMemo(() => {
    return tasks.map((task) => ({
      ...task,
      isOnCriticalPath: analysis.criticalPath.includes(task.id),
    }))
  }, [tasks, analysis.criticalPath])

  // Test connection
  const testConnection = useCallback(async () => {
    setLoading(true)
    try {
      // Simulate API test
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setConnectionStatus('connected')
    } catch (error) {
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset playground
  const resetPlayground = useCallback(() => {
    setTasks([])
    setSelectedTasks(new Set())
    setCanvasMode('view')
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
    setDrawingConnection({ isDrawing: false, from: null, currentPos: null })
  }, [])

  // Load sample project
  const loadSampleProject = useCallback(() => {
    const sampleTasks: Task[] = [
      {
        id: '1',
        name: 'Proje Başlangıcı',
        duration: 1,
        x: 100,
        y: 150,
        dependencies: [],
        taskType: 'critical',
        description: 'Projenin başlangıç aşaması ve kaynak tahsisi',
        milestone: true,
        priority: 'critical',
        assignedTo: 'Proje Yöneticisi',
        estimatedCost: 5000,
      },
      {
        id: '2',
        name: 'Gereksinim Analizi',
        duration: 3,
        x: 350,
        y: 100,
        dependencies: ['1'],
        taskType: 'critical',
        description: 'Müşteri ihtiyaçları ve sistem gereksinimlerinin analizi',
        priority: 'high',
        assignedTo: 'İş Analisti',
        estimatedCost: 8000,
      },
      {
        id: '3',
        name: 'Teknik Araştırma',
        duration: 4,
        x: 350,
        y: 200,
        dependencies: ['1'],
        taskType: 'parallel',
        description: 'Teknoloji araştırması ve mimari tasarım',
        priority: 'high',
        assignedTo: 'Teknik Lider',
        estimatedCost: 12000,
      },
      {
        id: '4',
        name: 'UI/UX Tasarım',
        duration: 5,
        x: 350,
        y: 300,
        dependencies: ['1'],
        taskType: 'parallel',
        description: 'Kullanıcı arayüzü ve deneyim tasarımı',
        priority: 'medium',
        assignedTo: 'UX Designer',
        estimatedCost: 15000,
      },
      {
        id: '5',
        name: 'Veritabanı Tasarımı',
        duration: 3,
        x: 600,
        y: 100,
        dependencies: ['2', '3'],
        taskType: 'critical',
        description: 'Veritabanı şeması ve optimizasyon',
        priority: 'high',
        assignedTo: 'Veritabanı Uzmanı',
        estimatedCost: 10000,
      },
      {
        id: '6',
        name: 'Backend API Geliştirme',
        duration: 8,
        x: 850,
        y: 100,
        dependencies: ['5'],
        taskType: 'critical',
        description: 'Sunucu tarafı API geliştirme ve güvenlik',
        priority: 'high',
        assignedTo: 'Backend Developer',
        estimatedCost: 25000,
      },
      {
        id: '7',
        name: 'Frontend Geliştirme',
        duration: 6,
        x: 600,
        y: 300,
        dependencies: ['4'],
        taskType: 'parallel',
        description: 'Kullanıcı arayüzü geliştirme',
        priority: 'medium',
        assignedTo: 'Frontend Developer',
        estimatedCost: 20000,
      },
      {
        id: '8',
        name: 'Mobil Uygulama',
        duration: 7,
        x: 850,
        y: 300,
        dependencies: ['7'],
        taskType: 'parallel',
        description: 'iOS ve Android uygulaması geliştirme',
        priority: 'medium',
        assignedTo: 'Mobil Developer',
        estimatedCost: 30000,
      },
      {
        id: '9',
        name: 'API Entegrasyonu',
        duration: 4,
        x: 1100,
        y: 200,
        dependencies: ['6', '7'],
        taskType: 'critical',
        description: 'Frontend ve backend entegrasyonu',
        priority: 'high',
        assignedTo: 'Full Stack Developer',
        estimatedCost: 15000,
      },
      {
        id: '10',
        name: 'Sistem Testleri',
        duration: 5,
        x: 1350,
        y: 150,
        dependencies: ['9'],
        taskType: 'critical',
        description: 'Kapsamlı sistem ve güvenlik testleri',
        priority: 'critical',
        assignedTo: 'Test Uzmanı',
        estimatedCost: 18000,
      },
      {
        id: '11',
        name: 'Performans Optimizasyonu',
        duration: 3,
        x: 1100,
        y: 300,
        dependencies: ['8'],
        taskType: 'parallel',
        description: 'Uygulama performans iyileştirmeleri',
        priority: 'medium',
        assignedTo: 'Performance Engineer',
        estimatedCost: 12000,
      },
      {
        id: '12',
        name: 'Dağıtım ve Yayınlama',
        duration: 2,
        x: 1600,
        y: 200,
        dependencies: ['10', '11'],
        taskType: 'critical',
        description: 'Üretim ortamına dağıtım ve yayınlama',
        milestone: true,
        priority: 'critical',
        assignedTo: 'DevOps Engineer',
        estimatedCost: 8000,
      },
    ]
    setTasks(sampleTasks)
    console.log(
      '✅ Sample project loaded with',
      sampleTasks.length,
      'tasks and dependencies:',
      sampleTasks.flatMap((t) => t.dependencies.map((d) => `${d} → ${t.id}`))
    )
  }, [])

  // Add new task
  const addTask = useCallback(() => {
    if (!newTaskName.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName,
      duration: newTaskDuration,
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 300,
      dependencies: [],
      taskType: newTaskType,
      description: newTaskDescription,
      assignedTo: newTaskAssignedTo,
      priority: newTaskPriority,
      estimatedCost: newTaskEstimatedCost,
      milestone: newTaskMilestone,
    }

    setTasks((prev) => [...prev, newTask])

    // Reset form
    setNewTaskName('')
    setNewTaskDuration(1)
    setNewTaskType('flexible')
    setNewTaskDescription('')
    setNewTaskAssignedTo('')
    setNewTaskPriority('medium')
    setNewTaskEstimatedCost(0)
    setNewTaskMilestone(false)
    setShowTaskForm(false)
  }, [
    newTaskName,
    newTaskDuration,
    newTaskType,
    newTaskDescription,
    newTaskAssignedTo,
    newTaskPriority,
    newTaskEstimatedCost,
    newTaskMilestone,
  ])

  // Delete task
  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev
        .filter((task) => task.id !== taskId) // Remove the task itself
        .map((task) => ({
          ...task,
          dependencies: task.dependencies.filter((depId) => depId !== taskId), // Remove from dependencies
        }))
    )
    setSelectedTasks((prev) => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
    console.log('🗑️ Deleted task:', taskId)
  }, [])

  // Save task edit
  const saveTaskEdit = useCallback(() => {
    if (!editingTask) return

    setTasks((prev) =>
      prev.map((task) =>
        task.id === editingTask
          ? {
              ...task,
              name: editTaskName,
              duration: editTaskDuration,
              taskType: editTaskType,
              description: editTaskDescription,
              assignedTo: editTaskAssignedTo,
              priority: editTaskPriority,
              parallelWith: editTaskParallelWith,
            }
          : task
      )
    )

    cancelTaskEdit()
  }, [
    editingTask,
    editTaskName,
    editTaskDuration,
    editTaskType,
    editTaskDescription,
    editTaskAssignedTo,
    editTaskPriority,
    editTaskParallelWith,
  ])

  // Start task edit
  const startTaskEdit = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId)
      if (task) {
        setEditingTask(taskId)
        setEditTaskName(task.name)
        setEditTaskDuration(task.duration)
        setEditTaskType(task.taskType)
        setEditTaskDescription(task.description || '')
        setEditTaskAssignedTo(task.assignedTo || '')
        setEditTaskPriority(task.priority || 'medium')
        setEditTaskParallelWith(task.parallelWith || [])
      }
    },
    [tasks]
  )

  // Cancel task edit
  const cancelTaskEdit = useCallback(() => {
    setEditingTask(null)
    setEditTaskName('')
    setEditTaskDuration(1)
    setEditTaskType('flexible')
    setEditTaskDescription('')
    setEditTaskAssignedTo('')
    setEditTaskPriority('medium')
    setEditTaskParallelWith([])
  }, [])

  // Canvas mouse handlers
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left - panOffset.x) / zoomLevel
        const y = (e.clientY - rect.top - panOffset.y) / zoomLevel

        if (canvasMode === 'view') {
          setIsPanning(true)
          setLastMousePos({ x: e.clientX, y: e.clientY })
        }
      }
    },
    [canvasMode, panOffset, zoomLevel]
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && canvasMode === 'view') {
        const deltaX = e.clientX - lastMousePos.x
        const deltaY = e.clientY - lastMousePos.y

        setPanOffset((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }))

        setLastMousePos({ x: e.clientX, y: e.clientY })
      }

      // Update drawing connection
      if (drawingConnection.isDrawing) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left - panOffset.x) / zoomLevel
        const y = (e.clientY - rect.top - panOffset.y) / zoomLevel

        setDrawingConnection((prev) => ({
          ...prev,
          currentPos: { x, y },
        }))
      }
    },
    [
      isPanning,
      canvasMode,
      lastMousePos,
      drawingConnection.isDrawing,
      panOffset,
      zoomLevel,
    ]
  )

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
    setDraggedTask(null)
    setPotentialDragTask(null)
    setIsDragging(false)
  }, [])

  // Task interaction handlers
  const handleTaskClick = useCallback(
    (taskId: string, e: React.MouseEvent) => {
      e.stopPropagation()

      if (canvasMode === 'select') {
        if (e.ctrlKey || e.metaKey) {
          setSelectedTasks((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(taskId)) {
              newSet.delete(taskId)
            } else {
              newSet.add(taskId)
            }
            return newSet
          })
        } else {
          setSelectedTasks(new Set([taskId]))
        }
      } else if (canvasMode === 'draw') {
        if (
          drawingConnection.isDrawing &&
          drawingConnection.from &&
          drawingConnection.from !== taskId
        ) {
          // Create connection
          setTasks((prev) =>
            prev.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    dependencies: [
                      ...task.dependencies,
                      drawingConnection.from!,
                    ],
                  }
                : task
            )
          )
          setDrawingConnection({
            isDrawing: false,
            from: null,
            currentPos: null,
          })
        } else if (!drawingConnection.isDrawing) {
          // Start drawing connection
          setDrawingConnection({
            isDrawing: true,
            from: taskId,
            currentPos: null,
          })
        }
      }
    },
    [canvasMode, drawingConnection]
  )

  const handleTaskMouseDown = useCallback(
    (taskId: string, e: React.MouseEvent) => {
      if (canvasMode === 'view') {
        e.preventDefault()
        e.stopPropagation()

        // Don't start dragging immediately - just prepare for it
        setPotentialDragTask(taskId)
        setDragStartPos({ x: e.clientX, y: e.clientY })
        setIsDragging(false)

        // Calculate the correct offset relative to the canvas
        const task = tasks.find((t) => t.id === taskId)
        if (task && canvasRef.current) {
          const canvasRect = canvasRef.current.getBoundingClientRect()
          const mouseX = (e.clientX - canvasRect.left - panOffset.x) / zoomLevel
          const mouseY = (e.clientY - canvasRect.top - panOffset.y) / zoomLevel

          // Calculate offset from mouse position to task's current position
          setDragOffset({
            x: mouseX - task.x,
            y: mouseY - task.y,
          })
        }
      }
    },
    [canvasMode, tasks, panOffset, zoomLevel]
  )

  // Mouse move for dragging tasks
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Check if we should start dragging
      if (potentialDragTask && !isDragging) {
        const deltaX = Math.abs(e.clientX - dragStartPos.x)
        const deltaY = Math.abs(e.clientY - dragStartPos.y)
        const dragThreshold = 8 // Pixels to move before starting drag

        if (deltaX > dragThreshold || deltaY > dragThreshold) {
          setDraggedTask(potentialDragTask)
          setIsDragging(true)
          setPotentialDragTask(null)
        }
      }

      // Perform the actual dragging
      if (draggedTask && isDragging && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const x =
          (e.clientX - rect.left - panOffset.x) / zoomLevel - dragOffset.x
        const y =
          (e.clientY - rect.top - panOffset.y) / zoomLevel - dragOffset.y

        setTasks((prev) =>
          prev.map((task) =>
            task.id === draggedTask
              ? { ...task, x: Math.max(0, x), y: Math.max(0, y) }
              : task
          )
        )
      }
    }

    const handleMouseUp = () => {
      setDraggedTask(null)
      setPotentialDragTask(null)
      setIsDragging(false)
    }

    if (potentialDragTask || (draggedTask && isDragging)) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    potentialDragTask,
    draggedTask,
    isDragging,
    dragStartPos,
    panOffset,
    zoomLevel,
    dragOffset,
  ])

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoomLevel((prev) => Math.min(Math.max(prev * delta, 0.2), 5))
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        setCanvasMode('view')
      } else if (e.key === 's' || e.key === 'S') {
        setCanvasMode('select')
      } else if (e.key === 'd' || e.key === 'D') {
        setCanvasMode('draw')
      } else if (e.key === 'Escape') {
        setDrawingConnection({ isDrawing: false, from: null, currentPos: null })
        setSelectedTasks(new Set())
      } else if (e.key === 'Delete' && selectedTasks.size > 0) {
        selectedTasks.forEach((taskId) => deleteTask(taskId))
        setSelectedTasks(new Set())
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedTasks, deleteTask])

  // Auto-load sample project on mount
  useEffect(() => {
    if (tasks.length === 0) {
      console.log('🚀 Auto-loading sample project...')
      loadSampleProject()
    }
  }, [loadSampleProject, tasks.length])

  // Debug effect to log task and arrow information
  useEffect(() => {
    if (tasks.length > 0) {
      const connections = tasks.flatMap((task) =>
        task.dependencies.map((depId) => `${depId} → ${task.id}`)
      )
      console.log('📊 Current project state:', {
        totalTasks: tasks.length,
        totalConnections: connections.length,
        connections: connections,
        criticalTasks: tasks
          .filter((t) => t.taskType === 'critical')
          .map((t) => t.id),
        parallelTasks: tasks
          .filter((t) => t.taskType === 'parallel')
          .map((t) => t.id),
      })
    }
  }, [tasks])

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6'>
      {/* Header Section */}
      <div className='max-w-7xl mx-auto'>
        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 mb-6'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                  Stratejik Proje Planlama
                </h1>
                <p className='text-gray-600'>
                  Kilometre taşları ve kritik yol analizi ile proje yönetimi
                </p>
              </div>
              <div className='flex items-center space-x-3'>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    connectionStatus === 'connected'
                      ? 'bg-green-100 text-green-800'
                      : connectionStatus === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {connectionStatus === 'connected'
                    ? '🟢 Bağlandı'
                    : connectionStatus === 'error'
                    ? '🔴 Hata'
                    : '🟡 Bilinmiyor'}
                </div>
                <button
                  onClick={testConnection}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  disabled={loading}
                >
                  {loading ? 'Test Ediliyor...' : 'Bağlantı Test Et'}
                </button>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className='p-6 bg-gray-50 border-b border-gray-200'>
            <div className='flex flex-wrap items-center gap-4 mb-4'>
              <button
                onClick={() => setShowTaskForm(true)}
                className='px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2'
              >
                <span>+</span> Yeni Görev Ekle
              </button>

              <button
                onClick={resetPlayground}
                disabled={loading}
                className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors'
              >
                🗑️ Temizle
              </button>

              <button
                onClick={loadSampleProject}
                disabled={loading}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
              >
                📋 Örnek Proje
              </button>

              <button
                onClick={() => {
                  resetPlayground()
                  setTimeout(() => loadSampleProject(), 100)
                }}
                disabled={loading}
                className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors'
              >
                🔄 Yenile & Yükle
              </button>

              <div className='flex items-center gap-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Proje Başlangıcı:
                </label>
                <input
                  type='date'
                  value={projectStartDate.toISOString().split('T')[0]}
                  onChange={(e) =>
                    setProjectStartDate(new Date(e.target.value))
                  }
                  className='px-3 py-1 border border-gray-300 rounded-lg text-sm'
                />
              </div>
            </div>

            {/* Toolbar */}
            <div className='flex items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-200'>
              <div className='flex items-center gap-1 border-r border-gray-200 pr-3'>
                <button
                  onClick={() => setCanvasMode('view')}
                  className={`p-2 rounded-lg transition-colors ${
                    canvasMode === 'view'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  title='Görüntüleme Modu (V)'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122'
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setCanvasMode('select')}
                  className={`p-2 rounded-lg transition-colors ${
                    canvasMode === 'select'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  title='Seçim Modu (S)'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setCanvasMode('draw')}
                  className={`p-2 rounded-lg transition-colors ${
                    canvasMode === 'draw'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  title='Bağlantı Çiz (D)'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                    />
                  </svg>
                </button>
              </div>

              <div className='flex items-center gap-1 border-r border-gray-200 pr-3'>
                <button
                  onClick={() =>
                    setZoomLevel((prev) => Math.max(prev * 0.8, 0.2))
                  }
                  className='p-2 rounded-lg hover:bg-gray-100 transition-colors'
                  title='Uzaklaştır'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10h-6'
                    />
                  </svg>
                </button>

                <span className='text-sm font-medium text-gray-600 min-w-[3rem] text-center'>
                  {Math.round(zoomLevel * 100)}%
                </span>

                <button
                  onClick={() =>
                    setZoomLevel((prev) => Math.min(prev * 1.25, 5))
                  }
                  className='p-2 rounded-lg hover:bg-gray-100 transition-colors'
                  title='Yakınlaştır'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7'
                    />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    setZoomLevel(1)
                    setPanOffset({ x: 0, y: 0 })
                  }}
                  className='p-2 rounded-lg hover:bg-gray-100 transition-colors'
                  title='Sıfırla'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                    />
                  </svg>
                </button>
              </div>

              <div className='flex items-center gap-2'>
                <span className='text-sm text-gray-600'>
                  {canvasMode === 'view' &&
                    'Görüntüleme - Basılı tutup sürükleyerek görevleri taşıyın'}
                  {canvasMode === 'select' &&
                    'Seçim - Çoklu seçim için Ctrl+tık'}
                  {canvasMode === 'draw' &&
                    'Bağlantı - Görevler arası bağlantı çizin'}
                </span>
              </div>

              {selectedTasks.size > 0 && (
                <div className='flex items-center gap-2 border-l border-gray-200 pl-3'>
                  <span className='text-sm text-blue-600 font-medium'>
                    {selectedTasks.size} görev seçili
                  </span>
                  <button
                    onClick={() => {
                      selectedTasks.forEach((taskId) => deleteTask(taskId))
                      setSelectedTasks(new Set())
                    }}
                    className='p-1 text-red-600 hover:bg-red-50 rounded'
                    title='Seçili görevleri sil (Delete)'
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 xl:grid-cols-4 gap-6'>
          {/* Left Sidebar - Project Overview */}
          <div className='xl:col-span-1 space-y-6'>
            {/* Mini Sonuç Paneli */}
            <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
                📊 Mini Sonuç Paneli
              </h3>
              <div className='space-y-4'>
                <div className='bg-blue-50 p-4 rounded-lg'>
                  <div className='text-sm text-blue-600 font-medium'>
                    Proje Bitiş Tarihi
                  </div>
                  <div className='text-lg font-bold text-blue-900'>
                    {analysis?.projectEndDate
                      ? analysis.projectEndDate.toLocaleDateString('tr-TR')
                      : 'Hesaplanıyor...'}
                  </div>
                  <div className='text-sm text-blue-600'>
                    Başlangıç: {projectStartDate.toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className='bg-green-50 p-4 rounded-lg'>
                  <div className='text-sm text-green-600 font-medium'>
                    Toplam Süre
                  </div>
                  <div className='text-lg font-bold text-green-900'>
                    {analysis?.totalDuration || 0} gün
                  </div>
                </div>

                <div className='bg-amber-50 p-4 rounded-lg'>
                  <div className='text-sm text-amber-600 font-medium'>
                    Milestone Sayısı
                  </div>
                  <div className='text-lg font-bold text-amber-900'>
                    {displayTasks.filter((t) => t.milestone).length}
                  </div>
                </div>

                <div className='bg-purple-50 p-4 rounded-lg'>
                  <div className='text-sm text-purple-600 font-medium'>
                    Görev Dağılımı
                  </div>
                  <div className='text-xs space-y-1 mt-2'>
                    <div className='flex justify-between'>
                      <span>Kritik:</span>
                      <span className='font-semibold'>
                        {
                          displayTasks.filter(
                            (t) =>
                              t.taskType === 'critical' || t.isOnCriticalPath
                          ).length
                        }
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Paralel:</span>
                      <span className='font-semibold'>
                        {
                          displayTasks.filter((t) => t.taskType === 'parallel')
                            .length
                        }
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Esnek:</span>
                      <span className='font-semibold'>
                        {
                          displayTasks.filter((t) => t.taskType === 'flexible')
                            .length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bağlantı Türleri Guide */}
            <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-4'>
                🔗 Bağlantı Türleri
              </h3>
              <div className='space-y-3 text-sm'>
                <div className='bg-red-50 p-3 rounded-lg border border-red-200'>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='font-semibold text-red-800'>
                      Kritik Yol Bağlantısı
                    </div>
                    <svg width='20' height='8' className='flex-shrink-0'>
                      <path
                        d='M2 4 L18 4'
                        stroke='#dc2626'
                        strokeWidth='2'
                        strokeDasharray='3,2'
                        markerEnd='url(#mini-arrow-red)'
                      />
                      <defs>
                        <marker
                          id='mini-arrow-red'
                          markerWidth='6'
                          markerHeight='4'
                          refX='5'
                          refY='2'
                          orient='auto'
                        >
                          <path d='M0,0 L0,4 L6,2 z' fill='#dc2626' />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                  <div className='text-red-600 text-xs'>
                    En kritik görev bağlantıları. Gecikme tüm projeyi etkiler.
                  </div>
                </div>

                <div className='bg-blue-50 p-3 rounded-lg border border-blue-200'>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='font-semibold text-blue-800'>
                      Paralel Bağlantı
                    </div>
                    <svg width='20' height='8' className='flex-shrink-0'>
                      <path
                        d='M2 4 L18 4'
                        stroke='#3b82f6'
                        strokeWidth='2'
                        markerEnd='url(#mini-arrow-blue)'
                      />
                      <defs>
                        <marker
                          id='mini-arrow-blue'
                          markerWidth='6'
                          markerHeight='4'
                          refX='5'
                          refY='2'
                          orient='auto'
                        >
                          <path d='M0,0 L0,4 L6,2 z' fill='#3b82f6' />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                  <div className='text-blue-600 text-xs'>
                    Aynı anda çalışabilen görevler. Bağımsız olarak
                    ilerleyebilir.
                  </div>
                </div>

                <div className='bg-gray-50 p-3 rounded-lg border border-gray-200'>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='font-semibold text-gray-800'>
                      Normal Bağlantı
                    </div>
                    <svg width='20' height='8' className='flex-shrink-0'>
                      <path
                        d='M2 4 L18 4'
                        stroke='#6b7280'
                        strokeWidth='2'
                        markerEnd='url(#mini-arrow-gray)'
                      />
                      <defs>
                        <marker
                          id='mini-arrow-gray'
                          markerWidth='6'
                          markerHeight='4'
                          refX='5'
                          refY='2'
                          orient='auto'
                        >
                          <path d='M0,0 L0,4 L6,2 z' fill='#6b7280' />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                  <div className='text-gray-600 text-xs'>
                    Standart görev bağımlılıkları. Sıralı tamamlanması gereken
                    görevler.
                  </div>
                </div>

                <div className='mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <div className='text-xs text-yellow-800 font-medium'>
                    💡 İpucu:
                  </div>
                  <div className='text-xs text-yellow-700 mt-1'>
                    Draw modunda görev kenarlarında yeşil (çıkış) ve mavi
                    (giriş) noktalar görünür.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className='xl:col-span-3'>
            <div className='bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden'>
              {/* Canvas Header */}
              <div className='p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-xl font-bold'>Kilometre Taşı GÖREV 1</h2>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm opacity-90'>
                      {displayTasks.length} görev •{' '}
                      {analysis?.criticalPath.length || 0} kritik yol
                    </span>
                  </div>
                </div>
              </div>

              {/* Strategic Planning Canvas */}
              <div
                ref={canvasRef}
                className={`relative bg-gray-50 min-h-[800px] overflow-hidden transition-all duration-200 ${
                  canvasMode === 'view'
                    ? 'cursor-grab active:cursor-grabbing'
                    : canvasMode === 'select'
                    ? 'cursor-pointer'
                    : canvasMode === 'draw'
                    ? 'cursor-crosshair'
                    : 'cursor-grab'
                } ${isPanning ? 'cursor-move' : ''} ${
                  drawingConnection.isDrawing ? 'cursor-crosshair' : ''
                }`}
                style={{ minHeight: '800px' }}
                data-canvas='true'
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onWheel={handleWheel}
              >
                {/* Canvas Transform Container */}
                <div
                  className='relative w-full h-full origin-top-left transition-transform duration-75'
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                    width: `${100 / zoomLevel}%`,
                    height: `${100 / zoomLevel}%`,
                  }}
                >
                  {/* Grid Background */}
                  <div
                    className='absolute inset-0 opacity-20'
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                        linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                      `,
                      backgroundSize: `${20 * zoomLevel}px ${20 * zoomLevel}px`,
                    }}
                  />

                  {/* Connection Lines - Enhanced with better arrows */}
                  <svg
                    className='absolute inset-0 w-full h-full pointer-events-none'
                    style={{ zIndex: 1 }}
                  >
                    <defs>
                      {/* Critical path arrow */}
                      <marker
                        id='arrowhead-critical'
                        markerWidth='12'
                        markerHeight='10'
                        refX='11'
                        refY='5'
                        orient='auto'
                        markerUnits='strokeWidth'
                      >
                        <path
                          d='M0,0 L0,10 L12,5 z'
                          fill='#dc2626'
                          stroke='#dc2626'
                          strokeWidth='1'
                        />
                      </marker>

                      {/* Parallel task arrow */}
                      <marker
                        id='arrowhead-parallel'
                        markerWidth='12'
                        markerHeight='10'
                        refX='11'
                        refY='5'
                        orient='auto'
                        markerUnits='strokeWidth'
                      >
                        <path
                          d='M0,0 L0,10 L12,5 z'
                          fill='#3b82f6'
                          stroke='#3b82f6'
                          strokeWidth='1'
                        />
                      </marker>

                      {/* Normal task arrow */}
                      <marker
                        id='arrowhead-normal'
                        markerWidth='10'
                        markerHeight='8'
                        refX='9'
                        refY='4'
                        orient='auto'
                        markerUnits='strokeWidth'
                      >
                        <path
                          d='M0,0 L0,8 L10,4 z'
                          fill='#6b7280'
                          stroke='#6b7280'
                          strokeWidth='1'
                        />
                      </marker>

                      {/* Drawing preview arrow */}
                      <marker
                        id='arrowhead-preview'
                        markerWidth='10'
                        markerHeight='8'
                        refX='9'
                        refY='4'
                        orient='auto'
                      >
                        <path
                          d='M0,0 L0,8 L10,4 z'
                          fill='#10b981'
                          stroke='#10b981'
                          strokeWidth='1'
                        />
                      </marker>
                    </defs>

                    {/* Existing connections with enhanced styling */}
                    {(() => {
                      const connections = displayTasks
                        .flatMap((task) =>
                          task.dependencies.map((depId) => ({ task, depId }))
                        )
                        .filter(({ task, depId }) =>
                          displayTasks.find((t) => t.id === depId)
                        )

                      console.log('Rendering arrows:', {
                        totalTasks: displayTasks.length,
                        connections: connections.length,
                        connectionDetails: connections.map(
                          (c) => `${c.depId} -> ${c.task.id}`
                        ),
                      })

                      return connections.map(({ task, depId }) => {
                        const sourceTask = displayTasks.find(
                          (t) => t.id === depId
                        )
                        if (!sourceTask) return null

                        // Determine connection type and styling
                        const isCritical =
                          task.isOnCriticalPath && sourceTask.isOnCriticalPath
                        const isParallel =
                          task.taskType === 'parallel' ||
                          sourceTask.taskType === 'parallel'

                        const strokeColor = isCritical
                          ? '#dc2626'
                          : isParallel
                          ? '#3b82f6'
                          : '#6b7280'
                        const strokeWidth = isCritical
                          ? 3
                          : isParallel
                          ? 2.5
                          : 2
                        const markerEnd = isCritical
                          ? 'arrowhead-critical'
                          : isParallel
                          ? 'arrowhead-parallel'
                          : 'arrowhead-normal'

                        const x1 = sourceTask.x + 200 // Right edge of source
                        const y1 = sourceTask.y + 40 // Middle height
                        const x2 = task.x // Left edge of target
                        const y2 = task.y + 40 // Middle height

                        // Create curved path for better visual flow
                        const dx = x2 - x1
                        const dy = y2 - y1
                        const curve = Math.min(Math.abs(dx) * 0.5, 50)

                        const pathData = `M ${x1} ${y1} Q ${
                          x1 + curve
                        } ${y1}, ${x1 + dx / 2} ${y1 + dy / 2} T ${x2} ${y2}`

                        return (
                          <g key={`${depId}-${task.id}`}>
                            {/* Main connection path */}
                            <path
                              d={pathData}
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                              fill='none'
                              markerEnd={`url(#${markerEnd})`}
                              opacity='0.8'
                              style={{
                                strokeDasharray: isCritical ? '8,4' : 'none',
                                filter: isCritical
                                  ? 'drop-shadow(0 2px 4px rgba(220, 38, 38, 0.3))'
                                  : isParallel
                                  ? 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
                                  : 'none',
                              }}
                            />

                            {/* Connection start indicator */}
                            <circle
                              cx={x1}
                              cy={y1}
                              r='3'
                              fill={strokeColor}
                              opacity='0.7'
                              stroke='white'
                              strokeWidth='2'
                            />

                            {/* Connection type label */}
                            {isCritical && (
                              <text
                                x={(x1 + x2) / 2}
                                y={(y1 + y2) / 2 - 8}
                                fill='#dc2626'
                                fontSize='10'
                                fontWeight='bold'
                                textAnchor='middle'
                                className='pointer-events-none select-none'
                              >
                                CRITICAL
                              </text>
                            )}

                            {isParallel && !isCritical && (
                              <text
                                x={(x1 + x2) / 2}
                                y={(y1 + y2) / 2 - 8}
                                fill='#3b82f6'
                                fontSize='10'
                                fontWeight='bold'
                                textAnchor='middle'
                                className='pointer-events-none select-none'
                              >
                                PARALLEL
                              </text>
                            )}
                          </g>
                        )
                      })
                    })()}

                    {/* Drawing connection preview - Enhanced */}
                    {drawingConnection.isDrawing &&
                      drawingConnection.from &&
                      drawingConnection.currentPos &&
                      (() => {
                        const sourceTask = displayTasks.find(
                          (t) => t.id === drawingConnection.from!
                        )
                        if (!sourceTask) return null

                        const x1 = sourceTask.x + 200 // Right edge of source task
                        const y1 = sourceTask.y + 40 // Middle of source task
                        const x2 = drawingConnection.currentPos!.x
                        const y2 = drawingConnection.currentPos!.y

                        // Calculate distance for animation
                        const distance = Math.sqrt(
                          (x2 - x1) ** 2 + (y2 - y1) ** 2
                        )

                        return (
                          <g>
                            {/* Main connection line with curve */}
                            <path
                              d={`M ${x1} ${y1} Q ${
                                x1 + 50
                              } ${y1}, ${x2} ${y2}`}
                              stroke='#10b981'
                              strokeWidth='3'
                              fill='none'
                              strokeDasharray='8,4'
                              opacity='0.9'
                              markerEnd='url(#arrowhead-preview)'
                              className='animate-pulse'
                            />

                            {/* Connection start point with animation */}
                            <circle
                              cx={x1}
                              cy={y1}
                              r='6'
                              fill='#10b981'
                              opacity='0.9'
                              className='animate-ping'
                            />
                            <circle
                              cx={x1}
                              cy={y1}
                              r='3'
                              fill='#ffffff'
                              opacity='1'
                            />

                            {/* Target indicator with rotation */}
                            <circle
                              cx={x2}
                              cy={y2}
                              r='10'
                              fill='none'
                              stroke='#10b981'
                              strokeWidth='2'
                              opacity='0.6'
                              strokeDasharray='4,2'
                              className='animate-spin'
                            />
                            <circle
                              cx={x2}
                              cy={y2}
                              r='4'
                              fill='#10b981'
                              opacity='0.8'
                            />

                            {/* Distance indicator */}
                            {distance > 100 && (
                              <text
                                x={(x1 + x2) / 2}
                                y={(y1 + y2) / 2 - 15}
                                fill='#10b981'
                                fontSize='12'
                                fontWeight='bold'
                                textAnchor='middle'
                                className='pointer-events-none select-none'
                              >
                                {Math.round(distance)}px
                              </text>
                            )}

                            {/* Drawing instruction */}
                            <text
                              x={x2 + 15}
                              y={y2 + 5}
                              fill='#10b981'
                              fontSize='11'
                              fontWeight='medium'
                              className='pointer-events-none select-none'
                            >
                              Bağlantı kurmak için görev üzerine tıklayın
                            </text>
                          </g>
                        )
                      })()}
                  </svg>

                  {/* Tasks */}
                  {displayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`absolute cursor-pointer transform transition-all duration-200 select-none ${
                        selectedTasks.has(task.id) ? 'z-10' : 'z-5'
                      } ${draggedTask === task.id ? 'z-20' : ''} ${
                        potentialDragTask === task.id ? 'z-15' : ''
                      }`}
                      style={{
                        left: task.x,
                        top: task.y,
                        transform:
                          draggedTask === task.id
                            ? 'scale(1.05) rotate(2deg)'
                            : potentialDragTask === task.id
                            ? 'scale(1.02)'
                            : 'scale(1)',
                        cursor:
                          potentialDragTask === task.id
                            ? 'grab'
                            : draggedTask === task.id
                            ? 'grabbing'
                            : 'grab',
                      }}
                      onMouseDown={(e) => handleTaskMouseDown(task.id, e)}
                      onClick={(e) => handleTaskClick(task.id, e)}
                      onDoubleClick={() => {
                        if (canvasMode === 'view') {
                          setEditingTask(task.id)
                          setEditTaskName(task.name)
                          setEditTaskDuration(task.duration)
                          setEditTaskDescription(task.description || '')
                          setEditTaskAssignedTo(task.assignedTo || '')
                          setEditTaskPriority(task.priority || 'medium')
                          setEditTaskType(task.taskType || 'flexible')
                          setEditTaskParallelWith(task.parallelWith || [])
                        }
                      }}
                    >
                      <div
                        className={`
                          group p-4 rounded-xl border-2 bg-white min-w-[200px] relative transition-all duration-200 ${
                            task.isOnCriticalPath ||
                            task.taskType === 'critical'
                              ? 'border-red-500 bg-red-50 shadow-red-100'
                              : task.taskType === 'parallel'
                              ? 'border-blue-500 bg-blue-50 shadow-blue-100'
                              : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg'
                          } ${
                          drawingConnection.from === task.id
                            ? 'ring-4 ring-green-400 border-green-500'
                            : ''
                        } ${
                          selectedTasks.has(task.id)
                            ? 'border-blue-500 bg-blue-50'
                            : ''
                        } ${
                          potentialDragTask === task.id
                            ? 'ring-2 ring-orange-400 border-orange-400'
                            : ''
                        } ${
                          task.isOnCriticalPath
                            ? 'shadow-lg shadow-red-200'
                            : 'hover:shadow-md'
                        }`}
                      >
                        {/* Connection Points */}
                        {canvasMode === 'draw' && (
                          <>
                            {/* Input connection point (left) */}
                            <div
                              className='absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer border-2 border-white shadow-lg'
                              title='Input - bağlantı alır'
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // Handle input connection if needed
                              }}
                            />

                            {/* Output connection point (right) */}
                            <div
                              className='absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer border-2 border-white shadow-lg'
                              title='Output - bağlantı gönderir'
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (!drawingConnection.isDrawing) {
                                  setDrawingConnection({
                                    isDrawing: true,
                                    from: task.id,
                                    currentPos: null,
                                  })
                                }
                              }}
                            />
                          </>
                        )}

                        {editingTask === task.id ? (
                          <div className='space-y-3'>
                            <input
                              type='text'
                              value={editTaskName}
                              onChange={(e) => setEditTaskName(e.target.value)}
                              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                              placeholder='Görev adı'
                              autoFocus
                            />
                            <div className='grid grid-cols-2 gap-2'>
                              <input
                                type='number'
                                value={editTaskDuration}
                                onChange={(e) =>
                                  setEditTaskDuration(parseInt(e.target.value))
                                }
                                className='px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                                min='1'
                                placeholder='Süre'
                              />
                              <select
                                value={editTaskType}
                                onChange={(e) =>
                                  setEditTaskType(
                                    e.target.value as
                                      | 'critical'
                                      | 'parallel'
                                      | 'flexible'
                                  )
                                }
                                className='px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                              >
                                <option value='critical'>🔥 Kritik</option>
                                <option value='parallel'>🔄 Paralel</option>
                                <option value='flexible'>💡 Esnek</option>
                              </select>
                            </div>
                            <textarea
                              value={editTaskDescription}
                              onChange={(e) =>
                                setEditTaskDescription(e.target.value)
                              }
                              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                              rows={2}
                              placeholder='Açıklama...'
                            />
                            <div className='flex gap-2'>
                              <button
                                onClick={saveTaskEdit}
                                className='flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors'
                              >
                                ✓ Kaydet
                              </button>
                              <button
                                onClick={cancelTaskEdit}
                                className='flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors'
                              >
                                ✕ İptal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className='flex items-center justify-between mb-2'>
                              <div className='font-semibold text-gray-900 text-sm leading-tight'>
                                {task.name}
                              </div>
                              <div className='flex items-center gap-1'>
                                {/* Delete button */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    deleteTask(task.id)
                                  }}
                                  className='p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity'
                                  title='Görevi sil'
                                >
                                  <svg
                                    className='w-3 h-3'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                    />
                                  </svg>
                                </button>

                                {/* Edit button */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    startTaskEdit(task.id)
                                  }}
                                  className='p-1 text-blue-500 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity'
                                  title='Görevi düzenle'
                                >
                                  <svg
                                    className='w-3 h-3'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                    />
                                  </svg>
                                </button>

                                {task.taskType === 'critical' && (
                                  <span className='text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium'>
                                    🔥 Kritik
                                  </span>
                                )}
                                {task.taskType === 'parallel' && (
                                  <span className='text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium'>
                                    🔄 Paralel
                                  </span>
                                )}
                                {task.taskType === 'flexible' && (
                                  <span className='text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium'>
                                    💡 Esnek
                                  </span>
                                )}
                                {task.milestone && (
                                  <span className='text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full font-medium'>
                                    🏁 Milestone
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className='text-lg font-bold text-gray-900 mb-2'>
                              {task.duration} gün
                            </div>

                            {task.description && (
                              <div className='text-xs text-gray-600 mb-2 line-clamp-2'>
                                {task.description}
                              </div>
                            )}

                            <div className='text-xs text-gray-500 space-y-1'>
                              {task.assignedTo && (
                                <div className='flex items-center gap-1'>
                                  <svg
                                    className='w-3 h-3'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                    />
                                  </svg>
                                  <span>{task.assignedTo}</span>
                                </div>
                              )}

                              {task.dependencies.length > 0 && (
                                <div className='flex items-center gap-1'>
                                  <svg
                                    className='w-3 h-3'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                                    />
                                  </svg>
                                  <span>
                                    {task.dependencies.length} bağımlılık
                                  </span>
                                </div>
                              )}
                            </div>

                            {task.isOnCriticalPath && (
                              <div className='mt-2 text-xs text-red-600 font-medium flex items-center gap-1'>
                                <span className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></span>
                                Kritik Yol
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Canvas overlay info */}
                <div className='absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg'>
                  <div className='text-xs text-gray-600 space-y-1'>
                    <div>📋 {displayTasks.length} görev</div>
                    <div>
                      🔥 {displayTasks.filter((t) => t.isOnCriticalPath).length}{' '}
                      kritik
                    </div>
                    <div>📐 Zoom: {Math.round(zoomLevel * 100)}%</div>
                    {selectedTasks.size > 0 && (
                      <div>🎯 {selectedTasks.size} seçili</div>
                    )}
                    {potentialDragTask && !isDragging && (
                      <div className='text-orange-600'>
                        🖱️ Sürüklemek için hareket ettirin
                      </div>
                    )}
                    {isDragging && draggedTask && (
                      <div className='text-blue-600 animate-pulse'>
                        🔄 Sürükleniyor...
                      </div>
                    )}
                    <div className='pt-1 border-t border-gray-200'>
                      <div className='text-xs'>
                        <kbd className='px-1 py-0.5 bg-gray-100 rounded text-xs'>
                          V
                        </kbd>{' '}
                        View
                        <kbd className='px-1 py-0.5 bg-gray-100 rounded text-xs ml-1'>
                          S
                        </kbd>{' '}
                        Select
                        <kbd className='px-1 py-0.5 bg-gray-100 rounded text-xs ml-1'>
                          D
                        </kbd>{' '}
                        Draw
                      </div>
                      {canvasMode === 'draw' && (
                        <div className='text-xs mt-1 text-blue-600'>
                          Click source → drag to target
                        </div>
                      )}
                      {canvasMode === 'view' && (
                        <div className='text-xs mt-1 text-green-600'>
                          Görevleri taşımak için: basılı tutup hareket ettirin
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mode indicator */}
                <div className='absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-lg'>
                  <div
                    className={`text-sm font-medium transition-colors ${
                      canvasMode === 'view'
                        ? 'text-gray-700'
                        : canvasMode === 'select'
                        ? 'text-blue-700'
                        : canvasMode === 'draw'
                        ? 'text-green-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {canvasMode === 'view' && '👁️ View Mode'}
                    {canvasMode === 'select' && '🎯 Select Mode'}
                    {canvasMode === 'draw' && '✏️ Draw Mode'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
              <div className='p-6'>
                <h3 className='text-xl font-bold text-gray-900 mb-4'>
                  Yeni Görev Ekle
                </h3>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Görev Adı
                    </label>
                    <input
                      type='text'
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                      placeholder='Görev adını girin'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Süre (gün)
                    </label>
                    <input
                      type='number'
                      value={newTaskDuration}
                      onChange={(e) =>
                        setNewTaskDuration(parseInt(e.target.value))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                      min='1'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Görev Türü
                    </label>
                    <select
                      value={newTaskType}
                      onChange={(e) =>
                        setNewTaskType(
                          e.target.value as 'critical' | 'parallel' | 'flexible'
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='flexible'>🟡 Esnek Görev</option>
                      <option value='critical'>🔴 Kritik Görev</option>
                      <option value='parallel'>🔵 Paralel Görev</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Açıklama
                    </label>
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                      rows={3}
                      placeholder='Görev açıklaması (opsiyonel)'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Atanan Kişi
                    </label>
                    <input
                      type='text'
                      value={newTaskAssignedTo}
                      onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                      placeholder='Atanan kişi (opsiyonel)'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Öncelik
                    </label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) =>
                        setNewTaskPriority(
                          e.target.value as
                            | 'low'
                            | 'medium'
                            | 'high'
                            | 'critical'
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='low'>🟢 Düşük</option>
                      <option value='medium'>🟡 Orta</option>
                      <option value='high'>🟠 Yüksek</option>
                      <option value='critical'>🔴 Kritik</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Tahmini Maliyet (₺)
                    </label>
                    <input
                      type='number'
                      value={newTaskEstimatedCost}
                      onChange={(e) =>
                        setNewTaskEstimatedCost(parseFloat(e.target.value))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                      min='0'
                      step='0.01'
                      placeholder='0.00'
                    />
                  </div>

                  <div className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      id='milestone'
                      checked={newTaskMilestone}
                      onChange={(e) => setNewTaskMilestone(e.target.checked)}
                      className='rounded'
                    />
                    <label
                      htmlFor='milestone'
                      className='text-sm font-medium text-gray-700'
                    >
                      Bu görev bir kilometre taşı
                    </label>
                  </div>
                </div>

                <div className='flex justify-end gap-3 mt-6'>
                  <button
                    onClick={() => setShowTaskForm(false)}
                    className='px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300'
                  >
                    İptal
                  </button>
                  <button
                    onClick={addTask}
                    disabled={loading || !newTaskName.trim()}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
                  >
                    Görev Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StrategicPlaygroundNew
