'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Building, Briefcase, Hash, Camera } from 'lucide-react'

interface UserEditFormProps {
  user: {
    id: string
    name: string
    email: string
    department: string
    position: string
    studentId?: string | null
    photo?: string | null
    maxHoursPerDay: number
    workingDays: string
  }
  existingDepartments: string[]
}

export default function UserEditForm({ user, existingDepartments }: UserEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    department: user.department,
    position: user.position,
    studentId: user.studentId || '',
    photo: user.photo || '',
    maxHoursPerDay: user.maxHoursPerDay,
    workingDays: user.workingDays,
  })

  const [isCustomDepartment, setIsCustomDepartment] = useState(
    !existingDepartments.includes(user.department)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          department: formData.department,
          position: formData.position,
          studentId: formData.studentId || null,
          photo: formData.photo || null,
          maxHoursPerDay: formData.maxHoursPerDay,
          workingDays: formData.workingDays,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kullanıcı güncellenemedi')
      }

      router.push('/team')
    } catch (error) {
      console.error('Error updating user:', error)
      alert(error instanceof Error ? error.message : 'Kullanıcı güncellenemedi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxHoursPerDay' ? parseInt(value) || 8 : value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Name */}
        <div>
          <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-2'>
            <User className='w-4 h-4 inline mr-2' />
            Ad Soyad *
          </label>
          <input
            type='text'
            id='name'
            name='name'
            required
            value={formData.name}
            onChange={handleInputChange}
            className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
            placeholder='Kullanıcının tam adını girin'
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
            <Mail className='w-4 h-4 inline mr-2' />
            E-posta *
          </label>
          <input
            type='email'
            id='email'
            name='email'
            required
            value={formData.email}
            onChange={handleInputChange}
            className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
            placeholder='kullanici@example.com'
          />
        </div>

        {/* Department */}
        <div>
          <label htmlFor='department' className='block text-sm font-medium text-gray-700 mb-2'>
            <Building className='w-4 h-4 inline mr-2' />
            Departman *
          </label>
          {!isCustomDepartment && existingDepartments.length > 0 ? (
            <div className='space-y-2'>
              <select
                id='department'
                name='department'
                required
                value={formData.department}
                onChange={handleInputChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
              >
                <option value=''>Departman seçin</option>
                {existingDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <button
                type='button'
                onClick={() => setIsCustomDepartment(true)}
                className='text-sm text-blue-600 hover:text-blue-700'
              >
                Yeni departman ekle
              </button>
            </div>
          ) : (
            <div className='space-y-2'>
              <input
                type='text'
                id='department'
                name='department'
                required
                value={formData.department}
                onChange={handleInputChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
                placeholder='Departman adı'
              />
              {existingDepartments.length > 0 && (
                <button
                  type='button'
                  onClick={() => {
                    setIsCustomDepartment(false)
                    setFormData(prev => ({ ...prev, department: existingDepartments[0] || '' }))
                  }}
                  className='text-sm text-blue-600 hover:text-blue-700'
                >
                  Mevcut departmanlardan seç
                </button>
              )}
            </div>
          )}
        </div>

        {/* Position */}
        <div>
          <label htmlFor='position' className='block text-sm font-medium text-gray-700 mb-2'>
            <Briefcase className='w-4 h-4 inline mr-2' />
            Pozisyon *
          </label>
          <input
            type='text'
            id='position'
            name='position'
            required
            value={formData.position}
            onChange={handleInputChange}
            className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
            placeholder='Ör: Frontend Developer, Proje Yöneticisi'
          />
        </div>

        {/* Student ID */}
        <div>
          <label htmlFor='studentId' className='block text-sm font-medium text-gray-700 mb-2'>
            <Hash className='w-4 h-4 inline mr-2' />
            Öğrenci No (Opsiyonel)
          </label>
          <input
            type='text'
            id='studentId'
            name='studentId'
            value={formData.studentId}
            onChange={handleInputChange}
            className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
            placeholder='Öğrenci numarası'
          />
        </div>

        {/* Photo URL */}
        <div>
          <label htmlFor='photo' className='block text-sm font-medium text-gray-700 mb-2'>
            <Camera className='w-4 h-4 inline mr-2' />
            Profil Fotoğrafı URL (Opsiyonel)
          </label>
          <input
            type='url'
            id='photo'
            name='photo'
            value={formData.photo}
            onChange={handleInputChange}
            className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
            placeholder='https://example.com/photo.jpg'
          />
        </div>

        {/* Max Hours Per Day */}
        <div>
          <label htmlFor='maxHoursPerDay' className='block text-sm font-medium text-gray-700 mb-2'>
            Günlük Maksimum Çalışma Saati
          </label>
          <input
            type='number'
            id='maxHoursPerDay'
            name='maxHoursPerDay'
            min='1'
            max='24'
            value={formData.maxHoursPerDay}
            onChange={handleInputChange}
            className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
          />
        </div>

        {/* Working Days */}
        <div>
          <label htmlFor='workingDays' className='block text-sm font-medium text-gray-700 mb-2'>
            Çalışma Günleri (1=Pzt, 2=Sal, vb.)
          </label>
          <input
            type='text'
            id='workingDays'
            name='workingDays'
            value={formData.workingDays}
            onChange={handleInputChange}
            className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
            placeholder='1,2,3,4,5'
          />
          <p className='text-xs text-gray-500 mt-1'>
            Virgülle ayrılmış sayılar: 1=Pazartesi, 2=Salı, 3=Çarşamba, 4=Perşembe, 5=Cuma, 6=Cumartesi, 7=Pazar
          </p>
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
          {isLoading ? 'Güncelleniyor...' : 'Kullanıcı Güncelle'}
        </button>
      </div>
    </form>
  )
}
