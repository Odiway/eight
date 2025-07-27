import { prisma } from '@/lib/prisma'

/**
 * Assigns a user to a team based on their department
 * Creates a new team if one doesn't exist for the department
 */
export async function assignUserToTeam(
  userId: string, 
  department: string, 
  position: string
): Promise<{ teamId: string; teamName: string }> {
  try {
    // First, try to find an existing team with the same name as the department
    let team = await prisma.team.findFirst({
      where: { name: department }
    })

    // If no team exists for this department, create one
    if (!team) {
      team = await prisma.team.create({
        data: {
          name: department,
          description: `${department} takımı`,
        },
      })
      console.log(`Created new team: ${team.name}`)
    }

    // Check if user is already a member of this team
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: userId,
        },
      },
    })

    if (!existingMembership) {
      // Determine role based on position
      let role = 'Member'
      if (position.toLowerCase().includes('müdür') || position.toLowerCase().includes('yönetici')) {
        role = 'Lead'
      } else if (position.toLowerCase().includes('mühendis')) {
        role = 'Senior'
      }

      // Add user to the team
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: userId,
          role: role,
        },
      })

      console.log(`Added user to team ${team.name} with role ${role}`)
    } else {
      console.log(`User is already a member of team ${team.name}`)
    }

    return {
      teamId: team.id,
      teamName: team.name,
    }
  } catch (error) {
    console.error('Error assigning user to team:', error)
    throw error
  }
}

/**
 * Updates user's team membership when their department changes
 */
export async function updateUserTeamMembership(
  userId: string, 
  oldDepartment: string, 
  newDepartment: string,
  position: string
): Promise<void> {
  try {
    // Remove user from old team if it exists
    if (oldDepartment && oldDepartment !== newDepartment) {
      const oldTeam = await prisma.team.findFirst({
        where: { name: oldDepartment }
      })
      
      if (oldTeam) {
        await prisma.teamMember.deleteMany({
          where: {
            teamId: oldTeam.id,
            userId: userId,
          },
        })
        console.log(`Removed user from old team: ${oldDepartment}`)
      }
    }

    // Add user to new team
    if (newDepartment) {
      await assignUserToTeam(userId, newDepartment, position)
    }
  } catch (error) {
    console.error('Error updating user team membership:', error)
    throw error
  }
}

/**
 * Ensures all users have proper team assignments based on their departments
 */
export async function syncAllUsersToTeams(): Promise<number> {
  try {
    const users = await prisma.user.findMany({
      include: {
        teamMembers: true,
      },
    })

    let syncedCount = 0

    for (const user of users) {
      // Check if user has any team membership
      const hasTeamMembership = user.teamMembers.length > 0
      const hasCorrectTeamMembership = user.teamMembers.some(
        tm => tm.role !== null // Basic validation
      )

      if (!hasTeamMembership || !hasCorrectTeamMembership) {
        try {
          await assignUserToTeam(user.id, user.department, user.position)
          syncedCount++
        } catch (error) {
          console.error(`Failed to sync user ${user.name}:`, error)
        }
      }
    }

    console.log(`Synced ${syncedCount} users to teams`)
    return syncedCount
  } catch (error) {
    console.error('Error syncing users to teams:', error)
    throw error
  }
}
