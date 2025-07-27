const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDepartmentProjects() {
  console.log('=== DEPARTMAN PROJE ANALİZİ ===');
  
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

  const deptProjects = {};
  
  users.forEach(user => {
    if (!deptProjects[user.department]) {
      deptProjects[user.department] = {
        users: 0,
        projects: new Set(),
        tasks: 0
      };
    }
    
    deptProjects[user.department].users++;
    
    user.taskAssignments.forEach(assignment => {
      if (assignment.task && assignment.task.project) {
        deptProjects[user.department].projects.add(assignment.task.project.id);
        deptProjects[user.department].tasks++;
      }
    });
  });
  
  console.log('\nDepartman bazında proje analizi:');
  Object.entries(deptProjects).forEach(([dept, data]) => {
    console.log(`\n📊 ${dept}:`);
    console.log(`  👥 Kullanıcı sayısı: ${data.users}`);
    console.log(`  📋 Görev sayısı: ${data.tasks}`);
    console.log(`  📁 Benzersiz proje sayısı: ${data.projects.size}`);
    
    if (data.projects.size === 0 && data.tasks > 0) {
      console.log(`  ⚠️  PROBLEM: ${data.tasks} görev var ama proje yok!`);
    }
    
    // Hangi projeler olduğunu göster
    if (data.projects.size > 0) {
      console.log(`  Projeler:`);
      for (const projectId of data.projects) {
        console.log(`    - ${projectId}`);
      }
    }
  });
  
  // Ayrıca projeler tablosunu da kontrol edelim
  console.log('\n=== PROJE DURUMLARI ===');
  const projects = await prisma.project.findMany();
  projects.forEach(project => {
    console.log(`${project.name}: ${project.status}`);
  });
}

testDepartmentProjects().then(() => prisma.$disconnect()).catch(console.error);
