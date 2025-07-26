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

    // Check if team name already exists
    const existingTeam = await prisma.team.findFirst({
      where: { name: body.name },
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team with this name already exists' },
        { status: 409 }
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
          role: 'Member',
        })),
      })

      // Update user departments to match team name
      await prisma.user.updateMany({
        where: { id: { in: body.memberIds } },
        data: { department: team.name }
      })

      // Fetch the updated team with members
      const updatedTeam = await prisma.team.findUnique({
        where: { id: team.id },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      })

      // Invalidate relevant caches more aggressively
      revalidatePath('/team')
      revalidatePath('/team', 'page')
      revalidatePath('/projects')
      
      return NextResponse.json(updatedTeam, { status: 201 })
    }

    // Invalidate team page cache more aggressively  
    revalidatePath('/team')
    revalidatePath('/team', 'page')
    revalidatePath('/projects')

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
