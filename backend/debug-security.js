const axios = require('axios');

// Clinic ID from the conversation
const clinicId = '743da65d-683d-499a-8760-a051014436cc';

async function testSecurity() {
  try {
    console.log('Testing /security endpoint with token:', clinicId);
    
    const response = await axios.post('http://localhost:4000/security', {
      token: clinicId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n=== Security Endpoint Response ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n=== Key Values ===');
    console.log('isFirstLogin:', response.data.isFirstLogin);
    console.log('admin_password_changed:', response.data.admin_password_changed);
    console.log('employee_count:', response.data.employee_count);
    console.log('drug_count:', response.data.drug_count);
    console.log('facilityConfigCount:', response.data.facilityConfigCount);
    console.log('canFinishOnboarding:', response.data.canFinishOnboarding);
    
  } catch (error) {
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testSecurity();
