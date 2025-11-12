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

  // Calculate timeline bounds - Fixed to 2025
  const timelineBounds = React.useMemo(() => {
    // Always show 2025 - full year
    return {
      start: new Date(2025, 0, 1), // January 1, 2025
      end: new Date(2025, 11, 31)  // December 31, 2025
    }
  }, [])

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
    <div className="min-h-screen bg-white">


      <div className="px-4 py-6">


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


    </div>
  )
}