'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Building, 
  Badge, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Activity,
  Users,
  Briefcase,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Timer,
  BarChart3,
  Zap
} from 'lucide-react'

interface UserDetailModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

interface UserDetails {
  id: string
  name: string
  email: string
  department: string
  position: string
  photo?: string
  maxHoursPerDay: number
  workingDays: string
  createdAt: string
  tasks: any[]
  projects: any[]
  teamMembers: any[]
  stats: {
    totalTasks: number
    activeTasks: number
    completedTasks: number
    reviewTasks: number
    blockedTasks: number
    totalProjects: number
    activeProjects: number
    completedProjects: number
    totalEstimatedHours: number
    totalActualHours: number
    totalTeams: number
    efficiency: number
    averageTaskHours: number
  }
  tasksByStatus: {
    todo: any[]
    inProgress: any[]
    completed: any[]
    review: any[]
    blocked: any[]
  }
  tasksByPriority: {
    high: any[]
    medium: any[]
    low: any[]
  }
  recentActivity: {
    recentTasks: any[]
    tasksStartedThisMonth: number
  }
}

export default function UserDetailModal({ userId, isOpen, onClose }: UserDetailModalProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'projects' | 'teams'>('overview')

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails()
    }
  }, [isOpen, userId])

  const fetchUserDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/details`)
      if (response.ok) {
        const data = await response.json()
        setUserDetails(data)
      } else {
        console.error('Failed to fetch user details')
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO':
        return <AlertCircle className="w-4 h-4" />
      case 'IN_PROGRESS':
        return <PlayCircle className="w-4 h-4" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      case 'PENDING':
        return <Timer className="w-4 h-4" />
      case 'ON_HOLD':
        return <PauseCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'BLOCKED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
                {userDetails ? userDetails.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {userDetails ? userDetails.name : 'Yükleniyor...'}
                </h2>
                <p className="text-blue-100">
                  {userDetails?.position} • {userDetails?.department}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Kullanıcı bilgileri yükleniyor...</p>
          </div>
        ) : userDetails ? (
          <div className="flex h-[calc(95vh-120px)]">
            {/* Sidebar Navigation */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Genel Bakış</span>
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === 'tasks'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Target className="w-5 h-5" />
                  <span>Görevler ({userDetails.stats.totalTasks})</span>
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === 'projects'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                  <span>Projeler ({userDetails.stats.totalProjects})</span>
                </button>
                <button
                  onClick={() => setActiveTab('teams')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === 'teams'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Takımlar ({userDetails.stats.totalTeams})</span>
                </button>
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Hızlı İstatistikler
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Verimlilik</span>
                    <span className="text-sm font-semibold text-blue-600">
                      %{userDetails.stats.efficiency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ortalama Saat</span>
                    <span className="text-sm font-semibold text-green-600">
                      {userDetails.stats.averageTaskHours}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bu Ay</span>
                    <span className="text-sm font-semibold text-purple-600">
                      {userDetails.recentActivity.tasksStartedThisMonth} görev
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="p-6 space-y-6">
                  {/* User Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white">
                      <div className="flex items-center space-x-3">
                        <Target className="w-8 h-8" />
                        <div>
                          <p className="text-blue-100 text-sm">Toplam Görev</p>
                          <p className="text-2xl font-bold">{userDetails.stats.totalTasks}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-8 h-8" />
                        <div>
                          <p className="text-green-100 text-sm">Tamamlanan</p>
                          <p className="text-2xl font-bold">{userDetails.stats.completedTasks}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white">
                      <div className="flex items-center space-x-3">
                        <Briefcase className="w-8 h-8" />
                        <div>
                          <p className="text-purple-100 text-sm">Aktif Proje</p>
                          <p className="text-2xl font-bold">{userDetails.stats.activeProjects}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl text-white">
                      <div className="flex items-center space-x-3">
                        <Zap className="w-8 h-8" />
                        <div>
                          <p className="text-orange-100 text-sm">Verimlilik</p>
                          <p className="text-2xl font-bold">%{userDetails.stats.efficiency}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Kişisel Bilgiler
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">E-posta</p>
                            <p className="font-medium">{userDetails.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Building className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Departman</p>
                            <p className="font-medium">{userDetails.department}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Pozisyon</p>
                            <p className="font-medium">{userDetails.position}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Günlük Maksimum Saat</p>
                            <p className="font-medium">{userDetails.maxHoursPerDay} saat</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Başlangıç Tarihi</p>
                            <p className="font-medium">{formatDate(userDetails.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Toplam Çalışma Saati</p>
                            <p className="font-medium">{userDetails.stats.totalActualHours} saat</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task Status Distribution */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Görev Dağılımı
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{userDetails.tasksByStatus.todo.length}</div>
                        <div className="text-sm text-gray-500">Yapılacak</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{userDetails.tasksByStatus.inProgress.length}</div>
                        <div className="text-sm text-blue-500">Devam Ediyor</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{userDetails.tasksByStatus.completed.length}</div>
                        <div className="text-sm text-green-500">Tamamlandı</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{userDetails.tasksByStatus.review.length}</div>
                        <div className="text-sm text-yellow-500">İncelemede</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{userDetails.tasksByStatus.blocked.length}</div>
                        <div className="text-sm text-red-500">Engellendi</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Son Aktiviteler
                    </h3>
                    {userDetails.recentActivity.recentTasks.length > 0 ? (
                      <div className="space-y-3">
                        {userDetails.recentActivity.recentTasks.map((task) => (
                          <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`p-2 rounded-lg ${getStatusColor(task.status)}`}>
                              {getStatusIcon(task.status)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{task.title}</p>
                              <p className="text-sm text-gray-500">
                                {task.project?.name} • {formatDate(task.startDate || task.createdAt)}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Son aktivite bulunmuyor</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tasks Tab */}
              {activeTab === 'tasks' && (
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Görevler</h3>
                  <div className="space-y-6">
                    {Object.entries(userDetails.tasksByStatus).map(([status, tasks]) => (
                      tasks.length > 0 && (
                        <div key={status} className="bg-white rounded-xl border border-gray-200 p-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                            {status === 'todo' ? 'Yapılacak' : 
                             status === 'inProgress' ? 'Devam Ediyor' :
                             status === 'completed' ? 'Tamamlandı' :
                             status === 'review' ? 'İncelemede' : 'Engellendi'} ({tasks.length})
                          </h4>
                          <div className="space-y-3">
                            {tasks.map((task) => (
                              <div key={task.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                <div className={`p-2 rounded-lg ${getStatusColor(task.status)}`}>
                                  {getStatusIcon(task.status)}
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{task.title}</h5>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-sm text-gray-500">
                                      {task.project?.name}
                                    </span>
                                    {task.estimatedHours && (
                                      <span className="text-sm text-gray-500">
                                        {task.estimatedHours}s tahmini
                                      </span>
                                    )}
                                    {task.startDate && (
                                      <span className="text-sm text-gray-500">
                                        {formatDate(task.startDate)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Projeler</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {userDetails.projects.map((projectMembership) => (
                      <div key={projectMembership.project.id} className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{projectMembership.project.name}</h4>
                            <p className="text-sm text-gray-500">Rol: {projectMembership.role}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            projectMembership.project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            projectMembership.project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {projectMembership.project.status}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Görevler:</span>
                            <span className="font-medium">{projectMembership.project.tasks.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Takım Üyeleri:</span>
                            <span className="font-medium">{projectMembership.project.members.length}</span>
                          </div>
                          {projectMembership.project.startDate && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Başlangıç:</span>
                              <span className="font-medium">{formatDate(projectMembership.project.startDate)}</span>
                            </div>
                          )}
                          {projectMembership.project.endDate && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Bitiş:</span>
                              <span className="font-medium">{formatDate(projectMembership.project.endDate)}</span>
                            </div>
                          )}
                        </div>

                        {projectMembership.project.tasks.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Bu Projedeki Görevlerim:</h5>
                            <div className="space-y-2">
                              {projectMembership.project.tasks.slice(0, 3).map((task: any) => (
                                <div key={task.id} className="flex items-center space-x-2 text-sm">
                                  <div className={`w-2 h-2 rounded-full ${
                                    task.status === 'COMPLETED' ? 'bg-green-500' :
                                    task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                    'bg-gray-400'
                                  }`}></div>
                                  <span className="text-gray-700">{task.title}</span>
                                </div>
                              ))}
                              {projectMembership.project.tasks.length > 3 && (
                                <p className="text-xs text-gray-500">+{projectMembership.project.tasks.length - 3} görev daha</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teams Tab */}
              {activeTab === 'teams' && (
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Takımlar</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {userDetails.teamMembers.map((teamMembership) => (
                      <div key={teamMembership.team.id} className="bg-white rounded-xl border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">{teamMembership.team.name}</h4>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Takım Üye Sayısı:</span>
                            <span className="font-medium">{teamMembership.team.members.length}</span>
                          </div>

                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-3">Takım Üyeleri:</h5>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {teamMembership.team.members.map((member: any) => (
                                <div key={member.user.id} className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                    {member.user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                                    <p className="text-xs text-gray-500">{member.user.position} • {member.user.department}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Kullanıcı bilgileri yüklenemedi.</p>
          </div>
        )}
      </div>
    </div>
  )
}
