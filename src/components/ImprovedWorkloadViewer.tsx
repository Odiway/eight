'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Filter,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Eye,
  X,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface WorkloadUser {
  id: string
  name: string
  department: string
  maxHoursPerDay: number
  workloadPercentage: number
  totalHours: number
  tasks: any[]
}

interface ImprovedWorkloadViewerProps {
  users: any[]
  tasks: any[]
  currentDate: Date
  onDateChange: (date: Date) => void
}

export default function ImprovedWorkloadViewer({ users, tasks, currentDate, onDateChange }: ImprovedWorkloadViewerProps) {
  const [workloadData, setWorkloadData] = useState<WorkloadUser[]>([])
  const [filteredData, setFilteredData] = useState<WorkloadUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [workloadFilter, setWorkloadFilter] = useState<'all' | 'light' | 'normal' | 'heavy' | 'overloaded'>('all')
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Calculate workload for current date/period
  useEffect(() => {
    const newWorkloadData = users.map(user => {
      let userTasks = []
      let totalHours = 0
      let periodDays = 1

      if (viewMode === 'daily') {
        // Daily calculation - existing logic
        userTasks = tasks.filter(task => {
          if (!task.startDate || !task.endDate) return false
          
          const isAssignedToUser = task.assignedId === user.id || 
            (task.assignedUsers && task.assignedUsers.some((assignment: any) => assignment.userId === user.id))
          
          if (!isAssignedToUser) return false
          
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          const checkDate = new Date(currentDate)
          
          taskStart.setHours(0, 0, 0, 0)
          taskEnd.setHours(0, 0, 0, 0)
          checkDate.setHours(0, 0, 0, 0)
          
          return checkDate >= taskStart && checkDate <= taskEnd
        })

        totalHours = userTasks.reduce((sum, task) => {
          if (!task.estimatedHours) return sum + 4
          
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          const workingDays = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)))
          
          return sum + (task.estimatedHours / workingDays)
        }, 0)

      } else if (viewMode === 'weekly') {
        // Weekly calculation
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay()) // Go to Sunday
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6) // Go to Saturday
        weekEnd.setHours(23, 59, 59, 999)
        
        periodDays = 7

        userTasks = tasks.filter(task => {
          if (!task.startDate || !task.endDate) return false
          
          const isAssignedToUser = task.assignedId === user.id || 
            (task.assignedUsers && task.assignedUsers.some((assignment: any) => assignment.userId === user.id))
          
          if (!isAssignedToUser) return false
          
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          
          // Check if task overlaps with the week
          return taskStart <= weekEnd && taskEnd >= weekStart
        })

        totalHours = userTasks.reduce((sum, task) => {
          if (!task.estimatedHours) return sum + 4 * periodDays
          
          const taskStart = new Date(Math.max(new Date(task.startDate).getTime(), weekStart.getTime()))
          const taskEnd = new Date(Math.min(new Date(task.endDate).getTime(), weekEnd.getTime()))
          const overlapDays = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)))
          
          const totalTaskDays = Math.max(1, Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)))
          const hoursPerDay = task.estimatedHours / totalTaskDays
          
          return sum + (hoursPerDay * overlapDays)
        }, 0)

      } else if (viewMode === 'monthly') {
        // Monthly calculation
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        monthEnd.setHours(23, 59, 59, 999)
        
        periodDays = monthEnd.getDate()

        userTasks = tasks.filter(task => {
          if (!task.startDate || !task.endDate) return false
          
          const isAssignedToUser = task.assignedId === user.id || 
            (task.assignedUsers && task.assignedUsers.some((assignment: any) => assignment.userId === user.id))
          
          if (!isAssignedToUser) return false
          
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          
          // Check if task overlaps with the month
          return taskStart <= monthEnd && taskEnd >= monthStart
        })

        totalHours = userTasks.reduce((sum, task) => {
          if (!task.estimatedHours) return sum + 4 * periodDays
          
          const taskStart = new Date(Math.max(new Date(task.startDate).getTime(), monthStart.getTime()))
          const taskEnd = new Date(Math.min(new Date(task.endDate).getTime(), monthEnd.getTime()))
          const overlapDays = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)))
          
          const totalTaskDays = Math.max(1, Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)))
          const hoursPerDay = task.estimatedHours / totalTaskDays
          
          return sum + (hoursPerDay * overlapDays)
        }, 0)
      }

      const maxHours = (user.maxHoursPerDay || 8) * periodDays
      const workloadPercentage = Math.round((totalHours / maxHours) * 100)

      return {
        id: user.id,
        name: user.name,
        department: user.department || 'Genel',
        maxHoursPerDay: user.maxHoursPerDay || 8,
        workloadPercentage,
        totalHours,
        tasks: userTasks
      }
    })
    
    setWorkloadData(newWorkloadData)
  }, [users, tasks, currentDate, viewMode])

  // Apply filters
  useEffect(() => {
    let filtered = workloadData

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Workload filter
    if (workloadFilter !== 'all') {
      filtered = filtered.filter(user => {
        switch (workloadFilter) {
          case 'light': return user.workloadPercentage <= 50
          case 'normal': return user.workloadPercentage > 50 && user.workloadPercentage <= 80
          case 'heavy': return user.workloadPercentage > 80 && user.workloadPercentage <= 100
          case 'overloaded': return user.workloadPercentage > 100
          default: return true
        }
      })
    }

    // Only show assigned users filter
    if (showOnlyAssigned) {
      filtered = filtered.filter(user => user.tasks.length > 0)
    }

    setFilteredData(filtered)
  }, [workloadData, searchTerm, workloadFilter, showOnlyAssigned])

  const getWorkloadColor = (percentage: number) => {
    if (percentage <= 50) return 'bg-green-500'
    if (percentage <= 80) return 'bg-yellow-500'
    if (percentage <= 100) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getWorkloadStatus = (percentage: number) => {
    if (percentage <= 50) return { text: 'Hafif', color: 'text-green-600', icon: CheckCircle }
    if (percentage <= 80) return { text: 'Normal', color: 'text-yellow-600', icon: Clock }
    if (percentage <= 100) return { text: 'Yoğun', color: 'text-orange-600', icon: AlertTriangle }
    return { text: 'Aşırı Yoğun', color: 'text-red-600', icon: AlertTriangle }
  }

  const getPeriodText = () => {
    if (viewMode === 'daily') {
      return currentDate.toLocaleDateString('tr-TR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } else if (viewMode === 'weekly') {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      return `${weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })} Haftası`
    } else {
      return currentDate.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'long' 
      })
    }
  }

  const getFilterCount = (filter: string) => {
    switch (filter) {
      case 'light': return workloadData.filter(u => u.workloadPercentage <= 50).length
      case 'normal': return workloadData.filter(u => u.workloadPercentage > 50 && u.workloadPercentage <= 80).length
      case 'heavy': return workloadData.filter(u => u.workloadPercentage > 80 && u.workloadPercentage <= 100).length
      case 'overloaded': return workloadData.filter(u => u.workloadPercentage > 100).length
      default: return workloadData.length
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Çalışan Doluluk Analizi</h2>
              <p className="text-blue-100">
                {getPeriodText()}
              </p>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newDate = new Date(currentDate)
                if (viewMode === 'daily') {
                  newDate.setDate(newDate.getDate() - 1)
                } else if (viewMode === 'weekly') {
                  newDate.setDate(newDate.getDate() - 7)
                } else {
                  newDate.setMonth(newDate.getMonth() - 1)
                }
                onDateChange(newDate)
              }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title={viewMode === 'daily' ? 'Önceki gün' : viewMode === 'weekly' ? 'Önceki hafta' : 'Önceki ay'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDateChange(new Date())}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
              title="Bugüne git"
            >
              Bugün
            </button>
            <button
              onClick={() => {
                const newDate = new Date(currentDate)
                if (viewMode === 'daily') {
                  newDate.setDate(newDate.getDate() + 1)
                } else if (viewMode === 'weekly') {
                  newDate.setDate(newDate.getDate() + 7)
                } else {
                  newDate.setMonth(newDate.getMonth() + 1)
                }
                onDateChange(newDate)
              }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title={viewMode === 'daily' ? 'Sonraki gün' : viewMode === 'weekly' ? 'Sonraki hafta' : 'Sonraki ay'}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Selection */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-blue-100 mr-2">Görünüm:</span>
          {[
            { key: 'daily', label: 'Günlük', icon: '📅' },
            { key: 'weekly', label: 'Haftalık', icon: '📆' },
            { key: 'monthly', label: 'Aylık', icon: '🗓️' }
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key as any)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                viewMode === mode.key
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-blue-100 hover:bg-white/30'
              }`}
            >
              <span>{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{workloadData.length}</div>
            <div className="text-sm text-blue-100">Toplam Çalışan</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{workloadData.filter(u => u.tasks.length > 0).length}</div>
            <div className="text-sm text-blue-100">Aktif Çalışan</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{workloadData.filter(u => u.workloadPercentage > 100).length}</div>
            <div className="text-sm text-blue-100">Aşırı Yoğun</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">
              {workloadData.filter(u => u.tasks.length > 0).length > 0 
                ? Math.round(workloadData.filter(u => u.tasks.length > 0).reduce((sum, u) => sum + u.workloadPercentage, 0) / workloadData.filter(u => u.tasks.length > 0).length)
                : 0}%
            </div>
            <div className="text-sm text-blue-100">Aktif Ort. Doluluk</div>
          </div>
        </div>
      </div>

      {/* Quick Date Shortcuts */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Hızlı {viewMode === 'daily' ? 'Tarih' : viewMode === 'weekly' ? 'Hafta' : 'Ay'} Geçişi (Test için):
        </h3>
        <div className="flex flex-wrap gap-2">
          {viewMode === 'daily' && (
            <>
              <button
                onClick={() => onDateChange(new Date('2025-07-24'))}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm transition-colors"
              >
                24 Temmuz (Berkay - Müşteri Talepleri)
              </button>
              <button
                onClick={() => onDateChange(new Date('2025-07-31'))}
                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm transition-colors"
              >
                31 Temmuz (3 Kişi - Montaja Hazırlık)
              </button>
              <button
                onClick={() => onDateChange(new Date('2025-08-06'))}
                className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm transition-colors"
              >
                6 Ağustos (Oğuzhan - Planlama)
              </button>
              <button
                onClick={() => onDateChange(new Date('2025-08-09'))}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-sm transition-colors"
              >
                9 Ağustos (4 Kişi - Tasarım)
              </button>
              <button
                onClick={() => onDateChange(new Date('2025-08-26'))}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm transition-colors"
              >
                26 Ağustos (Çoklu Görevler)
              </button>
            </>
          )}
          
          {viewMode === 'weekly' && (
            <>
              <button
                onClick={() => onDateChange(new Date('2025-07-28'))} // Week containing July 24-31
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm transition-colors"
              >
                Son Temmuz Haftası
              </button>
              <button
                onClick={() => onDateChange(new Date('2025-08-04'))} // Week containing Aug 1-7
                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm transition-colors"
              >
                İlk Ağustos Haftası
              </button>
              <button
                onClick={() => onDateChange(new Date('2025-08-11'))} // Week containing Aug 8-14
                className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm transition-colors"
              >
                İkinci Ağustos Haftası
              </button>
              <button
                onClick={() => onDateChange(new Date('2025-08-25'))} // Week containing Aug 22-28
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-sm transition-colors"
              >
                Son Ağustos Haftası
              </button>
            </>
          )}
          
          {viewMode === 'monthly' && (
            <>
              <button
                onClick={() => onDateChange(new Date('2025-07-15'))}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm transition-colors"
              >
                Temmuz 2025
              </button>
              <button
                onClick={() => onDateChange(new Date('2025-08-15'))}
                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm transition-colors"
              >
                Ağustos 2025
              </button>
              <button
                onClick={() => onDateChange(new Date('2025-09-15'))}
                className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm transition-colors"
              >
                Eylül 2025
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Çalışan ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filtreler
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="flex flex-wrap gap-3">
                {/* Workload Filters */}
                {[
                  { key: 'all', label: 'Tümü', color: 'bg-gray-500' },
                  { key: 'light', label: 'Hafif (≤50%)', color: 'bg-green-500' },
                  { key: 'normal', label: 'Normal (51-80%)', color: 'bg-yellow-500' },
                  { key: 'heavy', label: 'Yoğun (81-100%)', color: 'bg-orange-500' },
                  { key: 'overloaded', label: 'Aşırı (>100%)', color: 'bg-red-500' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setWorkloadFilter(filter.key as any)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all ${
                      workloadFilter === filter.key
                        ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${filter.color}`} />
                    {filter.label}
                    <span className="bg-white text-gray-600 px-1 rounded">
                      {getFilterCount(filter.key)}
                    </span>
                  </button>
                ))}

                {/* Only Assigned Toggle */}
                <button
                  onClick={() => setShowOnlyAssigned(!showOnlyAssigned)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    showOnlyAssigned
                      ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sadece Görevli
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-gray-600">
          <span className="font-medium">{filteredData.length}</span> çalışan gösteriliyor
          {filteredData.length !== workloadData.length && (
            <span className="text-sm"> ({workloadData.length} toplam)</span>
          )}
        </div>
        
        {(searchTerm || workloadFilter !== 'all' || showOnlyAssigned) && (
          <button
            onClick={() => {
              setSearchTerm('')
              setWorkloadFilter('all')
              setShowOnlyAssigned(false)
            }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Workload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredData.map((user, index) => {
            const status = getWorkloadStatus(user.workloadPercentage)
            const StatusIcon = status.icon
            
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all duration-300 cursor-pointer hover:shadow-md ${
                  selectedUser === user.id ? 'ring-2 ring-blue-300 border-blue-300' : 'border-gray-200'
                }`}
                onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
              >
                {/* User Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{user.department}</p>
                  </div>
                </div>

                {/* Workload Status */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      <span className={`text-sm font-medium ${status.color}`}>
                        {user.workloadPercentage}%
                      </span>
                    </div>
                    <span className={`text-xs ${status.color}`}>{status.text}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getWorkloadColor(user.workloadPercentage)}`}
                      style={{ width: `${Math.min(user.workloadPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Task Info */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{user.totalHours.toFixed(1)}h / {(user.maxHoursPerDay * (viewMode === 'daily' ? 1 : viewMode === 'weekly' ? 7 : 30)).toFixed(0)}h</span>
                  <span>{user.tasks.length} görev</span>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedUser === user.id && user.tasks.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-gray-200"
                    >
                      <h4 className="text-xs font-medium text-gray-700 mb-2">
                        {viewMode === 'daily' ? 'Günün Görevleri:' : 
                         viewMode === 'weekly' ? 'Haftanın Görevleri:' : 
                         'Ayın Görevleri:'}
                      </h4>
                      <div className="space-y-1">
                        {user.tasks.slice(0, 3).map(task => (
                          <div key={task.id} className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                            <div className="font-medium truncate">{task.title}</div>
                            <div className="text-gray-500">{task.estimatedHours || 'N/A'}h</div>
                          </div>
                        ))}
                        {user.tasks.length > 3 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{user.tasks.length - 3} daha...
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sonuç bulunamadı</h3>
          <p className="text-gray-500">Arama kriterlerinizi değiştirmeyi deneyin.</p>
        </div>
      )}
    </div>
  )
}
