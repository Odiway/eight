// Debug script to test the PDF endpoint locally
const fetch = require('node-fetch');

async function testPDFEndpoint() {
  try {
    // Use the project ID that's causing the issue
    const projectId = 'cm1f3h8da000013s2a7hrmr67'; // Replace with the actual project ID
    const url = `http://localhost:3000/api/reports/project/${projectId}/pdf`;
    
    console.log('🧪 Testing PDF endpoint:', url);
    
    const response = await fetch(url);
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
    } else {
      console.log('✅ Success! PDF generated successfully');
      console.log('📄 Content length:', response.headers.get('content-length'));
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testPDFEndpoint();