const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function directProjectTest() {
  try {
    console.log('Direct project test...');
    
    const project = await prisma.project.findUnique({
      where: { id: 'cmdh30yxs0000o86k3fjgkj75' },
      include: {
        tasks: {
          include: {
            assignedUser: true,
            assignedUsers: {
              include: {
                user: true,
              },
            },
          },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      console.log('Project not found!');
      return;
    }

    console.log('Project found:', project.name);
    console.log('Total tasks:', project.tasks.length);
    console.log('ProjectMember table entries:', project.members.length);

    // Calculate unique team members from task assignments
    const uniqueTeamMembers = new Set();
    const teamMembersMap = new Map();

    project.tasks.forEach(task => {
      if (task.assignedUser) {
        uniqueTeamMembers.add(task.assignedUser.id);
        teamMembersMap.set(task.assignedUser.id, {
          user: task.assignedUser,
          role: 'Ekip Üyesi'
        });
      }
      
      task.assignedUsers.forEach(assignment => {
        uniqueTeamMembers.add(assignment.user.id);
        teamMembersMap.set(assignment.user.id, {
          user: assignment.user,
          role: 'Ekip Üyesi'
        });
      });
    });

    console.log('Unique team members from tasks:', uniqueTeamMembers.size);
    console.log('Team members map size:', teamMembersMap.size);

    const actualTeamMembers = Array.from(teamMembersMap.values());
    console.log('Actual team members array length:', actualTeamMembers.length);

    if (actualTeamMembers.length > 0) {
      console.log('\nTeam members:');
      actualTeamMembers.slice(0, 5).forEach(member => {
        console.log(`- ${member.user.name} (${member.user.department})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

directProjectTest();
