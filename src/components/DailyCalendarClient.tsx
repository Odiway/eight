'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Target,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Users,
  Filter,
  FolderKanban,
  Plus,
  Eye
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'BLOCKED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate?: Date | null
  endDate?: Date | null
  projectId: string
  assignedId?: string | null
  createdAt: Date
  updatedAt: Date
  project: {
    id: string
    name: string
  }
  assignedUser?: {
    id: string
    name: string
    email: string
  } | null
  assignedUsers?: {
    id: string
    user: {
      id: string
      name: string
      email: string
    }
  }[]
}

interface Project {
  id: string
  name: string
}

interface DailyCalendarClientProps {
  tasks: Task[]
  projects: Project[]
  selectedProjectId?: string
}

const DailyCalendarClient: React.FC<DailyCalendarClientProps> = ({
  tasks,
  projects,
  selectedProjectId,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterPriority, setFilterPriority] = useState<string>('ALL')

  // Görevde atanan kullanıcıları alma fonksiyonu
  const getAssignedUsers = (task: Task) => {
    const users: Array<{ id: string; name: string; email: string }> = []

    // assignedUser varsa ekle
    if (task.assignedUser) {
      users.push(task.assignedUser)
    }

    // assignedUsers varsa ekle
    if (task.assignedUsers && task.assignedUsers.length > 0) {
      task.assignedUsers.forEach((assignment) => {
        if (!users.some(u => u.id === assignment.user.id)) {
          users.push(assignment.user)
        }
      })
    }

    return users
  }

  // Proje seçme fonksiyonu
  const handleProjectChange = (projectId: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (projectId === 'all') {
      params.delete('project')
    } else {
      params.set('project', projectId)
    }

    router.push(`/calendar?${params.toString()}`)
  }

  // Günlük navigasyon
  const goToPreviousDay = () => {
    const prevDay = new Date(currentDate)
    prevDay.setDate(prevDay.getDate() - 1)
    setCurrentDate(prevDay)
  }

  const goToNextDay = () => {
    const nextDay = new Date(currentDate)
    nextDay.setDate(nextDay.getDate() + 1)
    setCurrentDate(nextDay)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Seçili projenin adını bulma
  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null

  // Filtrelenmiş görevler
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedProjectId && task.projectId !== selectedProjectId)
        return false
      if (filterStatus !== 'ALL' && task.status !== filterStatus) return false
      if (filterPriority !== 'ALL' && task.priority !== filterPriority)
        return false
      return true
    })
  }, [tasks, selectedProjectId, filterStatus, filterPriority])

  // Seçilen günün görevlerini al
  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter((task) => {
      const taskStart = task.startDate ? new Date(task.startDate) : null
      const taskEnd = task.endDate ? new Date(task.endDate) : null
      const checkDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      )

      if (taskStart && taskEnd) {
        const start = new Date(
          taskStart.getFullYear(),
          taskStart.getMonth(),
          taskStart.getDate()
        )
        const end = new Date(
          taskEnd.getFullYear(),
          taskEnd.getMonth(),
          taskEnd.getDate()
        )
        return checkDate >= start && checkDate <= end
      } else if (taskStart) {
        const start = new Date(
          taskStart.getFullYear(),
          taskStart.getMonth(),
          taskStart.getDate()
        )
        return checkDate.getTime() === start.getTime()
      } else if (taskEnd) {
        const end = new Date(
          taskEnd.getFullYear(),
          taskEnd.getMonth(),
          taskEnd.getDate()
        )
        return checkDate.getTime() === end.getTime()
      }
      return false
    })
  }

  const todaysTasks = getTasksForDate(currentDate)
  const isToday = currentDate.toDateString() === new Date().toDateString()

  // Status ve Priority helper fonksiyonları
  const getStatusText = (status: string) => {
    switch (status) {
      case 'TODO': return 'Bekliyor'
      case 'IN_PROGRESS': return 'Devam Ediyor'
      case 'REVIEW': return 'İncelemede'
      case 'COMPLETED': return 'Tamamlandı'
      case 'BLOCKED': return 'Engellendi'
      default: return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Düşük'
      case 'MEDIUM': return 'Orta'
      case 'HIGH': return 'Yüksek'
      case 'URGENT': return 'Acil'
      default: return priority
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-green-600 bg-green-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'HIGH': return 'text-orange-600 bg-orange-100'
      case 'URGENT': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'text-gray-600 bg-gray-100'
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100'
      case 'REVIEW': return 'text-purple-600 bg-purple-100'
      case 'COMPLETED': return 'text-green-600 bg-green-100'
      case 'BLOCKED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className='max-w-7xl mx-auto py-8 sm:px-6 lg:px-8'>
      <div className='px-4 py-6 sm:px-0'>
        
        {/* Başlık ve Kontroller */}
        <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8'>
          <div className='space-y-2'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-blue-600 rounded-xl'>
                <Calendar className='w-7 h-7 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Günlük Takvim
                  {selectedProject && (
                    <span className='text-lg font-medium text-blue-600 ml-3'>
                      - {selectedProject.name}
                    </span>
                  )}
                  {!selectedProjectId && (
                    <span className='text-lg font-medium text-gray-500 ml-3'>
                      - Tüm Projeler
                    </span>
                  )}
                </h1>
                <p className='text-gray-600'>
                  {currentDate.toLocaleDateString('tr-TR', { 
                    weekday: 'long',
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                  {isToday && <span className='text-blue-600 font-medium ml-2'>(Bugün)</span>}
                </p>
              </div>
            </div>
          </div>

          <div className='flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-3 mt-4 lg:mt-0'>
            {/* Proje Seçici */}
            <div className='flex items-center space-x-2 bg-white rounded-lg p-1 shadow-md border'>
              <FolderKanban className='w-4 h-4 text-gray-500 ml-2' />
              <select
                value={selectedProjectId || 'all'}
                onChange={(e) => handleProjectChange(e.target.value)}
                className='bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer pr-2'
              >
                <option value='all'>Tüm Projeler</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtreleme Butonları */}
            <div className='flex space-x-3'>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
              >
                <option value='ALL'>Tüm Durumlar</option>
                <option value='TODO'>Yapılacak</option>
                <option value='IN_PROGRESS'>Devam Eden</option>
                <option value='REVIEW'>İnceleme</option>
                <option value='COMPLETED'>Tamamlandı</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
              >
                <option value='ALL'>Tüm Öncelikler</option>
                <option value='URGENT'>Acil</option>
                <option value='HIGH'>Yüksek</option>
                <option value='MEDIUM'>Orta</option>
                <option value='LOW'>Düşük</option>
              </select>
            </div>
          </div>
        </div>

        {/* Günlük Navigasyon */}
        <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8'>
          <div className='flex items-center justify-between'>
            <button
              onClick={goToPreviousDay}
              className='flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
            >
              <ChevronLeft className='w-5 h-5' />
              <span>Önceki Gün</span>
            </button>

            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900'>
                {currentDate.toLocaleDateString('tr-TR', { 
                  weekday: 'long'
                })}
              </h2>
              <p className='text-gray-600'>
                {currentDate.toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            <div className='flex items-center space-x-3'>
              <button
                onClick={goToToday}
                className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
              >
                Bugün
              </button>
              <button
                onClick={goToNextDay}
                className='flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
              >
                <span>Sonraki Gün</span>
                <ChevronRight className='w-5 h-5' />
              </button>
            </div>
          </div>
        </div>

        {/* Görev İstatistikleri */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Toplam Görev</p>
                <p className='text-3xl font-bold text-gray-900'>{todaysTasks.length}</p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <Target className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Tamamlandı</p>
                <p className='text-3xl font-bold text-green-600'>
                  {todaysTasks.filter(t => t.status === 'COMPLETED').length}
                </p>
              </div>
              <div className='p-3 bg-green-100 rounded-full'>
                <CheckCircle2 className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Devam Eden</p>
                <p className='text-3xl font-bold text-blue-600'>
                  {todaysTasks.filter(t => t.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <Zap className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Yüksek Öncelik</p>
                <p className='text-3xl font-bold text-red-600'>
                  {todaysTasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length}
                </p>
              </div>
              <div className='p-3 bg-red-100 rounded-full'>
                <AlertTriangle className='w-6 h-6 text-red-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Günlük Görev Listesi */}
        <div className='bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden'>
          <div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4'>
            <h3 className='text-xl font-bold text-white'>
              {currentDate.toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })} Görevleri
            </h3>
            <p className='text-blue-100'>{todaysTasks.length} görev bulundu</p>
          </div>

          <div className='p-6'>
            {todaysTasks.length === 0 ? (
              <div className='text-center py-12'>
                <Calendar className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h4 className='text-xl font-semibold text-gray-900 mb-2'>
                  Bu tarih için görev bulunmuyor
                </h4>
                <p className='text-gray-600'>
                  {isToday 
                    ? 'Bugün için henüz görev planlanmamış' 
                    : 'Bu tarih için görev bulunmuyor'}
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {todaysTasks.map((task) => {
                  const assignedUsers = getAssignedUsers(task)
                  const isOverdue = task.endDate && new Date() > new Date(task.endDate) && task.status !== 'COMPLETED'

                  return (
                    <div
                      key={task.id}
                      className={`border rounded-xl p-6 hover:shadow-lg transition-all duration-300 ${
                        isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-3 mb-3'>
                            <h4 className='text-lg font-bold text-gray-900'>
                              {task.title}
                            </h4>
                            {isOverdue && (
                              <span className='bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse'>
                                ⚠️ GECİKMİŞ
                              </span>
                            )}
                          </div>

                          {/* Status ve Priority */}
                          <div className='flex items-center space-x-4 mb-4'>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                              📍 {getPriorityText(task.priority)}
                            </span>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                              🎯 {getStatusText(task.status)}
                            </span>
                          </div>

                          {/* Açıklama */}
                          {task.description && (
                            <div className='mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400'>
                              <p className='text-sm text-gray-700 leading-relaxed'>
                                {task.description}
                              </p>
                            </div>
                          )}

                          {/* Proje ve Takım Bilgileri */}
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                            <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                              <div className='flex items-center space-x-2 mb-2'>
                                <FolderKanban className='w-5 h-5 text-blue-600' />
                                <span className='font-semibold text-blue-800'>Proje</span>
                              </div>
                              <p className='text-sm text-blue-700 font-medium'>
                                📁 {task.project.name}
                              </p>
                            </div>

                            <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
                              <div className='flex items-center space-x-2 mb-2'>
                                <Users className='w-5 h-5 text-green-600' />
                                <span className='font-semibold text-green-800'>Takım</span>
                              </div>
                              {assignedUsers.length > 0 ? (
                                <div className='space-y-1'>
                                  {assignedUsers.slice(0, 2).map((user) => (
                                    <p key={user.id} className='text-sm text-green-700'>
                                      👤 {user.name}
                                    </p>
                                  ))}
                                  {assignedUsers.length > 2 && (
                                    <p className='text-xs text-green-600'>
                                      +{assignedUsers.length - 2} kişi daha
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className='text-sm text-red-600 font-medium'>
                                  ⚠️ Atanmamış
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Tarih Bilgileri */}
                          <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
                            <div className='flex items-center space-x-2 mb-3'>
                              <Clock className='w-5 h-5 text-gray-600' />
                              <span className='font-semibold text-gray-800'>Tarihler</span>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                              {task.startDate && (
                                <div>
                                  <span className='text-gray-600 font-medium'>🚀 Başlangıç:</span>
                                  <p className='text-gray-800 font-semibold'>
                                    {new Date(task.startDate).toLocaleDateString('tr-TR')}
                                  </p>
                                </div>
                              )}
                              {task.endDate && (
                                <div>
                                  <span className='text-gray-600 font-medium'>🏁 Bitiş:</span>
                                  <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                                    {new Date(task.endDate).toLocaleDateString('tr-TR')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyCalendarClient