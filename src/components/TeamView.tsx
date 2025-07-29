'use client'

import { useState } from 'react'
import TeamFilter from '@/components/TeamFilter'
import UserDetailModal from '@/components/UserDetailModal'
import { Users, Badge, Clock, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  department: string
  position: string
  photo?: string | null
  activeTasks: number
  completedTasks: number
  activeProjects: number
  totalTasks: number
  teamMembers?: Array<{
    team: {
      id: string
      name: string
    }
  }>
}

interface Team {
  id: string
  name: string
  description?: string | null
  members: Array<{
    user: {
      id: string
      name: string
      email: string
      department: string
      position: string
    }
    role: string
  }>
}

interface TeamViewProps {
  initialUsers: User[]
  initialTeams: Team[]
}

export default function TeamView({
  initialUsers,
  initialTeams,
}: TeamViewProps) {
  const [filteredData, setFilteredData] = useState({
    users: initialUsers,
    teams: initialTeams,
  })
  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleFilterChange = (newFilteredData: {
    users: any[]
    teams: any[]
  }) => {
    setFilteredData(newFilteredData)
  }

  const handleViewUserDetails = (userId: string) => {
    setSelectedUserId(userId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedUserId(null)
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete the team "${teamName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete team')
      }

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error deleting team:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete team')
    }
  }

  // Group users by department
  const departments = filteredData.users.reduce((acc, user) => {
    if (!acc[user.department]) {
      acc[user.department] = []
    }
    acc[user.department].push(user)
    return acc
  }, {} as Record<string, any[]>)

  const getRoleColor = (position: string) => {
    if (!position) return 'bg-gray-100 text-gray-800'

    switch (position.toLowerCase()) {
      case 'manager':
      case 'müdür':
      case 'yönetici':
        return 'bg-purple-100 text-purple-800'
      case 'engineer':
      case 'mühendis':
      case 'elektrik mühendisi':
        return 'bg-blue-100 text-blue-800'
      case 'technician':
      case 'teknisyen':
      case 'batarya teknisyeni':
        return 'bg-green-100 text-green-800'
      case 'specialist':
      case 'uzman':
      case 'kalite uzmanı':
        return 'bg-yellow-100 text-yellow-800'
      case 'operator':
      case 'operatör':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className='space-y-6'>
      <TeamFilter
        users={initialUsers}
        teams={initialTeams}
        onFilterChange={handleFilterChange}
      />

      {/* Tab Navigation */}
      <div className='bg-white rounded-xl shadow-lg p-6'>
        <div className='flex space-x-1 mb-6'>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            Kullanıcılar ({filteredData.users.length})
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'teams'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            Takımlar ({filteredData.teams.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className='space-y-6'>
            {Object.entries(departments).map(([department, users]) => (
              <div key={department} className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
                  {department} ({users.length} kişi)
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className='bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold'>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className='font-semibold text-gray-900'>{user.name}</h4>
                            <p className='text-sm text-gray-600'>{user.email}</p>
                          </div>
                        </div>
                        
                        <div className='flex space-x-1'>
                          <button
                            onClick={() => handleViewUserDetails(user.id)}
                            className='p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors'
                            title='Detayları Görüntüle'
                          >
                            <Eye className='w-4 h-4' />
                          </button>
                          <Link
                            href={`/team/edit/${user.id}`}
                            className='p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                            title='Düzenle'
                          >
                            <Edit className='w-4 h-4' />
                          </Link>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className='p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                            title='Sil'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full'>
                            {user.position}
                          </span>
                        </div>

                        <div className='grid grid-cols-3 gap-2 text-center'>
                          <div className='bg-white p-2 rounded-lg'>
                            <div className='text-lg font-bold text-blue-600'>{user.activeTasks}</div>
                            <div className='text-xs text-gray-500'>Aktif</div>
                          </div>
                          <div className='bg-white p-2 rounded-lg'>
                            <div className='text-lg font-bold text-green-600'>{user.completedTasks}</div>
                            <div className='text-xs text-gray-500'>Tamamlanan</div>
                          </div>
                          <div className='bg-white p-2 rounded-lg'>
                            <div className='text-lg font-bold text-purple-600'>{user.activeProjects}</div>
                            <div className='text-xs text-gray-500'>Proje</div>
                          </div>
                        </div>

                        {user.teamMembers && user.teamMembers.length > 0 && (
                          <div className='mt-2'>
                            <div className='text-xs text-gray-500 mb-1'>Takımlar:</div>
                            <div className='flex flex-wrap gap-1'>
                              {user.teamMembers.map((membership: any) => (
                                <span
                                  key={membership.team.id}
                                  className='text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full'
                                >
                                  {membership.team.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredData.users.length === 0 && (
              <div className='text-center py-12'>
                <Users className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>Hiç kullanıcı bulunamadı</p>
              </div>
            )}
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredData.teams.map((team) => (
                <div
                  key={team.id}
                  className='bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>{team.name}</h3>
                      {team.description && (
                        <p className='text-sm text-gray-600 mt-1'>{team.description}</p>
                      )}
                    </div>
                    
                    <div className='flex space-x-1'>
                      <Link
                        href={`/team/edit-team/${team.id}`}
                        className='p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                        title='Düzenle'
                      >
                        <Edit className='w-4 h-4' />
                      </Link>
                      <button
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className='p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        title='Sil'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>
                        Üye Sayısı: {team.members.length}
                      </span>
                    </div>

                    {team.members.length > 0 && (
                      <div>
                        <div className='text-xs text-gray-500 mb-2'>Takım Üyeleri:</div>
                        <div className='space-y-1 max-h-32 overflow-y-auto'>
                          {team.members.slice(0, 5).map((member) => (
                            <div
                              key={member.user.id}
                              className='flex items-center space-x-2 text-sm'
                            >
                              <div className='w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold'>
                                {member.user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className='text-gray-700'>{member.user.name}</span>
                              <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>
                                {member.user.position}
                              </span>
                            </div>
                          ))}
                          {team.members.length > 5 && (
                            <div className='text-xs text-gray-500'>
                              +{team.members.length - 5} daha fazla üye
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/team/${team.id}`}
                      className='inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700'
                    >
                      <Eye className='w-4 h-4' />
                      <span>Detayları Görüntüle</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {filteredData.teams.length === 0 && (
              <div className='text-center py-12'>
                <Users className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>Hiç takım bulunamadı</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
