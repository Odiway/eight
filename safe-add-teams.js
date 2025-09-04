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

// Team definitions based on departments
const TEAMS_CONFIG = [
  {
    name: "Batarya Geliştirme Ekibi",
    description: "Batarya teknolojileri geliştirme takımı",
    targetDepartment: "Mühendis"
  },
  {
    name: "Batarya Paketleme Ekibi", 
    description: "Batarya paketleme ve montaj takımı",
    targetDepartment: "Teknisyen"
  },
  {
    name: "Yönetim Ekibi",
    description: "Proje yönetimi ve koordinasyon takımı", 
    targetDepartment: "Yönetim"
  },
  {
    name: "Kalite Kontrol Ekibi",
    description: "Kalite güvence ve test takımı",
    targetDepartment: "Kalite"
  }
];

async function safeAddTeams() {
  try {
    console.log('🔍 Starting SAFE team addition process...');

    // 1. First, let's see what we currently have
    console.log('\n📊 Current database state:');
    
    const existingUsers = await prisma.user.findMany({
      select: { id: true, name: true, department: true, position: true }
    });
    
    const existingTeams = await prisma.team.findMany({
      include: { members: true }
    });

    console.log(`✅ Found ${existingUsers.length} existing users`);
    console.log(`✅ Found ${existingTeams.length} existing teams`);

    // Group users by department
    const usersByDepartment = {};
    existingUsers.forEach(user => {
      if (!usersByDepartment[user.department]) {
        usersByDepartment[user.department] = [];
      }
      usersByDepartment[user.department].push(user);
    });

    console.log('\n📋 Users by department:');
    Object.keys(usersByDepartment).forEach(dept => {
      console.log(`  ${dept}: ${usersByDepartment[dept].length} users`);
    });

    // 2. Create teams if they don't exist
    console.log('\n🏗️  Creating teams (only if they don\'t exist)...');
    const createdTeams = {};
    
    for (const teamConfig of TEAMS_CONFIG) {
      // Check if team already exists
      let team = existingTeams.find(t => t.name === teamConfig.name);
      
      if (!team) {
        team = await prisma.team.create({
          data: {
            name: teamConfig.name,
            description: teamConfig.description
          }
        });
        console.log(`✅ Created new team: ${team.name}`);
      } else {
        console.log(`ℹ️  Team already exists: ${team.name} (${team.members.length} members)`);
      }
      
      createdTeams[teamConfig.name] = team;
    }

    // 3. Add team memberships (only for users not already in teams)
    console.log('\n🔗 Adding team memberships...');
    
    for (const teamConfig of TEAMS_CONFIG) {
      const team = createdTeams[teamConfig.name];
      const usersInDepartment = usersByDepartment[teamConfig.targetDepartment] || [];
      
      console.log(`\n👥 Processing ${teamConfig.name} for ${usersInDepartment.length} users in ${teamConfig.targetDepartment}...`);
      
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
          await prisma.teamMember.create({
            data: {
              teamId: team.id,
              userId: user.id,
              role: user.position?.includes('Yönetici') || user.department === 'Yönetim' ? 'Leader' : 'Member'
            }
          });
          console.log(`  ✅ Added ${user.name} to ${team.name}`);
        } else {
          console.log(`  ℹ️  ${user.name} already in ${team.name}`);
        }
      }
    }

    // 4. Final verification
    console.log('\n📊 Final verification:');
    
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
        console.log(`  👤 ${member.user.name} - ${member.user.position} (${member.role})`);
      });
    });

    const totalUsers = await prisma.user.count();
    const totalTeams = await prisma.team.count();
    const totalMemberships = await prisma.teamMember.count();

    console.log('\n📈 Final Summary:');
    console.log(`✅ Total users: ${totalUsers} (unchanged)`);
    console.log(`✅ Total teams: ${totalTeams}`);
    console.log(`✅ Total team memberships: ${totalMemberships}`);
    console.log('🎉 SAFE team addition completed successfully!');

  } catch (error) {
    console.error('❌ Error during SAFE team addition:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the SAFE team addition
safeAddTeams()
  .then(() => {
    console.log('\n✨ SAFE team synchronization completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 SAFE synchronization failed:', error);
    process.exit(1);
  });
