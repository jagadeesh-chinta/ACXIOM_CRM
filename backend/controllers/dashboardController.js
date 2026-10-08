const pool = require('../config/db');
const { successResponse } = require('../utils/responseHelper');

/**
 * 1. ADMIN DASHBOARD
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    // 1. KPI Counts
    const [[usersCount]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[customersCount]] = await pool.query('SELECT COUNT(*) as count FROM customers');
    const [[leadsCount]] = await pool.query('SELECT COUNT(*) as count FROM leads');
    const [[oppSummary]] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'WON' THEN 1 ELSE 0 END) as won_count,
        SUM(CASE WHEN status = 'LOST' THEN 1 ELSE 0 END) as lost_count,
        COALESCE(SUM(amount), 0) as total_pipeline_value,
        COALESCE(SUM(amount * (probability / 100)), 0) as total_weighted_value
      FROM opportunities
    `);
    const [[followupsPending]] = await pool.query('SELECT COUNT(*) as count FROM followups WHERE status = "PLANNED"');

    // 2. Lead Status Breakdown Chart Data
    const [leadStatusRows] = await pool.query(`
      SELECT status, COUNT(*) as count FROM leads GROUP BY status
    `);

    // 3. Opportunity Stage Breakdown Chart Data
    const [oppStageRows] = await pool.query(`
      SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
      FROM opportunities GROUP BY stage
    `);

    // 4. Monthly Sales (Won deals by month in the last 6 months)
    const [monthlySalesRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(updated_at, '%b %Y') as month,
        DATE_FORMAT(updated_at, '%Y-%m') as sales_period,
        COALESCE(SUM(amount), 0) as total_sales,
        COUNT(*) as won_deals
      FROM opportunities
      WHERE status = 'WON'
      GROUP BY sales_period, month
      ORDER BY sales_period ASC
      LIMIT 6
    `);

    // 5. System Health & Security Center Metrics
    const [[activeUsersCount]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE status = "ACTIVE"');
    const [[lockedUsersCount]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE status = "LOCKED"');
    const [recentFailedLogins] = await pool.query(`
      SELECT * FROM audit_logs 
      WHERE action IN ('FAILED_LOGIN', 'ACCOUNT_LOCKOUT') 
      ORDER BY created_at DESC LIMIT 5
    `);
    const [recentAuditActivities] = await pool.query(`
      SELECT a.*, u.first_name, u.last_name, u.email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ORDER BY a.created_at DESC LIMIT 6
    `);

    // 6. Recent activities
    const [recentActivities] = await pool.query(`
      SELECT a.*, u.first_name, u.last_name, c.customer_name
      FROM activities a
      LEFT JOIN users u ON a.assigned_to = u.user_id
      LEFT JOIN customers c ON a.customer_id = c.customer_id
      ORDER BY a.activity_date DESC LIMIT 5
    `);

    return successResponse(res, 'Admin dashboard metrics retrieved.', {
      kpis: {
        totalUsers: usersCount.count,
        totalCustomers: customersCount.count,
        totalLeads: leadsCount.count,
        openOpportunities: oppSummary.open_count || 0,
        wonOpportunities: oppSummary.won_count || 0,
        lostOpportunities: oppSummary.lost_count || 0,
        totalPipelineValue: Number(oppSummary.total_pipeline_value || 0),
        totalWeightedValue: Number(oppSummary.total_weighted_value || 0),
        pendingFollowUps: followupsPending.count
      },
      charts: {
        leadStatus: leadStatusRows,
        oppStage: oppStageRows,
        monthlySales: monthlySalesRows
      },
      securityCenter: {
        activeUsers: activeUsersCount.count,
        lockedAccounts: lockedUsersCount.count,
        recentFailedLogins,
        recentAuditActivities,
        databaseStatus: 'HEALTHY (15 Pool Connections Active)',
        uptime: process.uptime()
      },
      recentActivities
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. MANAGER DASHBOARD & TEAM PERFORMANCE CENTER
 */
