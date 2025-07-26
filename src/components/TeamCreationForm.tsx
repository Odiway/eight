'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, FileText, Check, X } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  department: string
  position: string
}

interface TeamCreationFormProps {
  availableUsers: User[]
}

export default function TeamCreationForm({ availableUsers }: TeamCreationFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          memberIds: selectedUsers,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Takım oluşturulamadı')
      }

      // Force router refresh and redirect
      router.refresh()
      router.push('/team')
    } catch (error) {
      console.error('Error creating team:', error)
      alert(error instanceof Error ? error.message : 'Takım oluşturulamadı')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    setSelectedUsers(filteredUsers.map(user => user.id))
  }

  const clearAllUsers = () => {
    setSelectedUsers([])
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-8'>
      {/* Basic Information */}
      <div className='space-y-6'>
        <h3 className='text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2'>
          Takım Bilgileri
        </h3>

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

          {/* Team Description */}
          <div>
            <label htmlFor='description' className='block text-sm font-medium text-gray-700 mb-2'>
              <FileText className='w-4 h-4 inline mr-2' />
              Açıklama (Opsiyonel)
            </label>
            <textarea
              id='description'
              name='description'
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
              placeholder='Takım hakkında kısa bir açıklama'
            />
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className='space-y-6'>
        <div className='flex items-center justify-between border-b border-gray-200 pb-2'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Takım Üyeleri ({selectedUsers.length} seçili)
          </h3>
          <div className='flex space-x-2'>
            <button
              type='button'
              onClick={selectAllUsers}
              className='text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50'
            >
              Tümünü Seç
            </button>
            <button
              type='button'
              onClick={clearAllUsers}
              className='text-sm text-gray-600 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-50'
            >
              Temizle
            </button>
          </div>
        </div>

        {/* User Search */}
        <div>
          <input
            type='text'
            placeholder='Kullanıcı ara...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
          />
        </div>

        {/* Users List */}
        <div className='max-h-64 overflow-y-auto border border-gray-200 rounded-xl'>
          {filteredUsers.length === 0 ? (
            <div className='p-4 text-center text-gray-500'>
              {searchTerm ? 'Kullanıcı bulunamadı' : 'Henüz kullanıcı bulunmuyor'}
            </div>
          ) : (
            <div className='divide-y divide-gray-100'>
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => toggleUserSelection(user.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUsers.includes(user.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-3'>
                        <div className='flex-shrink-0'>
                          <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold'>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <h4 className='font-medium text-gray-900'>{user.name}</h4>
                          <p className='text-sm text-gray-500'>{user.email}</p>
                          <div className='flex items-center space-x-2 mt-1'>
                            <span className='text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full'>
                              {user.department}
                            </span>
                            <span className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full'>
                              {user.position}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='flex-shrink-0'>
                      {selectedUsers.includes(user.id) ? (
                        <Check className='w-5 h-5 text-blue-600' />
                      ) : (
                        <div className='w-5 h-5 border-2 border-gray-300 rounded' />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
          {isLoading ? 'Oluşturuluyor...' : 'Takım Oluştur'}
        </button>
      </div>
    </form>
  )
}
