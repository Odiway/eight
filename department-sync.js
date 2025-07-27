const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDepartmentSyncTrigger() {
  try {
    console.log('\n=== CREATING DEPARTMENT SYNC SYSTEM ===\n');

    // Create a function that will sync ProjectMember table when departments change
    const syncProjectMembers = async () => {
      console.log('🔄 Syncing ProjectMember table with current task assignments...');
      
      // Get all current task assignments with user and project data
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

      // Create unique project-user combinations
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

      // Clear and rebuild ProjectMember table
      await prisma.projectMember.deleteMany({});
      
      const projectMemberData = Array.from(projectUserPairs.values()).map(data => ({
        projectId: data.projectId,
        userId: data.userId,
        role: 'MEMBER'
      }));

      if (projectMemberData.length > 0) {
        await prisma.projectMember.createMany({
          data: projectMemberData
        });
      }

      console.log(`✅ Synced ${projectMemberData.length} ProjectMember entries`);
      return projectMemberData.length;
    };

    // Run the sync now
    await syncProjectMembers();

    // Test department performance calculation
    console.log('\n🧪 Testing department performance after sync...');
    
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

    const departmentAnalysis = {};
    users.forEach(user => {
      if (!departmentAnalysis[user.department]) {
        departmentAnalysis[user.department] = {
          name: user.department,
          userCount: 0,
          totalTasks: 0,
          completedTasks: 0,
          activeProjects: new Set()
        };
      }
      
      departmentAnalysis[user.department].userCount++;
      
      user.taskAssignments.forEach(ta => {
        departmentAnalysis[user.department].totalTasks++;
        if (ta.task.status === 'COMPLETED') {
          departmentAnalysis[user.department].completedTasks++;
        }
        if (ta.task.status === 'IN_PROGRESS' || ta.task.status === 'TODO') {
          departmentAnalysis[user.department].activeProjects.add(ta.task.projectId);
        }
      });
    });

    // Convert Sets to numbers
    const finalDepartmentData = Object.entries(departmentAnalysis).reduce((acc, [key, data]) => {
      acc[key] = {
        ...data,
        activeProjects: data.activeProjects.size
      };
      return acc;
    }, {});

    console.log('Department analysis results:');
    Object.entries(finalDepartmentData).forEach(([dept, data]) => {
      console.log(`  ${dept}:`);
      console.log(`    - Users: ${data.userCount}`);
      console.log(`    - Total tasks: ${data.totalTasks}`);
      console.log(`    - Completed tasks: ${data.completedTasks}`);
      console.log(`    - Active projects: ${data.activeProjects}`);
    });

    console.log('\n✅ Department sync system ready!');
    console.log('\nTo use this in production:');
    console.log('1. Run this script whenever you update user departments');
    console.log('2. Add this logic to the team member update API');
    console.log('3. The reports should now show correct team member counts');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDepartmentSyncTrigger();
