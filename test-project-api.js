const { default: fetch } = require('node-fetch');

async function testProjectAPI() {
  try {
    console.log('Testing project API...');
    
    const response = await fetch('http://localhost:3001/api/reports/project/cmdh30yxs0000o86k3fjgkj75');
    const data = await response.json();
    
    console.log('Project Name:', data.project?.name || 'Not found');
    console.log('Team Analysis Count:', data.team?.length || 0);
    
    if (data.team && data.team.length > 0) {
      console.log('\nTeam Members:');
      data.team.forEach(member => {
        console.log(`- ${member.user.name} (${member.user.department})`);
      });
    } else {
      console.log('No team data found');
    }

    console.log('\nProject Statistics:');
    console.log('- Completed Tasks:', data.statistics?.completedTasks || 0);
    console.log('- Total Tasks:', data.statistics?.totalTasks || 0);
    console.log('- Team Size:', data.statistics?.teamSize || 0);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProjectAPI();
