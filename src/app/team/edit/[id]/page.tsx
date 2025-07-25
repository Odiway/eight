import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import UserEditForm from '@/components/UserEditForm'
import { User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      teamMembers: {
        include: {
          team: true,
        },
      },
      assignedTasks: {
        include: {
          project: true,
        },
      },
      projects: {
        include: {
          project: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  return user
}

async function getDepartments() {
  // Get team names as departments
  const teams = await prisma.team.findMany({
    select: {
      name: true,
    },
    distinct: ['name'],
  })
  
  return teams.map(t => t.name).filter(Boolean).sort()
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUser(id)
  const departments = await getDepartments()

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Navbar />

      <div className='max-w-4xl mx-auto py-8 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Header */}
          <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center space-x-4'>
              <Link
                href='/team'
                className='p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200'
              >
                <ArrowLeft className='w-6 h-6' />
              </Link>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-600 rounded-xl'>
                  <User className='w-7 h-7 text-white' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>Kullanıcı Düzenle</h1>
                  <p className='text-gray-600'>
                    {user.name} kullanıcısını düzenleyin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-8'>
            <UserEditForm user={user} existingDepartments={departments} />
          </div>
        </div>
      </div>
    </div>
  )
}
