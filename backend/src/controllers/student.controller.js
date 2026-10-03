const db = require('../config/database');

/**
 * Get the authenticated student's profile
 */
function getMyProfile(req, res) {
  const stmt = db.prepare(`
    SELECT s.id AS student_id, s.name, s.dept, s.year, u.username, u.role
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.user_id = ?
  `);
  const profile = stmt.get(req.user.id);

  if (!profile) {
    return res.status(404).json({
      status: 'error',
      message: 'Student profile not found.',
    });
  }

  return res.status(200).json({
    status: 'success',
    data: profile,
  });
}

/**
 * Get the authenticated student's enrolled courses and grades (Own records only)
 */
function getMyGrades(req, res) {
  const stmt = db.prepare(`
    SELECT 
      c.id AS course_id,
      c.code AS course_code,
      c.title AS course_title,
      u.username AS instructor_username,
      g.marks,
      g.updated_at
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON c.faculty_id = u.id
    JOIN students s ON e.student_id = s.id
    LEFT JOIN grades g ON (g.student_id = s.id AND g.course_id = c.id)
    WHERE s.user_id = ?
    ORDER BY c.code ASC
  `);

  const grades = stmt.all(req.user.id);

  return res.status(200).json({
    status: 'success',
    data: grades,
  });
}

/**
 * Endpoint to test direct object access: /api/students/:studentId/grades
 * Protected by requireStudentOwnership('studentId')
 */
function getStudentGradesById(req, res) {
  const studentId = parseInt(req.params.studentId, 10);

  const stmt = db.prepare(`
    SELECT 
      s.id AS student_id,
      s.name AS student_name,
      c.id AS course_id,
      c.code AS course_code,
      c.title AS course_title,
      g.marks,
      g.updated_at
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN students s ON e.student_id = s.id
    LEFT JOIN grades g ON (g.student_id = s.id AND g.course_id = c.id)
    WHERE s.id = ?
    ORDER BY c.code ASC
  `);

  const grades = stmt.all(studentId);

  return res.status(200).json({
    status: 'success',
    data: grades,
  });
}

module.exports = {
  getMyProfile,
  getMyGrades,
  getStudentGradesById,
};
