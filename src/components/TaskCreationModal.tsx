'use client'

import React, { useState } from 'react'
import { Plus, Users, Calendar, CheckSquare, Folder, List } from 'lucide-react'
import UserWorkloadDisplay from './UserWorkloadDisplay'

interface TaskCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTask: (taskData: any) => void
  onCreateTaskGroup: (groupData: any) => void
  projectId: string
  users: any[]
}

export default function TaskCreationModal({
  isOpen,
  onClose,
  onCreateTask,
  onCreateTaskGroup,
  projectId,
  users
}: TaskCreationModalProps) {
  const [creationType, setCreationType] = useState<'individual' | 'group'>('individual')
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assignedId: '',
    assignedUserIds: [] as string[],
    priority: 'MEDIUM',
    estimatedHours: '',
    maxDailyHours: '',
    startDate: '',
    endDate: ''
  })
  
  const [groupData, setGroupData] = useState({
    groupTitle: '',
    groupDescription: '',
    tasks: [
      {
        title: '',
        description: '',
        assignedId: '',
        assignedUserIds: [] as string[],
        priority: 'MEDIUM',
        estimatedHours: '',
        maxDailyHours: '',
        startDate: '',
        endDate: '',
        order: 1
      }
    ]
  })

  if (!isOpen) return null

  const addTaskToGroup = () => {
    setGroupData(prev => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          title: '',
          description: '',
          assignedId: '',
          assignedUserIds: [],
          priority: 'MEDIUM',
          estimatedHours: '',
          maxDailyHours: '',
          startDate: '',
          endDate: '',
          order: prev.tasks.length + 1
        }
      ]
    }))
  }

  const removeTaskFromGroup = (index: number) => {
    setGroupData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }))
  }

  const updateGroupTask = (index: number, field: string, value: string | string[]) => {
    setGroupData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => {
        if (i === index) {
          const updated = { ...task, [field]: value }
          
          // Auto-calculate deadline for group tasks when relevant fields change
          if (['startDate', 'estimatedHours', 'maxDailyHours'].includes(field)) {
            if (updated.startDate && updated.estimatedHours && updated.maxDailyHours) {
              updated.endDate = calculateDeadline(updated.startDate, updated.estimatedHours, updated.maxDailyHours)
            }
          }
          
          return updated
        }
        return task
      })
    }))
  }

  const updateGroupTaskUsers = (index: number, userIds: string[]) => {
    setGroupData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, assignedUserIds: userIds } : task
      )
    }))
  }

  // Validation helper functions
  const validateIndividualTask = () => {
    const errors = []
    
    if (!taskData.title.trim()) errors.push('Görev başlığı gereklidir')
    if (!taskData.assignedId && taskData.assignedUserIds.length === 0) errors.push('En az bir kişi atanmalıdır')
    if (!taskData.estimatedHours || parseInt(taskData.estimatedHours) <= 0) {
      errors.push('Geçerli bir tahmini süre girilmelidir (minimum 1 saat)')
    }
    if (!taskData.maxDailyHours || parseInt(taskData.maxDailyHours) <= 0) {
      errors.push('Geçerli bir günlük maksimum süre girilmelidir (minimum 1 saat)')
    }
    if (!taskData.startDate) errors.push('Başlangıç tarihi seçilmelidir')
    if (!taskData.endDate) errors.push('Bitiş tarihi seçilmelidir')
    
    if (taskData.startDate && taskData.endDate) {
      const start = new Date(taskData.startDate)
      const end = new Date(taskData.endDate)
      if (end <= start) {
        errors.push('Bitiş tarihi başlangıç tarihinden sonra olmalıdır')
      }
    }
    
    return errors
  }

  const validateTaskGroup = () => {
    const errors = []
    
    if (!groupData.groupTitle.trim()) errors.push('Grup başlığı gereklidir')
    
    groupData.tasks.forEach((task, index) => {
      if (!task.title.trim()) errors.push(`Alt görev #${index + 1}: Başlık gereklidir`)
      if (!task.assignedId && task.assignedUserIds.length === 0) errors.push(`Alt görev #${index + 1}: En az bir kişi atanmalıdır`)
      if (!task.estimatedHours || parseInt(task.estimatedHours) <= 0) {
        errors.push(`Alt görev #${index + 1}: Geçerli bir tahmini süre girilmelidir`)
      }
      if (!task.maxDailyHours || parseInt(task.maxDailyHours) <= 0) {
        errors.push(`Alt görev #${index + 1}: Geçerli bir günlük maksimum süre girilmelidir`)
      }
      if (!task.startDate) errors.push(`Alt görev #${index + 1}: Başlangıç tarihi seçilmelidir`)
      if (!task.endDate) errors.push(`Alt görev #${index + 1}: Bitiş tarihi seçilmelidir`)
      
      if (task.startDate && task.endDate) {
        const start = new Date(task.startDate)
        const end = new Date(task.endDate)
        if (end <= start) {
          errors.push(`Alt görev #${index + 1}: Bitiş tarihi başlangıç tarihinden sonra olmalıdır`)
        }
      }
    })
    
    return errors
  }

  // Deadline calculation helper function
  const calculateDeadline = (startDate: string, estimatedHours: string, maxDailyHours: string) => {
    if (!startDate || !estimatedHours || !maxDailyHours) return ''
    
    const start = new Date(startDate)
    const totalHours = parseInt(estimatedHours)
    const dailyHours = parseInt(maxDailyHours)
    
    if (totalHours <= 0 || dailyHours <= 0) return ''
    
    // Calculate working days needed (assuming 5-day work week)
    const daysNeeded = Math.ceil(totalHours / dailyHours)
    let currentDate = new Date(start)
    let workingDays = 0
    
    // Add working days (skip weekends)
    while (workingDays < daysNeeded) {
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        workingDays++
      }
      if (workingDays < daysNeeded) {
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }
    
    return currentDate.toISOString().split('T')[0]
  }

  // Auto-calculate deadline when start date, estimated hours, or max daily hours change
  const handleEstimatedHoursChange = (value: string) => {
    setTaskData(prev => {
      const updated = { ...prev, estimatedHours: value }
      if (updated.startDate && updated.maxDailyHours) {
        updated.endDate = calculateDeadline(updated.startDate, value, updated.maxDailyHours)
      }
      return updated
    })
  }

  const handleMaxDailyHoursChange = (value: string) => {
    setTaskData(prev => {
      const updated = { ...prev, maxDailyHours: value }
      if (updated.startDate && updated.estimatedHours) {
        updated.endDate = calculateDeadline(updated.startDate, updated.estimatedHours, value)
      }
      return updated
    })
  }

  const handleStartDateChange = (value: string) => {
    setTaskData(prev => {
      const updated = { ...prev, startDate: value }
      if (updated.estimatedHours && updated.maxDailyHours) {
        updated.endDate = calculateDeadline(value, updated.estimatedHours, updated.maxDailyHours)
      }
      return updated
    })
  }

  const handleSubmit = () => {
    const errors = creationType === 'individual' 
      ? validateIndividualTask() 
      : validateTaskGroup()
    
    if (errors.length > 0) {
      alert('Lütfen aşağıdaki hataları düzeltin:\n\n' + errors.join('\n'))
      return
    }

    if (creationType === 'individual') {
      // Enhanced task data with all required fields for workload visualization
      const enhancedTaskData = {
        ...taskData,
        projectId,
        taskType: 'INDIVIDUAL',
        isGroupParent: false,
        parentTaskId: null,
        groupOrder: 0,
        estimatedHours: parseInt(taskData.estimatedHours),
        maxDailyHours: parseInt(taskData.maxDailyHours),
        actualHours: null,
        delayReason: null,
        delayDays: 0,
        workloadPercentage: 0,
        isBottleneck: false,
        originalEndDate: taskData.endDate ? new Date(taskData.endDate) : null,
        // Ensure dates are properly formatted
        startDate: taskData.startDate ? new Date(taskData.startDate) : null,
        endDate: taskData.endDate ? new Date(taskData.endDate) : null,
        // Add user ID arrays for new assignment system
        assignedUserIds: taskData.assignedUserIds.length > 0 ? taskData.assignedUserIds : (taskData.assignedId ? [taskData.assignedId] : [])
      }
      
      onCreateTask(enhancedTaskData)
    } else {
      // Enhanced group data with proper task structure
      const enhancedGroupData = {
        ...groupData,
        projectId,
        tasks: groupData.tasks.map((task, index) => ({
          ...task,
          estimatedHours: parseInt(task.estimatedHours),
          maxDailyHours: parseInt(task.maxDailyHours),
          taskType: 'GROUP',
          isGroupParent: index === 0,
          parentTaskId: index > 0 ? 'GROUP_PARENT' : null,
          groupOrder: index,
          actualHours: null,
          delayReason: null,
          delayDays: 0,
          workloadPercentage: 0,
          isBottleneck: false,
          originalEndDate: task.endDate ? new Date(task.endDate) : null,
          // Ensure dates are properly formatted
          startDate: task.startDate ? new Date(task.startDate) : null,
          endDate: task.endDate ? new Date(task.endDate) : null,
          assignedUserIds: task.assignedUserIds.length > 0 ? task.assignedUserIds : (task.assignedId ? [task.assignedId] : [])
        }))
      }
      
      onCreateTaskGroup(enhancedGroupData)
    }
    
    // Reset form
    setTaskData({
      title: '',
      description: '',
      assignedId: '',
      assignedUserIds: [],
      priority: 'MEDIUM',
      estimatedHours: '',
      maxDailyHours: '',
      startDate: '',
      endDate: ''
    })
    setGroupData({
      groupTitle: '',
      groupDescription: '',
      tasks: [{
        title: '',
        description: '',
        assignedId: '',
        assignedUserIds: [],
        priority: 'MEDIUM',
        estimatedHours: '',
        maxDailyHours: '',
        startDate: '',
        endDate: '',
        order: 1
      }]
    })
    
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Yeni Görev Oluştur</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/20 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Task Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Görev Türü Seçin
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCreationType('individual')}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  creationType === 'individual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <CheckSquare className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Tekil Görev</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Bağımsız olarak çalışılabilecek tek bir görev oluşturun
                </p>
              </button>
              
              <button
                onClick={() => setCreationType('group')}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  creationType === 'group'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Folder className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Görev Grubu</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Birbiriyle ilişkili birden fazla alt görev oluşturun
                </p>
              </button>
            </div>
          </div>

          {/* Individual Task Form */}
          {creationType === 'individual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Görev Başlığı *
                </label>
                <input
                  type="text"
                  value={taskData.title}
                  onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Görev başlığını yazın..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={taskData.description}
                  onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Görev detaylarını yazın..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Atanan Kişiler *
                  </label>
                  <div className="space-y-2">
                    {/* Multiple user selection */}
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
                      {users.map(user => (
                        <label key={user.id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={taskData.assignedUserIds.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTaskData(prev => ({
                                  ...prev,
                                  assignedUserIds: [...prev.assignedUserIds, user.id]
                                }))
                              } else {
                                setTaskData(prev => ({
                                  ...prev,
                                  assignedUserIds: prev.assignedUserIds.filter(id => id !== user.id)
                                }))
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{user.name}</span>
                          <span className="text-xs text-gray-500">({user.department})</span>
                        </label>
                      ))}
                    </div>
                    {/* Selected users display */}
                    {taskData.assignedUserIds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {taskData.assignedUserIds.map(userId => {
                          const user = users.find(u => u.id === userId)
                          return user ? (
                            <span key={userId} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {user.name}
                              <button
                                type="button"
                                onClick={() => setTaskData(prev => ({
                                  ...prev,
                                  assignedUserIds: prev.assignedUserIds.filter(id => id !== userId)
                                }))}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                    {taskData.assignedUserIds.length === 0 && (
                      <p className="text-xs text-red-500">En az bir kişi seçilmelidir</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Öncelik
                  </label>
                  <select
                    value={taskData.priority}
                    onChange={(e) => setTaskData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="LOW">Düşük</option>
                    <option value="MEDIUM">Orta</option>
                    <option value="HIGH">Yüksek</option>
                    <option value="URGENT">Acil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahmini Süre (saat) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={taskData.estimatedHours}
                    onChange={(e) => handleEstimatedHoursChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8"
                    required
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    ℹ️ Birden fazla kişi atandığında, her kişi bu sürenin tamamından sorumlu olur (bölerek dağıtılmaz)
                  </p>
                  {(!taskData.estimatedHours || parseInt(taskData.estimatedHours) <= 0) && (
                    <p className="text-xs text-red-500 mt-1">Bu alan zorunludur (min: 1 saat)</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Günlük Max. Süre (saat) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={taskData.maxDailyHours}
                    onChange={(e) => handleMaxDailyHoursChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8"
                    required
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    ℹ️ Bu işe günde ayırılabilecek maksimum saat
                  </p>
                  {(!taskData.maxDailyHours || parseInt(taskData.maxDailyHours) <= 0) && (
                    <p className="text-xs text-red-500 mt-1">Bu alan zorunludur (min: 1 saat)</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlangıç Tarihi *
                  </label>
                  <input
                    type="date"
                    value={taskData.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {!taskData.startDate && (
                    <p className="text-xs text-red-500 mt-1">Bu alan zorunludur</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bitiş Tarihi *
                  </label>
                  <input
                    type="date"
                    value={taskData.endDate}
                    onChange={(e) => setTaskData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={taskData.startDate}
                    required
                  />
                  {!taskData.endDate && (
                    <p className="text-xs text-red-500 mt-1">Bu alan zorunludur</p>
                  )}
                  {taskData.startDate && taskData.endDate && new Date(taskData.endDate) <= new Date(taskData.startDate) && (
                    <p className="text-xs text-red-500 mt-1">Bitiş tarihi başlangıçtan sonra olmalı</p>
                  )}
                </div>
              </div>

              {/* Show workload information for selected users */}
              <UserWorkloadDisplay 
                users={users} 
                selectedUserIds={taskData.assignedUserIds} 
              />
            </div>
          )}

          {/* Task Group Form */}
          {creationType === 'group' && (
            <div className="space-y-6">
              {/* Group Info */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grup Başlığı *
                    </label>
                    <input
                      type="text"
                      value={groupData.groupTitle}
                      onChange={(e) => setGroupData(prev => ({ ...prev, groupTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Örn: Kullanıcı Arayüzü Geliştirme"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grup Açıklaması
                    </label>
                    <textarea
                      value={groupData.groupDescription}
                      onChange={(e) => setGroupData(prev => ({ ...prev, groupDescription: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Bu görev grubunun amacını açıklayın..."
                    />
                  </div>
                </div>
              </div>

              {/* Group Tasks */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Alt Görevler</h3>
                  <button
                    onClick={addTaskToGroup}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Görev Ekle
                  </button>
                </div>

                <div className="space-y-4">
                  {groupData.tasks.map((task, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Alt Görev #{index + 1}</h4>
                        {groupData.tasks.length > 1 && (
                          <button
                            onClick={() => removeTaskFromGroup(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateGroupTask(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Alt görev başlığı..."
                          />
                        </div>

                        <div>
                          <textarea
                            value={task.description}
                            onChange={(e) => updateGroupTask(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                            placeholder="Alt görev açıklaması..."
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {/* Multiple user selection for group tasks */}
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Atanan Kişiler *
                            </label>
                            <div className="space-y-2">
                              <div className="max-h-24 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
                                {users.map(user => (
                                  <label key={user.id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={task.assignedUserIds.includes(user.id)}
                                      onChange={(e) => {
                                        const currentUsers = task.assignedUserIds || []
                                        if (e.target.checked) {
                                          updateGroupTaskUsers(index, [...currentUsers, user.id])
                                        } else {
                                          updateGroupTaskUsers(index, currentUsers.filter(id => id !== user.id))
                                        }
                                      }}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-gray-700">{user.name}</span>
                                  </label>
                                ))}
                              </div>
                              {task.assignedUserIds.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {task.assignedUserIds.map(userId => {
                                    const user = users.find(u => u.id === userId)
                                    return user ? (
                                      <span key={userId} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        {user.name}
                                        <button
                                          type="button"
                                          onClick={() => updateGroupTaskUsers(index, task.assignedUserIds.filter(id => id !== userId))}
                                          className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ) : null
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Öncelik
                            </label>
                            <select
                              value={task.priority}
                              onChange={(e) => updateGroupTask(index, 'priority', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="LOW">Düşük</option>
                              <option value="MEDIUM">Orta</option>
                              <option value="HIGH">Yüksek</option>
                              <option value="URGENT">Acil</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tahmini Süre (saat) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="200"
                              value={task.estimatedHours}
                              onChange={(e) => updateGroupTask(index, 'estimatedHours', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="8"
                              required
                            />
                            <p className="text-xs text-blue-600 mt-1">
                              ℹ️ Her atanan kişi bu sürenin tamamından sorumlu olur
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Günlük Max. Süre (saat) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="24"
                              value={task.maxDailyHours}
                              onChange={(e) => updateGroupTask(index, 'maxDailyHours', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="8"
                              required
                            />
                            <p className="text-xs text-blue-600 mt-1">
                              ℹ️ Bu işe günde ayırılabilecek maksimum saat
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Başlangıç Tarihi *
                            </label>
                            <input
                              type="date"
                              value={task.startDate}
                              onChange={(e) => updateGroupTask(index, 'startDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bitiş Tarihi *
                            </label>
                            <input
                              type="date"
                              value={task.endDate}
                              onChange={(e) => updateGroupTask(index, 'endDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>
                        
                        {/* Validation messages for group tasks */}
                        <div className="mt-2 space-y-1">
                          {!task.title.trim() && (
                            <p className="text-xs text-red-500">Başlık gereklidir</p>
                          )}
                          {task.assignedUserIds.length === 0 && (
                            <p className="text-xs text-red-500">En az bir kişi seçilmelidir</p>
                          )}
                          {(!task.estimatedHours || parseInt(task.estimatedHours) <= 0) && (
                            <p className="text-xs text-red-500">Geçerli bir tahmini süre girilmelidir</p>
                          )}
                          {(!task.maxDailyHours || parseInt(task.maxDailyHours) <= 0) && (
                            <p className="text-xs text-red-500">Geçerli bir günlük maksimum süre girilmelidir</p>
                          )}
                          {!task.startDate && (
                            <p className="text-xs text-red-500">Başlangıç tarihi gereklidir</p>
                          )}
                          {!task.endDate && (
                            <p className="text-xs text-red-500">Bitiş tarihi gereklidir</p>
                          )}
                          {task.startDate && task.endDate && new Date(task.startDate) >= new Date(task.endDate) && (
                            <p className="text-xs text-red-500">Bitiş tarihi başlangıç tarihinden sonra olmalıdır</p>
                          )}
                        </div>

                        {/* Show workload for this group task */}
                        {task.assignedUserIds.length > 0 && (
                          <UserWorkloadDisplay 
                            users={users} 
                            selectedUserIds={task.assignedUserIds} 
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {creationType === 'individual' ? 'Görev Oluştur' : 'Görev Grubu Oluştur'}
            </button>
          </div>

          {/* Validation Requirements Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">✋ Zorunlu Alanlar:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Görev başlığı</li>
              <li>• Atanan kişi</li>
              <li>• Tahmini süre (minimum 1 saat)</li>
              {creationType === 'individual' && (
                <>
                  <li>• Başlangıç ve bitiş tarihleri</li>
                  <li>• Bitiş tarihi başlangıçtan sonra olmalı</li>
                </>
              )}
            </ul>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              Bu alanlar iş yükü hesaplaması için kritik öneme sahiptir.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
