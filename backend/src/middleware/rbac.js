const { logEvent } = require('../services/audit.service');

/**
 * SECURITY CONTROL: Role-Based Access Control (RBAC) Middleware
 * - Enforces Principle of Least Privilege.
 * - Implements "Deny-by-Default": Any role not explicitly enumerated is rejected with 403.
 * - Source of Truth: `req.user.role` populated by server-side session authentication.
 * - Logs all unauthorized access attempts to audit log for forensics.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // SECURITY AUDIT: Log horizontal/vertical privilege escalation attempts
      logEvent({
        userId: req.user.id,
        action: 'ACCESS_ATTEMPT',
        resource: `${req.method} ${req.originalUrl}`,
        result: 'DENIED',
        ip: req.ip || req.connection.remoteAddress,
      });

      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You do not have sufficient permissions.',
      });
    }

    next();
  };
}

module.exports = {
  requireRole,
};
