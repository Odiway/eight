'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  FolderKanban,
  Calendar,
  Users,
  BarChart3,
  FileText,
  Bell,
  Settings,
  ChevronDown,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Command,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import SearchModal from '@/components/SearchModal'

const allNavigation = [
  {
    name: 'Takvim',
    href: '/calendar',
    icon: Calendar,
    description: 'Proje takvimleri ve görevler',
    requiresAdmin: false,
  },
  {
    name: 'Projeler',
    href: '/projects',
    icon: FolderKanban,
    description: 'Proje yönetimi ve takibi',
    requiresAdmin: true,
  },
  {
    name: 'Stratejik Alan',
    href: '/playground',
    icon: Lightbulb,
    description: 'Kritik yol analizi ve stratejik planlama',
    requiresAdmin: true,
  },
  {
    name: 'Takım',
    href: '/team',
    icon: Users,
    description: 'Ekip üyeleri ve roller',
    requiresAdmin: true,
  },
  {
    name: 'İş Gücü',
    href: '/workload',
    icon: BarChart3,
    description: 'İş yükü analizi',
    requiresAdmin: true,
  },
  {
    name: 'Raporlar',
    href: '/reports',
    icon: FileText,
    description: 'Detaylı raporlar ve analitik',
    requiresAdmin: true,
  },
  {
    name: 'Bildirimler',
    href: '/notifications',
    icon: Bell,
    description: 'Sistem bildirimleri',
    requiresAdmin: true,
  },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [taskNotifications, setTaskNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => !item.requiresAdmin || isAdmin)

  // Fetch task notifications
  const fetchTaskNotifications = async () => {
    if (!user) return
    
    try {
      const response = await fetch(
        `/api/notifications?userId=${user.id}&unreadOnly=false`,
        {
          credentials: 'include'
        }
      )

      if (response.ok) {
        const data = await response.json()
        // Filter only task-related notifications
        const taskNotifs = data.notifications.filter((notif: any) => 
          notif.type.includes('TASK') && notif.task
        )
        setTaskNotifications(taskNotifs.slice(0, 5)) // Show only 5 latest
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching task notifications:', error)
    }
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch task notifications when user is available
  useEffect(() => {
    if (user) {
      fetchTaskNotifications()
      // Refresh notifications every 5 minutes
      const interval = setInterval(fetchTaskNotifications, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false)
      setIsNotificationOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <Bell className='w-4 h-4 text-blue-500' />
      case 'TASK_DUE_SOON':
        return <Calendar className='w-4 h-4 text-yellow-500' />
      case 'TASK_OVERDUE':
        return <Bell className='w-4 h-4 text-red-500' />
      case 'TASK_COMPLETED':
        return <Bell className='w-4 h-4 text-green-500' />
      case 'TASK_STATUS_CHANGED':
        return <Bell className='w-4 h-4 text-blue-500' />
      default:
        return <Bell className='w-4 h-4 text-gray-500' />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Az önce'
    if (diffInHours < 24) return `${diffInHours} saat önce`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} gün önce`
    return date.toLocaleDateString('tr-TR')
  }

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50'
          : 'bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 shadow-xl'
      )}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo and Brand - Compact */}
          <div className='flex items-center flex-shrink-0'>
            <Link href='/dashboard' className='group flex items-center space-x-3'>
              <div
                className={cn(
                  'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105',
                  scrolled
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg'
                    : 'bg-white/20 backdrop-blur-sm border border-white/30'
                )}
              >
                <span
                  className={cn(
                    'text-lg font-bold transition-colors duration-300',
                    scrolled ? 'text-white' : 'text-white'
                  )}
                >
                  T
                </span>
                <div className='absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
              </div>
              <div className='hidden sm:block min-w-0'>
                <h1
                  className={cn(
                    'text-lg font-bold transition-colors duration-300 truncate',
                    scrolled ? 'text-gray-900' : 'text-white'
                  )}
                >
                  Batarya Üretim
                </h1>
              </div>
            </Link>
          </div>

          {/* Center Navigation - Optimized spacing */}
          <div className='hidden lg:flex flex-1 justify-center max-w-2xl mx-8'>
            <div className='flex space-x-1'>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <div key={item.name} className='relative group'>
                    <Link
                      href={item.href}
                      className={cn(
                        'inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative',
                        isActive
                          ? scrolled
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                            : 'bg-white/20 text-white backdrop-blur-sm border border-white/30'
                          : scrolled
                          ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className='w-4 h-4 mr-2 transition-transform group-hover:scale-110 flex-shrink-0' />
                      <span className='hidden xl:inline whitespace-nowrap'>
                        {item.name}
                      </span>
                      <span className='xl:hidden'>{item.name.charAt(0)}</span>
                      {isActive && (
                        <div
                          className={cn(
                            'absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full',
                            scrolled ? 'bg-white' : 'bg-white'
                          )}
                        />
                      )}
                    </Link>

                    {/* Tooltip */}
                    <div className='absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50'>
                      <div className='bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl'>
                        {item.description}
                        <div className='absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45' />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right side actions - Compact */}
          <div className='flex items-center space-x-2 flex-shrink-0'>
            {/* Search Button (Desktop) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className={cn(
                'hidden lg:flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all duration-300 group',
                scrolled
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
            >
              <Search className='w-4 h-4 flex-shrink-0' />
              <span className='hidden xl:inline'>Ara</span>
              <div
                className={cn(
                  'px-2 py-1 rounded text-xs font-mono hidden xl:block flex-shrink-0',
                  scrolled
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-white/20 text-white/70'
                )}
              >
                ⌘K
              </div>
            </button>

            {/* Task Notifications */}
            <div className='relative'>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsNotificationOpen(!isNotificationOpen)
                  setIsUserMenuOpen(false) // Close user menu when opening notifications
                }}
                className={cn(
                  'relative p-2 rounded-lg transition-all duration-300',
                  scrolled
                    ? 'text-gray-600 hover:bg-gray-100'
                    : 'text-white hover:bg-white/10'
                )}
              >
                <Bell className='w-5 h-5' />
                {unreadCount > 0 && (
                  <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse'>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Task Notifications Dropdown */}
              {isNotificationOpen && (
                <div className='absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200'>
                  <div className='px-4 py-3 border-b border-gray-100'>
                    <h3 className='text-sm font-semibold text-gray-900'>Görev Bildirimleri</h3>
                    <p className='text-xs text-gray-500'>Son görev güncellemeleri</p>
                  </div>
                  
                  <div className='max-h-96 overflow-y-auto'>
                    {taskNotifications.length === 0 ? (
                      <div className='px-4 py-6 text-center'>
                        <Bell className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                        <p className='text-sm text-gray-500'>Henüz görev bildirimi yok</p>
                      </div>
                    ) : (
                      taskNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors duration-200 cursor-pointer',
                            !notification.isRead && 'bg-blue-50'
                          )}
                          onClick={() => {
                            // Mark as read and navigate to task
                            if (notification.task) {
                              window.location.href = `/projects/${notification.task.project.id}?task=${notification.task.id}`
                            }
                            setIsNotificationOpen(false)
                          }}
                        >
                          <div className='flex items-start space-x-3'>
                            <div className='flex-shrink-0 mt-1'>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className={cn(
                                'text-sm font-medium truncate',
                                notification.isRead ? 'text-gray-600' : 'text-gray-900'
                              )}>
                                {notification.title}
                              </p>
                              <p className={cn(
                                'text-xs mt-1 line-clamp-2',
                                notification.isRead ? 'text-gray-400' : 'text-gray-600'
                              )}>
                                {notification.message}
                              </p>
                              {notification.task && (
                                <p className='text-xs text-blue-600 mt-1 font-medium'>
                                  {notification.task.title} - {notification.task.project.name}
                                </p>
                              )}
                              <p className='text-xs text-gray-400 mt-1'>
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2'></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className='px-4 py-2 border-t border-gray-100'>
                    <Link
                      href='/notifications'
                      className='text-xs text-blue-600 hover:text-blue-800 font-medium'
                      onClick={() => setIsNotificationOpen(false)}
                    >
                      Tüm bildirimleri görüntüle →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className='relative'>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsUserMenuOpen(!isUserMenuOpen)
                  setIsNotificationOpen(false) // Close notifications when opening user menu
                }}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-300 group',
                  scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10',
                  isUserMenuOpen && (scrolled ? 'bg-gray-100' : 'bg-white/10')
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm transition-all duration-300 flex-shrink-0',
                    scrolled
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white'
                      : 'bg-white/20 text-white backdrop-blur-sm'
                  )}
                >
                  T
                </div>
                <div className='hidden sm:block text-left min-w-0'>
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      scrolled ? 'text-gray-900' : 'text-white'
                    )}
                  >
                    System Administrator
                  </p>
                  <p className={cn(
                    'text-xs truncate',
                    scrolled ? 'text-gray-600' : 'text-white/70'
                  )}>
                    {user?.name || 'Yönetici'}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform duration-300 flex-shrink-0',
                    scrolled ? 'text-gray-500' : 'text-white/70',
                    isUserMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className='absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200'>
                  <div className='px-4 py-3 border-b border-gray-100'>
                    <p className='text-sm font-medium text-gray-900'>
                      System Administrator
                    </p>
                    <p className='text-xs text-gray-500'>{user?.email}</p>
                    <p className='text-xs text-gray-500'>{user?.name || 'Yönetici'}</p>
                    {user?.department && (
                      <p className='text-xs text-gray-500 mt-1'>{user.department}</p>
                    )}
                  </div>
                  
                  {/* Profile Link */}
                  <Link
                    href='/profile'
                    className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200'
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className='w-4 h-4 mr-3 text-gray-400' />
                    Profil
                  </Link>

                  {/* Settings Link */}
                  <Link
                    href='/settings'
                    className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200'
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className='w-4 h-4 mr-3 text-gray-400' />
                    Ayarlar
                  </Link>

                  {/* Divider */}
                  <hr className='my-2 border-gray-100' />

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      logout()
                    }}
                    className='flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-200'
                  >
                    <LogOut className='w-4 h-4 mr-3 text-red-400' />
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen)
                setIsUserMenuOpen(false)
                setIsNotificationOpen(false)
              }}
              className={cn(
                'lg:hidden p-2 rounded-lg transition-all duration-300',
                scrolled
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              )}
            >
              {isMobileMenuOpen ? (
                <X className='w-5 h-5' />
              ) : (
                <Menu className='w-5 h-5' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className='lg:hidden border-t border-white/10 py-4 animate-in slide-in-from-top-2 duration-200'>
            <div className='space-y-1'>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300',
                      isActive
                        ? scrolled
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                          : 'bg-white/20 text-white backdrop-blur-sm'
                        : scrolled
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-white/90 hover:bg-white/10'
                    )}
                  >
                    <Icon className='w-5 h-5 mr-3 flex-shrink-0' />
                    <div className='min-w-0 flex-1'>
                      <div className='truncate'>{item.name}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </nav>
  )
}
