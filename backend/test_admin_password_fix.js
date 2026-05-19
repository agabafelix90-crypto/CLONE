#!/usr/bin/env node

// Test the admin password fix

const clinicId = 'a7d1d753-4d70-4db5-9596-12a8230d0ea6';
const API_URL = 'http://localhost:4000/';

async function testAdminPassword() {
  console.log('Testing admin password with default "12345"...\n');
  
  try {
    const response = await fetch(`${API_URL}permitadmin.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee: 'admin',
        adminPassword: '12345',
        token: clinicId
      })
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    console.log();
    
    if (data.result === 'yes' || data.success === true) {
      console.log('✅ SUCCESS: Admin password accepted!');
      console.log('Login token:', data.login_token);
    } else if (data.success === false) {
      console.log('❌ FAILED:', data.error || data.message);
    } else {
      console.log('⚠️  UNKNOWN RESPONSE:', data);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testAdminPassword();
