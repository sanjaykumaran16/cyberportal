const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { requireStudentOwnership } = require('../middleware/ownership');

/**
 * SECURITY CONTROL: Student-Only Routes (Deny by Default)
 */
// GET /api/students/me - View own student profile
router.get('/me', authenticate, requireRole('student'), studentController.getMyProfile);

// GET /api/students/me/grades - View own grades only
router.get('/me/grades', authenticate, requireRole('student'), studentController.getMyGrades);

// GET /api/students/:studentId/grades - Direct object access protected by ownership check (Anti-IDOR)
router.get(
  '/:studentId/grades',
  authenticate,
  requireRole('student', 'admin'),
  requireStudentOwnership('studentId'),
  studentController.getStudentGradesById
);

module.exports = router;
