'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Calendar, Clock, Target, CheckCircle } from 'lucide-react'

export default function UserDashboard() {
  const { user, isAdmin } = useAuth()

  if (isAdmin) return null // Admins see full navigation

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Hoş geldiniz, {user?.name}
          </h2>
          <p className="text-blue-100 mb-4">
            {user?.department} • {user?.position}
          </p>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Takvim Görünümü</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Görevleriniz</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Projeleriniz</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold mb-2">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <p className="text-xs text-blue-100">Kullanıcı</p>
        </div>
      </div>
    </div>
  )
}
