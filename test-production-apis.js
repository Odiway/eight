const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductionAPIs() {
  try {
    console.log('\n=== TESTING PRODUCTION APIS ===\n');

    // Test 1: General Reports API data
    console.log('🧪 Test 1: Simulating General Reports API...');
    
    const users = await prisma.user.findMany({
      include: {
        taskAssignments: {
          include: {
            task: {
              include: {
                project: true
              }
            }
          }
        }
      }
    });

    const tasks = await prisma.task.findMany({
      include: {
        project: true,
        assignedUser: true,
        assignedUsers: {
          include: {
            user: true
          }
        }
      }
    });

    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: {
            user: true
          }
        },
        tasks: true
      }
    });

    // Calculate department data
    const departmentData = users.reduce((acc, user) => {
      if (!acc[user.department]) {
        acc[user.department] = {
          name: user.department,
          userCount: 0,
          totalTasks: 0,
          completedTasks: 0,
          activeProjects: new Set()
        };
      }
      
      acc[user.department].userCount++;
      
      user.taskAssignments.forEach(ta => {
        acc[user.department].totalTasks++;
        if (ta.task.status === 'COMPLETED') {
          acc[user.department].completedTasks++;
        }
        if (ta.task.status === 'IN_PROGRESS' || ta.task.status === 'TODO') {
          acc[user.department].activeProjects.add(ta.task.projectId);
        }
      });
      
      return acc;
    }, {});

    // Convert Sets to numbers
    const finalDepartmentData = Object.entries(departmentData).reduce((acc, [key, data]) => {
      acc[key] = {
        ...data,
        activeProjects: data.activeProjects.size
      };
      return acc;
    }, {});

    console.log('General Reports API Result:');
    console.log(JSON.stringify({
      totalProjects: projects.length,
      totalTasks: tasks.length,
      departments: finalDepartmentData
    }, null, 2));

    // Test 2: Project-specific reports
    console.log('\n🧪 Test 2: Testing Project-specific reports...');
    
    for (const project of projects) {
      // Calculate team members from task assignments
      const uniqueTeamMembers = new Set();
      project.tasks.forEach(task => {
        const taskWithAssignments = tasks.find(t => t.id === task.id);
        if (taskWithAssignments) {
          if (taskWithAssignments.assignedUser) {
            uniqueTeamMembers.add(taskWithAssignments.assignedUser.id);
          }
          taskWithAssignments.assignedUsers.forEach(assignment => {
            uniqueTeamMembers.add(assignment.user.id);
          });
        }
      });

      const projectMemberTableSize = project.members.length;
      const taskBasedTeamSize = uniqueTeamMembers.size;

      console.log(`  ${project.name}:`);
      console.log(`    - ProjectMember table: ${projectMemberTableSize} members`);
      console.log(`    - Task assignments: ${taskBasedTeamSize} unique users`);
      console.log(`    - Status: ${projectMemberTableSize === taskBasedTeamSize ? '✅ Consistent' : '⚠️ Inconsistent'}`);
    }

    // Test 3: Team page data
    console.log('\n🧪 Test 3: Testing Team page data...');
    
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });

    console.log('Teams and their members:');
    teams.forEach(team => {
      console.log(`  ${team.name} (${team.members.length} members):`);
      team.members.forEach(member => {
        console.log(`    - ${member.user.name} (${member.user.department})`);
      });
    });

    // Test 4: Department consistency check
    console.log('\n🧪 Test 4: Department consistency check...');
    
    const departmentFromUsers = [...new Set(users.map(u => u.department))];
    const departmentFromTeams = teams.map(t => t.name);
    
    console.log('Departments from users:', departmentFromUsers);
    console.log('Team names:', departmentFromTeams);
    
    const missingDepartments = departmentFromUsers.filter(dept => !departmentFromTeams.includes(dept));
    const extraTeams = departmentFromTeams.filter(team => !departmentFromUsers.includes(team));
    
    if (missingDepartments.length > 0) {
      console.log('⚠️ Missing team definitions:', missingDepartments);
    }
    
    if (extraTeams.length > 0) {
      console.log('⚠️ Extra teams (no users):', extraTeams);
    }
    
    if (missingDepartments.length === 0 && extraTeams.length === 0) {
      console.log('✅ Teams and departments are consistent');
    }

    console.log('\n✅ All production API tests completed!');

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProductionAPIs();
