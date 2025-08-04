'use client'

import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Info,
  Trash2,
  Settings,
  Filter,
  CheckCheck,
  RefreshCw
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'TASK_DUE' | 'TASK_OVERDUE' | 'PROJECT_DELAY'
  isRead: boolean
  createdAt: Date
  relatedTaskId?: string
  relatedProjectId?: string
  actionUrl?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

interface NotificationCenterProps {
  userId?: string
  projectId?: string
}

export default function NotificationCenter({ userId, projectId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')
  const [loading, setLoading] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (projectId) params.append('projectId', projectId)

      const response = await fetch(`/api/notifications?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
    setLoading(false)
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, projectId })
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead
      case 'urgent':
        return notification.priority === 'URGENT' || notification.priority === 'HIGH'
      default:
        return true
    }
  })

  // Get notification icon
  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'URGENT') return <AlertTriangle className="w-5 h-5 text-red-500" />
    
    switch (type) {
      case 'ERROR':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'TASK_DUE':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'TASK_OVERDUE':
        return <Clock className="w-5 h-5 text-red-500" />
      case 'PROJECT_DELAY':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  // Get notification color
  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'URGENT') return 'border-l-red-500 bg-red-50'
    
    switch (type) {
      case 'ERROR':
        return 'border-l-red-500 bg-red-50'
      case 'WARNING':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'SUCCESS':
        return 'border-l-green-500 bg-green-50'
      case 'TASK_DUE':
        return 'border-l-blue-500 bg-blue-50'
      case 'TASK_OVERDUE':
        return 'border-l-red-500 bg-red-50'
      case 'PROJECT_DELAY':
        return 'border-l-orange-500 bg-orange-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [userId, projectId])

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Bildirimler</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-white/80">
                {unreadCount} okunmamış bildirim
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1 hover:bg-white/20 rounded"
                    title="Tümünü okundu işaretle"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { key: 'all', label: 'Tümü', count: notifications.length },
              { key: 'unread', label: 'Okunmamış', count: unreadCount },
              { key: 'urgent', label: 'Acil', count: notifications.filter(n => n.priority === 'URGENT' || n.priority === 'HIGH').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Bildirim yok</p>
                <p className="text-sm">
                  {filter === 'unread' ? 'Tüm bildirimler okundu' : 'Henüz bildirim bulunmuyor'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 transition-colors hover:bg-gray-50 ${
                      getNotificationColor(notification.type, notification.priority)
                    } ${!notification.isRead ? 'bg-blue-25' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleString('tr-TR')}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              {notification.priority === 'URGENT' && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                  ACİL
                                </span>
                              )}
                              {notification.priority === 'HIGH' && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                                  YÜKSEK
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {notification.actionUrl && (
                            <button
                              onClick={() => {
                                window.location.href = notification.actionUrl!
                                markAsRead(notification.id)
                              }}
                              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Detaya Git →
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="Okundu işaretle"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="border-t border-gray-200 p-3">
              <button
                onClick={() => {
                  // Navigate to full notifications page if needed
                  setIsOpen(false)
                }}
                className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2"
              >
                Tüm Bildirimleri Gör
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Notification Settings Component
export function NotificationSettings() {
  const [settings, setSettings] = useState({
    taskDueReminders: true,
    projectDeadlines: true,
    teamUpdates: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    reminderTiming: 24, // hours before
  })

  const updateSetting = async (key: string, value: any) => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })

      if (response.ok) {
        setSettings(prev => ({ ...prev, [key]: value }))
      }
    } catch (error) {
      console.error('Error updating notification settings:', error)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Bildirim Ayarları</h2>
      </div>

      <div className="space-y-6">
        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bildirim Türleri</h3>
          <div className="space-y-4">
            {[
              { key: 'taskDueReminders', label: 'Görev Teslim Tarihi Hatırlatmaları', description: 'Görevlerinizin teslim tarihi yaklaştığında bildirim alın' },
              { key: 'projectDeadlines', label: 'Proje Son Tarihleri', description: 'Proje deadlineları için hatırlatmalar' },
              { key: 'teamUpdates', label: 'Takım Güncellemeleri', description: 'Takım üyelerinin aktiviteleri hakkında bildirimler' },
              { key: 'systemAlerts', label: 'Sistem Uyarıları', description: 'Önemli sistem bildirimleri ve güncellemeler' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{item.label}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[item.key as keyof typeof settings] as boolean}
                    onChange={(e) => updateSetting(item.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Methods */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bildirim Yöntemleri</h3>
          <div className="space-y-4">
            {[
              { key: 'pushNotifications', label: 'Anlık Bildirimler', description: 'Tarayıcı bildirimleri' },
              { key: 'emailNotifications', label: 'E-posta Bildirimleri', description: 'E-posta ile bildirim alın' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{item.label}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[item.key as keyof typeof settings] as boolean}
                    onChange={(e) => updateSetting(item.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Timing Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Zamanlama Ayarları</h3>
          <div className="p-4 border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Görev teslim tarihi kaç saat önceden hatırlatılsın?
            </label>
            <select
              value={settings.reminderTiming}
              onChange={(e) => updateSetting('reminderTiming', parseInt(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 saat önceden</option>
              <option value={4}>4 saat önceden</option>
              <option value={12}>12 saat önceden</option>
              <option value={24}>1 gün önceden</option>
              <option value={48}>2 gün önceden</option>
              <option value={72}>3 gün önceden</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
