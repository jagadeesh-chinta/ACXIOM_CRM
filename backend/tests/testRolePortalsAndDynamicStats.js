const pool = require('../config/db');

async function testRolePortalsAndDynamicStats() {
  console.log('--- Testing Dedicated Role Portals & Dynamic Database Metrics ---');
  let failures = 0;

  try {
    // 1. Test GET /api/auth/admin-status
    const adminStatusRes = await fetch('http://localhost:5000/api/auth/admin-status');
    const adminStatusJson = await adminStatusRes.json();
    if (adminStatusJson.success && adminStatusJson.data.adminExists === true && adminStatusJson.data.adminCount >= 1) {
      console.log('  ✓ PASS: GET /api/auth/admin-status correctly detects registered admin');
    } else {
      console.error('  ✗ FAIL: GET /api/auth/admin-status did not report existing admin:', adminStatusJson);
      failures++;
    }

    // 2. Test Attempting duplicate Admin Signup (MUST BE REJECTED)
    const duplicateAdminRes = await fetch('http://localhost:5000/api/auth/admin-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Hacker',
        last_name: 'Admin',
        email: 'secondadmin@acxiomcrm.com',
        password: 'Admin@123Second',
        phone: '+1-555-9999'
      })
    });
    const duplicateAdminJson = await duplicateAdminRes.json();
    if (duplicateAdminRes.status === 403 && duplicateAdminJson.errors?.adminExists === true) {
      console.log('  ✓ PASS: POST /api/auth/admin-register correctly blocked duplicate admin with 403');
    } else {
      console.error('  ✗ FAIL: Expected 403 duplicate admin rejection, got:', duplicateAdminRes.status, duplicateAdminJson);
      failures++;
    }

    // 3. Test Live Dynamic Stats Endpoint
    const statsRes = await fetch('http://localhost:5000/api/auth/public-stats');
    const statsJson = await statsRes.json();
    const stats = statsJson.data;

    // Direct DB count comparison
    const [[custCount]] = await pool.query('SELECT COUNT(*) as count FROM customers');
    const [[leadCount]] = await pool.query('SELECT COUNT(*) as count FROM leads');
    const [[oppCount]] = await pool.query('SELECT COUNT(*) as count FROM opportunities');
    const [[userCount]] = await pool.query('SELECT COUNT(*) as count FROM users');

    if (
      stats.totalCustomers === custCount.count &&
      stats.totalLeads === leadCount.count &&
      stats.totalOpportunities === oppCount.count &&
      stats.totalUsers === userCount.count
    ) {
      console.log(`  ✓ PASS: Dynamic stats matches MySQL DB exactly (${stats.totalCustomers} customers, ${stats.totalLeads} leads, ${stats.totalOpportunities} opps, ${stats.totalUsers} users)`);
    } else {
      console.error('  ✗ FAIL: Dynamic stats does not match DB:', { api: stats, db: { custCount, leadCount, oppCount, userCount } });
      failures++;
    }

    // 4. Test Manager Registration (/manager portal API)
    const testMgrEmail = `mgr.test.${Date.now()}@acxiomcrm.com`;
    const mgrRegisterRes = await fetch('http://localhost:5000/api/auth/manager-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'TestManager',
        last_name: 'Operations',
        email: testMgrEmail,
        password: 'Manager@1234',
        phone: '+1-555-7788',
        department: 'Regional Sales Management'
      })
    });
    const mgrRegisterJson = await mgrRegisterRes.json();
    if (mgrRegisterRes.status === 201 && mgrRegisterJson.data.user.role_name === 'MANAGER') {
      console.log('  ✓ PASS: Manager registration succeeds with role MANAGER');
    } else {
      console.error('  ✗ FAIL: Manager registration failed:', mgrRegisterRes.status, mgrRegisterJson);
      failures++;
    }

    // 5. Test Sales Executive Registration (/sales-exec portal API)
    const testSalesEmail = `sales.test.${Date.now()}@acxiomcrm.com`;
    const salesRegisterRes = await fetch('http://localhost:5000/api/auth/sales-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'TestSales',
        last_name: 'Executive',
        email: testSalesEmail,
        password: 'Sales@1234',
        phone: '+1-555-4433',
        department: 'Strategic Accounts'
      })
    });
    const salesRegisterJson = await salesRegisterRes.json();
    if (salesRegisterRes.status === 201 && salesRegisterJson.data.user.role_name === 'SALES_EXECUTIVE') {
      console.log('  ✓ PASS: Sales Executive registration succeeds with role SALES_EXECUTIVE');
    } else {
      console.error('  ✗ FAIL: Sales Executive registration failed:', salesRegisterRes.status, salesRegisterJson);
      failures++;
    }

    // 6. Test Logging in with the newly registered manager and sales exec
    const mgrLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testMgrEmail, password: 'Manager@1234' })
    });
    const mgrLoginJson = await mgrLoginRes.json();

    const salesLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testSalesEmail, password: 'Sales@1234' })
    });
    const salesLoginJson = await salesLoginRes.json();

    if (mgrLoginJson.success && mgrLoginJson.data.user.role_name === 'MANAGER' &&
        salesLoginJson.success && salesLoginJson.data.user.role_name === 'SALES_EXECUTIVE') {
      console.log('  ✓ PASS: Newly registered Manager & Sales Exec authenticated successfully');
    } else {
      console.error('  ✗ FAIL: Login failed for newly registered roles');
      failures++;
    }

    // 7. Verify dynamic stats updated immediately with new user counts
    const updatedStatsRes = await fetch('http://localhost:5000/api/auth/public-stats');
    const updatedStatsJson = await updatedStatsRes.json();
    if (updatedStatsJson.data.totalUsers === stats.totalUsers + 2) {
      console.log(`  ✓ PASS: Dynamic stats automatically updated in real-time (${updatedStatsJson.data.totalUsers} total users)`);
    } else {
      console.error('  ✗ FAIL: Dynamic stats did not reflect new users');
      failures++;
    }

    // Clean up temporary test accounts
    await pool.query('DELETE FROM users WHERE email IN (?, ?)', [testMgrEmail, testSalesEmail]);
    console.log('  ✓ Cleaned up temporary test accounts from database.');

    console.log(`\nAll Dedicated Portals & Real DB Metrics Verified! Failures: ${failures}`);
  } catch (err) {
    console.error('Test execution error:', err);
    failures++;
  } finally {
    process.exit(failures > 0 ? 1 : 0);
  }
}

testRolePortalsAndDynamicStats();
