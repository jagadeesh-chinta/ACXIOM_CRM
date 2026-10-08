const http = require('http');
const app = require('../app');
const pool = require('../config/db');

let server;
const PORT = 5099;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...options, port: PORT, host: '127.0.0.1' }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
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

async function runTests() {
  console.log('--- Starting AcxiomCRM Architectural & Business Rule Verification ---');
  server = app.listen(PORT);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request({ path: '/api/health', method: 'GET' });
    assert(health.status === 200 && health.body.success, 'API health check responds 200');

    // 2. Unauthenticated access rejected
    const unauth = await request({ path: '/api/customers', method: 'GET' });
    assert(unauth.status === 401, 'Unauthenticated access to /api/customers rejected with 401');

    // 3. Admin login
    const adminLogin = await request({
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@acxiomcrm.com', password: 'Admin@123' });
    assert(adminLogin.status === 200 && adminLogin.body.data.token, 'Admin login succeeds with valid token');
    const adminToken = adminLogin.body.data.token;

    // 4. Sales Executive login
    const salesLogin = await request({
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'sales.alex@acxiomcrm.com', password: 'Sales@123' });
    assert(salesLogin.status === 200, 'Sales Executive login succeeds');
    const salesToken = salesLogin.body.data.token;

    // 5. Customer login
    const custLogin = await request({
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'customer.robert@cloudscale.io', password: 'Customer@123' });
    assert(custLogin.status === 200, 'Customer login succeeds');
    const custToken = custLogin.body.data.token;

    // 6. Role Authorization: Customer cannot access leads
    const custLeads = await request({
      path: '/api/leads',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${custToken}` }
    });
    assert(custLeads.status === 403, 'Customer role blocked from accessing /api/leads with 403');

    // 7. Role Authorization: Customer cannot access admin dashboard
    const custAdminDash = await request({
      path: '/api/dashboard/admin',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${custToken}` }
    });
    assert(custAdminDash.status === 403, 'Customer blocked from admin dashboard with 403');

    // 8. Admin Dashboard data
    const adminDash = await request({
      path: '/api/dashboard/admin',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(adminDash.status === 200 && adminDash.body.data.kpis.totalCustomers > 0, 'Admin dashboard returns dynamic KPI metrics');

    // 9. Validation rule: Opportunity Amount <= 0 rejected
    const invalidOpp = await request({
      path: '/api/opportunities',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    }, {
      opportunity_name: 'Invalid Test Deal',
      customer_id: 1,
      amount: -500,
      probability: 50,
      expected_close_date: '2026-12-31'
    });
    assert(invalidOpp.status === 422, 'Opportunity amount <= 0 rejected with 422 Validation Error');

    // 10. Validation rule: Probability > 100 rejected
    const invalidProb = await request({
      path: '/api/opportunities',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    }, {
      opportunity_name: 'Invalid Prob Deal',
      customer_id: 1,
      amount: 10000,
      probability: 150,
      expected_close_date: '2026-12-31'
    });
    assert(invalidProb.status === 422, 'Probability > 100 rejected with 422 Validation Error');

    // 11. Business Rule: Planned follow-up earlier than today rejected
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const invalidFollowup = await request({
      path: '/api/followups',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    }, {
      customer_id: 1,
      followup_date: pastDate.toISOString(),
      followup_type: 'CALL',
      status: 'PLANNED'
    });
    assert(invalidFollowup.status === 422 || invalidFollowup.status === 400, 'Planned follow-up with past date rejected');

    // 12. Lead conversion workflow
    const newLeadRes = await request({
      path: '/api/leads',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    }, {
      lead_name: 'Test Conversion Lead',
      email: `test.convert.${Date.now()}@enterprise.com`,
      phone: `+1-555-${Math.floor(100000 + Math.random() * 900000)}`,
      company_name: 'Conversion Tech Corp',
      status: 'QUALIFIED',
      expected_value: 95000
    });

    const leadToConvertId = newLeadRes.body.data.lead_id;

    const convertLeadRes = await request({
      path: `/api/leads/${leadToConvertId}/convert`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    }, {
      opportunity_name: 'Converted Enterprise Strata Deal',
      amount: 95000
    });
    assert(convertLeadRes.status === 200 && convertLeadRes.body.data.status === 'CONVERTED', 'Lead conversion generates customer & opportunity and sets CONVERTED status');

    // 13. Audit logs record events
    const auditRes = await request({
      path: '/api/audit',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(auditRes.status === 200 && auditRes.body.data.auditLogs.length > 0, 'Audit trail contains recorded actions');

    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed.`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    await pool.end();
  }
}

runTests();
