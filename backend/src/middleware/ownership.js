const db = require('../config/database');
const { logEvent } = require('../services/audit.service');

/**
 * SECURITY CONTROL: Anti-IDOR / Ownership Middleware for Students
 * Ensures a student can ONLY access their own resource ID.
 * Admins can access any student record.
 */
function requireStudentOwnership(paramName = 'studentId') {
  return (req, res, next) => {
    // Admin bypasses ownership check
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied.',
      });
    }

    const requestedStudentId = parseInt(req.params[paramName], 10);
    if (isNaN(requestedStudentId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid student identifier.',
      });
    }

    // Lookup student record linked to current user
    const stmt = db.prepare('SELECT id FROM students WHERE user_id = ?');
    const studentRecord = stmt.get(req.user.id);

    if (!studentRecord || studentRecord.id !== requestedStudentId) {
      logEvent({
        userId: req.user.id,
        action: 'IDOR_VIOLATION_ATTEMPT',
        resource: `${req.method} ${req.originalUrl} (Target Student ID: ${requestedStudentId})`,
        result: 'DENIED',
        ip: req.ip || req.connection.remoteAddress,
      });

      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You may only view your own records.',
      });
    }

    // Attach student record ID for controller efficiency
    req.studentId = studentRecord.id;
    next();
  };
}

/**
 * SECURITY CONTROL: Anti-IDOR / Faculty Course Assignment Check
 * Ensures a faculty member can ONLY view or modify grades for courses assigned to them.
 */
function requireFacultyCourseAssignment(courseIdSource = 'params', paramKey = 'courseId') {
  return (req, res, next) => {
    // Admin bypasses assignment check
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied.',
      });
    }

    const rawCourseId = courseIdSource === 'body' ? req.body[paramKey] : req.params[paramKey];
    const courseId = parseInt(rawCourseId, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid course identifier.',
      });
    }

    // Verify course assignment in database
    const stmt = db.prepare('SELECT id, faculty_id FROM courses WHERE id = ?');
    const course = stmt.get(courseId);

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found.',
      });
    }

    if (course.faculty_id !== req.user.id) {
      logEvent({
        userId: req.user.id,
        action: 'UNASSIGNED_COURSE_ACCESS_ATTEMPT',
        resource: `${req.method} ${req.originalUrl} (Course ID: ${courseId})`,
        result: 'DENIED',
        ip: req.ip || req.connection.remoteAddress,
      });

      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You are not assigned to instruct this course.',
      });
    }

    next();
  };
}

module.exports = {
  requireStudentOwnership,
  requireFacultyCourseAssignment,
};
