'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  X, 
  FolderKanban, 
  Users, 
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'project' | 'task' | 'user' | 'team'
  title: string
  subtitle?: string
  description?: string
  url: string
  status?: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  // Search function with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        setSelectedIndex(0)
      } else {
        // Fall back to mock results if API fails
        const mockResults: SearchResult[] = [
          {
            id: '1',
            type: 'project',
            title: 'Batarya Test Projesi',
            subtitle: 'Aktif Proje',
            description: 'Batarya kalite kontrol ve test süreçleri',
            url: '/projects/1',
            status: 'IN_PROGRESS'
          },
          {
            id: '2',
            type: 'project',
            title: 'Üretim Hattı Optimizasyonu',
            subtitle: 'Planlanan Proje',
            description: 'Üretim verimliliği artırma projesi',
            url: '/projects/2',
            status: 'PLANNING'
          },
          {
            id: '3',
            type: 'task',
            title: 'Batarya Paketleme Kontrolü',
            subtitle: 'Görev',
            description: 'Paketleme kalite kontrol işlemi',
            url: '/tasks/3'
          },
          {
            id: '4',
            type: 'user',
            title: 'Ali AĞCAKOYUNLU',
            subtitle: 'Batarya Paketleme Ekibi',
            description: 'Teknisyen',
            url: '/team/member/4'
          },
          {
            id: '5',
            type: 'team',
            title: 'Batarya Geliştirme Ekibi',
            subtitle: '8 Üye',
            description: 'Batarya AR-GE ve geliştirme',
            url: '/team/5'
          }
        ]

        // Filter mock results based on query
        const filteredResults = mockResults.filter(
          result =>
            result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
        )

        setResults(filteredResults)
        setSelectedIndex(0)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    onClose()
    setQuery('')
    setResults([])
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FolderKanban className="w-4 h-4 text-blue-500" />
      case 'task':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'user':
        return <Users className="w-4 h-4 text-green-500" />
      case 'team':
        return <Users className="w-4 h-4 text-purple-500" />
      default:
        return <Search className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'PLANNING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'Devam Ediyor'
      case 'PLANNING':
        return 'Planlama'
      case 'COMPLETED':
        return 'Tamamlandı'
      default:
        return status
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative min-h-full flex items-start justify-center p-4 pt-16">
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Proje, görev, kişi veya ekip ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 outline-none text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-500">Aranıyor...</span>
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Search className="w-8 h-8 mb-2" />
                <p>"{query}" için sonuç bulunamadı</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </h3>
                        {result.status && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                            {getStatusText(result.status)}
                          </span>
                        )}
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{result.subtitle}</p>
                      )}
                      {result.description && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{result.description}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {!query && (
              <div className="py-8 px-4">
                <p className="text-sm text-gray-500 text-center">
                  Arama yapmak için yukarıya yazın
                </p>
                <div className="mt-4 text-xs text-gray-400 text-center space-y-1">
                  <p>İpuçları:</p>
                  <p>• ↑ ↓ gezinmek için</p>
                  <p>• Enter seçmek için</p>
                  <p>• Esc çıkmak için</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
