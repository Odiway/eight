'use client'

import { useState } from 'react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface UserWorkloadData {
  id: string
  name: string
  email: string
  department: string
  position: string
  photo?: string | null
  activeTasks: number
  completedTasks: number
  reviewTasks: number
  overdueTasks: number
  activeProjects: number
  totalTasks: number
  workloadScore: number
  completionRate: number
  efficiency: number
  utilization: number
  riskLevel: string
  allTasks: any[]
  dailyWorkload: { date: string; hours: number; tasks: number }[]
  weeklyWorkload: { week: string; hours: number; tasks: number }[]
  monthlyWorkload: { month: string; hours: number; tasks: number }[]
  maxHoursPerDay: number
  workingDays: string
  studentId?: string | null
  createdAt: Date
  updatedAt: Date
}

interface WorkloadAnalysisViewProps {
  userWorkloads: UserWorkloadData[]
}

export default function WorkloadAnalysisView({ userWorkloads }: WorkloadAnalysisViewProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Get current date string for navigation
  const getCurrentDateString = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }
    return currentDate.toLocaleDateString('tr-TR', options)
  }

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  // Filter users based on current date and view mode
  const getRelevantWorkloadData = () => {
    const currentDateStr = currentDate.toISOString().split('T')[0]
    
    return userWorkloads.map(user => {
      let workloadData
      let totalHours = 0
      let totalTasks = 0

      if (viewMode === 'daily') {
        workloadData = user.dailyWorkload.find(d => d.date === currentDateStr)
        totalHours = workloadData?.hours || 0
        totalTasks = workloadData?.tasks || 0
      } else if (viewMode === 'weekly') {
        const weekStart = new Date(currentDate)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        
        const weekData = user.dailyWorkload.filter(d => {
          const date = new Date(d.date)
          return date >= weekStart && date <= weekEnd
        })
        
        totalHours = weekData.reduce((sum, d) => sum + d.hours, 0)
        totalTasks = weekData.reduce((sum, d) => sum + d.tasks, 0)
      } else {
        const monthData = user.monthlyWorkload.find(m => 
          m.month === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        )
        totalHours = monthData?.hours || 0
        totalTasks = monthData?.tasks || 0
      }

      const maxDailyHours = user.maxHoursPerDay || 8
      const utilizationPercent = viewMode === 'daily' 
        ? Math.min(100, (totalHours / maxDailyHours) * 100)
        : viewMode === 'weekly'
        ? Math.min(100, (totalHours / (maxDailyHours * 5)) * 100) // 5 working days
        : Math.min(100, (totalHours / (maxDailyHours * 20)) * 100) // ~20 working days per month

      return {
        ...user,
        currentHours: Math.round(totalHours * 10) / 10,
        currentTasks: Math.round(totalTasks * 10) / 10,
        utilizationPercent: Math.round(utilizationPercent)
      }
    }).sort((a, b) => b.utilizationPercent - a.utilizationPercent)
  }

  const relevantData = getRelevantWorkloadData()

  return (
    <div className='mb-8 bg-white shadow-xl rounded-2xl border border-gray-100'>
      {/* Header */}
      <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600'>
        <div className='flex justify-between items-center'>
          <h3 className='text-lg font-semibold text-white flex items-center'>
            <BarChart3 className='w-5 h-5 mr-2' />
            Çalışan Doluluk Analizi
          </h3>
          <div className='text-sm text-blue-100'>
            Takım üyelerinin iş yükü dağılımı
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className='px-6 py-4 border-b border-gray-200 bg-gray-50'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          {/* View Mode Toggle */}
          <div className='flex space-x-2'>
            {['daily', 'weekly', 'monthly'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-blue-50'
                }`}
              >
                {mode === 'daily' ? 'Günlük' : mode === 'weekly' ? 'Haftalık' : 'Aylık'}
              </button>
            ))}
          </div>

          {/* Date Navigation */}
          <div className='flex items-center space-x-4'>
            <button
              onClick={() => navigateDate('prev')}
              className='p-2 rounded-lg hover:bg-gray-200 transition-colors'
            >
              <ChevronLeft className='w-5 h-5 text-gray-600' />
            </button>
            
            <div className='text-center'>
              <div className='text-lg font-semibold text-gray-900'>
                {viewMode === 'daily' && getCurrentDateString()}
                {viewMode === 'weekly' && `${getCurrentDateString()} Haftası`}
                {viewMode === 'monthly' && currentDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
              </div>
            </div>

            <button
              onClick={() => navigateDate('next')}
              className='p-2 rounded-lg hover:bg-gray-200 transition-colors'
            >
              <ChevronRight className='w-5 h-5 text-gray-600' />
            </button>
          </div>
        </div>
      </div>

      {/* User Cards */}
      <div className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {relevantData.map((user) => (
            <div
              key={user.id}
              className='border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-200'
            >
              {/* User Header */}
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center space-x-3'>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      user.utilizationPercent >= 90
                        ? 'bg-red-500'
                        : user.utilizationPercent >= 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className='font-semibold text-gray-900'>{user.name}</div>
                    <div className='text-sm text-gray-500'>{user.department}</div>
                    <div className='text-xs text-gray-400'>{user.position}</div>
                  </div>
                </div>
                <div className='text-right'>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      user.utilizationPercent >= 90
                        ? 'bg-red-100 text-red-800'
                        : user.utilizationPercent >= 70
                        ? 'bg-yellow-100 text-yellow-800'
                        : user.utilizationPercent >= 50
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.utilizationPercent >= 90 ? 'Aşırı Yüklü' : 
                     user.utilizationPercent >= 70 ? 'Yüklü' :
                     user.utilizationPercent >= 50 ? 'Orta' : 'Hafif'}
                  </span>
                </div>
              </div>

              {/* Current Stats */}
              <div className='grid grid-cols-2 gap-3 mb-4'>
                <div className='text-center p-3 bg-blue-50 rounded-lg'>
                  <div className='text-xl font-bold text-blue-600'>
                    {user.currentTasks}
                  </div>
                  <div className='text-xs text-gray-600'>
                    {viewMode === 'daily' ? 'Günlük Görev' : 
                     viewMode === 'weekly' ? 'Haftalık Görev' : 'Aylık Görev'}
                  </div>
                </div>
                <div className='text-center p-3 bg-purple-50 rounded-lg'>
                  <div className='text-xl font-bold text-purple-600'>
                    {user.currentHours}h
                  </div>
                  <div className='text-xs text-gray-600'>
                    {viewMode === 'daily' ? 'Günlük Saat' : 
                     viewMode === 'weekly' ? 'Haftalık Saat' : 'Aylık Saat'}
                  </div>
                </div>
              </div>

              {/* Utilization Bar */}
              <div>
                <div className='flex justify-between text-sm text-gray-600 mb-1'>
                  <span>Doluluk Oranı</span>
                  <span>{user.utilizationPercent}%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-3'>
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      user.utilizationPercent >= 90
                        ? 'bg-red-500'
                        : user.utilizationPercent >= 70
                        ? 'bg-yellow-500'
                        : user.utilizationPercent >= 50
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, user.utilizationPercent)}%` }}
                  ></div>
                </div>
              </div>

              {/* Son Görevler */}
              <div className='mt-4'>
                <div className='text-sm font-medium text-gray-600 mb-2'>Son Görevler:</div>
                <div className='space-y-1'>
                  {user.allTasks
                    .filter(task => task.status !== 'COMPLETED')
                    .slice(0, 2)
                    .map((task, index) => (
                      <div key={index} className='text-xs p-2 bg-gray-50 rounded flex justify-between'>
                        <span className='truncate'>{task.title}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          task.status === 'TODO' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.status === 'TODO' ? 'Bekliyor' :
                           task.status === 'IN_PROGRESS' ? 'Devam' : 'Beklemede'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
