import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                position: true,
                photo: true,
                maxHoursPerDay: true,
                workingDays: true,
              },
            },
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const members = team.members.map(member => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      department: member.user.department,
      position: member.user.position,
      photo: member.user.photo,
      maxHoursPerDay: member.user.maxHoursPerDay,
      workingDays: member.user.workingDays,
      role: member.role,
      teamId: team.id,
      teamName: team.name,
    }))

    return NextResponse.json({
      teamId: team.id,
      teamName: team.name,
      teamDescription: team.description,
      members: members,
      memberCount: members.length,
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}
