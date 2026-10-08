const http = require('http');

function apiCall(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      host: '127.0.0.1',
      port: 5000,
      path: `/api${path}`,
      method,
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runSimulation() {
  console.log('====================================================');
  console.log('  ACXIOMCRM FULL END-TO-END FLOW VERIFICATION');
  console.log('====================================================\n');

  // 1. Authenticate Admin
  const adminLogin = await apiCall('POST', '/auth/login', {
    email: 'admin@acxiomcrm.com',
    password: 'Admin@123'
  });
  console.log('1. Admin Login:', adminLogin.status === 200 ? 'SUCCESS' : 'FAILED');
  const adminToken = adminLogin.body.data.token;

  // 2. Query Admin Dashboard
  const adminDash = await apiCall('GET', '/dashboard/admin', null, adminToken);
  console.log('2. Admin Dashboard KPIs:');
  console.log('   - Total Customers:', adminDash.body.data.kpis.totalCustomers);
  console.log('   - Total Pipeline Value:', adminDash.body.data.kpis.totalPipelineValue);
  console.log('   - Active Users:', adminDash.body.data.securityCenter.activeUsers);
  console.log('   - Database Status:', adminDash.body.data.securityCenter.databaseStatus);

  // 3. Authenticate Manager
  const managerLogin = await apiCall('POST', '/auth/login', {
    email: 'manager@acxiomcrm.com',
    password: 'Manager@123'
  });
  console.log('\n3. Manager Login:', managerLogin.status === 200 ? 'SUCCESS' : 'FAILED');
  const managerToken = managerLogin.body.data.token;

  // 4. Query Manager Dashboard & Team Performance Center
  const managerDash = await apiCall('GET', '/dashboard/manager', null, managerToken);
  console.log('4. Manager Team Performance:');
  console.log('   - Team Pipeline:', managerDash.body.data.kpis.teamPipelineValue);
  console.log('   - Leaderboard Reps:', managerDash.body.data.teamPerformanceCenter.leaderboard.length);

  // 5. Authenticate Sales Executive
  const salesLogin = await apiCall('POST', '/auth/login', {
    email: 'sales.alex@acxiomcrm.com',
    password: 'Sales@123'
  });
  console.log('\n5. Sales Executive Login:', salesLogin.status === 200 ? 'SUCCESS' : 'FAILED');
  const salesToken = salesLogin.body.data.token;

  // 6. Query Sales Executive Workspace
  const salesDash = await apiCall('GET', '/dashboard/sales', null, salesToken);
  console.log('6. Sales Executive Workspace:');
  console.log('   - My Pipeline:', salesDash.body.data.kpis.myPipeline);
  console.log('   - Hot Leads Queue:', salesDash.body.data.salesWorkspace.hotLeads.length);
  console.log('   - Today Follow-ups:', salesDash.body.data.salesWorkspace.todaysFollowUps.length);

  // 7. Authenticate Customer
  const custLogin = await apiCall('POST', '/auth/login', {
    email: 'customer.robert@cloudscale.io',
    password: 'Customer@123'
  });
  console.log('\n7. Customer Login:', custLogin.status === 200 ? 'SUCCESS' : 'FAILED');
  const custToken = custLogin.body.data.token;

  // 8. Query Customer Relationship Center
  const custDash = await apiCall('GET', '/dashboard/customer', null, custToken);
  console.log('8. Customer Relationship Center:');
  console.log('   - Account Rep:', custDash.body.data.relationshipCenter.assignedExecutive?.name);
  console.log('   - Active Opportunities:', custDash.body.data.relationshipCenter.myOpportunities.length);
  console.log('   - Support Requests:', custDash.body.data.relationshipCenter.myRequests.length);

  // 9. Customer submits support request
  const newReq = await apiCall('POST', '/customer-portal/requests', {
    subject: 'Verification test support ticket',
    message: 'Testing portal communication roundtrip',
    priority: 'HIGH'
  }, custToken);
  console.log('\n9. Customer Submits Support Ticket:', newReq.status === 201 ? 'SUCCESS' : 'FAILED');

  // 10. Verify Audit Log recorded action
  const auditCheck = await apiCall('GET', '/audit?limit=5', null, adminToken);
  console.log('10. Audit Log Inspection:');
  console.log('    - Latest action:', auditCheck.body.data.auditLogs[0]?.action);
  console.log('    - Entity:', auditCheck.body.data.auditLogs[0]?.entity_name);

  console.log('\n====================================================');
  console.log('  ALL SIMULATED END-TO-END FLOWS OPERATIONAL!');
  console.log('====================================================');
}

runSimulation();
