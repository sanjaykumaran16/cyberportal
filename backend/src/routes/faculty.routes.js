const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { requireFacultyCourseAssignment } = require('../middleware/ownership');
const { validate } = require('../middleware/validate');
const { updateGradeSchema } = require('../schemas/validation.schemas');

/**
 * SECURITY CONTROL: Faculty-Only Routes (Deny by Default)
 */
// GET /api/faculty/courses - View assigned courses only
router.get('/courses', authenticate, requireRole('faculty'), facultyController.getMyCourses);

// GET /api/faculty/courses/:courseId/students - View students enrolled in assigned course
router.get(
  '/courses/:courseId/students',
  authenticate,
  requireRole('faculty', 'admin'),
  requireFacultyCourseAssignment('params', 'courseId'),
  facultyController.getCourseStudents
);

// POST /api/faculty/grades - Update student grade for assigned course ONLY
router.post(
  '/grades',
  authenticate,
  requireRole('faculty', 'admin'),
  validate(updateGradeSchema),
  requireFacultyCourseAssignment('body', 'course_id'),
  facultyController.updateGrade
);

module.exports = router;
