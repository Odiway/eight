'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Users, Calendar, CheckSquare, Folder, List, Search, X, User, Building, Trash2 } from 'lucide-react'
import UserWorkloadDisplay from './UserWorkloadDisplay'

interface TaskCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTask: (taskData: any) => void
  onCreateTaskGroup: (groupData: any) => void
  projectId: string
  users: any[]
}

interface UserSearchSelectProps {
  users: any[]
  selectedUserIds: string[]
  onUserSelectionChange: (userIds: string[]) => void
  label?: string
  required?: boolean
}

// Enhanced User Search & Select Component
function UserSearchSelect({ 
  users, 
  selectedUserIds, 
  onUserSelectionChange, 
  label = "Atanan Kişiler",
  required = true 
}: UserSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users

    const search = searchTerm.toLowerCase()
    return users.filter(user => 
      user.name.toLowerCase().includes(search) ||
      user.department.toLowerCase().includes(search) ||
      user.position?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    )
  }, [users, searchTerm])

  // Get selected users
  const selectedUsers = useMemo(() => 
    users.filter(user => selectedUserIds.includes(user.id)),
    [users, selectedUserIds]
  )

  const handleUserToggle = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onUserSelectionChange(selectedUserIds.filter(id => id !== userId))
    } else {
      onUserSelectionChange([...selectedUserIds, userId])
    }
  }

  const removeUser = (userId: string) => {
    onUserSelectionChange(selectedUserIds.filter(id => id !== userId))
  }

  const clearAll = () => {
    onUserSelectionChange([])
    setSearchTerm('')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          {selectedUsers.map(user => (
            <span 
              key={user.id} 
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
            >
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{user.name}</span>
              <span className="text-blue-200 text-xs">({user.department})</span>
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="ml-1 text-blue-200 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-blue-600 hover:text-blue-800 underline ml-2"
          >
            Tümünü Temizle
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Kişi ara (isim, departman, pozisyon)..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsDropdownOpen(true)
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('')
              setIsDropdownOpen(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isDropdownOpen && (
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 z-50 max-h-64 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Arama kriterlerine uygun kişi bulunamadı</p>
              </div>
            ) : (
              <div className="p-2">
                <div className="text-xs text-gray-500 px-2 py-1 border-b border-gray-100">
                  {filteredUsers.length} kişi bulundu
                </div>
                {filteredUsers.map(user => {
                  const isSelected = selectedUserIds.includes(user.id)
                  return (
                    <label 
                      key={user.id} 
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleUserToggle(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        isSelected ? 'bg-blue-600' : 'bg-gray-400'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Building className="w-3 h-3" />
                          <span>{user.department}</span>
                          {user.position && (
                            <>
                              <span>•</span>
                              <span>{user.position}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-blue-600 font-medium text-sm">
                          Seçili
                        </div>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
            <div className="p-2 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Validation Message */}
      {required && selectedUserIds.length === 0 && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠️</span>
          En az bir kişi seçilmelidir
        </p>
      )}

      {/* Selection Summary */}
      <div className="text-xs text-gray-500">
        {selectedUserIds.length > 0 && (
          <span>{selectedUserIds.length} kişi seçili</span>
        )}
        {selectedUserIds.length === 0 && required && (
          <span>Lütfen en az bir kişi seçin</span>
        )}
      </div>
    </div>
  )
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
    if (taskData.assignedUserIds.length === 0) errors.push('En az bir kişi atanmalıdır')
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
      if (task.assignedUserIds.length === 0) errors.push(`Alt görev #${index + 1}: En az bir kişi atanmalıdır`)
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
      alert('Lütfen aşağıdaki hataları düzeltin:\\n\\n' + errors.join('\\n'))
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
        // Use the new assignment system
        assignedUserIds: taskData.assignedUserIds
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
          assignedUserIds: task.assignedUserIds
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
      tasks: [
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
          order: 1
        }
      ]
    })
    
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Yeni Görev Oluştur
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Creation Type Toggle */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setCreationType('individual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  creationType === 'individual'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                Tekil Görev
              </button>
              <button
                onClick={() => setCreationType('group')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  creationType === 'group'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="w-4 h-4" />
                Görev Grubu
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {creationType === 'individual' ? (
              // Individual Task Form
              <div className="space-y-6">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Enhanced User Selection */}
                  <div>
                    <UserSearchSelect
                      users={users}
                      selectedUserIds={taskData.assignedUserIds}
                      onUserSelectionChange={(userIds) => 
                        setTaskData(prev => ({ ...prev, assignedUserIds: userIds }))
                      }
                      label="Atanan Kişiler"
                      required={true}
                    />
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tahmini Süre (saat) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={taskData.estimatedHours}
                      onChange={(e) => handleEstimatedHoursChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Günlük Maks. Süre (saat) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={taskData.maxDailyHours}
                      onChange={(e) => handleMaxDailyHoursChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="8"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Çalışma Günü Sayısı
                    </label>
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                      {taskData.estimatedHours && taskData.maxDailyHours 
                        ? Math.ceil(parseInt(taskData.estimatedHours) / parseInt(taskData.maxDailyHours))
                        : '-'} gün
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Başlangıç Tarihi *
                    </label>
                    <input
                      type="date"
                      value={taskData.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
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
                    />
                    {taskData.startDate && taskData.estimatedHours && taskData.maxDailyHours && (
                      <p className="text-xs text-blue-600 mt-1">
                        Önerilen: {calculateDeadline(taskData.startDate, taskData.estimatedHours, taskData.maxDailyHours)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Show workload information for selected users */}
                {taskData.assignedUserIds.length > 0 && (
                  <UserWorkloadDisplay 
                    selectedUserIds={taskData.assignedUserIds} 
                    users={users}
                  />
                )}
              </div>
            ) : (
              // Group Task Form
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grup Başlığı *
                  </label>
                  <input
                    type="text"
                    value={groupData.groupTitle}
                    onChange={(e) => setGroupData(prev => ({ ...prev, groupTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Grup başlığını yazın..."
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
                    placeholder="Grup açıklamasını yazın..."
                  />
                </div>

                {/* Group Tasks */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Alt Görevler</h3>
                    <button
                      type="button"
                      onClick={addTaskToGroup}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Alt Görev Ekle
                    </button>
                  </div>

                  {groupData.tasks.map((task, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-800">Alt Görev #{index + 1}</h4>
                        {groupData.tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTaskFromGroup(index)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Görev Başlığı *
                          </label>
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateGroupTask(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Alt görev başlığı..."
                          />
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

                      <div className="mt-4">
                        <textarea
                          value={task.description}
                          onChange={(e) => updateGroupTask(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={2}
                          placeholder="Alt görev açıklaması..."
                        />
                      </div>

                      {/* Enhanced User Selection for Group Tasks */}
                      <div className="mt-4">
                        <UserSearchSelect
                          users={users}
                          selectedUserIds={task.assignedUserIds}
                          onUserSelectionChange={(userIds) => updateGroupTaskUsers(index, userIds)}
                          label={`Alt Görev #${index + 1} - Atanan Kişiler`}
                          required={true}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tahmini Süre *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={task.estimatedHours}
                            onChange={(e) => updateGroupTask(index, 'estimatedHours', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="24"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Günlük Maks. *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={task.maxDailyHours}
                            onChange={(e) => updateGroupTask(index, 'maxDailyHours', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="8"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Başlangıç *
                          </label>
                          <input
                            type="date"
                            value={task.startDate}
                            onChange={(e) => updateGroupTask(index, 'startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bitiş *
                          </label>
                          <input
                            type="date"
                            value={task.endDate}
                            onChange={(e) => updateGroupTask(index, 'endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Show workload information for selected users in group tasks */}
                      {task.assignedUserIds.length > 0 && (
                        <div className="mt-4">
                          <UserWorkloadDisplay 
                            selectedUserIds={task.assignedUserIds} 
                            users={users}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              {creationType === 'individual' ? 'Görev Oluştur' : 'Grup Oluştur'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
