'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { 
  ArrowLeft, 
  Users, 
  Mail, 
  Briefcase, 
  Calendar,
  User,
  Edit,
  UserPlus,
  Trash2
} from 'lucide-react'

interface TeamMember {
  id: string
  user: {
    id: string
    name: string
    email: string
    department: string
    position: string
    photo?: string | null
  }
}

interface Team {
  id: string
  name: string
  description?: string | null
  members: TeamMember[]
  createdAt: string
  updatedAt: string
}

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeam()
  }, [teamId])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teams/${teamId}`)
      
      if (!response.ok) {
        throw new Error('Takım bulunamadı')
      }

      const teamData = await response.json()
      setTeam(teamData)
    } catch (err) {
      console.error('Error fetching team:', err)
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
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
              <p className='text-gray-600'>Takım bilgileri yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
        <Navbar />
        <div className='max-w-7xl mx-auto px-4 py-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Users className='w-8 h-8 text-red-600' />
              </div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>Takım Bulunamadı</h2>
              <p className='text-gray-600 mb-4'>{error || 'Bu takıma ait bilgiler bulunamadı.'}</p>
              <button
                onClick={() => router.push('/team')}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto'
              >
                <ArrowLeft className='w-4 h-4' />
                Takımlara Geri Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Navbar />
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => router.push('/team')}
                className='flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
                title='Takımlara Geri Dön'
              >
                <ArrowLeft className='w-5 h-5' />
                <span className='hidden sm:inline'>Geri</span>
              </button>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>{team.name}</h1>
                {team.description && (
                  <p className='text-gray-600 mt-2'>{team.description}</p>
                )}
                <div className='flex items-center gap-4 mt-4'>
                  <div className='flex items-center gap-2'>
                    <Users className='w-5 h-5 text-gray-400' />
                    <span className='text-sm text-gray-600'>
                      {team.members.length} üye
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-5 h-5 text-gray-400' />
                    <span className='text-sm text-gray-600'>
                      Oluşturulma: {new Date(team.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={() => router.push(`/team/edit/${team.id}`)}
                className='flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
              >
                <Edit className='w-4 h-4' />
                Düzenle
              </button>
              <button
                onClick={() => router.push(`/team/add-member/${team.id}`)}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <UserPlus className='w-4 h-4' />
                Üye Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
              <Users className='w-5 h-5' />
              Takım Üyeleri
            </h2>
            <span className='text-sm text-gray-500'>
              Toplam {team.members.length} üye
            </span>
          </div>

          {team.members.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      {member.user.photo ? (
                        <img
                          src={member.user.photo}
                          alt={member.user.name}
                          className='w-12 h-12 rounded-full object-cover'
                        />
                      ) : (
                        <div className='w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center'>
                          <User className='w-6 h-6 text-white' />
                        </div>
                      )}
                      <div>
                        <h3 className='font-semibold text-gray-900'>{member.user.name}</h3>
                        <p className='text-sm text-gray-600'>{member.user.position}</p>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-2 text-sm'>
                    <div className='flex items-center gap-2 text-gray-600'>
                      <Mail className='w-4 h-4' />
                      <span>{member.user.email}</span>
                    </div>
                    <div className='flex items-center gap-2 text-gray-600'>
                      <Briefcase className='w-4 h-4' />
                      <span>{member.user.department}</span>
                    </div>
                  </div>

                  <div className='mt-4 pt-4 border-t border-blue-200'>
                    <div className='flex items-center justify-between'>
                      <button
                        onClick={() => router.push(`/team/member/${member.user.id}`)}
                        className='text-sm text-blue-600 hover:text-blue-700 font-medium'
                      >
                        Profili Görüntüle
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`${member.user.name} kullanıcısını takımdan çıkarmak istediğinizden emin misiniz?`)) {
                            // Remove member logic here
                          }
                        }}
                        className='text-sm text-red-600 hover:text-red-700'
                        title='Takımdan Çıkar'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Users className='w-8 h-8 text-gray-400' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Henüz Üye Yok</h3>
              <p className='text-gray-600 mb-4'>Bu takımda henüz hiç üye bulunmuyor.</p>
              <button
                onClick={() => router.push(`/team/add-member/${team.id}`)}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto'
              >
                <UserPlus className='w-4 h-4' />
                İlk Üyeyi Ekle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
