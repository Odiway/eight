const http = require('http')

// Test if server is responding
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
}

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)
  console.log(`Headers:`, res.headers)
  
  res.on('data', (d) => {
    console.log('Response:', d.toString())
  })
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

// Write data to request body
const data = JSON.stringify({
  username: 'admin',
  password: 'Securepassword1',
  loginType: 'admin'
})

req.write(data)
req.end()
