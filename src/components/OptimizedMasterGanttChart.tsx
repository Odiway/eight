'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { 
  Calendar, 
  Filter, 
  Download, 
  Building,
  BarChart3,
  Clock,
  Users
} from 'lucide-react'

// Simplified project interface for performance
export interface OptimizedProject {
  id: string
  name: string
  startDate: string // ISO string for better performance
  endDate: string
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED'
  progress: number
  teamCount: number
  taskCount: number
  completedTasks: number
}

interface OptimizedMasterGanttChartProps {
  projects: OptimizedProject[]
  onProjectClick?: (projectId: string) => void
}

// Static constants to avoid recalculation
const MONTHS_2025 = [
  'Ocak 2025', 'Şubat 2025', 'Mart 2025', 'Nisan 2025', 
  'Mayıs 2025', 'Haziran 2025', 'Temmuz 2025', 'Ağustos 2025',
  'Eylül 2025', 'Ekim 2025', 'Kasım 2025', 'Aralık 2025'
]

const STATUS_COLORS = {
  'COMPLETED': 'bg-emerald-500',
  'IN_PROGRESS': 'bg-blue-500', 
  'ON_HOLD': 'bg-yellow-500',
  'PLANNING': 'bg-gray-400'
} as const

const STATUS_LABELS = {
  'COMPLETED': 'Tamamlandı',
  'IN_PROGRESS': 'Devam Ediyor',
  'ON_HOLD': 'Beklemede', 
  'PLANNING': 'Planlama'
} as const

