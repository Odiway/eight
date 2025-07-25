'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, X, Check } from 'lucide-react'

interface TeamEditFormProps {
  team: {
    id: string
    name: string
    members: {
      id: string
      name: string
      email: string
      position: string
    }[]
  }
  availableUsers: {
    id: string
    name: string
    email: string
    position: string
    department: string
  }[]
}

export default function TeamEditForm({ team, availableUsers }: TeamEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: team.name,
  })
  
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    team.members.map(member => member.id)
  )

  // Filter users - show current members and users not in any team
  const currentMemberIds = team.members.map(member => member.id)
  const availableForSelection = availableUsers.filter(user => 
    currentMemberIds.includes(user.id) || user.department === team.name || !user.department
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Update team basic info
      const teamResponse = await fetch(`/api/teams/${team.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
        }),
      })

      if (!teamResponse.ok) {
        const errorData = await teamResponse.json()
        throw new Error(errorData.error || 'Takım güncellenemedi')
      }

      // Update team members
      const membersResponse = await fetch(`/api/teams/${team.id}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberIds: selectedMembers,
        }),
      })

      if (!membersResponse.ok) {
        const errorData = await membersResponse.json()
        throw new Error(errorData.error || 'Takım üyeleri güncellenemedi')
      }

      router.push('/team')
    } catch (error) {
      console.error('Error updating team:', error)
      alert(error instanceof Error ? error.message : 'Takım güncellenemedi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid grid-cols-1 gap-6'>
        {/* Team Name */}
        <div>
          <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-2'>
            <Users className='w-4 h-4 inline mr-2' />
            Takım Adı *
          </label>
          <input
            type='text'
            id='name'
            name='name'
            required
            value={formData.name}
            onChange={handleInputChange}
            className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
            placeholder='Takım adını girin'
          />
        </div>
      </div>

      {/* Team Members Selection */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-4'>
          <UserPlus className='w-4 h-4 inline mr-2' />
          Takım Üyeleri
        </label>
        
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto border border-gray-200 rounded-xl p-4'>
          {availableForSelection.map((user) => {
            const isSelected = selectedMembers.includes(user.id)
            const isCurrentMember = currentMemberIds.includes(user.id)
            
            return (
              <div
                key={user.id}
                onClick={() => toggleMember(user.id)}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1 min-w-0'>
                    <h4 className='text-sm font-medium text-gray-900 truncate'>
                      {user.name}
                    </h4>
                    <p className='text-xs text-gray-500 truncate'>
                      {user.position}
                    </p>
                    <p className='text-xs text-gray-400 truncate'>
                      {user.email}
                    </p>
                    {user.department && (
                      <span className='inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded'>
                        {user.department}
                      </span>
                    )}
                  </div>
                  
                  <div className='ml-2 flex-shrink-0'>
                    {isSelected ? (
                      <Check className='w-5 h-5 text-blue-600' />
                    ) : (
                      <div className='w-5 h-5 border-2 border-gray-300 rounded'></div>
                    )}
                  </div>
                </div>
                
                {isCurrentMember && (
                  <div className='absolute top-2 left-2'>
                    <span className='inline-block w-2 h-2 bg-green-500 rounded-full'></span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <p className='text-sm text-gray-500 mt-2'>
          Seçili üye sayısı: {selectedMembers.length}
        </p>
      </div>

      {/* Current Members Summary */}
      {team.members.length > 0 && (
        <div className='bg-gray-50 rounded-xl p-4'>
          <h3 className='text-sm font-medium text-gray-700 mb-3'>
            Mevcut Takım Üyeleri
          </h3>
          <div className='flex flex-wrap gap-2'>
            {team.members.map((member) => {
              const isStillSelected = selectedMembers.includes(member.id)
              return (
                <span
                  key={member.id}
                  className={`
                    inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                    ${isStillSelected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                    }
                  `}
                >
                  {member.name}
                  {isStillSelected ? (
                    <Check className='w-3 h-3 ml-1' />
                  ) : (
                    <X className='w-3 h-3 ml-1' />
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Submit Buttons */}
      <div className='flex justify-end space-x-4 pt-6 border-t border-gray-200'>
        <button
          type='button'
          onClick={() => router.back()}
          className='px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors'
        >
          İptal
        </button>
        <button
          type='submit'
          disabled={isLoading}
          className='px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isLoading ? 'Güncelleniyor...' : 'Takımı Güncelle'}
        </button>
      </div>
    </form>
  )
}
