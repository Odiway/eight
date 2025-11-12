'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  FolderKanban,
  Activity,
  Zap
} from 'lucide-react'
import MasterGanttChart from '@/components/MasterGanttChart'
import { useAuth } from '@/contexts/AuthContext'

// Project interface for Master Gantt
export interface MasterProject {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'REVIEW'
  progress: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  teamCount: number
  taskCount: number
  completedTasks: number
  budget?: number
  spent?: number
  manager?: {
    id: string
    name: string
    avatar?: string
  }
  isDelayed?: boolean
  delayDays?: number
  milestones: Array<{
    id: string
    title: string
    date: Date
    completed: boolean
  }>
}

export default function MasterGanttPage() {
  const { user, isAdmin } = useAuth()
  const [projects, setProjects] = useState<MasterProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    delayedProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
    avgProgress: 0
  })

  // Fetch all projects data
  const fetchProjectsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/projects/master-gantt', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Proje verileri alınamadı')
      }

      const data = await response.json()
      
      // Convert date strings to Date objects
      const processedProjects = data.projects.map((project: any) => ({
        ...project,
        startDate: new Date(project.startDate),
        endDate: new Date(project.endDate),
        milestones: project.milestones.map((milestone: any) => ({
          ...milestone,
          date: new Date(milestone.date)
        }))
      }))

      setProjects(processedProjects)
      setStats(data.stats)
    } catch (error) {
      console.error('Proje verileri alınırken hata:', error)
      setError(error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchProjectsData()
    }
  }, [user])

  // Calculate timeline bounds
  const timelineBounds = React.useMemo(() => {
    if (projects.length === 0) {
      const today = new Date()
      return {
        start: new Date(today.getFullYear(), 0, 1),
        end: new Date(today.getFullYear() + 1, 11, 31)
      }
    }

    const allDates = projects.flatMap(p => [p.startDate, p.endDate])
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
    
    // Add some padding
    const paddingDays = 30
    minDate.setDate(minDate.getDate() - paddingDays)
    maxDate.setDate(maxDate.getDate() + paddingDays)

    return { start: minDate, end: maxDate }
  }, [projects])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-lg font-medium text-gray-700">Proje verileri yükleniyor...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Veri Yüklenemedi</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={fetchProjectsData}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Master Gantt Şeması</h1>
                <p className="text-xl text-indigo-100">
                  Tüm projelerin genel görünümü ve zaman çizelgesi
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.totalProjects}</div>
                <div className="text-sm text-indigo-200">Toplam Proje</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.activeProjects}</div>
                <div className="text-sm text-indigo-200">Aktif Proje</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{Math.round(stats.avgProgress)}%</div>
                <div className="text-sm text-indigo-200">Ortalama İlerleme</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Aktif Projeler</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.activeProjects}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.totalProjects > 0 ? Math.round((stats.activeProjects / stats.totalProjects) * 100) : 0}% toplam projeden
                </p>
              </div>
              <Activity className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Tamamlanan</h3>
                <p className="text-3xl font-bold text-green-600">{stats.completedProjects}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Başarıyla tamamlandı
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Geciken</h3>
                <p className="text-3xl font-bold text-red-600">{stats.delayedProjects}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Planlanan süreci aştı
                </p>
              </div>
              <Clock className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Ortalama İlerleme</h3>
                <p className="text-3xl font-bold text-purple-600">{Math.round(stats.avgProgress)}%</p>
                <p className="text-sm text-gray-600 mt-1">
                  Tüm projeler ortalaması
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Budget Overview (if available) */}
        {(stats.totalBudget > 0 || stats.totalSpent > 0) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Bütçe Durumu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ₺{stats.totalBudget.toLocaleString('tr-TR')}
                </div>
                <div className="text-sm text-gray-500">Toplam Bütçe</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ₺{stats.totalSpent.toLocaleString('tr-TR')}
                </div>
                <div className="text-sm text-gray-500">Harcanan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ₺{(stats.totalBudget - stats.totalSpent).toLocaleString('tr-TR')}
                </div>
                <div className="text-sm text-gray-500">Kalan</div>
              </div>
            </div>
            {stats.totalBudget > 0 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      (stats.totalSpent / stats.totalBudget) > 0.9 ? 'bg-red-500' :
                      (stats.totalSpent / stats.totalBudget) > 0.7 ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, (stats.totalSpent / stats.totalBudget) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 text-center mt-2">
                  Bütçe kullanımı: {Math.round((stats.totalSpent / stats.totalBudget) * 100)}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Master Gantt Chart */}
        {projects.length > 0 ? (
          <MasterGanttChart 
            projects={projects}
            projectStartDate={timelineBounds.start}
            projectEndDate={timelineBounds.end}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz Proje Bulunmuyor</h3>
            <p className="text-gray-600 mb-6">
              Master Gantt şemasını görüntülemek için önce projeler oluşturmanız gerekiyor.
            </p>
            <button
              onClick={() => window.location.href = '/projects/new'}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Yeni Proje Oluştur
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={fetchProjectsData}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 transition-all duration-300 hover:scale-105 flex items-center justify-center group"
          title="Verileri Yenile"
        >
          <Activity className="w-6 h-6 group-hover:animate-spin" />
        </button>
      </div>
    </div>
  )
}