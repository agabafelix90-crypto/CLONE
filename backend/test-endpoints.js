#!/usr/bin/env node

// Simple test script to verify backend endpoints
const http = require('http');

const BASE_URL = 'http://localhost:4000';

function testEndpoint(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

const { startServer } = require('./src/index');

async function runTests() {
  console.log('Testing Medical Health Management Backend...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await testEndpoint('/api/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data)}\n`);

    // Test legacy endpoint (will fail until database is set up)
    console.log('2. Testing legacy endpoint (fetchdrugs.php)...');
    const drugs = await testEndpoint('/fetchdrugs.php');
    console.log(`   Status: ${drugs.status}`);
    console.log(`   Response: ${JSON.stringify(drugs.data)}\n`);

    console.log('Tests completed. If you see database errors, make sure to:');
    console.log('1. Run the SQL schema in your Supabase dashboard');
    console.log('2. Update backend/.env with your service role key');

  } catch (error) {
    console.error('Test failed:', error.message || error);
    process.exitCode = 1;
  }
}

(async () => {
  let server;
  try {
    server = startServer();
    await runTests();
  } catch (error) {
    console.error('Test runner failed:', error.message || error);
    process.exitCode = 1;
  } finally {
    if (server && server.close) {
      server.close();
    }
  }
})();