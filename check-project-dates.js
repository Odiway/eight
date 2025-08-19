const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProjectDates() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        delayDays: true,
        status: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('=== RECENT PROJECTS FROM DB ===');
    projects.forEach(p => {
      console.log(`ID: ${p.id}`);
      console.log(`Name: ${p.name}`);
      console.log(`Start Date: ${p.startDate}`);
      console.log(`End Date: ${p.endDate}`);
      console.log(`Delay Days: ${p.delayDays}`);
      console.log(`Status: ${p.status}`);
      console.log('---');
    });

    // Also check tasks for one project
    if (projects.length > 0) {
      const projectId = projects[0].id;
      const tasks = await prisma.task.findMany({
        where: { projectId },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          status: true,
          completedAt: true
        },
        take: 3
      });

      console.log(`\n=== TASKS FOR PROJECT ${projectId} ===`);
      tasks.forEach(t => {
        console.log(`Task: ${t.title}`);
        console.log(`Start: ${t.startDate}`);
        console.log(`End: ${t.endDate}`);
        console.log(`Status: ${t.status}`);
        console.log(`Completed: ${t.completedAt}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectDates();
