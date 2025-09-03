'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Shield, Crown, Users } from 'lucide-react'

export default function AdminHeader() {
  const { user, isAdmin } = useAuth()

  if (!isAdmin) return null

  return (
    <div className="mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Crown className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Yönetici Paneli</h2>
          </div>
          <p className="text-purple-100 mb-3">
            Tam sistem erişimine sahipsiniz, {user?.name}
          </p>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Tüm Projeler</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Takım Yönetimi</span>
            </div>
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4" />
              <span>İş Gücü Analizi</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl font-bold mb-2">
            <Crown className="w-8 h-8" />
          </div>
          <p className="text-xs text-purple-100">Yönetici</p>
        </div>
      </div>
    </div>
  )
}
