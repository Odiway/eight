const { PrismaClient } = require('@prisma/client');

// Use production database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_j53YgzQflxbr@ep-old-breeze-adrvkyiq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

// Updated team mapping based on actual departments in database
const TEAM_MAPPINGS = [
  {
    teamName: "Batarya Geliştirme Ekibi",
    targetDepartment: "Batarya Geliştirme" // Actual department name from DB
  },
  {
    teamName: "Batarya Paketleme Ekibi", 
    targetDepartment: "Batarya Paketleme" // Actual department name from DB
  },
  {
    teamName: "Yönetim Ekibi",
    targetDepartment: "Yönetim" // Already mapped correctly
  },
  {
    teamName: "Kalite Kontrol Ekibi",
    targetDepartment: "Satın Alma" // Map Satın Alma to Quality Control
  }
];

async function assignUsersToTeams() {
  try {
    console.log('🔗 Assigning users to teams based on actual departments...');

    // Get current teams
    const teams = await prisma.team.findMany();
    const teamsByName = {};
    teams.forEach(team => {
      teamsByName[team.name] = team;
    });

    // Get users by department
    const users = await prisma.user.findMany({
      select: { id: true, name: true, department: true, position: true }
    });

    const usersByDepartment = {};
    users.forEach(user => {
      if (!usersByDepartment[user.department]) {
        usersByDepartment[user.department] = [];
      }
      usersByDepartment[user.department].push(user);
    });

    console.log('\n📋 Available departments and user counts:');
    Object.keys(usersByDepartment).forEach(dept => {
      console.log(`  ${dept}: ${usersByDepartment[dept].length} users`);
    });

    // Assign users to teams
    for (const mapping of TEAM_MAPPINGS) {
      const team = teamsByName[mapping.teamName];
      const usersInDepartment = usersByDepartment[mapping.targetDepartment] || [];
      
      console.log(`\n👥 Assigning ${usersInDepartment.length} users from "${mapping.targetDepartment}" to "${mapping.teamName}"...`);
      
      for (const user of usersInDepartment) {
        // Check if user is already a member of this team
        const existingMembership = await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: team.id,
              userId: user.id
            }
          }
        });
        
        if (!existingMembership) {
          const role = user.position?.toLowerCase().includes('müdür') || 
                       user.position?.toLowerCase().includes('yönetici') || 
                       user.department === 'Yönetim' ? 'Leader' : 'Member';
          
          await prisma.teamMember.create({
            data: {
              teamId: team.id,
              userId: user.id,
              role: role
            }
          });
          console.log(`  ✅ Added ${user.name} (${user.position}) as ${role}`);
        } else {
          console.log(`  ℹ️  ${user.name} already in team`);
        }
      }
    }

    // Also assign remaining departments to appropriate teams
    const remainingDepartments = ['Proje Geliştirme', 'System'];
    for (const dept of remainingDepartments) {
      const usersInDept = usersByDepartment[dept] || [];
      if (usersInDept.length > 0) {
        // Assign Proje Geliştirme to Batarya Geliştirme team
        const targetTeam = dept === 'Proje Geliştirme' ? 'Batarya Geliştirme Ekibi' : 'Yönetim Ekibi';
        const team = teamsByName[targetTeam];
        
        console.log(`\n👥 Assigning ${usersInDept.length} users from "${dept}" to "${targetTeam}"...`);
        
        for (const user of usersInDept) {
          const existingMembership = await prisma.teamMember.findUnique({
            where: {
              teamId_userId: {
                teamId: team.id,
                userId: user.id
              }
            }
          });
          
          if (!existingMembership) {
            await prisma.teamMember.create({
              data: {
                teamId: team.id,
                userId: user.id,
                role: 'Member'
              }
            });
            console.log(`  ✅ Added ${user.name} (${user.position})`);
          }
        }
      }
    }

    // Final verification
    console.log('\n📊 Final team composition:');
    
    const finalTeams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { name: true, department: true, position: true }
            }
          }
        }
      }
    });

    finalTeams.forEach(team => {
      console.log(`\n🏢 ${team.name} (${team.members.length} members):`);
      team.members.forEach(member => {
        const roleIcon = member.role === 'Leader' ? '👑' : '👤';
        console.log(`  ${roleIcon} ${member.user.name} - ${member.user.position} (${member.user.department})`);
      });
    });

    const totalMemberships = await prisma.teamMember.count();
    console.log(`\n📈 Total team memberships: ${totalMemberships}`);
    console.log('🎉 Team assignments completed successfully!');

  } catch (error) {
    console.error('❌ Error during team assignment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the team assignment
assignUsersToTeams()
  .then(() => {
    console.log('\n✨ Team assignment completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Team assignment failed:', error);
    process.exit(1);
  });
