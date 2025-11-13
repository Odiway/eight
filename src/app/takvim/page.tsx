'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Clock,
  Users,
  Target,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'

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

// Türkçe ay isimleri
const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

// Türkçe gün isimleri
const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

const TakvimPage: React.FC = () => {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Mevcut haftanın başlangıcını hesapla (Pazartesi)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Pazartesi başlangıç
    return new Date(d.setDate(diff))
  }

  const startOfWeek = getStartOfWeek(currentDate)

  // Haftalık navigasyon
  const goToPreviousWeek = () => {
    setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))
  }

  const goToNextWeek = () => {
    setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Veri çekme
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects/master-gantt', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Veri alınamadı')
      }

      const data = await response.json()
      
      // Sadece gerekli task bilgilerini al
      const processedTasks: Task[] = data.projects.flatMap((project: any) => 
        project.tasks?.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          startDate: task.startDate ? new Date(task.startDate) : null,
          endDate: task.endDate ? new Date(task.endDate) : null,
          projectId: project.id,
          assignedId: task.assignedId,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          project: {
            id: project.id,
            name: project.name
          },
          assignedUser: task.assignedUser,
          assignedUsers: task.assignedUsers || []
        })) || []
      )

      setTasks(processedTasks)
      setProjects(data.projects.map((p: any) => ({ id: p.id, name: p.name })))
    } catch (error) {
      console.error('Veri çekme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  // Seçilen günün görevlerini filtrele
  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.startDate && !task.endDate) return false
      
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      
      if (task.startDate && task.endDate) {
        const startDate = new Date(task.startDate.getFullYear(), task.startDate.getMonth(), task.startDate.getDate())
        const endDate = new Date(task.endDate.getFullYear(), task.endDate.getMonth(), task.endDate.getDate())
        return checkDate >= startDate && checkDate <= endDate
      } else if (task.startDate) {
        const startDate = new Date(task.startDate.getFullYear(), task.startDate.getMonth(), task.startDate.getDate())
        return checkDate.getTime() === startDate.getTime()
      } else if (task.endDate) {
        const endDate = new Date(task.endDate.getFullYear(), task.endDate.getMonth(), task.endDate.getDate())
        return checkDate.getTime() === endDate.getTime()
      }
      return false
    })
  }

  // Atanan kullanıcıları al
  const getAssignedUsers = (task: Task) => {
    const users: Array<{ id: string; name: string; email: string }> = []
    
    if (task.assignedUser) {
      users.push(task.assignedUser)
    }
    
    if (task.assignedUsers && task.assignedUsers.length > 0) {
      task.assignedUsers.forEach((assignment) => {
        if (!users.some(u => u.id === assignment.user.id)) {
          users.push(assignment.user)
        }
      })
    }
    
    return users
  }

  // Bugünün görevleri
  const todaysTasks = getTasksForDate(currentDate)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Üst kısım - Tarih ve navigasyon */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <h1 className="text-5xl font-light tracking-wider">
                {currentDate.toLocaleDateString('tr-TR', { weekday: 'long' })}
              </h1>
              <p className="text-gray-400 text-lg mt-1">
                {currentDate.toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="text-right">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Bugün
            </button>
          </div>
        </div>

        {/* Ana içerik alanı */}
        <div className="border border-gray-700 rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-medium mb-2">Görevler</h2>
            <p className="text-gray-400">
              {todaysTasks.length} görev bulundu
            </p>
          </div>

          {/* Görev tablosu */}
          <div className="grid grid-cols-5 gap-8">
            {/* Görev adı */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-300">görev adı</h3>
              <div className="space-y-3">
                {todaysTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Bugün için görev bulunmuyor</p>
                  </div>
                ) : (
                  todaysTasks.map((task) => (
                    <div key={task.id} className="border-b border-gray-700 pb-2">
                      <p className="font-medium text-white">{task.title}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Yakınlık */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-300">yakınlık</h3>
              <div className="space-y-3">
                {todaysTasks.map((task) => {
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
                      case 'LOW': return 'text-green-400'
                      case 'MEDIUM': return 'text-yellow-400'
                      case 'HIGH': return 'text-orange-400'
                      case 'URGENT': return 'text-red-400'
                      default: return 'text-gray-400'
                    }
                  }

                  return (
                    <div key={task.id} className="border-b border-gray-700 pb-2">
                      <p className={`font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityText(task.priority)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Kişiler */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-300">kişiler</h3>
              <div className="space-y-3">
                {todaysTasks.map((task) => {
                  const assignedUsers = getAssignedUsers(task)
                  
                  return (
                    <div key={task.id} className="border-b border-gray-700 pb-2">
                      {assignedUsers.length > 0 ? (
                        <p className="font-medium text-blue-400">
                          {assignedUsers.length === 1 
                            ? assignedUsers[0].name
                            : `${assignedUsers[0].name} +${assignedUsers.length - 1}`
                          }
                        </p>
                      ) : (
                        <p className="font-medium text-gray-500">Atanmamış</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-300">açıklama</h3>
              <div className="space-y-3">
                {todaysTasks.map((task) => (
                  <div key={task.id} className="border-b border-gray-700 pb-2">
                    <p className="font-medium text-gray-300 text-sm truncate">
                      {task.description || 'Açıklama yok'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarihler */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-300">tarihler</h3>
              <div className="space-y-3">
                {todaysTasks.map((task) => (
                  <div key={task.id} className="border-b border-gray-700 pb-2">
                    <div className="text-sm">
                      {task.startDate && (
                        <p className="text-green-400">
                          {task.startDate.toLocaleDateString('tr-TR')}
                        </p>
                      )}
                      {task.endDate && (
                        <p className="text-red-400">
                          {task.endDate.toLocaleDateString('tr-TR')}
                        </p>
                      )}
                      {!task.startDate && !task.endDate && (
                        <p className="text-gray-500">Tarih yok</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alt kısım - İstatistikler */}
          {todaysTasks.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="grid grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {todaysTasks.length}
                  </p>
                  <p className="text-gray-400 text-sm">Toplam Görev</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {todaysTasks.filter(t => t.status === 'COMPLETED').length}
                  </p>
                  <p className="text-gray-400 text-sm">Tamamlandı</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">
                    {todaysTasks.filter(t => t.status === 'IN_PROGRESS').length}
                  </p>
                  <p className="text-gray-400 text-sm">Devam Ediyor</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    {todaysTasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length}
                  </p>
                  <p className="text-gray-400 text-sm">Yüksek Öncelik</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TakvimPage