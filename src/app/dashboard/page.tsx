'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Users, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  Bell, 
  Calculator,
  Target,
  LogOut,
  Shield,
  User
} from 'lucide-react'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth-token')
    const userInfo = localStorage.getItem('user-info')
    
    if (!token || !userInfo) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userInfo)
    if (parsedUser.role !== 'ADMIN') {
      // Non-admin users get redirected to calendar only
      router.push('/calendar')
      return
    }

    setUser(parsedUser)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-info')
    router.push('/')
  }

  const adminMenuItems = [
    {
      title: 'Takvim',
      description: 'Proje takvimleri ve görevler',
      href: '/calendar',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Projeler',
      description: 'Proje yönetimi ve takibi',
      href: '/projects',
      icon: FolderOpen,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Takım',
      description: 'Ekip üyeleri ve departmanlar',
      href: '/team',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'İş Yükü',
      description: 'Personel iş yükü analizi',
      href: '/workload',
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Raporlar',
      description: 'Sistem raporları ve analizler',
      href: '/reports',
      icon: BarChart3,
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Bildirimler',
      description: 'Sistem bildirimleri',
      href: '/notifications',
      icon: Bell,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Termin Hesaplayıcı',
      description: 'Proje termin hesaplamaları',
      href: '/deadline-calculator',
      icon: Calculator,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Stratejik Planlama',
      description: 'Stratejik proje planlaması',
      href: '/playground',
      icon: Target,
      color: 'from-teal-500 to-teal-600'
    },
    {
      title: 'Ayarlar',
      description: 'Sistem ayarları ve konfigürasyon',
      href: '/settings',
      icon: Settings,
      color: 'from-gray-500 to-gray-600'
    }
  ]

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">T</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Temsada Batarya Üretim Departmanı</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="font-medium">{user.name}</span>
                <span className="text-gray-500">({user.role})</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Hoş Geldiniz, {user.name}!
          </h2>
          <p className="text-gray-600">
            Yönetici olarak tüm sistem özelliklerine erişiminiz bulunmaktadır.
          </p>
        </div>

        {/* Admin Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminMenuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="group block"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 group-hover:scale-105">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
                
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  <span>Erişim →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Sistem Durumu</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">∞</div>
              <div className="text-sm text-gray-600">Aktif Projeler</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">∞</div>
              <div className="text-sm text-gray-600">Takım Üyeleri</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-2xl font-bold text-orange-600">∞</div>
              <div className="text-sm text-gray-600">Görevler</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-gray-600">Sistem Durumu</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
