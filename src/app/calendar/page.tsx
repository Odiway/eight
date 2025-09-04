import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import CalendarClient from '@/components/CalendarClient'
import CalendarIntegration from '@/components/CalendarIntegration'
import UserDashboard from '@/components/UserDashboard'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { redirect } from 'next/navigation'

// Force dynamic rendering to prevent build-time database access
export const dynamic = 'force-dynamic'

async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-change-in-production') as any
    
    // The JWT payload contains user info directly, not userId
    if (!decoded.id) {
      return null
    }

    // For admin users, return the decoded data directly
    if (decoded.role === 'ADMIN') {
      return {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        username: decoded.username
      }
    }

    // For regular users, fetch from database to get the most current data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        username: true
      }
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

async function getCalendarData(projectId?: string, currentUser?: any) {
  if (!currentUser) {
    return { tasks: [], projects: [] }
  }

  // Base filter for projects/tasks
  const projectFilter = projectId ? { projectId } : {}

  // Build task filter based on user role
  let taskFilter: any = {
    ...projectFilter,
    OR: [{ startDate: { not: null } }, { endDate: { not: null } }],
  }

  // If user is NOT admin, only show tasks assigned to them
  if (currentUser.role !== 'ADMIN') {
    taskFilter.AND = [
      {
        OR: [
          { assignedId: currentUser.id },
          {
            assignedUsers: {
              some: {
                userId: currentUser.id
              }
            }
          }
        ]
      }
    ]
  }

  const tasks = await prisma.task.findMany({
    where: taskFilter,
    include: {
      project: true,
      assignedUser: true,
      assignedUsers: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  })

  // For regular users, only show projects they're assigned to
  let projectsFilter: any = {}
  if (currentUser.role !== 'ADMIN') {
    projectsFilter = {
      OR: [
        {
          members: {
            some: {
              userId: currentUser.id
            }
          }
        },
        {
          tasks: {
            some: {
              OR: [
                { assignedId: currentUser.id },
                { assignedUsers: { some: { userId: currentUser.id } } }
              ]
            }
          }
        }
      ]
    }
  }

  const projects = await prisma.project.findMany({
    where: projectsFilter,
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })

  return { tasks, projects }
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const { tasks, projects } = await getCalendarData(
    resolvedSearchParams.project,
    currentUser
  )

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Navbar />
      
      <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* User Dashboard - show different info based on role */}
        <UserDashboard />

        {/* Dynamic Calendar Integration */}
        <div className='mb-6'>
          <CalendarIntegration />
        </div>

        {/* Main Calendar */}
        <CalendarClient
          tasks={tasks}
          projects={projects}
          selectedProjectId={resolvedSearchParams.project}
        />

        {/* Role indicator for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs">
            {currentUser.role === 'ADMIN' ? '🔑 Admin View' : '👤 User View'}
            <br />
            Showing {tasks.length} tasks
          </div>
        )}
      </div>
    </div>
  )
}
