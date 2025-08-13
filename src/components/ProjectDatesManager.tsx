'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
} from 'lucide-react'

interface Task {
  id: string
  name: string
  startDate: Date
  endDate: Date
  duration: number
  status: string
  dependencies?: string[]
}

interface ProjectDatesProps {
  projectId: string
  originalStartDate: Date
  originalEndDate: Date
  tasks: Task[]
  className?: string
}

interface DateAnalysis {
  originalEndDate: Date
  calculatedEndDate: Date
  delayDays: number
  isDelayed: boolean
  criticalPath: string[]
  completionPercentage: number
  estimatedActualEndDate: Date
}

export default function ProjectDatesManager({
  projectId,
  originalStartDate,
  originalEndDate,
  tasks,
  className = '',
}: ProjectDatesProps) {
  const [dateAnalysis, setDateAnalysis] = useState<DateAnalysis | null>(null)
  const [loading, setLoading] = useState(false)

  // Kritik yolu hesapla
  const calculateCriticalPath = (tasks: Task[]): string[] => {
    // Basitleştirilmiş kritik yol hesaplaması
    const taskMap = new Map(tasks.map((task) => [task.id, task]))
    const visited = new Set<string>()
    const criticalPath: string[] = []

    // En uzun süren görevleri bul
    const longestTasks = tasks
      .filter((task) => task.status !== 'completed')
      .sort((a, b) => b.duration - a.duration)
      .slice(0, Math.ceil(tasks.length * 0.3)) // En uzun %30

    longestTasks.forEach((task) => {
      if (!visited.has(task.id)) {
        criticalPath.push(task.id)
        visited.add(task.id)
      }
    })

    return criticalPath
  }

  // Proje bitiş tarihini hesapla
  const analyzeProjectDates = () => {
    setLoading(true)

    try {
      const now = new Date()
      const completedTasks = tasks.filter((task) => task.status === 'completed')
      const remainingTasks = tasks.filter((task) => task.status !== 'completed')

      // Tamamlanma yüzdesi
      const completionPercentage =
        tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0

      // Kritik yol
      const criticalPath = calculateCriticalPath(tasks)

      // Hesaplanan bitiş tarihi (kalan görevlerin toplam süresi)
      const remainingDuration = remainingTasks.reduce(
        (sum, task) => sum + task.duration,
        0
      )
      const calculatedEndDate = new Date(now)
      calculatedEndDate.setDate(calculatedEndDate.getDate() + remainingDuration)

      // Gecikmeli görevleri dikkate al
      let maxTaskEndDate = now
      remainingTasks.forEach((task) => {
        const taskEndDate = new Date(task.endDate)
        if (taskEndDate > maxTaskEndDate) {
          maxTaskEndDate = taskEndDate
        }
      })

      // Gerçek tahmini bitiş tarihi
      const estimatedActualEndDate =
        maxTaskEndDate > calculatedEndDate ? maxTaskEndDate : calculatedEndDate

      // Gecikme hesaplama
      const delayDays = Math.ceil(
        (estimatedActualEndDate.getTime() - originalEndDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )

      const analysis: DateAnalysis = {
        originalEndDate,
        calculatedEndDate,
        delayDays: Math.max(0, delayDays),
        isDelayed: delayDays > 0,
        criticalPath,
        completionPercentage,
        estimatedActualEndDate,
      }

      setDateAnalysis(analysis)
    } catch (error) {
      console.error('Tarih analizi hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tasks.length > 0) {
      analyzeProjectDates()
    }
  }, [tasks, originalEndDate])

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusColor = (isDelayed: boolean, delayDays: number) => {
    if (!isDelayed) return 'text-green-600 bg-green-50 border-green-200'
    if (delayDays <= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (delayDays <= 30) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
      >
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/3 mb-3'></div>
          <div className='h-3 bg-gray-200 rounded w-1/2 mb-2'></div>
          <div className='h-3 bg-gray-200 rounded w-2/3'></div>
        </div>
      </div>
    )
  }

  if (!dateAnalysis) {
    return null
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
    >
      <div className='p-4 border-b border-gray-200'>
        <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
          <Calendar className='w-5 h-5' />
          Proje Bitiş Tarihleri
        </h3>
      </div>

      <div className='p-4 space-y-4'>
        {/* Orijinal Bitiş Tarihi */}
        <div className='flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <div className='flex items-center gap-3'>
            <Target className='w-5 h-5 text-blue-600' />
            <div>
              <h4 className='font-medium text-blue-900'>
                Planlanan Bitiş Tarihi
              </h4>
              <p className='text-sm text-blue-700'>
                İlk belirlenen hedef tarih
              </p>
            </div>
          </div>
          <div className='text-right'>
            <p className='font-bold text-blue-900'>
              {formatDate(dateAnalysis.originalEndDate)}
            </p>
            <p className='text-xs text-blue-600'>Sabit</p>
          </div>
        </div>

        {/* Güncel Tahmini Bitiş Tarihi */}
        <div
          className={`flex items-center justify-between p-3 border rounded-lg ${getStatusColor(
            dateAnalysis.isDelayed,
            dateAnalysis.delayDays
          )}`}
        >
          <div className='flex items-center gap-3'>
            <Clock className='w-5 h-5' />
            <div>
              <h4 className='font-medium'>Güncel Tahmini Bitiş</h4>
              <p className='text-sm opacity-80'>
                Mevcut duruma göre hesaplanan
              </p>
            </div>
          </div>
          <div className='text-right'>
            <p className='font-bold'>
              {formatDate(dateAnalysis.estimatedActualEndDate)}
            </p>
            {dateAnalysis.isDelayed && (
              <p className='text-xs'>
                <AlertTriangle className='w-3 h-3 inline mr-1' />
                {dateAnalysis.delayDays} gün gecikme
              </p>
            )}
          </div>
        </div>

        {/* İlerleme Durumu */}
        <div className='p-3 bg-gray-50 border border-gray-200 rounded-lg'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-gray-700'>
              Proje İlerlemesi
            </span>
            <span className='text-sm font-bold text-gray-900'>
              %{dateAnalysis.completionPercentage.toFixed(1)}
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
              style={{ width: `${dateAnalysis.completionPercentage}%` }}
            ></div>
          </div>
          <p className='text-xs text-gray-600 mt-1'>
            {tasks.filter((t) => t.status === 'completed').length} /{' '}
            {tasks.length} görev tamamlandı
          </p>
        </div>

        {/* Gecikme Durumu */}
        {dateAnalysis.isDelayed && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <AlertTriangle className='w-4 h-4 text-red-600' />
              <h4 className='font-medium text-red-900'>Gecikme Analizi</h4>
            </div>
            <div className='space-y-1 text-sm text-red-800'>
              <p>
                • Planlanan tarihten {dateAnalysis.delayDays} gün gecikme
                bekleniyor
              </p>
              <p>• Kritik yolda {dateAnalysis.criticalPath.length} görev var</p>
              <p>• Gecikmeyi azaltmak için kritik görevlere odaklanın</p>
            </div>
          </div>
        )}

        {/* Başarı Durumu */}
        {!dateAnalysis.isDelayed && dateAnalysis.completionPercentage > 50 && (
          <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-center gap-2'>
              <TrendingUp className='w-4 h-4 text-green-600' />
              <p className='text-sm text-green-800 font-medium'>
                Proje planlandığı gibi ilerliyor! 🎉
              </p>
            </div>
          </div>
        )}

        {/* Özet İstatistikler */}
        <div className='grid grid-cols-2 gap-3 pt-3 border-t border-gray-200'>
          <div className='text-center'>
            <p className='text-xs text-gray-500'>Kalan Süre</p>
            <p className='font-bold text-gray-900'>
              {Math.ceil(
                (dateAnalysis.estimatedActualEndDate.getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              gün
            </p>
          </div>
          <div className='text-center'>
            <p className='text-xs text-gray-500'>Kritik Görevler</p>
            <p className='font-bold text-gray-900'>
              {dateAnalysis.criticalPath.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
