const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDepartmentAPI() {
  console.log('=== DEPARTMAN API ÇIKTI TESTİ ===');
  
  const users = await prisma.user.findMany({
    include: {
      taskAssignments: {
        include: {
          task: {
            include: {
              project: true,
            },
          },
        },
      },
    },
    orderBy: {
      department: 'asc',
    },
  });

  // API kodunu simüle et
  const departmentAnalysis = users.reduce((acc, user) => {
    if (!acc[user.department]) {
      acc[user.department] = {
        users: [],
        statistics: {
          totalUsers: 0,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          activeProjects: new Set(),
          completedProjects: new Set(),
        },
      }
    }

    // Task assignments'dan görevleri al
    const uniqueTasks = user.taskAssignments.map(assignment => assignment.task);
    
    const userActiveProjects = new Set();
    const userCompletedProjects = new Set();
    
    uniqueTasks.forEach((task) => {
      if (task.project) {
        console.log(`User: ${user.name}, Task: ${task.title}, Project: ${task.project.name}, Status: ${task.project.status}`);
        if (
          task.project.status === 'IN_PROGRESS' ||
          task.project.status === 'PLANNING'
        ) {
          userActiveProjects.add(task.project.id);
          acc[user.department].statistics.activeProjects.add(task.project.id);
        } else if (task.project.status === 'COMPLETED') {
          userCompletedProjects.add(task.project.id);
          acc[user.department].statistics.completedProjects.add(task.project.id);
        }
      }
    });

    acc[user.department].users.push({
      name: user.name,
      activeProjects: userActiveProjects.size,
    });

    return acc;
  }, {});

  console.log('\n=== DEPARTMAN SONUÇLARI ===');
  Object.entries(departmentAnalysis).forEach(([dept, data]) => {
    console.log(`\n📊 ${dept}:`);
    console.log(`  Aktif Projeler: ${data.statistics.activeProjects.size}`);
    console.log(`  Tamamlanan Projeler: ${data.statistics.completedProjects.size}`);
    console.log(`  Kullanıcılar:`);
    data.users.forEach(user => {
      console.log(`    - ${user.name}: ${user.activeProjects} aktif proje`);
    });
  });
}

testDepartmentAPI().then(() => prisma.$disconnect()).catch(console.error);
