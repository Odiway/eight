'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Calendar,
} from 'lucide-react'

interface Task {
  id: string
  name: string
  endDate: Date
  status: string
  assignedUserId?: string
  priority?: string
}

interface Notification {
  id: string
  type: 'overdue' | 'deadline_approaching' | 'reminder' | 'milestone'
  title: string
  message: string
  taskId?: string
  projectId: string
  createdAt: Date
  isRead: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface NotificationSystemProps {
  projectId: string
  tasks: Task[]
  userId?: string
}

export default function NotificationSystem({
  projectId,
  tasks,
  userId,
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState({
    enableNotifications: true,
    reminderIntervals: [1, 3, 7], // days before deadline
    dailyCheck: true,
    checkTime: '09:00',
  })

  // Bildirim oluşturma fonksiyonu
  const createNotification = useCallback(
    (
      type: Notification['type'],
      title: string,
      message: string,
      taskId?: string,
      severity: Notification['severity'] = 'medium'
    ): Notification => {
      return {
        id: Date.now().toString() + Math.random(),
        type,
        title,
        message,
        taskId,
        projectId,
        createdAt: new Date(),
        isRead: false,
        severity,
      }
    },
    [projectId]
  )

  // Görev durumunu kontrol et ve bildirim oluştur
  const checkTaskStatus = useCallback(() => {
    if (!settings.enableNotifications) return

    const now = new Date()
    const newNotifications: Notification[] = []

    tasks.forEach((task) => {
      const endDate = new Date(task.endDate)
      const timeDiff = endDate.getTime() - now.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

      // Gecikmiş görevler
      if (daysDiff < 0 && task.status !== 'completed') {
        const overdueDays = Math.abs(daysDiff)
        newNotifications.push(
          createNotification(
            'overdue',
            '⚠️ Gecikmiş Görev',
            `"${task.name}" görevi ${overdueDays} gün gecikmiş!`,
            task.id,
            'critical'
          )
        )
      }

      // Yaklaşan son teslim tarihleri
      else if (daysDiff > 0 && daysDiff <= 7 && task.status !== 'completed') {
        if (settings.reminderIntervals.includes(daysDiff)) {
          const severity =
            daysDiff === 1 ? 'high' : daysDiff <= 3 ? 'medium' : 'low'
          newNotifications.push(
            createNotification(
              'deadline_approaching',
              '🕐 Son Teslim Yaklaşıyor',
              `"${task.name}" görevinin son teslimi ${daysDiff} gün sonra!`,
              task.id,
              severity
            )
          )
        }
      }

      // Bugün teslim edilecek görevler
      if (daysDiff === 0 && task.status !== 'completed') {
        newNotifications.push(
          createNotification(
            'deadline_approaching',
            '🔥 Bugün Teslim!',
            `"${task.name}" görevi bugün teslim edilmeli!`,
            task.id,
            'critical'
          )
        )
      }
    })

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev])
    }
  }, [tasks, settings, createNotification])

  // Periyodik kontrol
  useEffect(() => {
    checkTaskStatus()

    // Her 30 dakikada bir kontrol et
    const interval = setInterval(checkTaskStatus, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkTaskStatus])

  // Bildirimi okundu olarak işaretle
  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    )
  }

  // Bildirimi sil
  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    )
  }

  // Tüm bildirimleri temizle
  const clearAllNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className='w-4 h-4' />
      case 'deadline_approaching':
        return <Clock className='w-4 h-4' />
      case 'reminder':
        return <Bell className='w-4 h-4' />
      case 'milestone':
        return <CheckCircle className='w-4 h-4' />
      default:
        return <Bell className='w-4 h-4' />
    }
  }

  return (
    <div className='relative'>
      {/* Bildirim butonu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
        title='Bildirimler'
      >
        <Bell className='w-5 h-5' />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Bildirim paneli */}
      {isOpen && (
        <div className='absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50'>
          <div className='p-4 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Bildirimler ({unreadCount} okunmamış)
              </h3>
              <div className='flex items-center gap-2'>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className='text-xs text-gray-500 hover:text-gray-700'
                  >
                    Tümünü Temizle
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className='text-gray-500 hover:text-gray-700'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>

          <div className='max-h-96 overflow-y-auto'>
            {notifications.length === 0 ? (
              <div className='p-6 text-center text-gray-500'>
                <Bell className='w-8 h-8 mx-auto mb-2 opacity-50' />
                <p>Henüz bildirim yok</p>
              </div>
            ) : (
              <div className='p-2'>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 mb-2 rounded-lg border transition-all cursor-pointer ${
                      notification.isRead ? 'opacity-60' : ''
                    } ${getSeverityColor(notification.severity)}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start gap-2 flex-1'>
                        {getTypeIcon(notification.type)}
                        <div className='flex-1'>
                          <h4 className='font-medium text-sm'>
                            {notification.title}
                          </h4>
                          <p className='text-xs mt-1 opacity-80'>
                            {notification.message}
                          </p>
                          <p className='text-xs mt-1 opacity-60'>
                            {notification.createdAt.toLocaleTimeString(
                              'tr-TR',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className='text-gray-400 hover:text-gray-600'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bildirim ayarları */}
          <div className='p-4 border-t border-gray-200 bg-gray-50'>
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  enableNotifications: !prev.enableNotifications,
                }))
              }
              className={`w-full text-xs px-3 py-2 rounded-lg transition-colors ${
                settings.enableNotifications
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {settings.enableNotifications
                ? '✓ Bildirimler Açık'
                : '✗ Bildirimler Kapalı'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
