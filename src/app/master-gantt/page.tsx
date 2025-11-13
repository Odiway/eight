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
import OptimizedMasterGanttChart from '@/components/OptimizedMasterGanttChart'
import type { OptimizedProject } from '@/components/OptimizedMasterGanttChart'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'

export default function MasterGanttPage() {
  const { user, isAdmin } = useAuth()
  const [projects, setProjects] = useState<OptimizedProject[]>([])
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
      
      // Convert to optimized project format (keep dates as strings for performance)
      const processedProjects = data.projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        progress: project.progress,
        teamCount: project.teamCount,
        taskCount: project.taskCount,
        completedTasks: project.completedTasks
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

  // Timeline is fixed to 2025 in the optimized component

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="text-lg font-medium text-gray-700">Proje verileri yükleniyor...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navbar />
        <div className="p-6">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="px-4 py-6">


        {/* Optimized Master Gantt Chart */}
        {projects.length > 0 ? (
          <OptimizedMasterGanttChart 
            projects={projects}
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