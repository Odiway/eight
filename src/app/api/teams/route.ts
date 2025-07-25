import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    const team = await prisma.team.create({
      data: {
        name: body.name,
        description: body.description || null,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    // If members are provided, add them to the team
    if (body.memberIds && Array.isArray(body.memberIds)) {
      await prisma.teamMember.createMany({
        data: body.memberIds.map((userId: string) => ({
          teamId: team.id,
          userId: userId,
        })),
      })
    }

    // Invalidate team page cache
    revalidatePath('/team')

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
