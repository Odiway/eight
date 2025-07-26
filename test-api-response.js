async function testGeneralAPI() {
  try {
    // Use node-fetch if needed, but first try with basic fetch
    const { default: fetch } = await import('node-fetch');
    
    const response = await fetch('http://localhost:3000/api/reports/general')
    
    if (!response.ok) {
      console.error('API response not OK:', response.status)
      return
    }
    
    const data = await response.json()
    
    console.log('📊 API Response Structure:')
    console.log('Summary:', data.summary)
    console.log('\n🎯 Projects:')
    
    if (data.projects && data.projects.length > 0) {
      data.projects.forEach((project, index) => {
        console.log(`\n--- Project ${index + 1}: ${project.name} ---`)
        console.log(`Members count: ${project.members?.length || 'undefined'}`)
        console.log(`Tasks count: ${project.tasks?.length || 'undefined'}`)
        console.log(`TeamSize: ${project.teamSize || 'undefined'}`)
        
        if (project.members && project.members.length > 0) {
          console.log('Members structure:')
          project.members.forEach((member, i) => {
            console.log(`  ${i + 1}. ${JSON.stringify(member)}`)
          })
        } else {
          console.log('❌ No members in API response!')
        }
        
        if (project.tasks && project.tasks.length > 0) {
          console.log(`Tasks structure (first 2):`)
          project.tasks.slice(0, 2).forEach((task, i) => {
            console.log(`  ${i + 1}. ${JSON.stringify(task)}`)
          })
        }
      })
    }
    
    console.log('\n🔍 Full Projects Structure (first project):')
    if (data.projects && data.projects[0]) {
      console.log(JSON.stringify(data.projects[0], null, 2))
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message)
    console.log('Make sure the development server is running on http://localhost:3000')
  }
}

testGeneralAPI()
