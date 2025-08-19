'use client'

import { useState } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { useProjectDates } from '@/hooks/useProjectDates'

interface Task {
  id: string
  title: string
  status: string
  startDate?: Date | string | null
  endDate?: Date | string | null
  estimatedHours?: number | null | undefined
  completedAt?: Date | string | null
}

interface ProjectDatesManagerProps {
  projectId: string
  tasks: Task[]
  projectStatus?: string
}

export default function ProjectDatesManager({
  projectId,
  tasks,
  projectStatus = 'IN_PROGRESS'
}: ProjectDatesManagerProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const analysis = useProjectDates({
    projectId,
    tasks,
    projectStatus
  })

  const formatDate = (date: Date | null) => {
    if (!date) return 'Belirlenmemiş'
    return date.toLocaleDateString('tr-TR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'early':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'on-time':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'delayed':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'completed':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'early':
        return <TrendingUp className="w-4 h-4" />
      case 'on-time':
        return <Clock className="w-4 h-4" />
      case 'delayed':
        return <AlertTriangle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'early':
        return 'Erken Bitecek'
      case 'on-time':
        return 'Zamanında'
      case 'delayed':
        return 'Gecikmeli'
      case 'completed':
        return 'Tamamlandı'
      default:
        return 'Belirsiz'
    }
  }

  const syncWithCalendar = () => {
    if (!analysis) return

    // Dispatch custom event for calendar integration
    const event = new CustomEvent('projectDatesUpdated', {
      detail: {
        projectId,
        plannedStartDate: analysis.plannedStartDate,
        plannedEndDate: analysis.plannedEndDate,
        actualStartDate: analysis.actualStartDate,
        actualEndDate: analysis.actualEndDate,
        isDelayed: analysis.isDelayed,
        status: analysis.status
      }
    })
    window.dispatchEvent(event)
    
    // Show feedback
    alert('Takvim güncellendi!')
  }

  if (!analysis) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Proje Tarihleri</h3>
            <p className="text-sm text-gray-500">Dinamik tarih analizi</p>
          </div>
        </div>
        
        <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(analysis.status)}`}>
          {getStatusIcon(analysis.status)}
          <span className="ml-2">{getStatusText(analysis.status)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planned Dates (From Tasks) */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
            Planlanan Tarihler (Görevlerden)
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-gray-700">Başlangıç Tarihi:</span>
              <span className="text-sm font-semibold text-blue-700">
                {formatDate(analysis.plannedStartDate)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-gray-700">Planlanan Bitiş:</span>
              <span className="text-sm font-semibold text-blue-700">
                {formatDate(analysis.plannedEndDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Actual/Estimated Dates */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <TrendingDown className="w-4 h-4 mr-2 text-orange-500" />
            Gerçek/Tahmini Tarihler
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">Gerçek Başlangıç:</span>
              <span className="text-sm font-semibold text-gray-700">
                {formatDate(analysis.actualStartDate)}
              </span>
            </div>
            
            <div className={`flex justify-between items-center p-3 rounded-lg border ${getStatusColor(analysis.status)}`}>
              <span className="text-sm font-medium">Gerçek/Tahmini Bitiş:</span>
              <span className="text-sm font-semibold">
                {formatDate(analysis.actualEndDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(analysis.completionPercentage)}%
            </div>
            <div className="text-xs text-gray-500">Tamamlanma</div>
          </div>
          
          <div>
            <div className={`text-2xl font-bold ${analysis.isDelayed ? 'text-red-600' : 'text-green-600'}`}>
              {analysis.delayDays}
            </div>
            <div className="text-xs text-gray-500">Gün {analysis.isDelayed ? 'Gecikme' : 'Erken'}</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {analysis.criticalPath.length}
            </div>
            <div className="text-xs text-gray-500">Kritik Görev</div>
          </div>

          <div>
            <button
              onClick={syncWithCalendar}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
            >
              Takvimi Güncelle
            </button>
          </div>
        </div>
      </div>

      {/* Details Toggle */}
      <div className="mt-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showDetails ? 'Detayları Gizle' : 'Detaylı Analiz'}
        </button>
        
        {showDetails && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h5 className="font-medium text-yellow-800 mb-2">Analiz Detayları:</h5>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• Tarihler görev başlangıç ve bitiş tarihlerinden dinamik olarak hesaplanır</p>
              <p>• Gecikme: Planlanan bitiş tarihinden gerçek/tahmini bitiş tarihine kadar geçen gün</p>
              <p>• Tamamlanan görevlerin gerçek tarihleri, kalan görevlerin planlanan tarihleri kullanılır</p>
              {analysis.criticalPath.length > 0 && (
                <p>• Kritik görevler: {analysis.criticalPath.length} görev gecikmede etkili olabilir</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
