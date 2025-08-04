'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Calendar,
  Plus,
  Users,
  BarChart3,
  Clock,
  Settings,
  AlertTriangle,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  Circle,
  AlertCircle,
  ArrowLeft,
  List,
  Eye,
  User as UserIcon,
  Calendar as CalendarIcon,
  Target,
  Timer,
  MessageSquare,
  Download,
} from 'lucide-react'
import type { Project, Task, User } from '@prisma/client'
import ImprovedEnhancedCalendar from '@/components/ImprovedEnhancedCalendar'
import EnhancedTaskCreationModal from '@/components/EnhancedTaskCreationModal'
import AdvancedGanttChart from '@/components/AdvancedGanttChart'
import NotificationCenter from '@/components/NotificationCenter'
import CriticalPathAnalysis from '@/components/CriticalPathAnalysis'
import '@/styles/kanban-board.css'

interface ExtendedProject extends Project {
  tasks: ExtendedTask[]
  users: User[]
}

interface ExtendedTask extends Task {
  assignedUser?: User
  assignedUsers?: Array<{
    id: string
    taskId: string
    userId: string
    assignedAt: Date
    user: User
  }>
}

interface StatusNote {
  id: string
  content: string
  createdAt: string
  createdBy: {
    id: string
    name: string
  }
  status: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<ExtendedProject | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'calendar' | 'gantt' | 'critical-path' | 'analytics'
  >('overview')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [selectedTaskDetails, setSelectedTaskDetails] =
    useState<ExtendedTask | null>(null)
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false)
  const [editingTaskData, setEditingTaskData] = useState<ExtendedTask | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  
  // Status Notes state for task details modal
  const [taskStatusNotes, setTaskStatusNotes] = useState<StatusNote[]>([])
  const [showStatusNotesModal, setShowStatusNotesModal] = useState(false)
  const [newStatusNoteContent, setNewStatusNoteContent] = useState('')
  const [newStatusNoteType, setNewStatusNoteType] = useState<'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'>('INFO')
  const [selectedNoteCreator, setSelectedNoteCreator] = useState<string>('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  // Task status change handler
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchProject()
        // Show brief success feedback
        const taskTitle =
          project?.tasks.find((t) => t.id === taskId)?.title || 'Görev'
        console.log(`✅ ${taskTitle} durumu güncellendi: ${newStatus}`)
      } else {
        const errorData = await response.json()
        console.error('Status update failed:', errorData)
        alert('Görev durumu güncellenemedi')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      alert('Görev durumu güncellenirken bir hata oluştu')
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchProject()
        }
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedTask) {
      handleTaskStatusChange(draggedTask, newStatus)
      setDraggedTask(null)
    }
  }

  // Fetch project data
  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error('Proje bulunamadı')
      }
      const data = await response.json()
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const data = await response.json()
          // Remove duplicates based on user ID
          const uniqueUsers = data.filter(
            (user: any, index: number, self: any[]) =>
              index === self.findIndex((u) => u.id === user.id)
          )
          setUsers(uniqueUsers)
        }
      } catch (err) {
        console.error('Kullanıcılar yüklenemedi:', err)
      }
    }

    fetchUsers()
  }, [])

  // Handle task updates
  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Görev güncellenemedi')
      }

      const updatedTask = await response.json()

      // Update local state
      setProject((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updatedTask } : task
          ),
        }
      })
    } catch (err) {
      console.error('Görev güncellenirken hata:', err)
    }
  }

  // Handle task click for details view
  const handleTaskClick = (task: ExtendedTask) => {
    setSelectedTaskDetails(task)
    setShowTaskDetailsModal(true)
    loadTaskStatusNotes(task.id)
    // Reset note creator selection
    setSelectedNoteCreator('')
    setNewStatusNoteContent('')
    setNewStatusNoteType('INFO')
    
    // Debug: Log task assignment data
    console.log('Task clicked:', {
      title: task.title,
      assignedUser: task.assignedUser,
      assignedUsers: task.assignedUsers,
      assignedUsersCount: task.assignedUsers?.length || 0
    })
  }

  // Load status notes for a task
  const loadTaskStatusNotes = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status-notes`)
      if (response.ok) {
        const notes = await response.json()
        console.log('Loaded status notes:', notes) // Debug log
        setTaskStatusNotes(notes || [])
      } else {
        console.error('Failed to load status notes, status:', response.status)
        setTaskStatusNotes([])
      }
    } catch (error) {
      console.error('Error loading status notes:', error)
      setTaskStatusNotes([])
    }
  }

  // Add new status note to a task
  const addTaskStatusNote = async (taskId: string, content: string, status: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR', createdById?: string) => {
    if (!content.trim()) return

    setIsAddingNote(true)
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/status-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: content.trim(), 
          status,
          createdById: createdById || undefined
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save note')
      }

      const savedNote = await response.json()
      
      // Update local state with the saved note
      setTaskStatusNotes(prev => [savedNote, ...prev])
      return true
    } catch (error) {
      console.error('Error adding status note:', error)
      alert('Not kaydedilemedi. Lütfen tekrar deneyin.')
      return false
    } finally {
      setIsAddingNote(false)
    }
  }

  // Handle project reschedule
  const handleProjectReschedule = async (strategy: string) => {
    try {
      const response = await fetch(`/api/projects/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          strategy,
        }),
      })

      if (!response.ok) {
        throw new Error('Proje yeniden planlanamadı')
      }

      // Reload project data
      window.location.reload()
    } catch (err) {
      console.error('Proje yeniden planlanırken hata:', err)
    }
  }

  // Handle single task creation
  const handleCreateTask = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          projectId,
          startDate: taskData.startDate
            ? new Date(taskData.startDate).toISOString()
            : null,
          endDate: taskData.endDate
            ? new Date(taskData.endDate).toISOString()
            : null,
          estimatedHours: taskData.estimatedHours
            ? parseInt(taskData.estimatedHours)
            : null,
          maxDailyHours: taskData.maxDailyHours
            ? parseInt(taskData.maxDailyHours)
            : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Görev oluşturulamadı')
      }

      // Reload project data
      await fetchProject()
      setShowTaskModal(false)
      setModalMode('create')
      setEditingTaskData(null)
    } catch (err) {
      console.error('Görev oluşturulurken hata:', err)
    }
  }

  // Handle task update
  const handleUpdateTask = async (taskId: string, taskData: any) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          estimatedHours: taskData.estimatedHours || null,
          maxDailyHours: taskData.maxDailyHours || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Görev güncellenemedi')
      }

      // Reload project data
      await fetchProject()
      setShowTaskModal(false)
      setModalMode('create')
      setEditingTaskData(null)
    } catch (err) {
      console.error('Görev güncellenirken hata:', err)
    }
  }

  // Handle opening edit modal
  const handleEditTask = (task: ExtendedTask) => {
    setEditingTaskData(task)
    setModalMode('edit')
    setShowTaskModal(true)
  }

  // Handle task group creation
  const handleCreateTaskGroup = async (groupData: any) => {
    try {
      // First create the parent task
      const parentResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: groupData.groupTitle,
          description: groupData.groupDescription,
          projectId,
          status: 'TODO',
          priority: 'MEDIUM',
          createdById: null, // Add this required field
        }),
      })

      if (!parentResponse.ok) {
        const errorText = await parentResponse.text()
        console.error('Parent task creation failed:', errorText)
        throw new Error(`Ana görev oluşturulamadı: ${errorText}`)
      }

      const parentTask = await parentResponse.json()

      // Then create child tasks
      for (let i = 0; i < groupData.tasks.length; i++) {
        const childTask = groupData.tasks[i]
        const childResponse = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: childTask.title,
            description: childTask.description,
            projectId,
            assignedId: childTask.assignedId || null,
            assignedUserIds: childTask.assignedUserIds || [],
            priority: childTask.priority,
            estimatedHours: childTask.estimatedHours
              ? parseInt(childTask.estimatedHours)
              : null,
            maxDailyHours: childTask.maxDailyHours
              ? parseInt(childTask.maxDailyHours)
              : null,
            startDate: childTask.startDate || null,
            endDate: childTask.endDate || null,
            status: 'TODO',
            createdById: null,
          }),
        })

        if (!childResponse.ok) {
          const childErrorText = await childResponse.text()
          console.error(`Child task ${i + 1} creation failed:`, childErrorText)
        }
      }

      // Reload project data
      window.location.reload()
    } catch (err) {
      console.error('Görev grubu oluşturulurken hata:', err)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Proje yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <AlertTriangle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Hata</h1>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={() => router.push('/projects')}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Projelere Dön
          </button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Proje Bulunamadı
          </h1>
          <button
            onClick={() => router.push('/projects')}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Projelere Dön
          </button>
        </div>
      </div>
    )
  }

  // Calculate project statistics
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(
    (task) => task.status === 'COMPLETED'
  ).length
  const inProgressTasks = project.tasks.filter(
    (task) => task.status === 'IN_PROGRESS'
  ).length
  const todoTasks = project.tasks.filter(
    (task) => task.status === 'TODO'
  ).length
  const blockedTasks = project.tasks.filter(
    (task) => task.status === 'BLOCKED'
  ).length
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Transform tasks for Gantt chart
  const transformTasksForGantt = (tasks: ExtendedTask[]) => {
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      startDate: task.startDate ? new Date(task.startDate) : new Date(),
      endDate: task.endDate ? new Date(task.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
      progress: task.status === 'COMPLETED' ? 100 : 
                task.status === 'IN_PROGRESS' ? 50 : 
                task.status === 'REVIEW' ? 80 : 0,
      priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      status: task.status as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED',
      assignedUsers: task.assignedUsers?.map(assignment => ({
        user: {
          id: assignment.user.id,
          name: assignment.user.name,
          avatar: undefined
        }
      })) || (task.assignedUser ? [{
        user: {
          id: task.assignedUser.id,
          name: task.assignedUser.name,
          avatar: undefined
        }
      }] : []),
      dependencies: [], // Add dependencies logic if available
      estimatedHours: task.estimatedHours || 8,
      actualHours: task.actualHours ?? undefined,
      isOnCriticalPath: false, // This would be calculated by critical path analysis
      milestones: []
    }))
  }

  // Transform tasks for Critical Path Analysis
  const transformTasksForCriticalPath = (tasks: ExtendedTask[]) => {
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      estimatedHours: task.estimatedHours || 8,
      actualHours: task.actualHours ?? undefined,
      startDate: task.startDate ? new Date(task.startDate) : new Date(),
      endDate: task.endDate ? new Date(task.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      dependencies: [], // Add dependencies logic if available
      status: task.status as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED',
      assignedUsers: task.assignedUsers?.map(assignment => ({
        user: { id: assignment.user.id, name: assignment.user.name }
      })) || (task.assignedUser ? [{
        user: { id: task.assignedUser.id, name: task.assignedUser.name }
      }] : []),
      priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    }))
  }

  // Handle optimization recommendations
  const handleOptimizationRecommendations = async (recommendations: any[]) => {
    console.log('Optimization recommendations:', recommendations)
    // You can implement auto-application of recommendations here
    alert(`${recommendations.length} optimizasyon önerisi alındı. Konsolu kontrol edin.`)
  }

  // TaskList Component
  function TaskList({
    tasks,
    users,
    onTaskClick,
  }: {
    tasks: ExtendedTask[]
    users: User[]
    onTaskClick: (task: ExtendedTask) => void
  }) {
    const [filter, setFilter] = useState<
      'all' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'BLOCKED'
    >('all')
    const [sortBy, setSortBy] = useState<
      'title' | 'priority' | 'status' | 'dueDate'
    >('title')

    const filteredTasks = tasks.filter(
      (task) => filter === 'all' || task.status === filter
    )

    const sortedTasks = [...filteredTasks].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'status':
          return a.status.localeCompare(b.status)
        case 'dueDate':
          if (!a.endDate && !b.endDate) return 0
          if (!a.endDate) return 1
          if (!b.endDate) return -1
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
        default:
          return a.title.localeCompare(b.title)
      }
    })

    const getStatusText = (status: string) => {
      const statusMap: { [key: string]: string } = {
        TODO: 'Yapılacak',
        IN_PROGRESS: 'Devam Ediyor',
        REVIEW: 'İncelemede',
        COMPLETED: 'Tamamlandı',
        BLOCKED: 'Engellenmiş',
      }
      return statusMap[status] || status
    }

    const getPriorityText = (priority: string) => {
      const priorityMap: { [key: string]: string } = {
        LOW: 'Düşük',
        MEDIUM: 'Orta',
        HIGH: 'Yüksek',
        URGENT: 'Acil',
      }
      return priorityMap[priority] || priority
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'TODO':
          return 'bg-gray-100 text-gray-700'
        case 'IN_PROGRESS':
          return 'bg-blue-100 text-blue-700'
        case 'REVIEW':
          return 'bg-purple-100 text-purple-700'
        case 'COMPLETED':
          return 'bg-green-100 text-green-700'
        case 'BLOCKED':
          return 'bg-red-100 text-red-700'
        default:
          return 'bg-gray-100 text-gray-700'
      }
    }

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'LOW':
          return 'bg-green-100 text-green-700'
        case 'MEDIUM':
          return 'bg-yellow-100 text-yellow-700'
        case 'HIGH':
          return 'bg-orange-100 text-orange-700'
        case 'URGENT':
          return 'bg-red-100 text-red-700'
        default:
          return 'bg-gray-100 text-gray-700'
      }
    }

    return (
      <div className='space-y-4'>
        {/* Filters and Sort */}
        <div className='flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-lg'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-gray-700'>Filtrele:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className='px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>Tümü ({tasks.length})</option>
              <option value='TODO'>
                Yapılacak ({tasks.filter((t) => t.status === 'TODO').length})
              </option>
              <option value='IN_PROGRESS'>
                Devam Eden (
                {tasks.filter((t) => t.status === 'IN_PROGRESS').length})
              </option>
              <option value='REVIEW'>
                İncelemede ({tasks.filter((t) => t.status === 'REVIEW').length})
              </option>
              <option value='COMPLETED'>
                Tamamlandı (
                {tasks.filter((t) => t.status === 'COMPLETED').length})
              </option>
              <option value='BLOCKED'>
                Engellenmiş (
                {tasks.filter((t) => t.status === 'BLOCKED').length})
              </option>
            </select>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-gray-700'>Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className='px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='title'>Başlık</option>
              <option value='priority'>Öncelik</option>
              <option value='status'>Durum</option>
              <option value='dueDate'>Son Tarih</option>
            </select>
          </div>
        </div>

        {/* Task Grid */}
        {sortedTasks.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-gray-400 mb-4'>
              <Target className='w-12 h-12 mx-auto' />
            </div>
            <p className='text-gray-500'>
              {filter === 'all'
                ? 'Henüz görev eklenmemiş'
                : `${getStatusText(filter)} durumunda görev bulunamadı`}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {sortedTasks.map((task) => {
              const assignedUser = users.find((u) => u.id === task.assignedId)
              // Fixed overdue logic: task is overdue only after the deadline day has completely passed
              const isOverdue = (() => {
                if (!task.endDate || task.status === 'COMPLETED') return false
                
                const taskDeadline = new Date(task.endDate)
                const today = new Date()
                
                // Set deadline to end of deadline day and current date to end of current day
                taskDeadline.setHours(23, 59, 59, 999) // End of deadline day
                today.setHours(23, 59, 59, 999) // End of current day
                
                // Task is overdue only when current day is completely past the deadline
                return today > taskDeadline
              })()

              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`bg-white border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer ${
                    isOverdue
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className='flex items-start justify-between mb-3'>
                    <h4 className='font-semibold text-gray-900 flex-1 pr-2'>
                      {task.title}
                    </h4>
                    <button className='text-gray-400 hover:text-blue-600 transition-colors'>
                      <Eye className='w-4 h-4' />
                    </button>
                  </div>

                  {task.description && (
                    <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                      {task.description}
                    </p>
                  )}

                  <div className='flex items-center gap-2 mb-3'>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {getStatusText(task.status)}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {getPriorityText(task.priority)}
                    </span>
                  </div>

                  <div className='space-y-2 text-xs text-gray-500'>
                    {assignedUser && (
                      <div className='flex items-center gap-1'>
                        <UserIcon className='w-3 h-3' />
                        <span>{assignedUser.name}</span>
                      </div>
                    )}

                    {task.estimatedHours && (
                      <div className='flex items-center gap-1'>
                        <Timer className='w-3 h-3' />
                        <span>{task.estimatedHours} saat</span>
                      </div>
                    )}

                    {task.endDate && (
                      <div className='flex items-center gap-1'>
                        <CalendarIcon className='w-3 h-3' />
                        <span
                          className={
                            isOverdue ? 'text-red-600 font-semibold' : ''
                          }
                        >
                          {new Date(task.endDate).toLocaleDateString('tr-TR')}
                          {isOverdue && ' (Gecikmiş)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Enhanced Task Card Component
  function TaskCard({ task }: { task: ExtendedTask }) {
    // Fixed overdue logic: task is overdue only after the deadline day has completely passed
    const isOverdue = (() => {
      if (!task.endDate || task.status === 'COMPLETED') return false
      
      const taskDeadline = new Date(task.endDate)
      const today = new Date()
      
      // Set deadline to end of deadline day and current date to end of current day
      taskDeadline.setHours(23, 59, 59, 999) // End of deadline day
      today.setHours(23, 59, 59, 999) // End of current day
      
      // Task is overdue only when current day is completely past the deadline
      return today > taskDeadline
    })()

    // Get status-specific styling
    const getStatusStyling = (status: string) => {
      switch (status) {
        case 'COMPLETED':
          return {
            bgColor: 'bg-gradient-to-r from-emerald-50 to-emerald-100',
            borderColor: 'border-emerald-200',
            textColor: 'text-emerald-800',
            statusIcon: <CheckCircle className='w-4 h-4 text-emerald-600' />,
            shadowColor: 'shadow-emerald-100',
          }
        case 'IN_PROGRESS':
          return {
            bgColor: 'bg-gradient-to-r from-blue-50 to-blue-100',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800',
            statusIcon: <AlertCircle className='w-4 h-4 text-blue-600' />,
            shadowColor: 'shadow-blue-100',
          }
        case 'REVIEW':
          return {
            bgColor: 'bg-gradient-to-r from-purple-50 to-purple-100',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-800',
            statusIcon: <Eye className='w-4 h-4 text-purple-600' />,
            shadowColor: 'shadow-purple-100',
          }
        case 'BLOCKED':
          return {
            bgColor: 'bg-gradient-to-r from-red-50 to-red-100',
            borderColor: 'border-red-200',
            textColor: 'text-red-800',
            statusIcon: <X className='w-4 h-4 text-red-600' />,
            shadowColor: 'shadow-red-100',
          }
        default:
          return {
            bgColor: 'bg-gradient-to-r from-slate-50 to-slate-100',
            borderColor: 'border-slate-200',
            textColor: 'text-slate-800',
            statusIcon: <Circle className='w-4 h-4 text-slate-600' />,
            shadowColor: 'shadow-slate-100',
          }
      }
    }

    const statusStyling = getStatusStyling(task.status)

    return (
      <div
        className={`
          kanban-task-card
          ${statusStyling.bgColor} 
          ${statusStyling.borderColor} 
          ${statusStyling.shadowColor}
          border-l-4 rounded-xl p-5 cursor-move transition-all duration-300 
          hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1
          ${draggedTask === task.id ? 'opacity-50 scale-95 dragging' : ''}
          ${isOverdue ? 'ring-2 ring-red-400 animate-pulse' : ''}
          ${task.priority === 'URGENT' ? 'priority-urgent' : ''}
          backdrop-blur-sm relative overflow-hidden group
        `}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22%3E%3Cg fill-rule=%22evenodd%22%3E%3Cg fill=%22%23000%22 fill-opacity=%220.4%22 fill-rule=%22nonzero%22%3E%3Cpath d=%22m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>

        <div className='relative z-10'>
            {/* Header with status and actions */}
            <div className='flex items-start justify-between mb-3'>
              <div className='flex items-center gap-3 flex-1'>
                <div className='p-2 bg-white/80 rounded-lg shadow-sm'>
                  {statusStyling.statusIcon}
                </div>
                <h4
                  className={`font-bold text-base ${statusStyling.textColor} leading-tight`}
                >
                  {task.title}
                </h4>
                {isOverdue && (
                  <div className='flex items-center bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold animate-bounce'>
                    ⚠️ GECİKMİŞ
                  </div>
                )}
              </div>
              <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                <button
                  onClick={() => handleEditTask(task)}
                  className='p-2 text-slate-500 hover:text-blue-600 hover:bg-white/80 rounded-lg transition-all duration-200'
                  title='Görevi Düzenle'
                >
                  <Edit className='w-4 h-4' />
                </button>
                <button
                  onClick={() => handleTaskDelete(task.id)}
                  className='p-2 text-slate-500 hover:text-red-600 hover:bg-white/80 rounded-lg transition-all duration-200'
                  title='Görevi Sil'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className='text-sm text-slate-600 mb-4 bg-white/50 p-3 rounded-lg leading-relaxed'>
                {task.description}
              </p>
            )}

            {/* Priority and metadata */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 shadow-sm ${
                    task.priority === 'URGENT'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : task.priority === 'HIGH'
                      ? 'bg-orange-100 text-orange-700 border-orange-200'
                      : task.priority === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {task.priority === 'URGENT'
                    ? '🔴 Acil'
                    : task.priority === 'HIGH'
                    ? '🟠 Yüksek'
                    : task.priority === 'MEDIUM'
                    ? '🟡 Orta'
                    : '🟢 Düşük'}
                </span>
                {task.estimatedHours && (
                  <div className='flex items-center bg-white/80 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 shadow-sm border'>
                    <Clock className='w-3 h-3 mr-1.5' />
                    {task.estimatedHours}h
                  </div>
                )}
              </div>
            </div>

            {/* Assigned user */}
            {task.assignedUser && (
              <div className='flex items-center bg-white/80 p-3 rounded-lg mb-4 border shadow-sm'>
                <div className='kanban-user-avatar w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3'>
                  {task.assignedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className='font-medium text-slate-800 text-sm'>
                    {task.assignedUser.name}
                  </p>
                  <p className='text-xs text-slate-500'>Sorumlu</p>
                </div>
              </div>
            )}

            {/* Dates */}
            {(task.startDate || task.endDate) && (
              <div className='bg-white/80 p-3 rounded-lg border shadow-sm'>
                <div className='flex items-center justify-between text-xs'>
                  {task.startDate && (
                    <div className='flex items-center text-emerald-600'>
                      <div className='w-2 h-2 bg-emerald-500 rounded-full mr-2'></div>
                      <span className='font-medium'>
                        🚀{' '}
                        {new Date(task.startDate).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                  {task.endDate && (
                    <div
                      className={`flex items-center ${
                        isOverdue ? 'text-red-600 font-bold' : 'text-red-500'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          isOverdue ? 'bg-red-600 animate-pulse' : 'bg-red-500'
                        }`}
                      ></div>
                      <span className='font-medium'>
                        🏁{' '}
                        {new Date(task.endDate).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress indicator for status */}
            <div className='mt-4 w-full bg-slate-200 rounded-full h-2 overflow-hidden kanban-progress-bar'>
              <div
                className={`h-full transition-all duration-500 ${
                  task.status === 'COMPLETED'
                    ? 'w-full bg-gradient-to-r from-emerald-500 to-emerald-600'
                    : task.status === 'REVIEW'
                    ? 'w-4/5 bg-gradient-to-r from-purple-500 to-purple-600'
                    : task.status === 'IN_PROGRESS'
                    ? 'w-1/2 bg-gradient-to-r from-blue-500 to-blue-600'
                    : 'w-1/4 bg-gradient-to-r from-slate-400 to-slate-500'
                }`}
              ></div>
            </div>
          </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              {/* Go Back Button */}
              <button
                onClick={() => router.push('/projects')}
                className='flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
                title='Projelere Geri Dön'
              >
                <ArrowLeft className='w-5 h-5' />
                <span className='hidden sm:inline'>Geri</span>
              </button>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  {project.name}
                </h1>
                {project.description && (
                  <p className='text-gray-600 mt-2'>{project.description}</p>
                )}
                <div className='flex items-center gap-4 mt-4'>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-5 h-5 text-gray-400' />
                    <span className='text-sm text-gray-600'>
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString(
                            'tr-TR'
                          )
                        : 'Başlangıç tarihi belirtilmemiş'}
                      {' - '}
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString('tr-TR')
                        : 'Bitiş tarihi belirtilmemiş'}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Users className='w-5 h-5 text-gray-400' />
                    <span className='text-sm text-gray-600'>
                      {totalTasks} görev
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <NotificationCenter 
                projectId={projectId} 
                userId={undefined} // Add user ID if available
              />
              <button
                onClick={() => window.open(`/api/reports/project/${projectId}/pdf`, '_blank')}
                className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
                title='PDF Raporu İndir (Gelişmiş Timeline ile)'
              >
                <Download className='w-4 h-4' />
                PDF İndir
              </button>
              <button
                onClick={() => {
                  setModalMode('create')
                  setEditingTaskData(null)
                  setShowTaskModal(true)
                }}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <Plus className='w-4 h-4' />
                Yeni Görev
              </button>
              <button
                onClick={() => router.push(`/projects/${projectId}/settings`)}
                className='flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
              >
                <Settings className='w-4 h-4' />
                Ayarlar
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Proje İlerlemesi
            </h2>
            <span className='text-2xl font-bold text-blue-600'>
              {progressPercentage}%
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-3 mb-4'>
            <div
              className='bg-blue-600 h-3 rounded-full transition-all duration-300'
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className='grid grid-cols-5 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-900'>
                {totalTasks}
              </div>
              <div className='text-sm text-gray-600'>Toplam Görev</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {completedTasks}
              </div>
              <div className='text-sm text-gray-600'>Tamamlanan</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {inProgressTasks}
              </div>
              <div className='text-sm text-gray-600'>Devam Eden</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {blockedTasks}
              </div>
              <div className='text-sm text-gray-600'>Engellenen</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-600'>
                {todoTasks}
              </div>
              <div className='text-sm text-gray-600'>Bekleyen</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='bg-white rounded-lg shadow-sm mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='flex'>
              {[
                { key: 'overview', label: 'Genel Bakış', icon: BarChart3 },
                { key: 'calendar', label: 'Takvim', icon: Calendar },
                { key: 'gantt', label: 'Gantt Şeması', icon: Target },
                { key: 'critical-path', label: 'Kritik Yol', icon: AlertTriangle },
                { key: 'analytics', label: 'Analitik', icon: BarChart3 },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className='p-6'>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className='space-y-6'>
                {/* Enhanced Interactive Kanban Board */}
                <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
                  {/* TODO Column */}
                  <div
                    className={`kanban-column bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 transition-all duration-300 border border-slate-200 shadow-sm ${
                      draggedTask &&
                      'ring-2 ring-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 scale-105 shadow-lg drag-over'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'TODO')}
                  >
                    <div className='kanban-column-header flex items-center justify-between mb-6'>
                      <div className='flex items-center'>
                        <div className='p-2 bg-white rounded-lg shadow-sm mr-3'>
                          <Circle className='w-5 h-5 text-slate-500' />
                        </div>
                        <div>
                          <h3 className='font-bold text-slate-800 text-lg'>
                            Yapılacak
                          </h3>
                          <p className='text-slate-500 text-sm'>
                            {
                              project.tasks.filter((t) => t.status === 'TODO')
                                .length
                            }{' '}
                            görev
                          </p>
                        </div>
                      </div>
                      <div className='w-3 h-3 bg-slate-400 rounded-full'></div>
                    </div>
                    <div className='space-y-3 min-h-[450px] overflow-y-auto'>
                      {project.tasks
                        .filter((t) => t.status === 'TODO')
                        .map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      {project.tasks.filter((t) => t.status === 'TODO')
                        .length === 0 && (
                        <div className='flex flex-col items-center justify-center py-12 text-slate-400'>
                          <Circle className='w-12 h-12 mb-3 opacity-40' />
                          <p className='text-center'>
                            Henüz yapılacak görev yok
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* IN_PROGRESS Column */}
                  <div
                    className={`kanban-column bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 transition-all duration-300 border border-blue-200 shadow-sm ${
                      draggedTask &&
                      'ring-2 ring-blue-400 bg-gradient-to-br from-blue-100 to-blue-200 scale-105 shadow-lg drag-over'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
                  >
                    <div className='kanban-column-header flex items-center justify-between mb-6'>
                      <div className='flex items-center'>
                        <div className='p-2 bg-white rounded-lg shadow-sm mr-3'>
                          <AlertCircle className='w-5 h-5 text-blue-600' />
                        </div>
                        <div>
                          <h3 className='font-bold text-blue-800 text-lg'>
                            Devam Eden
                          </h3>
                          <p className='text-blue-600 text-sm'>
                            {
                              project.tasks.filter(
                                (t) => t.status === 'IN_PROGRESS'
                              ).length
                            }{' '}
                            görev
                          </p>
                        </div>
                      </div>
                      <div className='w-3 h-3 bg-blue-500 rounded-full animate-pulse'></div>
                    </div>
                    <div className='space-y-3 min-h-[450px] overflow-y-auto'>
                      {project.tasks
                        .filter((t) => t.status === 'IN_PROGRESS')
                        .map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      {project.tasks.filter((t) => t.status === 'IN_PROGRESS')
                        .length === 0 && (
                        <div className='flex flex-col items-center justify-center py-12 text-blue-400'>
                          <AlertCircle className='w-12 h-12 mb-3 opacity-40' />
                          <p className='text-center'>Devam eden görev yok</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* REVIEW Column - Added between IN_PROGRESS and COMPLETED */}
                  <div
                    className={`kanban-column bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 transition-all duration-300 border border-purple-200 shadow-sm ${
                      draggedTask &&
                      'ring-2 ring-blue-400 bg-gradient-to-br from-purple-100 to-purple-200 scale-105 shadow-lg drag-over'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'REVIEW')}
                  >
                    <div className='kanban-column-header flex items-center justify-between mb-6'>
                      <div className='flex items-center'>
                        <div className='p-2 bg-white rounded-lg shadow-sm mr-3'>
                          <Eye className='w-5 h-5 text-purple-600' />
                        </div>
                        <div>
                          <h3 className='font-bold text-purple-800 text-lg'>
                            İncelemede
                          </h3>
                          <p className='text-purple-600 text-sm'>
                            {
                              project.tasks.filter((t) => t.status === 'REVIEW')
                                .length
                            }{' '}
                            görev
                          </p>
                        </div>
                      </div>
                      <div className='w-3 h-3 bg-purple-500 rounded-full animate-pulse'></div>
                    </div>
                    <div className='space-y-3 min-h-[450px] overflow-y-auto'>
                      {project.tasks
                        .filter((t) => t.status === 'REVIEW')
                        .map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      {project.tasks.filter((t) => t.status === 'REVIEW')
                        .length === 0 && (
                        <div className='flex flex-col items-center justify-center py-12 text-purple-400'>
                          <Eye className='w-12 h-12 mb-3 opacity-40' />
                          <p className='text-center'>İncelenen görev yok</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COMPLETED Column */}
                  <div
                    className={`kanban-column bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 transition-all duration-300 border border-emerald-200 shadow-sm ${
                      draggedTask &&
                      'ring-2 ring-blue-400 bg-gradient-to-br from-emerald-100 to-emerald-200 scale-105 shadow-lg drag-over'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'COMPLETED')}
                  >
                    <div className='kanban-column-header flex items-center justify-between mb-6'>
                      <div className='flex items-center'>
                        <div className='p-2 bg-white rounded-lg shadow-sm mr-3'>
                          <CheckCircle className='w-5 h-5 text-emerald-600' />
                        </div>
                        <div>
                          <h3 className='font-bold text-emerald-800 text-lg'>
                            Tamamlanan
                          </h3>
                          <p className='text-emerald-600 text-sm'>
                            {
                              project.tasks.filter(
                                (t) => t.status === 'COMPLETED'
                              ).length
                            }{' '}
                            görev
                          </p>
                        </div>
                      </div>
                      <div className='w-3 h-3 bg-emerald-500 rounded-full'></div>
                    </div>
                    <div className='space-y-3 min-h-[450px] overflow-y-auto'>
                      {project.tasks
                        .filter((t) => t.status === 'COMPLETED')
                        .map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      {project.tasks.filter((t) => t.status === 'COMPLETED')
                        .length === 0 && (
                        <div className='flex flex-col items-center justify-center py-12 text-emerald-400'>
                          <CheckCircle className='w-12 h-12 mb-3 opacity-40' />
                          <p className='text-center'>Tamamlanan görev yok</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task List Section Below Kanban */}
                <div className='mt-8'>
                  <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
                    <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600'>
                      <h3 className='text-lg font-semibold text-white flex items-center'>
                        <List className='w-5 h-5 mr-2' />
                        Tüm Görevler ({project.tasks.length})
                      </h3>
                      <p className='text-blue-100 text-sm mt-1'>
                        Görevlere tıklayarak detaylı bilgileri
                        görüntüleyebilirsiniz
                      </p>
                    </div>
                    <div className='p-6'>
                      <TaskList
                        tasks={project.tasks}
                        users={users}
                        onTaskClick={handleTaskClick}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <ImprovedEnhancedCalendar
                tasks={project.tasks.map(
                  (task) =>
                    ({
                      ...task,
                      description: task.description || undefined,
                      startDate: task.startDate || undefined,
                      endDate: task.endDate || undefined,
                      originalEndDate: task.originalEndDate || undefined,
                      assignedId: task.assignedId || undefined,
                      estimatedHours: task.estimatedHours || undefined,
                      actualHours: task.actualHours || undefined,
                      workloadPercentage: task.workloadPercentage || 0,
                      delayDays: task.delayDays || 0,
                      isBottleneck: task.isBottleneck || false,
                      maxDailyHours: task.maxDailyHours || undefined,
                      assignedUser: task.assignedUser
                        ? {
                            id: task.assignedUser.id,
                            name: task.assignedUser.name,
                            maxHoursPerDay:
                              task.assignedUser.maxHoursPerDay || 8,
                          }
                        : undefined,
                    } as any)
                )}
                project={{
                  id: project.id,
                  name: project.name,
                  startDate: project.startDate || undefined,
                  endDate: project.endDate || undefined,
                  originalEndDate: project.originalEndDate || undefined,
                  delayDays: project.delayDays || 0,
                  autoReschedule: project.autoReschedule || false,
                }}
                users={users}
                onTaskUpdate={handleTaskUpdate}
                onProjectReschedule={handleProjectReschedule}
              />
            )}

            {/* Gantt Chart Tab */}
            {activeTab === 'gantt' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">🎯 Gelişmiş Gantt Şeması</h3>
                  <p className="text-sm opacity-90">
                    Görevleri sürükleyerek yeniden planlayabilir, bağımlılıkları görüntüleyebilir ve kritik yolu analiz edebilirsiniz.
                  </p>
                </div>
                
                <AdvancedGanttChart
                  tasks={transformTasksForGantt(project.tasks)}
                  projectStartDate={project.startDate ? new Date(project.startDate) : new Date()}
                  projectEndDate={project.endDate ? new Date(project.endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
                  onTaskUpdate={(taskId, updates) => {
                    handleTaskUpdate(taskId, {
                      startDate: updates.startDate?.toISOString(),
                      endDate: updates.endDate?.toISOString(),
                      ...updates
                    })
                  }}
                  onDependencyCreate={(fromTaskId, toTaskId) => {
                    console.log('Dependency created:', fromTaskId, '->', toTaskId)
                    // Implement dependency creation logic
                  }}
                  onMilestoneAdd={(taskId, milestone) => {
                    console.log('Milestone added to task:', taskId, milestone)
                    // Implement milestone addition logic
                  }}
                />
              </div>
            )}

            {/* Critical Path Analysis Tab */}
            {activeTab === 'critical-path' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">🎯 Kritik Yol Analizi</h3>
                  <p className="text-sm opacity-90">
                    Projenizin en kritik görevlerini belirleyin ve zaman tasarrufu için optimizasyon önerilerini uygulayın.
                  </p>
                </div>
                
                <CriticalPathAnalysis
                  tasks={transformTasksForCriticalPath(project.tasks)}
                  projectStartDate={project.startDate ? new Date(project.startDate) : new Date()}
                  onOptimize={handleOptimizationRecommendations}
                />
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className='space-y-6'>
                {/* Project Overview Stats */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white'>
                    <h3 className='text-sm font-medium opacity-90'>
                      Tamamlanma Oranı
                    </h3>
                    <p className='text-2xl font-bold'>{progressPercentage}%</p>
                    <p className='text-xs opacity-75'>
                      {completedTasks}/{totalTasks} görev
                    </p>
                  </div>
                  <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white'>
                    <h3 className='text-sm font-medium opacity-90'>
                      Aktif Görevler
                    </h3>
                    <p className='text-2xl font-bold'>{inProgressTasks}</p>
                    <p className='text-xs opacity-75'>Devam eden işler</p>
                  </div>
                  <div className='bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white'>
                    <h3 className='text-sm font-medium opacity-90'>
                      Bekleyen Görevler
                    </h3>
                    <p className='text-2xl font-bold'>{todoTasks}</p>
                    <p className='text-xs opacity-75'>Başlanmamış işler</p>
                  </div>
                  <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white'>
                    <h3 className='text-sm font-medium opacity-90'>
                      Toplam Süre
                    </h3>
                    <p className='text-2xl font-bold'>
                      {project.tasks.reduce(
                        (sum, task) => sum + (task.estimatedHours || 0),
                        0
                      )}
                      h
                    </p>
                    <p className='text-xs opacity-75'>Tahmini toplam</p>
                  </div>
                </div>

                {/* Task Status Distribution */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Görev Durum Dağılımı
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-4 h-4 bg-green-500 rounded'></div>
                        <span className='text-sm text-gray-700'>
                          Tamamlanan
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-32 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-green-500 h-2 rounded-full'
                            style={{
                              width: `${
                                totalTasks > 0
                                  ? (completedTasks / totalTasks) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className='text-sm font-medium text-gray-900 w-12'>
                          {completedTasks}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-4 h-4 bg-blue-500 rounded'></div>
                        <span className='text-sm text-gray-700'>
                          Devam Eden
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-32 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-blue-500 h-2 rounded-full'
                            style={{
                              width: `${
                                totalTasks > 0
                                  ? (inProgressTasks / totalTasks) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className='text-sm font-medium text-gray-900 w-12'>
                          {inProgressTasks}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-4 h-4 bg-orange-500 rounded'></div>
                        <span className='text-sm text-gray-700'>Bekleyen</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-32 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-orange-500 h-2 rounded-full'
                            style={{
                              width: `${
                                totalTasks > 0
                                  ? (todoTasks / totalTasks) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className='text-sm font-medium text-gray-900 w-12'>
                          {todoTasks}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Performance */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Takım Performansı
                  </h3>
                  <div className='space-y-4'>
                    {users.map((user) => {
                      const userTasks = project.tasks.filter(
                        (task) => task.assignedId === user.id
                      )
                      const completedUserTasks = userTasks.filter(
                        (task) => task.status === 'COMPLETED'
                      )
                      const userProgress =
                        userTasks.length > 0
                          ? Math.round(
                              (completedUserTasks.length / userTasks.length) *
                                100
                            )
                          : 0
                      const userHours = userTasks.reduce(
                        (sum, task) => sum + (task.estimatedHours || 0),
                        0
                      )

                      return (
                        userTasks.length > 0 && (
                          <div
                            key={user.id}
                            className='p-4 border border-gray-100 rounded-lg'
                          >
                            <div className='flex items-center justify-between mb-2'>
                              <h4 className='font-medium text-gray-900'>
                                {user.name}
                              </h4>
                              <span className='text-sm text-gray-500'>
                                {userTasks.length} görev
                              </span>
                            </div>
                            <div className='grid grid-cols-3 gap-4 text-sm'>
                              <div>
                                <span className='text-gray-500'>İlerleme:</span>
                                <div className='flex items-center gap-2 mt-1'>
                                  <div className='flex-1 bg-gray-200 rounded-full h-2'>
                                    <div
                                      className='bg-blue-600 h-2 rounded-full'
                                      style={{ width: `${userProgress}%` }}
                                    ></div>
                                  </div>
                                  <span className='font-medium text-gray-900'>
                                    {userProgress}%
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span className='text-gray-500'>
                                  Toplam Süre:
                                </span>
                                <p className='font-medium text-gray-900 mt-1'>
                                  {userHours}h
                                </p>
                              </div>
                              <div>
                                <span className='text-gray-500'>
                                  Tamamlanan:
                                </span>
                                <p className='font-medium text-gray-900 mt-1'>
                                  {completedUserTasks.length}/{userTasks.length}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )
                    })}
                  </div>
                </div>

                {/* Project Timeline */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Proje Zaman Çizelgesi
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-500'>Başlangıç Tarihi:</span>
                      <span className='font-medium text-gray-900'>
                        {project.startDate
                          ? new Date(project.startDate).toLocaleDateString(
                              'tr-TR'
                            )
                          : 'Belirtilmemiş'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-500'>Bitiş Tarihi:</span>
                      <span className='font-medium text-gray-900'>
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString(
                              'tr-TR'
                            )
                          : 'Belirtilmemiş'}
                      </span>
                    </div>
                    {project.startDate && project.endDate && (
                      <>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-gray-500'>Toplam Süre:</span>
                          <span className='font-medium text-gray-900'>
                            {Math.ceil(
                              (new Date(project.endDate).getTime() -
                                new Date(project.startDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{' '}
                            gün
                          </span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-gray-500'>Kalan Süre:</span>
                          <span className='font-medium text-gray-900'>
                            {Math.max(
                              0,
                              Math.ceil(
                                (new Date(project.endDate).getTime() -
                                  new Date().getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )}{' '}
                            gün
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Priority Distribution */}
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Öncelik Dağılımı
                  </h3>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => {
                      const priorityTasks = project.tasks.filter(
                        (task) => task.priority === priority
                      )
                      const priorityCount = priorityTasks.length
                      const priorityPercent =
                        totalTasks > 0
                          ? Math.round((priorityCount / totalTasks) * 100)
                          : 0

                      return (
                        <div
                          key={priority}
                          className='text-center p-3 border border-gray-100 rounded-lg'
                        >
                          <div
                            className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                              priority === 'URGENT'
                                ? 'bg-red-100 text-red-600'
                                : priority === 'HIGH'
                                ? 'bg-orange-100 text-orange-600'
                                : priority === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-green-100 text-green-600'
                            }`}
                          >
                            {priority === 'URGENT'
                              ? '🔥'
                              : priority === 'HIGH'
                              ? '🔴'
                              : priority === 'MEDIUM'
                              ? '🟡'
                              : '🟢'}
                          </div>
                          <h4 className='font-medium text-gray-900 text-sm'>
                            {priority === 'URGENT'
                              ? 'Acil'
                              : priority === 'HIGH'
                              ? 'Yüksek'
                              : priority === 'MEDIUM'
                              ? 'Orta'
                              : 'Düşük'}
                          </h4>
                          <p className='text-2xl font-bold text-gray-900'>
                            {priorityCount}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {priorityPercent}%
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      {showTaskDetailsModal && selectedTaskDetails && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-white flex items-center'>
                  <Eye className='w-6 h-6 mr-2' />
                  Görev Detayları
                </h3>
                <button
                  onClick={() => setShowTaskDetailsModal(false)}
                  className='text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/20 rounded-lg'
                >
                  <X className='w-6 h-6' />
                </button>
              </div>
            </div>

            <div className='p-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Left Column - Basic Info */}
                <div className='space-y-6'>
                  <div>
                    <h4 className='text-2xl font-bold text-gray-900 mb-2'>
                      {selectedTaskDetails.title}
                    </h4>
                    {selectedTaskDetails.description && (
                      <div className='bg-gray-50 p-4 rounded-lg'>
                        <h5 className='font-semibold text-gray-700 mb-2'>
                          Açıklama:
                        </h5>
                        <p className='text-gray-600 leading-relaxed'>
                          {selectedTaskDetails.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='bg-blue-50 p-4 rounded-lg'>
                      <h5 className='font-semibold text-blue-700 mb-2 flex items-center'>
                        <Target className='w-4 h-4 mr-1' />
                        Durum
                      </h5>
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          selectedTaskDetails.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : selectedTaskDetails.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-700'
                            : selectedTaskDetails.status === 'REVIEW'
                            ? 'bg-purple-100 text-purple-700'
                            : selectedTaskDetails.status === 'BLOCKED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {selectedTaskDetails.status === 'TODO'
                          ? 'Yapılacak'
                          : selectedTaskDetails.status === 'IN_PROGRESS'
                          ? 'Devam Ediyor'
                          : selectedTaskDetails.status === 'REVIEW'
                          ? 'İncelemede'
                          : selectedTaskDetails.status === 'BLOCKED'
                          ? 'Engellenmiş'
                          : 'Tamamlandı'}
                      </span>
                    </div>

                    <div className='bg-orange-50 p-4 rounded-lg'>
                      <h5 className='font-semibold text-orange-700 mb-2 flex items-center'>
                        <AlertTriangle className='w-4 h-4 mr-1' />
                        Öncelik
                      </h5>
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          selectedTaskDetails.priority === 'URGENT'
                            ? 'bg-red-100 text-red-700'
                            : selectedTaskDetails.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : selectedTaskDetails.priority === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {selectedTaskDetails.priority === 'URGENT'
                          ? 'Acil'
                          : selectedTaskDetails.priority === 'HIGH'
                          ? 'Yüksek'
                          : selectedTaskDetails.priority === 'MEDIUM'
                          ? 'Orta'
                          : 'Düşük'}
                      </span>
                    </div>
                  </div>

                  {/* Task Assigned Users Section - Fixed Duplication */}
                  <div className='bg-purple-50 p-4 rounded-lg'>
                    <h5 className='font-semibold text-purple-700 mb-3 flex items-center'>
                      <Users className='w-4 h-4 mr-1' />
                      Bu Göreve Atanan Kişiler
                      <span className='ml-2 bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs font-bold'>
                        {(() => {
                          // Calculate unique assigned users
                          const uniqueUsers = new Set();
                          if (selectedTaskDetails.assignedUser) {
                            uniqueUsers.add(selectedTaskDetails.assignedUser.id);
                          }
                          selectedTaskDetails.assignedUsers?.forEach(assignment => {
                            uniqueUsers.add(assignment.user.id);
                          });
                          return uniqueUsers.size;
                        })()}
                      </span>
                    </h5>
                    
                    {(() => {
                      // Create unique list of assigned users
                      const assignedUsers = [];
                      const addedUserIds = new Set();
                      
                      // Add main assigned user first if exists
                      if (selectedTaskDetails.assignedUser && !addedUserIds.has(selectedTaskDetails.assignedUser.id)) {
                        assignedUsers.push({
                          user: selectedTaskDetails.assignedUser,
                          isMain: true,
                          assignedAt: null
                        });
                        addedUserIds.add(selectedTaskDetails.assignedUser.id);
                      }
                      
                      // Add task assignments, skipping duplicates
                      selectedTaskDetails.assignedUsers?.forEach(assignment => {
                        if (!addedUserIds.has(assignment.user.id)) {
                          assignedUsers.push({
                            user: assignment.user,
                            isMain: false,
                            assignedAt: assignment.assignedAt
                          });
                          addedUserIds.add(assignment.user.id);
                        }
                      });
                      
                      if (assignedUsers.length === 0) {
                        return (
                          <div className='text-center py-6'>
                            <Users className='w-8 h-8 mx-auto text-purple-300 mb-2' />
                            <p className='text-sm text-purple-600 mb-1'>Bu göreve henüz kimse atanmamış</p>
                            <p className='text-xs text-purple-500'>Görev düzenleme modalından kişi atayabilirsiniz</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className='space-y-2 max-h-64 overflow-y-auto'>
                          {assignedUsers.map((item, index) => (
                            <div
                              key={`${item.user.id}-${index}`}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                item.isMain 
                                  ? 'bg-white border-purple-200 hover:border-purple-300' 
                                  : 'bg-white border-gray-200 hover:border-purple-200'
                              }`}
                            >
                              <div className={`w-10 h-10 ${
                                item.isMain 
                                  ? 'bg-gradient-to-br from-purple-600 to-purple-700' 
                                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
                              } text-white rounded-full flex items-center justify-center font-bold`}>
                                {item.user.name.charAt(0)}
                              </div>
                              <div className='flex-1 min-w-0'>
                                <p className='font-medium truncate text-gray-900'>
                                  {item.user.name}
                                </p>
                                <p className='text-sm truncate text-gray-600'>
                                  {item.user.email}
                                </p>
                                {item.assignedAt && (
                                  <p className='text-xs text-blue-600'>
                                    {new Date(item.assignedAt).toLocaleDateString('tr-TR')} tarihinde atandı
                                  </p>
                                )}
                              </div>
                              <div className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                                item.isMain
                                  ? 'text-purple-600 bg-purple-100'
                                  : 'text-blue-600 bg-blue-100'
                              }`}>
                                {item.isMain ? 'Ana Sorumlu' : 'Atanan'}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right Column - Time & Dates */}
                <div className='space-y-6'>
                  {(selectedTaskDetails.estimatedHours ||
                    selectedTaskDetails.actualHours) && (
                    <div className='bg-green-50 p-4 rounded-lg'>
                      <h5 className='font-semibold text-green-700 mb-3 flex items-center'>
                        <Timer className='w-4 h-4 mr-1' />
                        Zaman Bilgileri
                      </h5>
                      <div className='space-y-2'>
                        {selectedTaskDetails.estimatedHours && (
                          <div className='flex justify-between'>
                            <span className='text-sm text-gray-600'>
                              Tahmini Süre:
                            </span>
                            <span className='text-sm font-medium'>
                              {selectedTaskDetails.estimatedHours} saat
                            </span>
                          </div>
                        )}
                        {selectedTaskDetails.actualHours && (
                          <div className='flex justify-between'>
                            <span className='text-sm text-gray-600'>
                              Gerçekleşen Süre:
                            </span>
                            <span className='text-sm font-medium'>
                              {selectedTaskDetails.actualHours} saat
                            </span>
                          </div>
                        )}
                        {selectedTaskDetails.estimatedHours &&
                          selectedTaskDetails.actualHours && (
                            <div className='pt-2 border-t border-green-200'>
                              <div className='flex justify-between'>
                                <span className='text-sm text-gray-600'>
                                  Fark:
                                </span>
                                <span
                                  className={`text-sm font-medium ${
                                    selectedTaskDetails.actualHours >
                                    selectedTaskDetails.estimatedHours
                                      ? 'text-red-600'
                                      : 'text-green-600'
                                  }`}
                                >
                                  {selectedTaskDetails.actualHours >
                                  selectedTaskDetails.estimatedHours
                                    ? '+'
                                    : ''}
                                  {selectedTaskDetails.actualHours -
                                    selectedTaskDetails.estimatedHours}{' '}
                                  saat
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {(selectedTaskDetails.startDate ||
                    selectedTaskDetails.endDate) && (
                    <div className='bg-blue-50 p-4 rounded-lg'>
                      <h5 className='font-semibold text-blue-700 mb-3 flex items-center'>
                        <CalendarIcon className='w-4 h-4 mr-1' />
                        Tarih Bilgileri
                      </h5>
                      <div className='space-y-2'>
                        {selectedTaskDetails.startDate && (
                          <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-600'>
                              Başlangıç:
                            </span>
                            <span className='text-sm font-medium'>
                              {new Date(
                                selectedTaskDetails.startDate
                              ).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                        {selectedTaskDetails.endDate && (
                          <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-600'>
                              Bitiş:
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                new Date(selectedTaskDetails.endDate) <
                                  new Date() &&
                                selectedTaskDetails.status !== 'COMPLETED'
                                  ? 'text-red-600'
                                  : ''
                              }`}
                            >
                              {new Date(
                                selectedTaskDetails.endDate
                              ).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}
                              {new Date(selectedTaskDetails.endDate) <
                                new Date() &&
                                selectedTaskDetails.status !== 'COMPLETED' && (
                                  <span className='ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full'>
                                    Gecikmiş
                                  </span>
                                )}
                            </span>
                          </div>
                        )}
                        {selectedTaskDetails.startDate &&
                          selectedTaskDetails.endDate && (
                            <div className='pt-2 border-t border-blue-200'>
                              <div className='flex justify-between'>
                                <span className='text-sm text-gray-600'>
                                  Süre:
                                </span>
                                <span className='text-sm font-medium'>
                                  {Math.ceil(
                                    (new Date(
                                      selectedTaskDetails.endDate
                                    ).getTime() -
                                      new Date(
                                        selectedTaskDetails.startDate
                                      ).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )}{' '}
                                  gün
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <h5 className='font-semibold text-gray-700 mb-3'>
                      Hızlı İşlemler
                    </h5>
                    <div className='space-y-2'>
                      <button
                        onClick={() => {
                          handleEditTask(selectedTaskDetails)
                          setShowTaskDetailsModal(false)
                        }}
                        className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                      >
                        <Edit className='w-4 h-4' />
                        Düzenle
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              'Bu görevi silmek istediğinizden emin misiniz?'
                            )
                          ) {
                            handleTaskDelete(selectedTaskDetails.id)
                            setShowTaskDetailsModal(false)
                          }
                        }}
                        className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
                      >
                        <Trash2 className='w-4 h-4' />
                        Sil
                      </button>
                    </div>
                  </div>

                  {/* Status Notes Section - Moved to Right Bottom */}
                  <div className='bg-blue-50 p-4 rounded-lg'>
                    <div className='flex items-center justify-between mb-3'>
                      <h5 className='font-semibold text-blue-700 flex items-center'>
                        <MessageSquare className='w-4 h-4 mr-1' />
                        Durum Notları
                        <span className='ml-2 bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-bold'>
                          {taskStatusNotes?.length || 0}
                        </span>
                      </h5>
                      <div className='flex gap-2'>
                        <button
                          onClick={() => setShowStatusNotesModal(true)}
                          className='text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors'
                        >
                          {(taskStatusNotes?.length || 0) > 0 ? 'Tümünü Gör' : 'Not Ekle'}
                        </button>
                      </div>
                    </div>
                    
                    {(taskStatusNotes && taskStatusNotes.length > 0) ? (
                      <div className='space-y-2'>
                        {taskStatusNotes.slice(0, 2).map((note) => (
                          <div key={note.id} className='bg-white p-3 rounded-lg border border-blue-200'>
                            <div className='flex items-start justify-between mb-1'>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                note.status === 'INFO' ? 'bg-blue-100 text-blue-700' :
                                note.status === 'WARNING' ? 'bg-orange-100 text-orange-700' :
                                note.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {note.status === 'INFO' ? 'Bilgi' :
                                 note.status === 'WARNING' ? 'Uyarı' :
                                 note.status === 'SUCCESS' ? 'Başarı' : 'Hata'}
                              </span>
                              <span className='text-xs text-gray-500'>
                                {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <p className='text-sm text-gray-700 mb-2'>{note.content}</p>
                            <div className='flex items-center gap-2'>
                              <div className='w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600'>
                                {note.createdBy?.name?.charAt(0) || 'U'}
                              </div>
                              <span className='text-xs text-gray-600'>{note.createdBy?.name || 'Unknown User'}</span>
                            </div>
                          </div>
                        ))}
                        {taskStatusNotes.length > 2 && (
                          <p className='text-xs text-gray-500 text-center'>
                            +{taskStatusNotes.length - 2} daha fazla not
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className='text-center py-4'>
                        <MessageSquare className='w-8 h-8 mx-auto text-blue-300 mb-2' />
                        <p className='text-sm text-blue-600 mb-2'>Bu görev için henüz durum notu yok</p>
                        <p className='text-xs text-blue-500'>İlerleme kaydetmek için not ekleyebilirsiniz</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Notes Modal */}
      {showStatusNotesModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4'>
          <div className='bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl'>
            {/* Status Notes Modal Header */}
            <div className='p-6 border-b border-white/20'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <MessageSquare className='w-6 h-6 text-white' />
                  <h3 className='text-xl font-bold text-white'>Görev Durum Notları</h3>
                  <span className='bg-white/20 px-3 py-1 rounded-full text-sm text-white'>
                    {taskStatusNotes.length} Not
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowStatusNotesModal(false)
                    setNewStatusNoteContent('')
                    setNewStatusNoteType('INFO')
                    setIsAddingNote(false)
                  }}
                  className='text-white/70 hover:text-white transition-colors'
                >
                  <X className='w-6 h-6' />
                </button>
              </div>
              {selectedTaskDetails && (
                <p className='text-white/80 mt-2'>
                  {selectedTaskDetails.title}
                </p>
              )}
            </div>

            {/* Status Notes Content */}
            <div className='p-6 overflow-y-auto max-h-[60vh]'>
              {/* Task Team Members Section */}
              <div className='mb-6 bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/20'>
                <div className='flex items-center gap-2 mb-4'>
                  <Users className='w-5 h-5 text-white' />
                  <span className='text-white font-bold'>Bu Görevde Çalışanlar</span>
                </div>
                <div className='flex flex-wrap gap-3'>
                  {selectedTaskDetails?.assignedUser && (
                    <div className='flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2'>
                      <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm'>
                        {selectedTaskDetails.assignedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className='text-white text-sm font-medium'>{selectedTaskDetails.assignedUser.name}</div>
                        <div className='text-white/60 text-xs'>Ana Sorumlu</div>
                      </div>
                    </div>
                  )}
                  {/* Add other team members from project */}
                  {users.filter(user => user.id !== selectedTaskDetails?.assignedUser?.id).slice(0, 3).map(user => (
                    <div key={user.id} className='flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2'>
                      <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm'>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className='text-white text-sm font-medium'>{user.name}</div>
                        <div className='text-white/60 text-xs'>Takım Üyesi</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Status Note Form */}
              <div className='mb-6 bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/20'>
                <div className='flex items-center gap-2 mb-4'>
                  <MessageSquare className='w-5 h-5 text-white' />
                  <span className='text-white font-bold'>Yeni Durum Notu Ekle</span>
                </div>
                <div className='space-y-4'>
                  {/* User Selection */}
                  <div>
                    <label className='block text-white/80 text-sm font-medium mb-2'>
                      Notu Ekleyen Kişi:
                    </label>
                    <select
                      value={selectedNoteCreator}
                      onChange={(e) => setSelectedNoteCreator(e.target.value)}
                      className='w-full bg-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/20'
                    >
                      <option value='' className='bg-gray-800 text-white'>Kişi Seçin...</option>
                      {selectedTaskDetails?.assignedUser && (
                        <option value={selectedTaskDetails.assignedUser.id} className='bg-gray-800 text-white'>
                          {selectedTaskDetails.assignedUser.name} (Ana Sorumlu)
                        </option>
                      )}
                      {users.filter(user => user.id !== selectedTaskDetails?.assignedUser?.id).map(user => (
                        <option key={user.id} value={user.id} className='bg-gray-800 text-white'>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    value={newStatusNoteContent}
                    onChange={(e) => setNewStatusNoteContent(e.target.value)}
                    placeholder='Durum notu yazın...'
                    className='w-full bg-white/20 text-white placeholder-white/60 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/20'
                    rows={3}
                  />
                  <div className='flex items-center justify-between gap-3'>
                    <select
                      value={newStatusNoteType}
                      onChange={(e) => setNewStatusNoteType(e.target.value as any)}
                      className='bg-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/20'
                    >
                      <option value='INFO' className='bg-blue-600 text-white'>📋 Bilgi</option>
                      <option value='WARNING' className='bg-orange-600 text-white'>⚠️ Uyarı</option>
                      <option value='SUCCESS' className='bg-green-600 text-white'>✅ Başarı</option>
                      <option value='ERROR' className='bg-red-600 text-white'>❌ Hata</option>
                    </select>
                    <button
                      onClick={async () => {
                        if (selectedTaskDetails && newStatusNoteContent.trim() && selectedNoteCreator) {
                          const success = await addTaskStatusNote(
                            selectedTaskDetails.id,
                            newStatusNoteContent,
                            newStatusNoteType,
                            selectedNoteCreator
                          )
                          if (success !== false) {
                            setNewStatusNoteContent('')
                            setNewStatusNoteType('INFO')
                            setSelectedNoteCreator('')
                          }
                        }
                      }}
                      disabled={!newStatusNoteContent.trim() || !selectedNoteCreator || isAddingNote}
                      className='bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium'
                    >
                      {isAddingNote ? (
                        <>
                          <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                          Ekleniyor...
                        </>
                      ) : (
                        <>
                          <MessageSquare className='w-4 h-4' />
                          Notu Ekle
                        </>
                      )}
                    </button>
                  </div>
                  {(!selectedNoteCreator && newStatusNoteContent.trim()) && (
                    <p className='text-orange-200 text-xs'>⚠️ Lütfen notu ekleyen kişiyi seçin</p>
                  )}
                </div>
              </div>

              <div className='space-y-4'>
                {(taskStatusNotes?.length || 0) === 0 ? (
                  <div className='text-center py-12 text-white/60'>
                    <MessageSquare className='w-16 h-16 mx-auto mb-4 opacity-50' />
                    <p className='text-lg mb-2'>Bu görev için henüz durum notu yok</p>
                    <p className='text-sm mb-4'>Yukarıdaki formu kullanarak görevin ilerlemesi hakkında notlar ekleyebilirsiniz.</p>
                    <p className='text-xs opacity-75'>Not tipleri: Bilgi, Uyarı, Başarı, Hata</p>
                  </div>
                ) : (
                  (taskStatusNotes || []).map((note, index) => (
                    <div key={note.id} className='bg-white/10 rounded-xl p-5 backdrop-blur-sm'>
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center gap-3'>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            note.status === 'INFO' ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30' :
                            note.status === 'WARNING' ? 'bg-orange-500/30 text-orange-200 border border-orange-400/30' :
                            note.status === 'SUCCESS' ? 'bg-green-500/30 text-green-200 border border-green-400/30' :
                            'bg-red-500/30 text-red-200 border border-red-400/30'
                          }`}>
                            {note.status === 'INFO' ? '📋 Bilgi' :
                             note.status === 'WARNING' ? '⚠️ Uyarı' :
                             note.status === 'SUCCESS' ? '✅ Başarı' : '❌ Hata'}
                          </span>
                          <span className='text-white/60 text-sm'>
                            #{(taskStatusNotes?.length || 0) - index}
                          </span>
                        </div>
                        <div className='text-right'>
                          <div className='text-xs text-white/70'>
                            {new Date(note.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                          <div className='text-xs text-white/50'>
                            {new Date(note.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <p className='text-white text-sm leading-relaxed mb-4 bg-white/5 p-3 rounded-lg'>
                        {note.content}
                      </p>
                      
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold'>
                          {note.createdBy?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className='text-white font-medium text-sm'>{note.createdBy?.name || 'Unknown User'}</div>
                          <div className='text-white/60 text-xs'>Durum Notu Ekleyen</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className='p-6 border-t border-white/20 bg-white/5'>
              <div className='flex justify-between items-center'>
                <div className='text-white/70 text-sm'>
                  Toplam {taskStatusNotes?.length || 0} durum notu
                </div>
                <button
                  onClick={() => {
                    setShowStatusNotesModal(false)
                    setNewStatusNoteContent('')
                    setNewStatusNoteType('INFO')
                    setIsAddingNote(false)
                  }}
                  className='bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2'
                >
                  <X className='w-4 h-4' />
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Task Creation Modal */}
      <EnhancedTaskCreationModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setModalMode('create')
          setEditingTaskData(null)
        }}
        onCreateTask={handleCreateTask}
        onCreateTaskGroup={handleCreateTaskGroup}
        onUpdateTask={handleUpdateTask}
        projectId={projectId}
        users={users}
        editingTask={editingTaskData}
        mode={modalMode}
      />
    </div>
  )
}
