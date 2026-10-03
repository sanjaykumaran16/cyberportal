const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

async function seed() {
  console.log('[SEED] Starting synthetic database population...');

  // Reset existing tables
  db.exec(`
    DELETE FROM audit_log;
    DELETE FROM grades;
    DELETE FROM enrollments;
    DELETE FROM courses;
    DELETE FROM students;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  const defaultPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  console.log('[SEED] Generated bcrypt hash with unique salt for synthetic users.');

  // 1. Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role)
    VALUES (?, ?, ?)
  `);

  const adminResult = insertUser.run('admin_user', passwordHash, 'admin');
  const profAlanResult = insertUser.run('prof_alan', passwordHash, 'faculty');
  const profAdaResult = insertUser.run('prof_ada', passwordHash, 'faculty');

  const aliceUser = insertUser.run('student_alice', passwordHash, 'student');
  const bobUser = insertUser.run('student_bob', passwordHash, 'student');
  const charlieUser = insertUser.run('student_charlie', passwordHash, 'student');
  const davidUser = insertUser.run('student_david', passwordHash, 'student');

  // 2. Insert Students Profiles
  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, name, dept, year)
    VALUES (?, ?, ?, ?)
  `);

  const aliceId = insertStudent.run(aliceUser.lastInsertRowid, 'Alice Smith', 'Computer Science', 3).lastInsertRowid;
  const bobId = insertStudent.run(bobUser.lastInsertRowid, 'Bob Jones', 'Computer Science', 3).lastInsertRowid;
  const charlieId = insertStudent.run(charlieUser.lastInsertRowid, 'Charlie Day', 'Electrical Engineering', 2).lastInsertRowid;
  const davidId = insertStudent.run(davidUser.lastInsertRowid, 'David Miller', 'Electrical Engineering', 2).lastInsertRowid;

  // 3. Insert Courses
  const insertCourse = db.prepare(`
    INSERT INTO courses (code, title, faculty_id)
    VALUES (?, ?, ?)
  `);

  const cs101Id = insertCourse.run('CS101', 'Computer Systems & Architecture', profAlanResult.lastInsertRowid).lastInsertRowid;
  const cs201Id = insertCourse.run('CS201', 'Algorithms & Data Structures', profAlanResult.lastInsertRowid).lastInsertRowid;
  const cy301Id = insertCourse.run('CY301', 'Network & Application Security', profAdaResult.lastInsertRowid).lastInsertRowid;

  // 4. Insert Enrollments
  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (student_id, course_id)
    VALUES (?, ?)
  `);

  insertEnrollment.run(aliceId, cs101Id);
  insertEnrollment.run(aliceId, cy301Id);

  insertEnrollment.run(bobId, cs101Id);
  insertEnrollment.run(bobId, cs201Id);

  insertEnrollment.run(charlieId, cs201Id);
  insertEnrollment.run(charlieId, cy301Id);

  insertEnrollment.run(davidId, cy301Id);

  // 5. Insert Grades
  const insertGrade = db.prepare(`
    INSERT INTO grades (student_id, course_id, marks)
    VALUES (?, ?, ?)
  `);

  insertGrade.run(aliceId, cs101Id, 92.5);
  insertGrade.run(aliceId, cy301Id, 95.0);

  insertGrade.run(bobId, cs101Id, 84.0);
  insertGrade.run(bobId, cs201Id, 78.5);

  insertGrade.run(charlieId, cs201Id, 88.0);
  insertGrade.run(charlieId, cy301Id, 91.0);

  insertGrade.run(davidId, cy301Id, 82.5);

  // 6. Initial Audit Log
  const insertAudit = db.prepare(`
    INSERT INTO audit_log (user_id, action, resource, result, ip)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertAudit.run(adminResult.lastInsertRowid, 'DATABASE_SEED', 'system_init', 'SUCCESS', '127.0.0.1');

  console.log('[SEED] Database populated successfully with synthetic test fixtures!');
  console.log(`
  Default credentials for all users:
  -------------------------------------------------------------
  Role          | Username         | Password
  -------------------------------------------------------------
  Admin         | admin_user       | Password123!
  Faculty (1)   | prof_alan        | Password123! (CS101, CS201)
  Faculty (2)   | prof_ada         | Password123! (CY301)
  Student (1)   | student_alice    | Password123!
  Student (2)   | student_bob      | Password123!
  Student (3)   | student_charlie  | Password123!
  Student (4)   | student_david    | Password123!
  -------------------------------------------------------------
  `);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = seed;
