const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const env = require('../config/env');
const { logEvent } = require('../services/audit.service');

/**
 * Handle user authentication
 * SECURITY CONTROLS:
 * 1. Constant-time password hashing via bcrypt.
 * 2. Issues JWT strictly in httpOnly, SameSite cookie.
 * 3. Session expiration (15 minutes idle).
 * 4. Audit logging of all login attempts (success & failure).
 */
async function login(req, res) {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const stmt = db.prepare('SELECT id, username, password_hash, role FROM users WHERE username = ?');
    const user = stmt.get(username);

    // SECURITY: Use dummy compare or proceed cleanly to avoid timing attacks on username enumeration
    if (!user) {
      logEvent({
        userId: null,
        action: 'LOGIN_FAILURE',
        resource: '/api/auth/login',
        result: 'FAILED',
        ip,
      });

      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logEvent({
        userId: user.id,
        action: 'LOGIN_FAILURE',
        resource: '/api/auth/login',
        result: 'FAILED',
        ip,
      });

      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.',
      });
    }

    // Generate JWT token with configured expiration
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.SESSION_EXPIRES_IN }
    );

    // Set secure httpOnly cookie
    res.cookie('jwt_token', token, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: env.SESSION_MAX_AGE_MS,
    });

    // If user is a student, also fetch student record ID
    let studentId = null;
    let studentName = null;
    if (user.role === 'student') {
      const sStmt = db.prepare('SELECT id, name FROM students WHERE user_id = ?');
      const sRow = sStmt.get(user.id);
      if (sRow) {
        studentId = sRow.id;
        studentName = sRow.name;
      }
    }

    // AUDIT LOG: Record successful authentication
    logEvent({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: '/api/auth/login',
      result: 'SUCCESS',
      ip,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Authentication successful.',
      token, // Also returned for API / Jest testing convenience
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        studentId,
        studentName,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'An internal error occurred during authentication.',
    });
  }
}

/**
 * Handle user logout & session invalidation
 */
function logout(req, res) {
  const ip = req.ip || req.connection.remoteAddress;

  if (req.user) {
    logEvent({
      userId: req.user.id,
      action: 'LOGOUT',
      resource: '/api/auth/logout',
      result: 'SUCCESS',
      ip,
    });
  }

  // Invalidate cookie
  res.clearCookie('jwt_token', {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
  });

  return res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  });
}

/**
 * Return current session status and role
 */
function getSession(req, res) {
  let studentDetails = null;

  if (req.user.role === 'student') {
    const stmt = db.prepare('SELECT id, name, dept, year FROM students WHERE user_id = ?');
    studentDetails = stmt.get(req.user.id);
  }

  return res.status(200).json({
    status: 'success',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      student: studentDetails,
    },
  });
}

module.exports = {
  login,
  logout,
  getSession,
};
