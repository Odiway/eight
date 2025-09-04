'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Building, Briefcase, Hash, Camera, Lock, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react'

interface UserCreationFormProps {
  existingDepartments: string[]
}

export default function UserCreationForm({ existingDepartments }: UserCreationFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    studentId: '',
    photo: '',
    password: '', // Add password field
  })

  const [isCustomDepartment, setIsCustomDepartment] = useState(false)
  const [createdUser, setCreatedUser] = useState<any>(null) // Store created user info
  const [showPassword, setShowPassword] = useState(false)
  const [copiedCredentials, setCopiedCredentials] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
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
          password: formData.password || undefined, // Include password if provided
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kullanıcı oluşturulamadı')
      }

      const userData = await response.json()
      setCreatedUser(userData) // Store the created user data with credentials
      
      // Don't redirect immediately, show the credentials first
    } catch (error) {
      console.error('Error creating user:', error)
      alert(error instanceof Error ? error.message : 'Kullanıcı oluşturulamadı')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCredentials(label)
      setTimeout(() => setCopiedCredentials(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  // If user was just created, show credentials
  if (createdUser && createdUser.loginCredentials) {
    return (
      <div className='max-w-2xl mx-auto'>
        <div className='bg-green-50 border border-green-200 rounded-xl p-6 mb-6'>
          <div className='flex items-center mb-4'>
            <CheckCircle className='w-6 h-6 text-green-600 mr-2' />
            <h2 className='text-xl font-semibold text-green-800'>Kullanıcı Başarıyla Oluşturuldu!</h2>
          </div>
          
          <div className='mb-4'>
            <p className='text-green-700 mb-2'>
              <strong>{createdUser.name}</strong> için giriş bilgileri:
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <div className='bg-white p-4 rounded-lg border'>
              <label className='block text-sm font-medium text-gray-600 mb-1'>Kullanıcı Adı</label>
              <div className='flex items-center justify-between bg-gray-50 px-3 py-2 rounded border'>
                <span className='font-mono text-sm'>{createdUser.loginCredentials.username}</span>
                <button
                  onClick={() => copyToClipboard(createdUser.loginCredentials.username, 'username')}
                  className='p-1 hover:bg-gray-200 rounded'
                >
                  {copiedCredentials === 'username' ? 
                    <CheckCircle className='w-4 h-4 text-green-600' /> : 
                    <Copy className='w-4 h-4 text-gray-500' />
                  }
                </button>
              </div>
            </div>

            <div className='bg-white p-4 rounded-lg border'>
              <label className='block text-sm font-medium text-gray-600 mb-1'>Şifre</label>
              <div className='flex items-center justify-between bg-gray-50 px-3 py-2 rounded border'>
                <span className='font-mono text-sm'>
                  {showPassword ? createdUser.loginCredentials.password : '••••••'}
                </span>
                <div className='flex space-x-1'>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className='p-1 hover:bg-gray-200 rounded'
                  >
                    {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(createdUser.loginCredentials.password, 'password')}
                    className='p-1 hover:bg-gray-200 rounded'
                  >
                    {copiedCredentials === 'password' ? 
                      <CheckCircle className='w-4 h-4 text-green-600' /> : 
                      <Copy className='w-4 h-4 text-gray-500' />
                    }
                  </button>
                </div>
              </div>
            </div>

            <div className='bg-white p-4 rounded-lg border'>
              <label className='block text-sm font-medium text-gray-600 mb-1'>Rol</label>
              <div className='bg-gray-50 px-3 py-2 rounded border'>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  createdUser.loginCredentials.role === 'ADMIN' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {createdUser.loginCredentials.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}
                </span>
              </div>
            </div>

            <div className='bg-white p-4 rounded-lg border'>
              <label className='block text-sm font-medium text-gray-600 mb-1'>Departman</label>
              <div className='bg-gray-50 px-3 py-2 rounded border'>
                <span className='text-sm'>{createdUser.department}</span>
              </div>
            </div>
          </div>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4'>
            <p className='text-yellow-800 text-sm'>
              <strong>Önemli:</strong> Bu giriş bilgilerini kullanıcıya güvenli bir şekilde iletin. 
              Şifre ilk girişte değiştirilebilir.
            </p>
          </div>

          <div className='flex justify-center space-x-4'>
            <button
              onClick={() => {
                setCreatedUser(null)
                setFormData({
                  name: '',
                  email: '',
                  department: '',
                  position: '',
                  studentId: '',
                  photo: '',
                  password: '',
                })
              }}
              className='px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors'
            >
              Yeni Kullanıcı Ekle
            </button>
            <button
              onClick={() => router.push('/team')}
              className='px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors'
            >
              Takım Sayfasına Git
            </button>
          </div>
        </div>
      </div>
    )
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
                placeholder='Yeni departman adı'
              />
              {existingDepartments.length > 0 && (
                <button
                  type='button'
                  onClick={() => {
                    setIsCustomDepartment(false)
                    setFormData(prev => ({ ...prev, department: '' }))
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

        {/* Password */}
        <div>
          <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-2'>
            <Lock className='w-4 h-4 inline mr-2' />
            Şifre (Opsiyonel)
          </label>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              id='password'
              name='password'
              value={formData.password}
              onChange={handleInputChange}
              className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
              placeholder='Boş bırakılırsa varsayılan: 123456'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
            >
              {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
            </button>
          </div>
          <p className='text-sm text-gray-500 mt-1'>
            Kullanıcı adı otomatik olarak e-posta adresinden oluşturulacak
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
          {isLoading ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
        </button>
      </div>
    </form>
  )
}
