import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assignUserToTeam } from '@/lib/team-utils'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
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
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.department || !body.position) {
      return NextResponse.json(
        { error: 'Name, email, department, and position are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        department: body.department,
        position: body.position,
        photo: body.photo || null,
        maxHoursPerDay: body.maxHoursPerDay || 8,
        workingDays: body.workingDays || "1,2,3,4,5",
      },
      include: {
        assignedTasks: true,
        projects: true,
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
    })

    // Auto-assign user to team based on department
    try {
      await assignUserToTeam(user.id, body.department, body.position)
    } catch (error) {
      console.error('Error assigning user to team:', error)
      // Don't fail the user creation if team assignment fails
    }

    // Get the updated user with team membership
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        assignedTasks: true,
        projects: true,
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
    })

    // Invalidate team page cache
    revalidatePath('/team')
    revalidatePath('/projects')

    return NextResponse.json(updatedUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
