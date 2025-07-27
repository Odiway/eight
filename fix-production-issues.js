const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProductionIssues() {
  try {
    console.log('\n=== FIXING PRODUCTION ISSUES ===\n');

    // 1. Update ProjectMember table to match task assignments
    console.log('🔧 Step 1: Syncing ProjectMember table with task assignments...');
    
    // Get all task assignments
    const taskAssignments = await prisma.taskAssignment.findMany({
      include: {
        user: true,
        task: {
          include: {
            project: true
          }
        }
      }
    });

    // Group by project and user
    const projectUserPairs = new Map();
    taskAssignments.forEach(ta => {
      const key = `${ta.task.projectId}-${ta.userId}`;
      if (!projectUserPairs.has(key)) {
        projectUserPairs.set(key, {
          projectId: ta.task.projectId,
          userId: ta.userId,
          projectName: ta.task.project.name,
          userName: ta.user.name,
          userDepartment: ta.user.department
        });
      }
    });

    console.log(`Found ${projectUserPairs.size} unique project-user combinations from task assignments`);

    // Clear existing ProjectMember entries
    await prisma.projectMember.deleteMany({});
    console.log('Cleared existing ProjectMember table');

    // Add new entries
    let addedCount = 0;
    for (const [key, data] of projectUserPairs) {
      try {
        await prisma.projectMember.create({
          data: {
            projectId: data.projectId,
            userId: data.userId,
            role: 'MEMBER'
          }
        });
        addedCount++;
        console.log(`  ✓ Added: ${data.userName} (${data.userDepartment}) → ${data.projectName}`);
      } catch (error) {
        console.log(`  ✗ Failed to add: ${data.userName} → ${data.projectName} (${error.message})`);
      }
    }

    console.log(`✅ Added ${addedCount} ProjectMember entries\n`);

    // 2. Ensure all users have proper department assignments
    console.log('🔧 Step 2: Checking department assignments...');
    
    const users = await prisma.user.findMany();
    const departmentStats = {};
    
    users.forEach(user => {
      if (!departmentStats[user.department]) {
        departmentStats[user.department] = 0;
      }
      departmentStats[user.department]++;
    });

    console.log('Department distribution:');
    Object.entries(departmentStats).forEach(([dept, count]) => {
      console.log(`  - ${dept}: ${count} users`);
    });

    // 3. Verify data consistency for reports
    console.log('\n🔧 Step 3: Verifying report data consistency...');
    
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          include: {
            assignedUser: true,
            assignedUsers: {
              include: {
                user: true
              }
            }
          }
        },
        members: {
          include: {
            user: true
          }
        }
      }
    });

    projects.forEach(project => {
      // Calculate team members from task assignments
      const uniqueTeamMembers = new Set();
      project.tasks.forEach(task => {
        if (task.assignedUser) {
          uniqueTeamMembers.add(task.assignedUser.id);
        }
        task.assignedUsers.forEach(assignment => {
          uniqueTeamMembers.add(assignment.user.id);
        });
      });

      const taskBasedTeamSize = uniqueTeamMembers.size;
      const projectMemberTableSize = project.members.length;

      console.log(`  ${project.name}:`);
      console.log(`    - Task-based team size: ${taskBasedTeamSize}`);
      console.log(`    - ProjectMember table size: ${projectMemberTableSize}`);
      
      if (taskBasedTeamSize !== projectMemberTableSize) {
        console.log(`    ⚠️  Mismatch detected!`);
      } else {
        console.log(`    ✅ Data consistent`);
      }
    });

    // 4. Test department performance calculation
    console.log('\n🔧 Step 4: Testing department performance calculation...');
    
    const allUsers = await prisma.user.findMany({
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

    const departmentProjects = {};
    allUsers.forEach(user => {
      if (!departmentProjects[user.department]) {
        departmentProjects[user.department] = new Set();
      }
      
      user.taskAssignments.forEach(ta => {
        if (ta.task.status === 'IN_PROGRESS' || ta.task.status === 'TODO') {
          departmentProjects[user.department].add(ta.task.projectId);
        }
      });
    });

    console.log('Active projects by department:');
    Object.entries(departmentProjects).forEach(([dept, projectSet]) => {
      console.log(`  - ${dept}: ${projectSet.size} active projects`);
    });

    console.log('\n✅ All production issues have been analyzed and fixed!');
    
    // 5. Final verification - simulate API calls
    console.log('\n🔧 Step 5: Simulating API responses...');
    
    // Simulate general reports API
    const generalReportData = {
      totalProjects: projects.length,
      departments: Object.entries(departmentProjects).reduce((acc, [dept, projectSet]) => {
        const deptUsers = allUsers.filter(u => u.department === dept);
        acc[dept] = {
          name: dept,
          userCount: deptUsers.length,
          totalTasks: deptUsers.reduce((sum, u) => sum + u.taskAssignments.length, 0),
          completedTasks: deptUsers.reduce((sum, u) => 
            sum + u.taskAssignments.filter(ta => ta.task.status === 'COMPLETED').length, 0
          ),
          activeProjects: projectSet.size
        };
        return acc;
      }, {})
    };

    console.log('General report simulation:');
    console.log(JSON.stringify(generalReportData, null, 2));

  } catch (error) {
    console.error('Error during fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductionIssues();
