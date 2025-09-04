'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  name: string
  email: string
  role: 'ADMIN' | 'USER'
  department?: string
  position?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing auth session from cookie
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Check localStorage first for immediate user data
      const storedUser = localStorage.getItem('user')
      const debugUser = localStorage.getItem('debug-login-user')
      
      console.log('=== AUTH CONTEXT DEBUG ===')
      console.log('Stored user in localStorage:', storedUser)
      console.log('Debug login user:', debugUser)
      
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        console.log('Setting user from localStorage:', userData)
        setUser(userData)
        setIsLoading(false)
        return
      }

      // Fallback: try to get user from cookie by reading it client-side
      const cookies = document.cookie.split(';')
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-session='))
      
      if (authCookie) {
        try {
          const cookieValue = authCookie.split('=')[1]
          const sessionData = JSON.parse(atob(cookieValue))
          console.log('Session data from cookie:', sessionData)
          
          // Check if session is expired
          const now = Date.now()
          const maxAge = 24 * 60 * 60 * 1000 // 24 hours
          
          if (now - sessionData.timestamp <= maxAge) {
            const userData = {
              id: sessionData.id,
              username: sessionData.username,
              name: sessionData.name,
              email: sessionData.role === 'ADMIN' ? 'admin@temsa.com' : sessionData.email,
              role: sessionData.role
            }
            console.log('Setting user from cookie:', userData)
            setUser(userData)
          } else {
            console.log('Session expired')
          }
        } catch (cookieError) {
          console.error('Error parsing cookie:', cookieError)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = (userData: User) => {
    setUser(userData)
  }

  const logout = async () => {
    try {
      // Call logout API to clear cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      setUser(null)
      router.push('/login')
    }
  }

  const isAdmin = user?.role === 'ADMIN'

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
