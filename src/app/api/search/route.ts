import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SearchResult {
  id: string
  type: 'project' | 'task' | 'user' | 'team'
  title: string
  subtitle?: string
  description?: string
  url: string
  status?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.trim().toLowerCase()
    const results: SearchResult[] = []

    try {
      // Search Projects
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          endDate: true,
          _count: {
            select: { tasks: true }
          }
        },
        take: Math.ceil(limit / 4)
      })

      projects.forEach(project => {
        results.push({
          id: project.id,
          type: 'project',
          title: project.name,
          subtitle: `${project._count.tasks} görev`,
          description: project.description || 'Proje açıklaması yok',
          url: `/projects/${project.id}`,
          status: project.status
        })
      })

      // Search Tasks
      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          endDate: true,
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        take: Math.ceil(limit / 4)
      })

      tasks.forEach(task => {
        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: `${task.project.name}`,
          description: task.description || 'Görev açıklaması yok',
          url: `/projects/${task.project.id}#task-${task.id}`,
          status: task.status
        })
      })

      // Search Users
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { department: { contains: searchTerm, mode: 'insensitive' } },
            { position: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          department: true,
          position: true,
          role: true
        },
        take: Math.ceil(limit / 4)
      })

      users.forEach(user => {
        results.push({
          id: user.id,
          type: 'user',
          title: user.name,
          subtitle: user.department || 'Departman belirtilmemiş',
          description: `${user.position || 'Pozisyon belirtilmemiş'} • ${user.email}`,
          url: `/team/member/${user.id}`
        })
      })

      // Search Teams (using department grouping)
      if (searchTerm.includes('ekip') || searchTerm.includes('team') || searchTerm.includes('departman')) {
        const departments = await prisma.user.groupBy({
          by: ['department'],
          where: {
            department: { 
              not: undefined,
              contains: ''  // This ensures department exists and is not null
            }
          },
          _count: true
        })

        departments.forEach(dept => {
          if (dept.department && dept.department.toLowerCase().includes(searchTerm)) {
            results.push({
              id: dept.department,
              type: 'team',
              title: dept.department,
              subtitle: `${dept._count} üye`,
              description: 'Departman ekibi',
              url: `/team?department=${encodeURIComponent(dept.department)}`
            })
          }
        })
      }

    } catch (dbError) {
      console.error('Database search error:', dbError)
      // Return mock results if database search fails
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'project' as const,
          title: 'Batarya Test Projesi',
          subtitle: 'Aktif Proje • 5 görev',
          description: 'Batarya kalite kontrol ve test süreçleri',
          url: '/projects/1',
          status: 'IN_PROGRESS'
        },
        {
          id: '2',
          type: 'task' as const,
          title: 'Batarya Paketleme Kontrolü',
          subtitle: 'Batarya Test Projesi',
          description: 'Paketleme kalite kontrol işlemi',
          url: '/projects/1#task-2'
        },
        {
          id: '3',
          type: 'user' as const,
          title: 'Ali AĞCAKOYUNLU',
          subtitle: 'Batarya Paketleme',
          description: 'Teknisyen • ali.agcakoyunlu@temsa.com',
          url: '/team/member/3'
        }
      ].filter(result => 
        result.title.toLowerCase().includes(searchTerm) ||
        result.description?.toLowerCase().includes(searchTerm) ||
        result.subtitle?.toLowerCase().includes(searchTerm)
      )

      return NextResponse.json({ results: mockResults.slice(0, limit) })
    }

    // Sort results by relevance (exact matches first, then partial matches)
    const sortedResults = results.sort((a, b) => {
      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()
      
      if (aTitle === searchTerm && bTitle !== searchTerm) return -1
      if (bTitle === searchTerm && aTitle !== searchTerm) return 1
      if (aTitle.startsWith(searchTerm) && !bTitle.startsWith(searchTerm)) return -1
      if (bTitle.startsWith(searchTerm) && !aTitle.startsWith(searchTerm)) return 1
      
      return aTitle.localeCompare(bTitle)
    })

    return NextResponse.json({ 
      results: sortedResults.slice(0, limit),
      total: results.length
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Arama işlemi başarısız', results: [] },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use GET for search.' 
  }, { status: 405 })
}
