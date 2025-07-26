'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Briefcase, 
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  TrendingUp,
  Users,
  FolderKanban
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  department: string
  position: string
  photo?: string | null
  createdAt: string
  updatedAt: string
  assignedTasks: {
    id: string
    title: string
    status: string
    priority: string
    project: {
      id: string
      name: string
    }
  }[]
  teamMembers: {
    id: string
    team: {
      id: string
      name: string
    }
  }[]
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}`)
      
      if (!response.ok) {
        throw new Error('Kullanıcı bulunamadı')
      }

      const userData = await response.json()
      setUser(userData)
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'REVIEW':
        return 'bg-purple-100 text-purple-800'
      case 'BLOCKED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className='w-4 h-4 text-green-600' />
      case 'IN_PROGRESS':
        return <Clock className='w-4 h-4 text-blue-600' />
      case 'REVIEW':
        return <AlertCircle className='w-4 h-4 text-purple-600' />
      case 'BLOCKED':
        return <AlertCircle className='w-4 h-4 text-red-600' />
      default:
        return <Circle className='w-4 h-4 text-gray-600' />
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
        <Navbar />
        <div className='max-w-7xl mx-auto px-4 py-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-600'>Profil bilgileri yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
        <Navbar />
        <div className='max-w-7xl mx-auto px-4 py-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <User className='w-8 h-8 text-red-600' />
              </div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>Profil Bulunamadı</h2>
              <p className='text-gray-600 mb-4'>{error || 'Bu kullanıcıya ait bilgiler bulunamadı.'}</p>
              <button
                onClick={() => router.push('/team')}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto'
              >
                <ArrowLeft className='w-4 h-4' />
                Takıma Geri Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const activeTasks = user.assignedTasks.filter(task => task.status !== 'COMPLETED')
  const completedTasks = user.assignedTasks.filter(task => task.status === 'COMPLETED')

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Navbar />
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => router.back()}
                className='flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
                title='Geri Dön'
              >
                <ArrowLeft className='w-5 h-5' />
                <span className='hidden sm:inline'>Geri</span>
              </button>
              <div className='flex items-center gap-4'>
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt={user.name}
                    className='w-16 h-16 rounded-full object-cover'
                  />
                ) : (
                  <div className='w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center'>
                    <User className='w-8 h-8 text-white' />
                  </div>
                )}
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>{user.name}</h1>
                  <p className='text-lg text-gray-600'>{user.position}</p>
                  <div className='flex items-center gap-4 mt-2'>
                    <div className='flex items-center gap-2'>
                      <Briefcase className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-600'>{user.department}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-600'>
                        Üye: {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Profile Info */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <User className='w-5 h-5' />
                Kişisel Bilgiler
              </h2>
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <Mail className='w-5 h-5 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-600'>E-posta</p>
                    <p className='font-medium'>{user.email}</p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <Briefcase className='w-5 h-5 text-gray-400' />
                  <div>
                    <p className='text-sm text-gray-600'>Departman</p>
                    <p className='font-medium'>{user.department}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Teams */}
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <Users className='w-5 h-5' />
                Takımlar
              </h2>
              {user.teamMembers.length > 0 ? (
                <div className='space-y-2'>
                  {user.teamMembers.map((membership) => (
                    <div
                      key={membership.id}
                      className='flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200'
                    >
                      <span className='font-medium text-blue-900'>{membership.team.name}</span>
                      <button
                        onClick={() => router.push(`/team/${membership.team.id}`)}
                        className='text-sm text-blue-600 hover:text-blue-700'
                      >
                        Görüntüle
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-4'>Henüz hiç takıma üye değil</p>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className='lg:col-span-2'>
            {/* Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-blue-600'>Aktif Görevler</p>
                    <p className='text-2xl font-bold text-blue-900'>{activeTasks.length}</p>
                  </div>
                  <FolderKanban className='w-8 h-8 text-blue-600' />
                </div>
              </div>
              <div className='bg-green-50 rounded-lg p-4 border border-green-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-green-600'>Tamamlanan</p>
                    <p className='text-2xl font-bold text-green-900'>{completedTasks.length}</p>
                  </div>
                  <CheckCircle className='w-8 h-8 text-green-600' />
                </div>
              </div>
              <div className='bg-purple-50 rounded-lg p-4 border border-purple-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-purple-600'>Toplam Görev</p>
                    <p className='text-2xl font-bold text-purple-900'>{user.assignedTasks.length}</p>
                  </div>
                  <TrendingUp className='w-8 h-8 text-purple-600' />
                </div>
              </div>
            </div>

            {/* Tasks List */}
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FolderKanban className='w-5 h-5' />
                Görevler
              </h2>
              
              {user.assignedTasks.length > 0 ? (
                <div className='space-y-3'>
                  {user.assignedTasks.map((task) => (
                    <div
                      key={task.id}
                      className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex items-start gap-3'>
                          {getStatusIcon(task.status)}
                          <div>
                            <h3 className='font-semibold text-gray-900'>{task.title}</h3>
                            <p className='text-sm text-gray-600'>{task.project.name}</p>
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status === 'TODO' ? 'Bekliyor' :
                             task.status === 'IN_PROGRESS' ? 'Devam Ediyor' :
                             task.status === 'REVIEW' ? 'İncelemede' :
                             task.status === 'COMPLETED' ? 'Tamamlandı' :
                             task.status === 'BLOCKED' ? 'Engellenmiş' : task.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'URGENT' ? 'Acil' :
                             task.priority === 'HIGH' ? 'Yüksek' :
                             task.priority === 'MEDIUM' ? 'Orta' :
                             task.priority === 'LOW' ? 'Düşük' : task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <FolderKanban className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>Henüz Görev Yok</h3>
                  <p className='text-gray-600'>Bu kullanıcıya henüz hiç görev atanmamış.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
