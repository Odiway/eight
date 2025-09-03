'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, User, Lock, Shield, UserCheck } from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    loginType: 'user' // 'user' or 'admin'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        // Store token in localStorage and cookie
        localStorage.setItem('auth-token', result.token)
        localStorage.setItem('user-info', JSON.stringify(result.user))
        
        // Set cookie for middleware
        document.cookie = `auth-token=${result.token}; path=/; max-age=86400; secure=${window.location.protocol === 'https:'}; samesite=strict`
        
        // Redirect based on role
        if (result.user.role === 'ADMIN') {
          router.push('/dashboard') // Admins go to dashboard with full system access
        } else {
          router.push('/calendar') // Regular users only see calendar
        }
      } else {
        setError(result.message || 'Giriş başarısız')
      }
    } catch (error) {
      setError('Bağlantı hatası oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLoginTypeChange = (type: 'user' | 'admin') => {
    console.log('Button clicked:', type) // Debug log
    setFormData({
      ...formData,
      loginType: type,
      username: type === 'admin' ? 'admin' : '',
      password: ''
    })
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* Logo and Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl mb-4">
            <span className="text-3xl font-bold text-white">T</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Temsada Batarya
          </h1>
          <p className="text-gray-600">
            Üretim Departmanı Yönetim Sistemi
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Login Type Selector */}
            <div className="flex bg-gray-100 rounded-t-2xl">
              <div
                onClick={() => {
                  console.log('User tab clicked')
                  handleLoginTypeChange('user')
                }}
                className={`flex-1 py-4 px-6 text-sm font-medium cursor-pointer select-none transition-all duration-200 ${
                  formData.loginType === 'user'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-transparent text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
                style={{ zIndex: 10 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Kullanıcı Girişi</span>
                </div>
              </div>
              <div
                onClick={() => {
                  console.log('Admin tab clicked')
                  handleLoginTypeChange('admin')
                }}
                className={`flex-1 py-4 px-6 text-sm font-medium cursor-pointer select-none transition-all duration-200 ${
                  formData.loginType === 'admin'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-transparent text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
                style={{ zIndex: 10 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Yönetici Girişi</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8">
              {/* Username Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {formData.loginType === 'admin' ? (
                      <Shield className="h-5 w-5 text-gray-400" />
                    ) : (
                      <User className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder={formData.loginType === 'admin' ? 'admin' : 'Kullanıcı adınızı giriniz'}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={formData.loginType === 'admin' ? 'Yönetici şifresi' : 'Şifrenizi giriniz'}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl text-white font-medium transition-all duration-200 ${
                  formData.loginType === 'admin'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Giriş yapılıyor...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <UserCheck className="w-5 h-5" />
                    <span>
                      {formData.loginType === 'admin' ? 'Yönetici Girişi' : 'Kullanıcı Girişi'}
                    </span>
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Demo Bilgileri:</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Yönetici:</strong> admin / Securepassword1</div>
              <div><strong>Kullanıcı:</strong> Kullanıcı adları için USER_CREDENTIALS.md dosyasına bakınız</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 Temsada Batarya Üretim Departmanı</p>
          <p>Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  )
}
