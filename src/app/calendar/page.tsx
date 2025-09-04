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

  // If user is ADMIN, show all tasks
  if (currentUser.role === 'ADMIN') {
    console.log('User is ADMIN - showing all tasks')
    
    const allTasks = await prisma.task.findMany({
      where: {
        OR: [{ startDate: { not: null } }, { endDate: { not: null } }],
        ...(projectId ? { projectId } : {})
      },
      include: {
        project: true,
        assignedUser: true,
        assignedUsers: {
          include: { user: true },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    const allProjects = await prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    console.log(`Admin sees ${allTasks.length} tasks and ${allProjects.length} projects`)
    return { tasks: allTasks, projects: allProjects }
  }

  // For regular users - STRICT filtering
  console.log('User is regular user - filtering tasks strictly')

  // Get ALL tasks first, then filter in code to be 100% sure
  const allTasks = await prisma.task.findMany({
    where: {
      OR: [{ startDate: { not: null } }, { endDate: { not: null } }],
      ...(projectId ? { projectId } : {})
    },
    include: {
      project: true,
      assignedUser: true,
      assignedUsers: {
        include: { user: true },
      },
    },
    orderBy: { startDate: 'asc' },
  })

  console.log(`Total tasks in database: ${allTasks.length}`)

  // Filter tasks in JavaScript to be absolutely certain
  const userTasks = allTasks.filter(task => {
    // Check if task is assigned to current user
    const isDirectlyAssigned = task.assignedUser?.id === currentUser.id
    const isInMultipleAssignees = task.assignedUsers.some(au => au.user.id === currentUser.id)
    const isAssignedByName = task.assignedUser?.name === currentUser.name
    const isInMultipleAssigneesByName = task.assignedUsers.some(au => au.user.name === currentUser.name)
    
    const shouldShow = isDirectlyAssigned || isInMultipleAssignees || isAssignedByName || isInMultipleAssigneesByName
    
    console.log(`\n--- Task: "${task.title}" ---`)
    console.log(`Direct assignment: ${task.assignedUser?.name || 'none'} (${isDirectlyAssigned})`)
    console.log(`Multiple assignees: [${task.assignedUsers.map(au => `${au.user.name} (ID: ${au.user.id})`).join(', ')}]`)
    console.log(`Current user: ${currentUser.name} (ID: ${currentUser.id})`)
    console.log(`Current user username: ${currentUser.username}`)
    console.log(`Multiple assignees check: ${isInMultipleAssignees}`)
    console.log(`Multiple assignees by name check: ${isInMultipleAssigneesByName}`)
    console.log(`Should show: ${shouldShow}`)
    
    if (shouldShow) {
      console.log(`✅ SHOWING this task`)
    } else {
      console.log(`❌ HIDING this task`)
    }
    
    return shouldShow
  })

  console.log(`Filtered to ${userTasks.length} tasks for user: ${currentUser.name}`)

  // Get projects that have tasks assigned to this user
  const userProjectIds = [...new Set(userTasks.map(task => task.projectId))]
  const userProjects = await prisma.project.findMany({
    where: {
      id: { in: userProjectIds }
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  console.log(`User has access to ${userProjects.length} projects`)

  return { tasks: userTasks, projects: userProjects }
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
