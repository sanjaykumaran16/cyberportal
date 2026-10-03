const db = require('../config/database');

/**
 * SECURITY CONTROL: Audit Logging Service
 * Records sensitive actions, access decisions, and state modifications.
 * Passwords, tokens, and sensitive cryptographic secrets MUST NEVER be logged.
 */
function logEvent({ userId = null, action, resource, result, ip = 'unknown' }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_log (user_id, action, resource, result, ip)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(userId, action, resource, result, ip);
  } catch (err) {
    // Fail-safe: Audit log write failures should be logged to stderr without crashing the request flow
    console.error('CRITICAL: Failed to write to audit log:', err.message);
  }
}

/**
 * Fetch recent audit logs (Admin only)
 */
function getAuditLogs(limit = 100) {
  const stmt = db.prepare(`
    SELECT a.id, a.ts, a.user_id, u.username, a.action, a.resource, a.result, a.ip
    FROM audit_log a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.ts DESC, a.id DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

module.exports = {
  logEvent,
  getAuditLogs,
};
