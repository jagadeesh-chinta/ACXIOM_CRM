const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Helper to convert array of objects to CSV format string
 */
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers
      .map(fieldName => {
        let val = row[fieldName];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'object') val = JSON.stringify(val);
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Date range helper
 */
function getDateCondition(range, column) {
  if (range === 'today') {
    return `DATE(${column}) = CURRENT_DATE()`;
  } else if (range === 'this_week') {
    return `YEARWEEK(${column}, 1) = YEARWEEK(CURRENT_DATE(), 1)`;
  } else if (range === 'this_month') {
    return `YEAR(${column}) = YEAR(CURRENT_DATE()) AND MONTH(${column}) = MONTH(CURRENT_DATE())`;
  }
  return null;
}

/**
 * 1. Customer Report
 */
const getCustomerReport = async (req, res, next) => {
  try {
    const { range, status, format } = req.query;
    const where = [];
    const params = [];

    if (req.user.role_name === 'SALES_EXECUTIVE') {
      where.push('(c.assigned_to = ? OR c.created_by = ?)');
      params.push(req.user.user_id, req.user.user_id);
    }

    if (status) {
      where.push('c.status = ?');
      params.push(status);
    }

    const dateCond = getDateCondition(range, 'c.created_at');
    if (dateCond) where.push(dateCond);

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT c.customer_code, c.customer_name, c.email, c.phone, c.company_name, 
             c.city, c.state, c.status, c.created_at,
             CONCAT(u.first_name, ' ', u.last_name) as assigned_agent,
             (SELECT COUNT(*) FROM opportunities o WHERE o.customer_id = c.customer_id) as total_deals,
             (SELECT COALESCE(SUM(o.amount), 0) FROM opportunities o WHERE o.customer_id = c.customer_id) as total_deal_value
      FROM customers c
      LEFT JOIN users u ON c.assigned_to = u.user_id
      ${whereClause}
      ORDER BY c.created_at DESC
    `;

    const [rows] = await pool.query(query, params);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="customers-report.csv"');
      return res.status(200).send(convertToCSV(rows));
    }

    return successResponse(res, 'Customer report generated.', { report: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Lead Report
 */
const getLeadReport = async (req, res, next) => {
  try {
    const { range, status, priority, format } = req.query;
    const where = [];
    const params = [];

    if (req.user.role_name === 'SALES_EXECUTIVE') {
      where.push('(l.assigned_to = ? OR l.created_by = ?)');
      params.push(req.user.user_id, req.user.user_id);
    }

    if (status) {
      where.push('l.status = ?');
      params.push(status);
    }

    if (priority) {
      where.push('l.priority = ?');
      params.push(priority);
    }

    const dateCond = getDateCondition(range, 'l.created_at');
    if (dateCond) where.push(dateCond);

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT l.lead_code, l.lead_name, l.email, l.phone, l.company_name,
             l.source, l.status, l.priority, l.expected_value, l.created_at,
             CONCAT(u.first_name, ' ', u.last_name) as assigned_agent
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.user_id
      ${whereClause}
      ORDER BY l.created_at DESC
    `;

    const [rows] = await pool.query(query, params);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads-report.csv"');
      return res.status(200).send(convertToCSV(rows));
    }

    return successResponse(res, 'Lead report generated.', { report: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Follow-Up Report
 */
const getFollowupReport = async (req, res, next) => {
  try {
    const { range, status, type, format } = req.query;
    const where = [];
    const params = [];

    if (req.user.role_name === 'SALES_EXECUTIVE') {
      where.push('(f.assigned_to = ? OR f.created_by = ?)');
      params.push(req.user.user_id, req.user.user_id);
    }

    if (status) {
      where.push('f.status = ?');
      params.push(status);
    }

    if (type) {
      where.push('f.followup_type = ?');
      params.push(type);
    }

    const dateCond = getDateCondition(range, 'f.followup_date');
    if (dateCond) where.push(dateCond);

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT f.followup_id, f.followup_date, f.followup_type, f.status, f.remarks,
             COALESCE(c.customer_name, l.lead_name) as contact_name,
             COALESCE(c.company_name, l.company_name) as company,
             CONCAT(u.first_name, ' ', u.last_name) as assigned_agent
      FROM followups f
      LEFT JOIN customers c ON f.customer_id = c.customer_id
      LEFT JOIN leads l ON f.lead_id = l.lead_id
      LEFT JOIN users u ON f.assigned_to = u.user_id
      ${whereClause}
      ORDER BY f.followup_date DESC
    `;

    const [rows] = await pool.query(query, params);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="followups-report.csv"');
      return res.status(200).send(convertToCSV(rows));
    }

    return successResponse(res, 'Follow-up report generated.', { report: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Opportunity Report
 */
const getOpportunityReport = async (req, res, next) => {
  try {
    const { range, stage, status, format } = req.query;
    const where = [];
    const params = [];

    if (req.user.role_name === 'SALES_EXECUTIVE') {
      where.push('(o.assigned_to = ? OR o.created_by = ?)');
      params.push(req.user.user_id, req.user.user_id);
    }

    if (stage) {
      where.push('o.stage = ?');
      params.push(stage);
    }

    if (status) {
      where.push('o.status = ?');
      params.push(status);
    }

    const dateCond = getDateCondition(range, 'o.created_at');
    if (dateCond) where.push(dateCond);

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT o.opportunity_code, o.opportunity_name, o.amount, o.stage, o.probability,
             (o.amount * (o.probability / 100)) as weighted_amount,
             o.expected_close_date, o.status,
             c.customer_name, c.company_name,
             CONCAT(u.first_name, ' ', u.last_name) as sales_rep
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN users u ON o.assigned_to = u.user_id
      ${whereClause}
      ORDER BY o.amount DESC
    `;

    const [rows] = await pool.query(query, params);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="opportunities-report.csv"');
      return res.status(200).send(convertToCSV(rows));
    }

    return successResponse(res, 'Opportunity report generated.', { report: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Pipeline Analysis Report
 */
const getPipelineReport = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        o.stage,
        COUNT(*) as deal_count,
        COALESCE(SUM(o.amount), 0) as total_value,
        COALESCE(AVG(o.probability), 0) as avg_probability,
        COALESCE(SUM(o.amount * (o.probability / 100)), 0) as weighted_pipeline
      FROM opportunities o
      GROUP BY o.stage
      ORDER BY total_value DESC
    `;

    const [rows] = await pool.query(query);

    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="pipeline-analysis.csv"');
      return res.status(200).send(convertToCSV(rows));
    }

    return successResponse(res, 'Pipeline report generated.', { report: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. Lead Conversion Report
 */
const getConversionReport = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        l.source,
        COUNT(*) as total_leads,
        SUM(CASE WHEN l.status = 'CONVERTED' THEN 1 ELSE 0 END) as converted_count,
        SUM(CASE WHEN l.status = 'LOST' THEN 1 ELSE 0 END) as lost_count,
        ROUND((SUM(CASE WHEN l.status = 'CONVERTED' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as conversion_percentage,
        COALESCE(SUM(CASE WHEN l.status = 'CONVERTED' THEN l.expected_value ELSE 0 END), 0) as converted_value
      FROM leads l
      GROUP BY l.source
      ORDER BY converted_count DESC
    `;

    const [rows] = await pool.query(query);

    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="conversion-report.csv"');
      return res.status(200).send(convertToCSV(rows));
    }

    return successResponse(res, 'Lead conversion report generated.', { report: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. User Activity Report
 */
const getUserActivityReport = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name,
        u.email,
        u.department,
        r.role_name,
        COUNT(a.activity_id) as total_activities_logged,
        SUM(CASE WHEN a.activity_type = 'CALL' THEN 1 ELSE 0 END) as calls,
        SUM(CASE WHEN a.activity_type = 'MEETING' THEN 1 ELSE 0 END) as meetings,
        SUM(CASE WHEN a.activity_type = 'EMAIL' THEN 1 ELSE 0 END) as emails,
        SUM(CASE WHEN a.activity_type = 'TASK' THEN 1 ELSE 0 END) as tasks
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN activities a ON u.user_id = a.assigned_to
      WHERE u.role_id IN (2, 3) AND u.status = 'ACTIVE'
      GROUP BY u.user_id
      ORDER BY total_activities_logged DESC
    `;

    const [rows] = await pool.query(query);

    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="user-activity-report.csv"');
      return res.status(200).send(convertToCSV(rows));
    }

    return successResponse(res, 'User activity report generated.', { report: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. Audit Report (Admin & Manager only)
 */
const getAuditReport = async (req, res, next) => {
  try {
    if (req.user.role_name !== 'ADMIN' && req.user.role_name !== 'MANAGER') {
      return errorResponse(res, 'Access denied: Audit reports restricted to Administrators and Managers.', null, 403);
    }

    const { action, entity, format } = req.query;
    const where = [];
    const params = [];

    if (action) {
      where.push('a.action = ?');
      params.push(action);
    }

    if (entity) {
      where.push('a.entity_name = ?');
      params.push(entity);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT a.audit_log_id, a.action, a.entity_name, a.record_id, a.ip_address, a.created_at,
             CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT 100
    `;

    const [rows] = await pool.query(query, params);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-trail-report.csv"');
      return res.status(200).send(convertToCSV(rows));
    }

    return successResponse(res, 'Audit report generated.', { report: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomerReport,
  getLeadReport,
  getFollowupReport,
  getOpportunityReport,
  getPipelineReport,
  getConversionReport,
  getUserActivityReport,
  getAuditReport
};
