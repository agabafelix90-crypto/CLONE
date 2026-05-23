const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:4173';
const API_HOST = 'http://localhost:4000';

async function runScenario(name, setup, securityHandler, expect) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let securityRequests = [];
  let otherRequests = [];

  page.on('console', msg => console.log('[BROWSER]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));
  page.on('request', (request) => {
    if (request.url().includes('/security.php') || request.url().includes('/fetchcontacts.php') || request.url().includes('/testsavailable.php') || request.url().includes('/radiologytestsavailable.php') || request.url().includes('/fetchpermissions.php')) {
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    }
  });

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.includes('/security.php')) {
      console.log(`[route] ${url}`);
      securityRequests.push(url);
      return await securityHandler(route);
    }

    if (url.includes('/fetchcontacts.php') || url.includes('/testsavailable.php') || url.includes('/radiologytestsavailable.php')) {
      return await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }

    if (url.includes('/fetchpermissions.php') || url.includes('/fetchpermissions2.php')) {
      return await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, permissions: ['triage'] }) });
    }

    if (url.startsWith(API_HOST) || url.includes('://localhost:4000')) {
      console.log(`[route fallback] ${url}`);
      return await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }

    return await route.continue();
  });

  await setup(page);
  await expect(page, securityRequests, otherRequests);
  await browser.close();
}

(async () => {
  const results = [];

  try {
    await runScenario(
      'Direct URL token should validate and load',
      async (page) => {
        await page.goto(`${BASE_URL}/triage?token=valid-token-here`, { waitUntil: 'networkidle' });
      },
      async (route) => {
        return await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Session valid',
            employee_name: 'Alice',
            colour: 'white',
            clinic_session_token: 'valid-token-here',
            consultation_fee: 0,
          }),
        });
      },
      async (page, securityRequests) => {
        const finalUrl = page.url();
        console.log('DIRECT FINAL URL', finalUrl);
        console.log('DIRECT securityRequests', securityRequests.length);
        if (securityRequests.length < 1) {
          console.log('DIRECT page HTML snippet', (await page.content()).slice(0,200));
          throw new Error('Expected at least one security request on direct URL token flow');
        }
        if (!finalUrl.includes('/triage')) {
          throw new Error('Expected to remain on /triage after valid URL token access');
        }
        await page.waitForTimeout(500);
        if (finalUrl.endsWith('/login')) throw new Error('Unexpected redirect to login for valid URL token');
        results.push('direct-pass');
      }
    );

    await runScenario(
      'Missing token should redirect to /login before security check',
      async (page) => {
        await page.goto(`${BASE_URL}/triage`, { waitUntil: 'networkidle' });
      },
      async (route) => {
        throw new Error('security.php should not be called when token is missing and immediate redirect occurs');
      },
      async (page, securityRequests) => {
        if (securityRequests.length !== 0) throw new Error('Expected no security requests when token is missing');
        await page.waitForURL('**/login', { timeout: 3000 });
        results.push('missing-token-pass');
      }
    );

    await runScenario(
      'Logged-in flow should use storage token',
      async (page) => {
        await page.addInitScript(() => {
          window.localStorage.setItem('clinic_auth_token', 'stored-valid-token');
        });
        await page.goto(`${BASE_URL}/triage`, { waitUntil: 'networkidle' });
      },
      async (route) => {
        const requestBody = JSON.parse((await route.request().postData()) || '{}');
        if (requestBody.token !== 'stored-valid-token') {
          return await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Invalid token sent to security' }),
          });
        }
        return await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Session valid',
            employee_name: 'Bob',
            colour: 'blue',
            clinic_session_token: 'stored-valid-token',
            consultation_fee: 0,
          }),
        });
      },
      async (page, securityRequests) => {
        if (securityRequests.length < 1) throw new Error('Expected at least one security request for login storage flow');
        await page.waitForTimeout(500);
        const url = page.url();
        if (url.endsWith('/login')) throw new Error('Unexpected redirect to login for valid stored token');
        results.push('storage-pass');
      }
    );

    await runScenario(
      'Invalid token / expired should redirect to /login',
      async (page) => {
        await page.goto(`${BASE_URL}/triage?token=invalid-token`, { waitUntil: 'networkidle' });
      },
      async (route) => {
        return await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Unauthorized or invalid token' }),
        });
      },
      async (page, securityRequests) => {
        if (securityRequests.length < 1) throw new Error('Expected at least one security request for invalid token flow');
        await page.waitForURL('**/login', { timeout: 3000 });
        results.push('invalid-pass');
      }
    );

    console.log('TEST RESULTS:', results);
    if (results.length !== 4) {
      throw new Error('One or more scenarios failed');
    }
    process.exit(0);
  } catch (error) {
    console.error('TEST FAILED:', error);
    process.exit(1);
  }
})();
