const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugProductionData() {
  try {
    console.log('\n=== DATABASE ANALYSIS ===\n');

    // Check projects
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

    console.log('📊 PROJECTS:');
    projects.forEach(project => {
      console.log(`  - ${project.name}: ${project.tasks.length} tasks, ${project.members.length} members`);
    });

    // Check users and departments
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
        },
        projects: {
          include: {
            project: true
          }
        }
      }
    });

    console.log('\n👥 USERS BY DEPARTMENT:');
    const departmentCounts = {};
    users.forEach(user => {
      if (!departmentCounts[user.department]) {
        departmentCounts[user.department] = [];
      }
      departmentCounts[user.department].push({
        name: user.name,
        taskAssignments: user.taskAssignments.length,
        projectMemberships: user.projects.length
      });
    });

    Object.entries(departmentCounts).forEach(([dept, userList]) => {
      console.log(`  ${dept} (${userList.length} users):`);
      userList.forEach(user => {
        console.log(`    - ${user.name}: ${user.taskAssignments} task assignments, ${user.projectMemberships} project memberships`);
      });
    });

    // Check ProjectMember table
    const projectMembers = await prisma.projectMember.findMany({
      include: {
        user: true,
        project: true
      }
    });

    console.log('\n🔗 PROJECT MEMBERS TABLE:');
    console.log(`Total entries: ${projectMembers.length}`);
    projectMembers.forEach(pm => {
      console.log(`  - ${pm.user.name} (${pm.user.department}) → ${pm.project.name}`);
    });

    // Check TaskAssignment table
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

    console.log('\n📋 TASK ASSIGNMENTS:');
    console.log(`Total entries: ${taskAssignments.length}`);
    const assignmentsByProject = {};
    taskAssignments.forEach(ta => {
      const projectName = ta.task.project.name;
      if (!assignmentsByProject[projectName]) {
        assignmentsByProject[projectName] = new Set();
      }
      assignmentsByProject[projectName].add(`${ta.user.name} (${ta.user.department})`);
    });

    Object.entries(assignmentsByProject).forEach(([project, users]) => {
      console.log(`  ${project}: ${users.size} unique users`);
      Array.from(users).forEach(user => {
        console.log(`    - ${user}`);
      });
    });

    console.log('\n=== ANALYSIS COMPLETE ===\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProductionData();
