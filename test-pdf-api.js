// Test the PDF generation API locally
const { PrismaClient } = require('@prisma/client');

async function testPdfGeneration() {
  console.log('Testing PDF generation...');
  
  try {
    // Test database connection first
    console.log('Testing database connection...');
    const prisma = new PrismaClient();
    
    const projects = await prisma.project.findMany({
      take: 1,
      include: {
        tasks: true,
        members: true
      }
    });
    
    if (projects.length === 0) {
      console.log('No projects found in database');
      return;
    }
    
    const project = projects[0];
    console.log('Found project:', project.name);
    
    // Test the API endpoint
    console.log('Testing PDF API endpoint...');
    const response = await fetch(`http://localhost:3000/api/reports/project/${project.id}/pdf`);
    
    if (response.ok) {
      console.log('PDF API responded successfully!');
      const blob = await response.blob();
      console.log('PDF size:', blob.size, 'bytes');
    } else {
      console.error('PDF API failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPdfGeneration();
