const http = require('http')

// Test if server is responding to root
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
}

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)
  
  res.on('data', (d) => {
    console.log('Response length:', d.length)
  })
  
  res.on('end', () => {
    console.log('Request completed')
  })
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

req.end()
