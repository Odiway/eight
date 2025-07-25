import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
              include: {
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
            },
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id },
    })

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if new name conflicts with another team
    if (body.name && body.name !== existingTeam.name) {
      const nameConflict = await prisma.team.findFirst({
        where: { 
          name: body.name,
          id: { not: id },
        },
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Team with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Update team basic info
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name: body.name || existingTeam.name,
        description: body.description !== undefined ? body.description : existingTeam.description,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    // Update team members if provided
    if (body.memberIds && Array.isArray(body.memberIds)) {
      // Remove all existing members
      await prisma.teamMember.deleteMany({
        where: { teamId: id },
      })

      // Add new members
      if (body.memberIds.length > 0) {
        await prisma.teamMember.createMany({
          data: body.memberIds.map((userId: string) => ({
            teamId: id,
            userId: userId,
            role: 'Member',
          })),
          skipDuplicates: true,
        })
      }

      // Fetch updated team with new members
      const finalTeam = await prisma.team.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      })

      // Invalidate caches
      revalidatePath('/team')
      revalidatePath('/projects')

      return NextResponse.json(finalTeam)
    }

    // Invalidate caches
    revalidatePath('/team')
    revalidatePath('/projects')

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: true,
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Delete team (cascade will handle members)
    await prisma.team.delete({
      where: { id },
    })

    // Invalidate caches
    revalidatePath('/team')
    revalidatePath('/projects')

    return NextResponse.json({ 
      message: 'Team deleted successfully',
      deletedData: {
        teamName: team.name,
        membersRemoved: team.members.length,
      }
    })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}
