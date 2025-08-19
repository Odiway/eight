'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, AlertTriangle } from 'lucide-react'

interface DynamicProjectDate {
  projectId: string
  originalEndDate: Date
  dynamicEndDate: Date
  delayDays: number
  isDelayed: boolean
}

interface CalendarIntegrationProps {
  className?: string
}

export default function CalendarIntegration({
  className = '',
}: CalendarIntegrationProps) {
  const [projectDates, setProjectDates] = useState<DynamicProjectDate[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    const handleProjectDatesUpdate = (event: CustomEvent) => {
      const { projectId, originalEndDate, dynamicEndDate, delayDays, isDelayed } = event.detail
      
      setProjectDates(prev => {
        const filtered = prev.filter(p => p.projectId !== projectId)
        return [...filtered, {
          projectId,
          originalEndDate: new Date(originalEndDate),
          dynamicEndDate: new Date(dynamicEndDate),
          delayDays,
          isDelayed,
        }]
      })
      
      setLastUpdate(new Date())
      
      console.log('📅 Takvim güncellendi:', {
        projectId,
        originalDate: new Date(originalEndDate).toLocaleDateString('tr-TR'),
        dynamicDate: new Date(dynamicEndDate).toLocaleDateString('tr-TR'),
        delay: delayDays,
      })
    }

    // Listen for project date updates
    window.addEventListener('projectDatesUpdated', handleProjectDatesUpdate as EventListener)

    return () => {
      window.removeEventListener('projectDatesUpdated', handleProjectDatesUpdate as EventListener)
    }
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (projectDates.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className='flex items-center gap-2 text-gray-500'>
          <Calendar className='w-5 h-5' />
          <span className='text-sm'>Dinamik proje tarihleri burada görünecek</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <h3 className='font-semibold text-gray-900 flex items-center gap-2'>
            <Calendar className='w-5 h-5' />
            Dinamik Proje Tarihleri
          </h3>
          <span className='text-xs text-gray-500'>
            Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
          </span>
        </div>
      </div>

      <div className='p-4 space-y-3'>
        {projectDates.map((project) => (
          <div
            key={project.projectId}
            className={`p-3 rounded-lg border ${
              project.isDelayed
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {project.isDelayed ? (
                  <AlertTriangle className='w-4 h-4 text-red-600' />
                ) : (
                  <Clock className='w-4 h-4 text-green-600' />
                )}
                <span className='font-medium text-sm'>
                  Proje #{project.projectId.slice(-8)}
                </span>
              </div>
              <div className='text-right'>
                {project.isDelayed && (
                  <div className='text-xs text-red-600 font-medium mb-1'>
                    +{project.delayDays} gün gecikme
                  </div>
                )}
                <div className='text-sm'>
                  <span className='text-gray-500'>Orijinal: </span>
                  <span className='font-medium'>
                    {formatDate(project.originalEndDate)}
                  </span>
                </div>
                <div className='text-sm'>
                  <span className='text-gray-500'>Güncel: </span>
                  <span className='font-bold'>
                    {formatDate(project.dynamicEndDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='p-3 border-t border-gray-200 bg-gray-50'>
        <p className='text-xs text-gray-600 text-center'>
          📌 Bu tarihler proje ilerlemesine göre otomatik güncellenir
        </p>
      </div>
    </div>
  )
}
