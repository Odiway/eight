const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserTeamAssignments() {
  try {
    console.log('\n🔧 FIXING USER-TEAM ASSIGNMENTS\n');

    // Get all users with their current team memberships
    const users = await prisma.user.findMany({
      include: {
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
    });

    console.log(`📊 Found ${users.length} users to check`);

    let fixedCount = 0;
    let createdTeams = [];

    for (const user of users) {
      console.log(`\n👤 Checking user: ${user.name} (${user.department})`);

      // Check if user has any team membership
      const hasTeamMembership = user.teamMembers.length > 0;
      
      if (!hasTeamMembership) {
        console.log(`  ❌ User has no team membership`);
        
        // Find or create team for user's department
        let team = await prisma.team.findFirst({
          where: { name: user.department },
        });

        if (!team) {
          // Create new team for this department
          team = await prisma.team.create({
            data: {
              name: user.department,
              description: `${user.department} takımı`,
            },
          });
          createdTeams.push(team.name);
          console.log(`  ✅ Created new team: ${team.name}`);
        }

        // Determine role based on position
        let role = 'Member';
        if (user.position.toLowerCase().includes('müdür') || user.position.toLowerCase().includes('yönetici')) {
          role = 'Lead';
        } else if (user.position.toLowerCase().includes('mühendis')) {
          role = 'Senior';
        }

        // Add user to team
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: user.id,
            role: role,
          },
        });

        console.log(`  ✅ Added to team: ${team.name} (Role: ${role})`);
        fixedCount++;
      } else {
        // Check if user is in correct team (matching their department)
        const correctTeamMembership = user.teamMembers.find(
          tm => tm.team.name === user.department
        );

        if (!correctTeamMembership) {
          console.log(`  ⚠️  User is in wrong team. Department: ${user.department}, Teams: ${user.teamMembers.map(tm => tm.team.name).join(', ')}`);
          
          // Find or create correct team
          let correctTeam = await prisma.team.findFirst({
            where: { name: user.department },
          });

          if (!correctTeam) {
            correctTeam = await prisma.team.create({
              data: {
                name: user.department,
                description: `${user.department} takımı`,
              },
            });
            createdTeams.push(correctTeam.name);
            console.log(`  ✅ Created new team: ${correctTeam.name}`);
          }

          // Remove from old teams
          await prisma.teamMember.deleteMany({
            where: { userId: user.id },
          });

          // Add to correct team
          let role = 'Member';
          if (user.position.toLowerCase().includes('müdür') || user.position.toLowerCase().includes('yönetici')) {
            role = 'Lead';
          } else if (user.position.toLowerCase().includes('mühendis')) {
            role = 'Senior';
          }

          await prisma.teamMember.create({
            data: {
              teamId: correctTeam.id,
              userId: user.id,
              role: role,
            },
          });

          console.log(`  ✅ Moved to correct team: ${correctTeam.name} (Role: ${role})`);
          fixedCount++;
        } else {
          console.log(`  ✅ User is already in correct team: ${correctTeamMembership.team.name}`);
        }
      }
    }

    console.log('\n📈 SUMMARY:');
    console.log(`  - Users checked: ${users.length}`);
    console.log(`  - Users fixed: ${fixedCount}`);
    console.log(`  - Teams created: ${createdTeams.length}`);
    
    if (createdTeams.length > 0) {
      console.log(`  - New teams: ${createdTeams.join(', ')}`);
    }

    // Verify the results
    console.log('\n🔍 VERIFICATION:');
    const updatedUsers = await prisma.user.findMany({
      include: {
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
    });

    const usersWithoutTeams = updatedUsers.filter(u => u.teamMembers.length === 0);
    console.log(`  - Users without teams: ${usersWithoutTeams.length}`);
    
    if (usersWithoutTeams.length > 0) {
      console.log('  - Users still without teams:');
      usersWithoutTeams.forEach(u => {
        console.log(`    - ${u.name} (${u.department})`);
      });
    }

    // Show team statistics
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log('\n🏢 TEAM STATISTICS:');
    teams.forEach(team => {
      console.log(`  ${team.name}: ${team.members.length} members`);
      team.members.forEach(member => {
        console.log(`    - ${member.user.name} (${member.role})`);
      });
    });

    console.log('\n✅ User-team assignment fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing user-team assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserTeamAssignments();
