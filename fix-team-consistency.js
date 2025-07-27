const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTeamConsistency() {
  try {
    console.log('\n=== FIXING TEAM CONSISTENCY ISSUES ===\n');

    // 1. Create missing teams
    console.log('🔧 Step 1: Creating missing teams...');
    
    const existingTeams = await prisma.team.findMany();
    const existingTeamNames = existingTeams.map(t => t.name);
    
    const requiredTeams = [
      { name: 'Arge Proje', description: 'Araştırma ve Geliştirme Proje Ekibi' },
      { name: 'Satın Alma', description: 'Satın Alma Departmanı' },
      { name: 'Batarya Paketleme Ekibi', description: 'Batarya Paketleme ve Üretim Ekibi' },
      { name: 'Batarya Geliştirme Ekibi', description: 'Batarya Teknolojileri Geliştirme Ekibi' }
    ];

    for (const team of requiredTeams) {
      if (!existingTeamNames.includes(team.name)) {
        await prisma.team.create({
          data: team
        });
        console.log(`  ✓ Created team: ${team.name}`);
      } else {
        console.log(`  - Team already exists: ${team.name}`);
      }
    }

    // 2. Assign users to correct teams based on their departments
    console.log('\n🔧 Step 2: Assigning users to correct teams...');
    
    const users = await prisma.user.findMany();
    const teams = await prisma.team.findMany();
    
    // Clear all team memberships first
    await prisma.teamMember.deleteMany({});
    console.log('  Cleared existing team memberships');
    
    // Group users by department
    const usersByDepartment = {};
    users.forEach(user => {
      if (!usersByDepartment[user.department]) {
        usersByDepartment[user.department] = [];
      }
      usersByDepartment[user.department].push(user);
    });

    // Assign users to teams
    for (const [department, deptUsers] of Object.entries(usersByDepartment)) {
      const team = teams.find(t => t.name === department);
      
      if (team) {
        for (const user of deptUsers) {
          await prisma.teamMember.create({
            data: {
              teamId: team.id,
              userId: user.id,
              role: 'MEMBER'
            }
          });
          console.log(`    ✓ Added ${user.name} to ${team.name}`);
        }
      } else {
        console.log(`    ⚠️ No team found for department: ${department}`);
      }
    }

    // 3. Verify team assignments
    console.log('\n🔧 Step 3: Verifying team assignments...');
    
    const teamsWithMembers = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });

    teamsWithMembers.forEach(team => {
      console.log(`  ${team.name}: ${team.members.length} members`);
      team.members.forEach(member => {
        const departmentMatch = member.user.department === team.name;
        console.log(`    - ${member.user.name} (${member.user.department}) ${departmentMatch ? '✅' : '⚠️'}`);
      });
    });

    // 4. Final data consistency check
    console.log('\n🔧 Step 4: Final data consistency check...');
    
    const allUsers = await prisma.user.findMany();
    const allTeams = await prisma.team.findMany();
    
    const departmentsFromUsers = [...new Set(allUsers.map(u => u.department))];
    const teamNames = allTeams.map(t => t.name);
    
    console.log('Departments from users:', departmentsFromUsers);
    console.log('Available teams:', teamNames);
    
    const missingTeams = departmentsFromUsers.filter(dept => !teamNames.includes(dept));
    const extraTeams = teamNames.filter(team => !departmentsFromUsers.includes(team));
    
    if (missingTeams.length === 0 && extraTeams.length === 0) {
      console.log('✅ All departments have corresponding teams');
    } else {
      if (missingTeams.length > 0) {
        console.log('⚠️ Missing teams for departments:', missingTeams);
      }
      if (extraTeams.length > 0) {
        console.log('⚠️ Extra teams without users:', extraTeams);
      }
    }

    console.log('\n✅ Team consistency issues fixed!');

  } catch (error) {
    console.error('Error fixing team consistency:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTeamConsistency();
