const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/database');
const { logEvent } = require('../services/audit.service');

/**
 * SECURITY CONTROL: Session / Token Authentication Middleware
 * - Reads token strictly from httpOnly cookie or Authorization Bearer header.
 * - Enforces session expiration (e.g., 15 min).
 * - Verifies cryptographic signature using server-side secret.
 * - Refetches fresh user state from DB to detect revoked/deleted users immediately.
 */
function authenticate(req, res, next) {
  let token = null;

  // 1. Prioritize secure httpOnly cookie
  if (req.cookies && req.cookies.jwt_token) {
    token = req.cookies.jwt_token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required. No session token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Fetch user from DB to ensure account exists and role hasn't changed
    const stmt = db.prepare('SELECT id, username, role FROM users WHERE id = ?');
    const user = stmt.get(decoded.id);

    if (!user) {
      logEvent({
        userId: decoded.id,
        action: 'AUTHENTICATE',
        resource: req.originalUrl,
        result: 'FAILED',
        ip: req.ip || req.connection.remoteAddress,
      });
      return res.status(401).json({
        status: 'error',
        message: 'Invalid session. User not found.',
      });
    }

    // Attach validated user object strictly from server DB to request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    logEvent({
      userId: null,
      action: 'AUTHENTICATE',
      resource: req.originalUrl,
      result: isExpired ? 'FAILED' : 'DENIED',
      ip: req.ip || req.connection.remoteAddress,
    });

    return res.status(401).json({
      status: 'error',
      message: isExpired ? 'Session expired. Please log in again.' : 'Invalid session token.',
    });
  }
}

module.exports = {
  authenticate,
};
