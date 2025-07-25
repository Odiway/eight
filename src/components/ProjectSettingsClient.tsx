'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ProjectSettingsClientProps {
  project: {
    id: string
    name: string
    description: string | null
    status: string
    priority: string
    startDate: Date | null
    endDate: Date | null
    createdAt: Date
    updatedAt: Date
    originalEndDate: Date | null
    delayDays: number
    autoReschedule: boolean
    tasks: Array<{
      id: string
      title: string
      status: string
      assignedUser?: {
        id: string
        name: string
      } | null
      assignedUsers: Array<{
        user: {
          id: string
          name: string
        }
      }>
    }>
    members: Array<{
      id: string
      role: string
      user: {
        id: string
        name: string
        email: string
        department: string
      }
    }>
    workflowSteps: Array<{
      id: string
      name: string
      order: number
      color: string
    }>
  }
}

export default function ProjectSettingsClient({
  project,
}: ProjectSettingsClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    status: project.status,
    priority: project.priority,
    startDate: project.startDate ? project.startDate.toISOString().split('T')[0] : '',
    endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : '',
    autoReschedule: project.autoReschedule,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          autoReschedule: formData.autoReschedule,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update project')
      }

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Proje güncellenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      router.push('/projects')
      router.refresh()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Proje silinirken bir hata oluştu')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'ON_HOLD':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'Planlama'
      case 'IN_PROGRESS':
        return 'Devam Ediyor'
      case 'REVIEW':
        return 'İnceleme'
      case 'COMPLETED':
        return 'Tamamlandı'
      case 'ON_HOLD':
        return 'Beklemede'
      default:
        return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'Düşük'
      case 'MEDIUM':
        return 'Orta'
      case 'HIGH':
        return 'Yüksek'
      case 'URGENT':
        return 'Acil'
      default:
        return priority
    }
  }

  const activeTasks = project.tasks.filter(task => task.status !== 'COMPLETED')
  const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="w-8 h-8 mr-3 text-indigo-600" />
                Proje Ayarları
              </h1>
              <p className="text-gray-600 mt-1">
                {project.name} projesini düzenleyin veya silin
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Düzenle
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sil
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: project.name,
                      description: project.description || '',
                      status: project.status,
                      priority: project.priority,
                      startDate: project.startDate ? project.startDate.toISOString().split('T')[0] : '',
                      endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : '',
                      autoReschedule: project.autoReschedule,
                    })
                  }}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  İptal
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Project Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
                <h3 className="text-lg font-semibold text-white">
                  Temel Bilgiler
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proje Adı
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Proje adını giriniz"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{project.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  {isEditing ? (
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Proje açıklamasını giriniz"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {project.description || 'Açıklama yok'}
                    </p>
                  )}
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durum
                    </label>
                    {isEditing ? (
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="PLANNING">Planlama</option>
                        <option value="IN_PROGRESS">Devam Ediyor</option>
                        <option value="REVIEW">İnceleme</option>
                        <option value="COMPLETED">Tamamlandı</option>
                        <option value="ON_HOLD">Beklemede</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Öncelik
                    </label>
                    {isEditing ? (
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="LOW">Düşük</option>
                        <option value="MEDIUM">Orta</option>
                        <option value="HIGH">Yüksek</option>
                        <option value="URGENT">Acil</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                        {getPriorityText(project.priority)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Başlangıç Tarihi
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <p className="text-gray-700">
                        {project.startDate ? formatDate(project.startDate) : 'Belirlenmedi'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bitiş Tarihi
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <p className="text-gray-700">
                        {project.endDate ? formatDate(project.endDate) : 'Belirlenmedi'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Auto Reschedule */}
                <div>
                  <label className="flex items-center">
                    {isEditing ? (
                      <input
                        type="checkbox"
                        name="autoReschedule"
                        checked={formData.autoReschedule}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    ) : (
                      <CheckCircle className={`w-5 h-5 ${project.autoReschedule ? 'text-green-500' : 'text-gray-400'}`} />
                    )}
                    <span className="ml-2 text-sm text-gray-700">
                      Otomatik yeniden planlama
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Project Statistics */}
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                <h3 className="text-lg font-semibold text-white">
                  Proje İstatistikleri
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {activeTasks.length}
                    </div>
                    <div className="text-sm text-gray-600">Aktif Görev</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {completedTasks.length}
                    </div>
                    <div className="text-sm text-gray-600">Tamamlanan Görev</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {project.members.length}
                    </div>
                    <div className="text-sm text-gray-600">Takım Üyesi</div>
                  </div>
                </div>

                {project.delayDays > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-sm text-red-800">
                        Proje {project.delayDays} gün gecikmiş durumda
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Members */}
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Takım Üyeleri
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {project.members.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-indigo-700">
                          {member.user.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {member.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.user.department} • {member.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Timeline */}
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-red-600">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Zaman Çizelgesi
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Oluşturulma:</span>
                  <span className="text-sm font-medium">{formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Son Güncelleme:</span>
                  <span className="text-sm font-medium">{formatDate(project.updatedAt)}</span>
                </div>
                {project.originalEndDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Orijinal Deadline:</span>
                    <span className="text-sm font-medium">{formatDate(project.originalEndDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow Steps */}
            {project.workflowSteps.length > 0 && (
              <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    İş Akışı Adımları
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {project.workflowSteps.map((step) => (
                      <div key={step.id} className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: step.color }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {step.order}. {step.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Projeyi Sil
                </h3>
              </div>
              
              <p className="text-gray-700 mb-6">
                <strong>{project.name}</strong> projesini silmek istediğinizden emin misiniz? 
                Bu işlem geri alınamaz ve proje ile ilgili tüm görevler de silinecektir.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Bu proje silindiğinde:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{project.tasks.length} görev silinecek</li>
                      <li>{project.members.length} üye ataması kaldırılacak</li>
                      <li>{project.workflowSteps.length} iş akışı adımı silinecek</li>
                      <li>Tüm proje geçmişi kaybolacak</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
