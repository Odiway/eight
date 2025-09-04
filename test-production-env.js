// Test script to verify environment variables in production
const https = require('https');

async function testProductionEnv() {
  console.log('Testing production environment variables...');
  
  const testData = JSON.stringify({
    username: 'admin',
    password: 'Securepassword1',
    loginType: 'admin'
  });
  
  const options = {
    hostname: 'temsa-one.vercel.app',
    port: 443,
    path: '/api/debug',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  console.log('1. Testing debug endpoint...');
  
  const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(body);
        console.log('Debug Response:', JSON.stringify(result, null, 2));
        
        // Now test admin login (which doesn't use database)
        console.log('\n2. Testing admin login (no DB required)...');
        testAdminLogin();
        
      } catch (e) {
        console.log('Non-JSON response (might be HTML):', body.substring(0, 200) + '...');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Request error:', error);
  });
  
  req.end();
}

function testAdminLogin() {
  const loginData = JSON.stringify({
    username: 'admin',
    password: 'Securepassword1',
    loginType: 'admin'
  });
  
  const options = {
    hostname: 'temsa-one.vercel.app',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };
  
  const req = https.request(options, (res) => {
    console.log('Admin Login Status:', res.statusCode);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(body);
        console.log('Admin Login Response:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('Admin Login Raw Response:', body);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Admin Login Error:', error);
  });
  
  req.write(loginData);
  req.end();
}

// Run the test
testProductionEnv();
