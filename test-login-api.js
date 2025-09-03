// Test login API connectivity
const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Securepassword1',
        loginType: 'admin'
      }),
    })

    const result = await response.json()
    console.log('API Response:', result)
    console.log('Status:', response.status)
  } catch (error) {
    console.error('API Error:', error)
  }
}

testLogin()