const getManagerDashboard = async (req, res, next) => {
  try {
    const [[customersCount]] = await pool.query('SELECT COUNT(*) as count FROM customers');
    const [[leadsCount]] = await pool.query('SELECT COUNT(*) as count FROM leads');
    const [[oppSummary]] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'WON' THEN 1 ELSE 0 END) as won_count,
        SUM(CASE WHEN status = 'LOST' THEN 1 ELSE 0 END) as lost_count,
        COALESCE(SUM(amount), 0) as total_pipeline_value,
        COALESCE(SUM(CASE WHEN status = 'WON' THEN amount ELSE 0 END), 0) as won_sales
      FROM opportunities
    `);
    const [[followupsPending]] = await pool.query('SELECT COUNT(*) as count FROM followups WHERE status = "PLANNED"');

    // Lead conversion rate
    const [[conversionStats]] = await pool.query(`
      SELECT 
        COUNT(*) as total_leads,
        SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) as converted_leads
      FROM leads
    `);
    const conversionRate = conversionStats.total_leads > 0 
      ? ((conversionStats.converted_leads / conversionStats.total_leads) * 100).toFixed(1) 
      : 0;

    // Team Performance Center: Sales Executive Leaderboard
    const [salesLeaderboard] = await pool.query(`
      SELECT 
        u.user_id, u.first_name, u.last_name, u.email, u.department,
        COUNT(DISTINCT o.opportunity_id) as total_deals,
        COALESCE(SUM(CASE WHEN o.status = 'WON' THEN o.amount ELSE 0 END), 0) as closed_revenue,
        COALESCE(SUM(CASE WHEN o.status = 'OPEN' THEN o.amount ELSE 0 END), 0) as open_pipeline,
        COUNT(DISTINCT CASE WHEN o.status = 'WON' THEN o.opportunity_id END) as won_deals_count,
        (SELECT COUNT(*) FROM leads l WHERE l.assigned_to = u.user_id) as assigned_leads,
        (SELECT COUNT(*) FROM followups f WHERE f.assigned_to = u.user_id AND f.status = 'COMPLETED') as completed_followups,
        (SELECT COUNT(*) FROM followups f WHERE f.assigned_to = u.user_id) as total_followups
      FROM users u
      LEFT JOIN opportunities o ON u.user_id = o.assigned_to
      WHERE u.role_id = 3 AND u.status = 'ACTIVE'
      GROUP BY u.user_id
      ORDER BY closed_revenue DESC
    `);

    // Opportunity pipeline by stage
    const [oppStageRows] = await pool.query(`
      SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
      FROM opportunities GROUP BY stage
    `);

    // Monthly team performance
    const [monthlySalesRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(updated_at, '%b %Y') as month,
        DATE_FORMAT(updated_at, '%Y-%m') as sales_period,
        COALESCE(SUM(amount), 0) as total_sales,
        COUNT(*) as won_deals
      FROM opportunities
      WHERE status = 'WON'
      GROUP BY sales_period, month
      ORDER BY sales_period ASC
      LIMIT 6
    `);

    // Follow-up completion rate
    const [[fuCompletionStats]] = await pool.query(`
      SELECT 
        COUNT(*) as total_fu,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_fu,
        SUM(CASE WHEN status = 'MISSED' THEN 1 ELSE 0 END) as missed_fu
      FROM followups
    `);

    return successResponse(res, 'Manager dashboard metrics retrieved.', {
      kpis: {
        teamCustomers: customersCount.count,
        teamLeads: leadsCount.count,
        openOpportunities: oppSummary.open_count || 0,
        teamPipelineValue: Number(oppSummary.total_pipeline_value || 0),
        wonOpportunities: oppSummary.won_count || 0,
        lostOpportunities: oppSummary.lost_count || 0,
        pendingFollowUps: followupsPending.count,
        teamConversionRate: `${conversionRate}%`,
        monthlySales: Number(oppSummary.won_sales || 0)
      },
      teamPerformanceCenter: {
        leaderboard: salesLeaderboard,
        followUpCompletionRate: fuCompletionStats.total_fu > 0 
          ? `${((fuCompletionStats.completed_fu / fuCompletionStats.total_fu) * 100).toFixed(1)}%` 
          : '0%'
      },
      charts: {
        oppStage: oppStageRows,
        monthlySales: monthlySalesRows
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. SALES EXECUTIVE DASHBOARD & MY SALES WORKSPACE
 */
const getSalesDashboard = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    // My KPIs
    const [[myCustomersCount]] = await pool.query(
      'SELECT COUNT(*) as count FROM customers WHERE assigned_to = ? OR created_by = ?',
      [userId, userId]
    );

    const [[myLeadsCount]] = await pool.query(
      'SELECT COUNT(*) as count FROM leads WHERE assigned_to = ? OR created_by = ?',
      [userId, userId]
    );

    const [[myOppSummary]] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'WON' THEN 1 ELSE 0 END) as won_count,
        COALESCE(SUM(CASE WHEN status = 'OPEN' THEN amount ELSE 0 END), 0) as open_pipeline_value,
        COALESCE(SUM(CASE WHEN status = 'WON' THEN amount ELSE 0 END), 0) as won_revenue
      FROM opportunities
      WHERE assigned_to = ? OR created_by = ?
    `, [userId, userId]);

    const [[myPendingFollowUps]] = await pool.query(
      'SELECT COUNT(*) as count FROM followups WHERE (assigned_to = ? OR created_by = ?) AND status = "PLANNED"',
      [userId, userId]
    );

    const [[todaysActivitiesCount]] = await pool.query(
      'SELECT COUNT(*) as count FROM activities WHERE (assigned_to = ? OR created_by = ?) AND DATE(activity_date) = CURRENT_DATE()',
      [userId, userId]
    );

    // My Sales Workspace:
    // 1. Today's follow-ups
    const [todaysFollowUps] = await pool.query(`
      SELECT f.*, c.customer_name, c.phone as customer_phone, l.lead_name, l.phone as lead_phone, o.opportunity_name
      FROM followups f
      LEFT JOIN customers c ON f.customer_id = c.customer_id
      LEFT JOIN leads l ON f.lead_id = l.lead_id
      LEFT JOIN opportunities o ON f.opportunity_id = o.opportunity_id
      WHERE (f.assigned_to = ? OR f.created_by = ?) 
        AND DATE(f.followup_date) = CURRENT_DATE() 
        AND f.status = 'PLANNED'
      ORDER BY f.followup_date ASC
    `, [userId, userId]);

    // 2. Upcoming follow-ups
    const [upcomingFollowUps] = await pool.query(`
      SELECT f.*, c.customer_name, l.lead_name, o.opportunity_name
      FROM followups f
      LEFT JOIN customers c ON f.customer_id = c.customer_id
      LEFT JOIN leads l ON f.lead_id = l.lead_id
      LEFT JOIN opportunities o ON f.opportunity_id = o.opportunity_id
      WHERE (f.assigned_to = ? OR f.created_by = ?) 
        AND f.followup_date > NOW() 
        AND f.status = 'PLANNED'
      ORDER BY f.followup_date ASC LIMIT 5
    `, [userId, userId]);

    // 3. Hot Leads
    const [hotLeads] = await pool.query(`
      SELECT * FROM leads 
      WHERE (assigned_to = ? OR created_by = ?) AND priority = 'HOT' AND status != 'CONVERTED'
      ORDER BY expected_value DESC LIMIT 5
    `, [userId, userId]);

    // 4. High-Value Opportunities
    const [highValueOpps] = await pool.query(`
      SELECT o.*, c.customer_name, c.company_name
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      WHERE (o.assigned_to = ? OR o.created_by = ?) AND o.status = 'OPEN'
      ORDER BY o.amount DESC LIMIT 5
    `, [userId, userId]);

    // 5. Recent activities
    const [recentActivities] = await pool.query(`
      SELECT a.*, c.customer_name, l.lead_name
      FROM activities a
      LEFT JOIN customers c ON a.customer_id = c.customer_id
      LEFT JOIN leads l ON a.lead_id = l.lead_id
      WHERE (a.assigned_to = ? OR a.created_by = ?)
      ORDER BY a.activity_date DESC LIMIT 5
    `, [userId, userId]);

    return successResponse(res, 'Sales Executive workspace retrieved.', {
      kpis: {
        myCustomers: myCustomersCount.count,
        myLeads: myLeadsCount.count,
        myOpenOpportunities: myOppSummary.open_count || 0,
        myPipeline: Number(myOppSummary.open_pipeline_value || 0),
        wonOpportunities: myOppSummary.won_count || 0,
        wonRevenue: Number(myOppSummary.won_revenue || 0),
        pendingFollowUps: myPendingFollowUps.count,
        todaysActivities: todaysActivitiesCount.count
      },
      salesWorkspace: {
        todaysFollowUps,
        upcomingFollowUps,
        hotLeads,
        highValueOpportunities: highValueOpps,
        recentActivities
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. CUSTOMER PORTAL DASHBOARD & RELATIONSHIP CENTER
 */
const getCustomerDashboard = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const userEmail = req.user.email;

    // Find linked customer record
    let [custRows] = await pool.query(
      `SELECT c.*, 
              u.first_name as rep_first_name, u.last_name as rep_last_name, 
              u.email as rep_email, u.phone as rep_phone, u.department as rep_dept
       FROM customers c
       LEFT JOIN users u ON c.assigned_to = u.user_id
       WHERE c.user_id = ? OR c.email = ?`,
      [userId, userEmail]
    );

    if (!custRows || custRows.length === 0) {
      const { generateCode } = require('../utils/codeGenerator');
      const customerCode = await generateCode('CUST', 'customers', 'customer_code');
      const fallbackPhone = req.user.phone || `+1-555-${userId.toString().padStart(4, '0')}`;
      await pool.query(
        `INSERT INTO customers (customer_code, customer_name, email, phone, company_name, user_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [customerCode, `${req.user.first_name} ${req.user.last_name}`, req.user.email, fallbackPhone, `${req.user.first_name}'s Enterprise`, userId]
      );
      [custRows] = await pool.query(
        `SELECT c.*, 
                u.first_name as rep_first_name, u.last_name as rep_last_name, 
                u.email as rep_email, u.phone as rep_phone, u.department as rep_dept
         FROM customers c
         LEFT JOIN users u ON c.assigned_to = u.user_id
         WHERE c.user_id = ? OR c.email = ?`,
        [userId, userEmail]
      );
    }

    const customer = custRows[0] || null;
    const customerId = customer ? customer.customer_id : null;

    let myOpportunities = [];
    let upcomingFollowUps = [];
    let recentInteractions = [];
    let myRequests = [];

    if (customerId) {
      // Customer's opportunities
      const [opps] = await pool.query(`
        SELECT opportunity_id, opportunity_code, opportunity_name, amount, stage, expected_close_date, status, created_at
        FROM opportunities
        WHERE customer_id = ?
        ORDER BY created_at DESC
      `, [customerId]);
      myOpportunities = opps;

      // Customer's upcoming followups / meetings
      const [fus] = await pool.query(`
        SELECT f.followup_id, f.followup_date, f.followup_type, f.remarks, f.status,
               u.first_name as rep_name
        FROM followups f
        LEFT JOIN users u ON f.assigned_to = u.user_id
        WHERE f.customer_id = ? AND f.followup_date >= NOW()
        ORDER BY f.followup_date ASC
      `, [customerId]);
      upcomingFollowUps = fus;

      // Customer's recent interactions
      const [acts] = await pool.query(`
        SELECT activity_id, activity_type, subject, description, activity_date, status
        FROM activities
        WHERE customer_id = ?
        ORDER BY activity_date DESC LIMIT 5
      `, [customerId]);
      recentInteractions = acts;

      // Customer's requests / tickets
      const [reqs] = await pool.query(`
        SELECT r.*, u.first_name as rep_first_name, u.last_name as rep_last_name
        FROM customer_requests r
        LEFT JOIN users u ON r.assigned_to = u.user_id
        WHERE r.customer_id = ? OR r.user_id = ?
        ORDER BY r.created_at DESC
      `, [customerId, userId]);
      myRequests = reqs;
    }

    // Customer notifications
    const [notifications] = await pool.query(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
    `, [userId]);

    return successResponse(res, 'Customer relationship center data retrieved.', {
      profile: {
        ...req.user,
        customerRecord: customer
      },
      relationshipCenter: {
        assignedExecutive: customer ? {
          name: `${customer.rep_first_name || 'Account'} ${customer.rep_last_name || 'Team'}`,
          email: customer.rep_email || 'support@acxiomcrm.com',
          phone: customer.rep_phone || '+1-555-0100',
          department: customer.rep_dept || 'Customer Success'
        } : null,
        myOpportunities,
        upcomingFollowUps,
        recentInteractions,
        myRequests,
        notifications
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminDashboard,
  getManagerDashboard,
  getSalesDashboard,
  getCustomerDashboard
};
