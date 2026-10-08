const pool = require('../config/db');
const { successResponse } = require('../utils/responseHelper');

/**
 * System Health & Security Center Metrics
 */
const getSystemHealth = async (req, res, next) => {
  try {
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const dbLatencyMs = Date.now() - startTime;

    const [[usersTotal]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[activeUsers]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE status = "ACTIVE"');
    const [[lockedAccounts]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE status = "LOCKED"');

    const [recentSecurityEvents] = await pool.query(`
      SELECT * FROM audit_logs 
      WHERE action IN ('FAILED_LOGIN', 'ACCOUNT_LOCKOUT', 'PASSWORD_RESET', 'ROLE_CHANGE', 'STATUS_CHANGE')
      ORDER BY created_at DESC LIMIT 10
    `);

    const memoryUsage = process.memoryUsage();

    return successResponse(res, 'System health operational report.', {
      status: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
      database: {
        status: 'CONNECTED',
        driver: 'mysql2',
        database: process.env.DB_NAME || 'acxiomcrm',
        latencyMs: dbLatencyMs,
        poolLimit: 15
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
        }
      },
      security: {
        totalUsers: usersTotal.count,
        activeUsers: activeUsers.count,
        lockedAccounts: lockedAccounts.count,
        recentSecurityEvents
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get system settings
 */
const getSystemSettings = async (req, res, next) => {
  try {
    const [settings] = await pool.query('SELECT * FROM system_settings ORDER BY setting_group, setting_key');
    return successResponse(res, 'Settings retrieved.', settings);
  } catch (err) {
    next(err);
  }
};

/**
 * Update system setting
 */
const updateSystemSetting = async (req, res, next) => {
  try {
    const { setting_key, setting_value } = req.body;
    await pool.query(
      'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?',
      [setting_value, setting_key]
    );
    const [updated] = await pool.query('SELECT * FROM system_settings WHERE setting_key = ?', [setting_key]);
    return successResponse(res, 'Setting updated successfully.', updated[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSystemHealth,
  getSystemSettings,
  updateSystemSetting
};
