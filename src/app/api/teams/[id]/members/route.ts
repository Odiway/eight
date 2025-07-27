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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { memberIds } = await request.json()

    if (!Array.isArray(memberIds)) {
      return NextResponse.json(
        { error: 'memberIds should be an array' },
        { status: 400 }
      )
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id },
      include: { 
        members: {
          include: {
            user: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Takım bulunamadı' },
        { status: 404 }
      )
    }

    // Verify all memberIds exist
    if (memberIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: memberIds } }
      })

      if (users.length !== memberIds.length) {
        return NextResponse.json(
          { error: 'Bazı kullanıcılar bulunamadı' },
          { status: 400 }
        )
      }
    }

    // Remove all current members
    await prisma.teamMember.deleteMany({
      where: { teamId: id }
    })

    // Add new members and update their departments
    if (memberIds.length > 0) {
      await prisma.teamMember.createMany({
        data: memberIds.map((userId: string) => ({
          teamId: id,
          userId: userId,
          role: 'MEMBER'
        }))
      })

      // Update user departments to match team name
      await prisma.user.updateMany({
        where: { id: { in: memberIds } },
        data: { department: team.name }
      })

      // Sync ProjectMember table with current task assignments
      console.log('Syncing ProjectMember table after department update...')
      
      // Get all current task assignments
      const taskAssignments = await prisma.taskAssignment.findMany({
        include: {
          user: true,
          task: {
            include: {
              project: true
            }
          }
        }
      })

      // Create unique project-user combinations
      const projectUserPairs = new Map()
      taskAssignments.forEach(ta => {
        const key = `${ta.task.projectId}-${ta.userId}`
        if (!projectUserPairs.has(key)) {
          projectUserPairs.set(key, {
            projectId: ta.task.projectId,
            userId: ta.userId,
          })
        }
      })

      // Clear and rebuild ProjectMember table
      await prisma.projectMember.deleteMany({})
      
      const projectMemberData = Array.from(projectUserPairs.values()).map(data => ({
        projectId: data.projectId,
        userId: data.userId,
        role: 'MEMBER'
      }))

      if (projectMemberData.length > 0) {
        await prisma.projectMember.createMany({
          data: projectMemberData
        })
        console.log(`Synced ${projectMemberData.length} ProjectMember entries`)
      }
    }

    // Get updated team with members
    const updatedTeam = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                position: true,
                department: true
              }
            }
          }
        }
      }
    })

    // Revalidate pages that might show this data
    revalidatePath('/team')
    revalidatePath('/projects')
    revalidatePath('/calendar')

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error('Error updating team members:', error)
    return NextResponse.json(
      { error: 'Takım üyeleri güncellenemedi' },
      { status: 500 }
    )
  }
}
