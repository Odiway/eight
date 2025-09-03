import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import CalendarClient from '@/components/CalendarClient'
import CalendarIntegration from '@/components/CalendarIntegration'
import UserDashboard from '@/components/UserDashboard'

// Force dynamic rendering to prevent build-time database access
export const dynamic = 'force-dynamic'

async function getCalendarData(projectId?: string) {
  const where = projectId ? { projectId } : {}

  const tasks = await prisma.task.findMany({
    where: {
      ...where,
      OR: [{ startDate: { not: null } }, { endDate: { not: null } }],
    },
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

  const projects = await prisma.project.findMany({
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
  const resolvedSearchParams = await searchParams
  const { tasks, projects } = await getCalendarData(
    resolvedSearchParams.project
  )

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Navbar />
      
      <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* User Dashboard for regular users */}
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
      </div>
    </div>
  )
}
