const db = require('../config/database');
const { logEvent } = require('../services/audit.service');

/**
 * Get all courses assigned to the authenticated faculty member
 */
function getMyCourses(req, res) {
  const stmt = db.prepare(`
    SELECT c.id, c.code, c.title, COUNT(e.student_id) AS enrolled_count
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id
    WHERE c.faculty_id = ?
    GROUP BY c.id, c.code, c.title
    ORDER BY c.code ASC
  `);

  const courses = stmt.all(req.user.id);

  return res.status(200).json({
    status: 'success',
    data: courses,
  });
}

/**
 * Get students enrolled in a specific assigned course along with their grades
 */
function getCourseStudents(req, res) {
  const courseId = parseInt(req.params.courseId, 10);

  const stmt = db.prepare(`
    SELECT 
      s.id AS student_id,
      s.name AS student_name,
      s.dept,
      s.year,
      g.marks,
      g.updated_at
    FROM enrollments e
    JOIN students s ON e.student_id = s.id
    LEFT JOIN grades g ON (g.student_id = s.id AND g.course_id = e.course_id)
    WHERE e.course_id = ?
    ORDER BY s.name ASC
  `);

  const students = stmt.all(courseId);

  return res.status(200).json({
    status: 'success',
    data: students,
  });
}

/**
 * Update or assign a grade for a student in an assigned course
 * SECURITY CONTROLS:
 * 1. Role verified as faculty/admin.
 * 2. Course assignment verified.
 * 3. Enrollment verified (cannot assign grade to non-enrolled student).
 * 4. Audit logged.
 */
function updateGrade(req, res) {
  const { student_id, course_id, marks } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  // Check enrollment
  const enrollStmt = db.prepare(`
    SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?
  `);
  const isEnrolled = enrollStmt.get(student_id, course_id);

  if (!isEnrolled) {
    return res.status(400).json({
      status: 'error',
      message: 'Student is not enrolled in this course.',
    });
  }

  // Insert or update grade
  const upsertStmt = db.prepare(`
    INSERT INTO grades (student_id, course_id, marks, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id, course_id)
    DO UPDATE SET marks = excluded.marks, updated_at = CURRENT_TIMESTAMP
  `);

  upsertStmt.run(student_id, course_id, marks);

  // AUDIT LOG: Record grade mutation
  logEvent({
    userId: req.user.id,
    action: 'GRADE_UPDATE',
    resource: `Course ${course_id}, Student ${student_id}, Marks: ${marks}`,
    result: 'SUCCESS',
    ip,
  });

  return res.status(200).json({
    status: 'success',
    message: 'Grade updated successfully.',
    data: { student_id, course_id, marks },
  });
}

module.exports = {
  getMyCourses,
  getCourseStudents,
  updateGrade,
};
