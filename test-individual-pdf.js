// Test script to verify individual project PDF generation with all users
const testProjectPDF = async () => {
  try {
    console.log('Testing individual project PDF generation...')
    
    // Test with a sample project ID (will use mock data if no real project exists)
    const response = await fetch('http://localhost:3001/api/reports/project/test-project-id/pdf')
    
    if (response.ok) {
      console.log('✅ PDF generation successful!')
      console.log('📄 Response type:', response.headers.get('content-type'))
      console.log('📂 File name:', response.headers.get('content-disposition'))
      
      const arrayBuffer = await response.arrayBuffer()
      console.log('📏 PDF size:', arrayBuffer.byteLength, 'bytes')
      
      if (arrayBuffer.byteLength > 1000) {
        console.log('✅ PDF appears to have content (size > 1KB)')
      } else {
        console.log('⚠️ PDF might be empty or very small')
      }
    } else {
      console.log('❌ PDF generation failed')
      console.log('Status:', response.status)
      const text = await response.text()
      console.log('Error:', text)
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testProjectPDF()
