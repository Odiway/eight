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
    const sessionCookie = cookieStore.get('auth-session')?.value

    console.log('=== CALENDAR AUTH DEBUG ===')
    console.log('Raw session cookie:', sessionCookie)

    if (!sessionCookie) {
      console.log('No session cookie found')
      return null
    }

    // Decode the session data from the cookie
    const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString())
    console.log('Decoded session data:', sessionData)
    
    if (!sessionData.id) {
      console.log('No user ID in session')
      return null
    }

    // Check if session is expired (24 hours)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    if (now - sessionData.timestamp > maxAge) {
      console.log('Session expired')
      return null // Session expired
    }

    // For admin users, return the session data directly
    if (sessionData.role === 'ADMIN') {
      const adminUser = {
        id: sessionData.id,
        name: sessionData.name,
        email: 'admin@temsa.com',
        role: sessionData.role,
        username: sessionData.username
      }
      console.log('Returning admin user:', adminUser)
      return adminUser
    }

    // For regular users, fetch from database to get the most current data
    const user = await prisma.user.findUnique({
      where: { id: sessionData.id },
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

    console.log('Database user found:', user)
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

  console.log('=== CALENDAR FILTERING DEBUG ===')
  console.log('Current user:', currentUser)
  console.log('User role:', currentUser.role)
  console.log('User name:', currentUser.name)

  // Base filter for projects/tasks
  const projectFilter = projectId ? { projectId } : {}

  let taskFilter: any = {
    ...projectFilter,
    OR: [{ startDate: { not: null } }, { endDate: { not: null } }],
  }

  // SIMPLE APPROACH: If not admin, only show tasks where this user is specifically assigned
  if (currentUser.role !== 'ADMIN') {
    // For regular users: Only show tasks where THEIR NAME appears
    // Either as the main assignedUser OR in the assignedUsers list
    taskFilter.AND = [
      {
        OR: [
          // Task assigned directly to this user
          { assignedId: currentUser.id },
          // Task assigned to this user through assignedUsers relationship
          {
            assignedUsers: {
              some: {
                userId: currentUser.id
              }
            }
          },
          // Backup: check by name if ID matching fails
          {
            assignedUser: {
              name: currentUser.name
            }
          }
        ]
      }
    ]
  }
  // If ADMIN: show all tasks (no additional filters)

  console.log('Task filter:', JSON.stringify(taskFilter, null, 2))

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

  console.log(`Found ${tasks.length} tasks for user: ${currentUser.name}`)
  
  // Debug: Log task assignments to verify filtering
  tasks.forEach(task => {
    console.log(`Task: ${task.title}`)
    console.log(`  - Assigned to: ${task.assignedUser?.name || 'No one'}`)
    console.log(`  - Multiple assignees: ${task.assignedUsers.map(au => au.user.name).join(', ')}`)
  })

  // For projects: same logic
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
                { 
                  assignedUsers: { 
                    some: { userId: currentUser.id } 
                  } 
                },
                {
                  assignedUser: {
                    name: currentUser.name
                  }
                }
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

  console.log(`Found ${projects.length} projects for user: ${currentUser.name}`)

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
