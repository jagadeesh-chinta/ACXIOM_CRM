const pool = require('../config/db');

async function testCustomerProfileAndSettings() {
  console.log('--- Testing Customer Profile, Settings, and Account Deletion ---');
  let failures = 0;

  try {
    // 1. Register a new Customer with name@gmail.com
    const timestamp = Date.now();
    const testEmail = `johndoe${timestamp}@gmail.com`;
    const testPhone = `+1-555-${timestamp.toString().slice(-4)}`;
    const updatedPhone = `+1-555-${(timestamp + 1).toString().slice(-4)}`;
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        email: testEmail,
        password: 'Password@123',
        phone: testPhone,
        company_name: 'Acme Cloud Dynamics'
      })
    });
    const regJson = await regRes.json();
    if (regRes.status !== 201 || !regJson.data?.token) {
      console.error('  ✗ FAIL: Customer registration failed:', regJson);
      failures++;
    } else {
      console.log('  ✓ PASS: Customer registered with name@gmail.com format');
    }

    const token = regJson.data.token;
    const userId = regJson.data.user.user_id;

    // 2. Fetch Customer Profile via GET /api/customer-portal/profile
    const profRes = await fetch('http://localhost:5000/api/customer-portal/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profJson = await profRes.json();
    if (
      profRes.status === 200 &&
      profJson.data?.customerRecord?.company_name === 'Acme Cloud Dynamics' &&
      profJson.data?.customerRecord?.email === testEmail
    ) {
      console.log(`  ✓ PASS: Customer Profile retrieved dynamic database details (Code: ${profJson.data.customerRecord.customer_code}, Company: ${profJson.data.customerRecord.company_name})`);
    } else {
      console.error('  ✗ FAIL: Customer profile does not match dynamic database record:', profJson);
      failures++;
    }

    // 3. Update Customer Profile via PUT /api/customer-portal/profile
    const updateRes = await fetch('http://localhost:5000/api/customer-portal/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        first_name: 'Johnny',
        last_name: 'Doel',
        phone: updatedPhone,
        company_name: 'Acme Global Ventures LLC',
        address: '500 Tech Blvd',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701'
      })
    });
    const updateJson = await updateRes.json();
    if (updateRes.status === 200 && updateJson.success) {
      console.log('  ✓ PASS: PUT /api/customer-portal/profile updated customer details successfully');
    } else {
      console.error('  ✗ FAIL: Profile update failed:', updateJson);
      failures++;
    }

    // Verify in MySQL database directly
    const [[custInDb]] = await pool.query('SELECT * FROM customers WHERE email = ?', [testEmail]);
    if (custInDb && custInDb.company_name === 'Acme Global Ventures LLC' && custInDb.city === 'Austin') {
      console.log('  ✓ PASS: MySQL database record confirmed updated with dynamic customer data');
    } else {
      console.error('  ✗ FAIL: Database record did not update:', custInDb);
      failures++;
    }

    // 4. Test Permanent Account Deletion via DELETE /api/auth/delete-account
    const delRes = await fetch('http://localhost:5000/api/auth/delete-account', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const delJson = await delRes.json();
    if (delRes.status === 200 && delJson.success) {
      console.log('  ✓ PASS: DELETE /api/auth/delete-account permanently deleted the account');
    } else {
      console.error('  ✗ FAIL: Delete account failed:', delJson);
      failures++;
    }

    // Verify user is gone from MySQL
    const [[userInDb]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE user_id = ?', [userId]);
    if (userInDb.count === 0) {
      console.log('  ✓ PASS: Confirmed user record is completely removed from MySQL database');
    } else {
      console.error('  ✗ FAIL: User still exists in database after deletion!');
      failures++;
    }

    // Clean up customer record
    await pool.query('DELETE FROM customers WHERE email = ?', [testEmail]);

    console.log(`\nAll Customer Account & Settings tests finished! Failures: ${failures}`);
  } catch (err) {
    console.error('Test execution error:', err);
    failures++;
  } finally {
    try { await pool.end(); } catch (e) {}
    process.exit(failures > 0 ? 1 : 0);
  }
}

testCustomerProfileAndSettings();
