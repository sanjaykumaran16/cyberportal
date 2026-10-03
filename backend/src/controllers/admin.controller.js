const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { logEvent, getAuditLogs: fetchAuditLogs } = require('../services/audit.service');

/**
 * List all users with linked profile information
 */
function getAllUsers(req, res) {
  const stmt = db.prepare(`
    SELECT u.id, u.username, u.role, u.created_at, s.name, s.dept, s.year
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    ORDER BY u.id ASC
  `);
  const users = stmt.all();

  return res.status(200).json({
    status: 'success',
    data: users,
  });
}

/**
 * Create a new user with role
 * SECURITY CONTROLS:
 * 1. Hashes password with bcrypt.
 * 2. Role validation.
 * 3. Audit logged.
 */
async function createUser(req, res) {
  const { username, password, role, name, dept, year } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'Username already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const insertUser = db.transaction(() => {
      const userStmt = db.prepare(`
        INSERT INTO users (username, password_hash, role)
        VALUES (?, ?, ?)
      `);
      const result = userStmt.run(username, password_hash, role);
      const newUserId = result.lastInsertRowid;

      if (role === 'student' && name) {
        const studentStmt = db.prepare(`
          INSERT INTO students (user_id, name, dept, year)
          VALUES (?, ?, ?, ?)
        `);
        studentStmt.run(newUserId, name, dept || 'Undeclared', year || 1);
      }

      return newUserId;
    });

    const newUserId = insertUser();

    // AUDIT LOG
    logEvent({
      userId: req.user.id,
      action: 'USER_CREATED',
      resource: `User ID: ${newUserId}, Username: ${username}, Role: ${role}`,
      result: 'SUCCESS',
      ip,
    });

    return res.status(201).json({
      status: 'success',
      message: 'User created successfully.',
      data: { id: newUserId, username, role },
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create user.',
    });
  }
}

/**
 * Update user role
 * SECURITY CONTROLS:
 * 1. Admin only.
 * 2. Role change audit logging.
 */
function updateUserRole(req, res) {
  const targetUserId = parseInt(req.params.id, 10);
  const { role } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (isNaN(targetUserId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid user ID.',
    });
  }

  const targetUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(targetUserId);
  if (!targetUser) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found.',
    });
  }

  // Prevent admin from revoking their own admin privileges to avoid accidental lockout
  if (targetUserId === req.user.id && role !== 'admin') {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot demote your own administrator account.',
    });
  }

  const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
  stmt.run(role, targetUserId);

  logEvent({
    userId: req.user.id,
    action: 'ROLE_CHANGE',
    resource: `Target User: ${targetUser.username} (${targetUserId}), Old Role: ${targetUser.role}, New Role: ${role}`,
    result: 'SUCCESS',
    ip,
  });

  return res.status(200).json({
    status: 'success',
    message: `Role for user ${targetUser.username} updated to ${role}.`,
  });
}

/**
 * Delete a user
 */
function deleteUser(req, res) {
  const targetUserId = parseInt(req.params.id, 10);
  const ip = req.ip || req.connection.remoteAddress;

  if (targetUserId === req.user.id) {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot delete your own administrator account.',
    });
  }

  const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetUserId);
  if (!targetUser) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found.',
    });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(targetUserId);

  logEvent({
    userId: req.user.id,
    action: 'USER_DELETED',
    resource: `User: ${targetUser.username} (ID: ${targetUserId})`,
    result: 'SUCCESS',
    ip,
  });

  return res.status(200).json({
    status: 'success',
    message: 'User deleted successfully.',
  });
}

/**
 * View complete system overview (All courses, students, and marks)
 */
function getAllRecords(req, res) {
  const courses = db.prepare(`
    SELECT c.id, c.code, c.title, u.username AS faculty_name
    FROM courses c
    JOIN users u ON c.faculty_id = u.id
    ORDER BY c.code ASC
  `).all();

  const enrollments = db.prepare(`
    SELECT e.student_id, s.name AS student_name, e.course_id, c.code AS course_code, g.marks
    FROM enrollments e
    JOIN students s ON e.student_id = s.id
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN grades g ON (g.student_id = s.id AND g.course_id = c.id)
    ORDER BY c.code ASC, s.name ASC
  `).all();

  return res.status(200).json({
    status: 'success',
    data: {
      courses,
      enrollments,
    },
  });
}

/**
 * Retrieve Audit Log history
 */
function getAuditLog(req, res) {
  const limit = parseInt(req.query.limit, 10) || 100;
  const logs = fetchAuditLogs(limit);

  return res.status(200).json({
    status: 'success',
    data: logs,
  });
}

module.exports = {
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getAllRecords,
  getAuditLog,
};
