import { notFound, redirect } from 'next/navigation'
import TeamEditForm from '@/components/TeamEditForm'

async function getTeam(id: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/teams/${id}`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        notFound()
      }
      throw new Error('Takım verisi alınamadı')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching team:', error)
    throw error
  }
}

async function getAllUsers() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/users`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      throw new Error('Kullanıcı verisi alınamadı')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export default async function TeamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [team, users] = await Promise.all([
    getTeam(id),
    getAllUsers()
  ])

  if (!team) {
    notFound()
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Takımı Düzenle
          </h1>
          <p className='text-gray-600'>
            {team.name} takımının bilgilerini güncelleyin
          </p>
        </div>

        {/* Form */}
        <div className='bg-white rounded-2xl shadow-lg p-8'>
          <TeamEditForm team={team} availableUsers={users} />
        </div>
      </div>
    </div>
  )
}
