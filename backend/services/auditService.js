const pool = require('../config/db');

/**
 * Log audit events into the immutable audit_logs table
 */
async function logAudit({
  userId = null,
  action,
  entityName,
  recordId = null,
  oldValue = null,
  newValue = null,
  req = null
}) {
  try {
    let ipAddress = '127.0.0.1';
    let userAgent = 'API';

    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
      userAgent = req.headers['user-agent'] || 'API';
      if (!userId && req.user) {
        userId = req.user.user_id;
      }
    }

    const query = `
      INSERT INTO audit_logs 
      (user_id, action, entity_name, record_id, old_value, new_value, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const oldJson = oldValue ? JSON.stringify(oldValue) : null;
    const newJson = newValue ? JSON.stringify(newValue) : null;

    await pool.query(query, [
      userId,
      action,
      entityName,
      recordId ? String(recordId) : null,
      oldJson,
      newJson,
      ipAddress,
      userAgent.substring(0, 255)
    ]);
  } catch (err) {
    console.error('[AuditService] Failed to record audit log:', err.message);
  }
}

module.exports = {
  logAudit
};
