'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
  CalendarCheck,
  CalendarX,
} from 'lucide-react'
import { useProjectDates } from '@/hooks/useProjectDates'

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
  // Add these new props to handle existing project delay data
  existingDelayDays?: number
  projectStatus?: string
}

interface DateAnalysis {
  plannedStartDate: Date | null
  plannedEndDate: Date | null
  actualStartDate: Date | null
  actualEndDate: Date | null
  isDelayed: boolean
  delayDays: number
  completionPercentage: number
  criticalPath: string[]
  status: 'early' | 'on-time' | 'delayed' | 'completed'
}

export default function ProjectDatesManager({
  projectId,
  originalStartDate,
  originalEndDate,
  tasks,
  className = '',
  existingDelayDays = 0,
  projectStatus = 'IN_PROGRESS',
}: ProjectDatesProps) {
  // Use the custom hook for date calculations
  const dateAnalysis = useProjectDates({
    projectId,
    tasks: tasks.map(task => ({
      id: task.id,
      title: task.name,
      status: task.status,
      startDate: task.startDate,
      endDate: task.endDate,
      estimatedHours: task.duration,
    })),
    projectStatus,
  })

  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateWithDay = (date: Date): string => {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const getStatusColor = (isDelayed: boolean, delayDays: number) => {
    if (!isDelayed) return 'text-green-600 bg-green-50 border-green-200'
    if (delayDays <= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (delayDays <= 30) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getDelayIcon = (isDelayed: boolean) => {
    return isDelayed ? CalendarX : CalendarCheck
  }

  if (!dateAnalysis) {
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
              {formatDate(dateAnalysis.plannedEndDate || new Date())}
            </p>
            <p className='text-xs text-blue-600'>Sabit</p>
          </div>
        </div>

        {/* Güncel Tahmini Bitiş Tarihi */}
        <div
          className={`flex items-center justify-between p-4 border rounded-lg ${getStatusColor(
            dateAnalysis.isDelayed,
            dateAnalysis.delayDays
          )}`}
        >
          <div className='flex items-center gap-3'>
            <Clock className='w-6 h-6' />
            <div>
              <h4 className='font-semibold text-lg'>Güncel Tahmini Bitiş</h4>
              <p className='text-sm opacity-80'>
                Mevcut duruma göre hesaplanan dinamik tarih
              </p>
            </div>
          </div>
          <div className='text-right'>
            <p className='font-bold text-xl'>
              {formatDate(dateAnalysis.actualEndDate || new Date())}
            </p>
            <p className='text-sm opacity-75 mb-1'>
              {formatDateWithDay(dateAnalysis.actualEndDate || new Date())}
            </p>
            {dateAnalysis.isDelayed && (
              <div className='flex items-center gap-1 text-sm font-medium'>
                <AlertTriangle className='w-4 h-4' />
                +{dateAnalysis.delayDays} gün gecikme
              </div>
            )}
            {!dateAnalysis.isDelayed && (
              <div className='flex items-center gap-1 text-sm font-medium'>
                <CalendarCheck className='w-4 h-4' />
                Zamanında
              </div>
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

        {/* Özet İstatistikler ve Takvim Entegrasyonu */}
        <div className='grid grid-cols-2 gap-3 pt-4 border-t border-gray-200'>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-xs text-gray-500 mb-1'>Kalan Süre</p>
            <p className='font-bold text-gray-900'>
              {Math.max(0, Math.ceil(
                ((dateAnalysis.actualEndDate || new Date()).getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              ))}{' '}
              gün
            </p>
          </div>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-xs text-gray-500 mb-1'>Kritik Görevler</p>
            <p className='font-bold text-gray-900'>
              {dateAnalysis.criticalPath.length}
            </p>
          </div>
        </div>

        {/* Takvim Entegrasyonu Butonu */}
        <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Calendar className='w-5 h-5 text-blue-600' />
              <div>
                <h5 className='font-medium text-blue-900'>Takvim Entegrasyonu</h5>
                <p className='text-xs text-blue-700'>
                  Dinamik tarihler takvimde otomatik güncellenir
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // Emit custom event for calendar integration
                window.dispatchEvent(new CustomEvent('projectDatesUpdated', {
                  detail: {
                    projectId,
                    plannedEndDate: dateAnalysis.plannedEndDate,
                    dynamicEndDate: dateAnalysis.actualEndDate,
                    delayDays: dateAnalysis.delayDays,
                    isDelayed: dateAnalysis.isDelayed,
                    status: dateAnalysis.status
                  }
                }))
                
                // Show brief feedback
                const button = document.activeElement as HTMLButtonElement
                if (button) {
                  const originalText = button.textContent
                  button.textContent = '✓ Güncellendi'
                  button.disabled = true
                  setTimeout(() => {
                    button.textContent = originalText
                    button.disabled = false
                  }, 2000)
                }
              }}
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2'
            >
              <CalendarCheck className='w-4 h-4' />
              Takvimi Güncelle
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