const OptimizedMasterGanttChart: React.FC<OptimizedMasterGanttChartProps> = ({
  projects,
  onProjectClick
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'startDate'>('startDate')

  // Memoized filtered and sorted projects
  const processedProjects = useMemo(() => {
    let filtered = projects

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus)
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'tr')
        case 'progress':
          return b.progress - a.progress
        case 'startDate':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        default:
          return 0
      }
    })

    // Limit to max 50 projects for performance
    return sorted.slice(0, 50)
  }, [projects, filterStatus, sortBy])

  // Memoized project dimensions calculator
  const calculateProjectBar = useCallback((project: OptimizedProject) => {
    const start = new Date(project.startDate)
    const end = new Date(project.endDate)
    
    // Ensure dates are in 2025 or use defaults
    const year2025Start = new Date(2025, 0, 1).getTime()
    const year2025End = new Date(2025, 11, 31).getTime()
    const yearDuration = year2025End - year2025Start

    // Calculate start position (0-100%)
    const projectStart = start.getFullYear() === 2025 ? start.getTime() : year2025Start
    const startPercent = Math.max(0, Math.min(100, 
      ((projectStart - year2025Start) / yearDuration) * 100
    ))

    // Calculate width (minimum 5%, maximum 95%)
    const projectEnd = end.getFullYear() === 2025 ? end.getTime() : (year2025Start + yearDuration * 0.5)
    const duration = Math.max(86400000 * 7, projectEnd - projectStart) // Min 1 week
    const widthPercent = Math.max(5, Math.min(95, (duration / yearDuration) * 100))

    return {
      left: `${startPercent}%`,
      width: `${widthPercent}%`
    }
  }, [])

  // Handle project click
  const handleProjectClick = useCallback((project: OptimizedProject) => {
    if (onProjectClick) {
      onProjectClick(project.id)
    } else {
      window.location.href = `/projects/${project.id}`
    }
  }, [onProjectClick])

  // Export functionality (simplified)
  const handleExport = useCallback(async (format: 'pdf' | 'excel') => {
    try {
      if (format === 'excel') {
        const XLSX = await import('xlsx')
        
        const data = processedProjects.map(p => ({
          'Proje Adı': p.name,
          'Başlangıç': new Date(p.startDate).toLocaleDateString('tr-TR'),
          'Bitiş': new Date(p.endDate).toLocaleDateString('tr-TR'),
          'Durum': STATUS_LABELS[p.status],
          'İlerleme': `${p.progress}%`,
          'Takım': p.teamCount,
          'Görevler': `${p.completedTasks}/${p.taskCount}`
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Projeler')
        XLSX.writeFile(wb, `projeler-${new Date().toISOString().split('T')[0]}.xlsx`)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [processedProjects])

  return (
    <div className="w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Simplified Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Master Gantt Şeması</h2>
            <span className="text-sm text-blue-100">({processedProjects.length} proje)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 rounded bg-white/20 text-white border border-white/30 text-sm"
            >
              <option value="all" className="text-gray-900">Tümü</option>
              <option value="IN_PROGRESS" className="text-gray-900">Devam Ediyor</option>
              <option value="COMPLETED" className="text-gray-900">Tamamlandı</option>
              <option value="PLANNING" className="text-gray-900">Planlama</option>
            </select>

            {/* Sort */}
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 rounded bg-white/20 text-white border border-white/30 text-sm"
            >
              <option value="startDate" className="text-gray-900">Başlangıç Tarihi</option>
              <option value="name" className="text-gray-900">Proje Adı</option>
              <option value="progress" className="text-gray-900">İlerleme</option>
            </select>

            {/* Export */}
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-3 py-1 bg-white/20 text-white rounded hover:bg-white/30 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Timeline and Chart */}
      <div className="p-4">
        {/* Timeline Header (Fixed 2025 months) */}
        <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="w-64 p-3 font-semibold text-gray-700 border-r border-gray-200">
            Proje Adı
          </div>
          <div className="flex-1 flex">
            {MONTHS_2025.map((month, index) => (
              <div key={index} className="flex-1 p-2 text-center text-sm border-r border-gray-200">
                <div className="font-medium text-gray-700">{month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Rows */}
        <div className="border border-gray-200 rounded-b-lg overflow-hidden">
          {processedProjects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Gösterilecek proje bulunamadı</p>
            </div>
          ) : (
            processedProjects.map((project, index) => {
              const barDimensions = calculateProjectBar(project)
              
              return (
                <div
                  key={project.id}
                  className={`flex border-b border-gray-100 hover:bg-blue-50/30 transition-colors cursor-pointer ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                  onClick={() => handleProjectClick(project)}
                >
                  {/* Project Info */}
                  <div className="w-64 p-3 border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[project.status]}`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate text-sm">
                          {project.name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            {project.progress}%
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {project.teamCount}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {project.completedTasks}/{project.taskCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Area */}
                  <div className="flex-1 p-3 relative">
                    <div className="relative w-full h-6">
                      {/* Project Bar */}
                      <div
                        className={`absolute top-1 h-4 ${STATUS_COLORS[project.status]} rounded-sm opacity-80 hover:opacity-100 transition-opacity`}
                        style={{
                          left: barDimensions.left,
                          width: barDimensions.width
                        }}
                      >
                        {/* Progress Indicator */}
                        <div 
                          className="h-full bg-white/30 rounded-sm"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                        
                        {/* Tooltip on hover */}
                        <div className="absolute -top-8 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {project.name} - {project.progress}% - {STATUS_LABELS[project.status]}
                        </div>
                      </div>

                      {/* Month Dividers */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {Array.from({ length: 11 }).map((_, i) => (
                          <div
                            key={i}
                            className="border-l border-gray-200/50"
                            style={{ left: `${((i + 1) / 12) * 100}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Statistics Footer */}
        {processedProjects.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{processedProjects.length}</div>
                <div className="text-sm text-gray-600">Toplam Proje</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {processedProjects.filter(p => p.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-gray-600">Tamamlanan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {processedProjects.filter(p => p.status === 'IN_PROGRESS').length}
                </div>
                <div className="text-sm text-gray-600">Devam Eden</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {Math.round(processedProjects.reduce((sum, p) => sum + p.progress, 0) / processedProjects.length || 0)}%
                </div>
                <div className="text-sm text-gray-600">Ortalama İlerleme</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OptimizedMasterGanttChart