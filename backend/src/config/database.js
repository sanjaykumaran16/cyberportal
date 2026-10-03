const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const env = require('./env');

// Ensure database directory exists
const dbFilePath = path.resolve(__dirname, '../../', env.DB_PATH);
const dbDir = path.dirname(dbFilePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database connection
const db = new Database(dbFilePath);

// SECURITY CONTROL: Enforce Foreign Key constraints and WAL mode for reliability
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

/**
 * Initialize database schema
 */
function initDb() {
  const schema = `
    -- Users Table (Core Identity & Roles)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'faculty', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Students Profile Table
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      dept TEXT NOT NULL,
      year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 5),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Courses Table
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      faculty_id INTEGER NOT NULL,
      FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- Enrollments Table
    CREATE TABLE IF NOT EXISTS enrollments (
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      PRIMARY KEY (student_id, course_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    -- Grades Table
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      marks REAL NOT NULL CHECK(marks >= 0 AND marks <= 100),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    -- Audit Log Table (Immutable Security Trail)
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      result TEXT NOT NULL CHECK(result IN ('ALLOWED', 'DENIED', 'FAILED', 'SUCCESS')),
      ip TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
    CREATE INDEX IF NOT EXISTS idx_courses_faculty_id ON courses(faculty_id);
    CREATE INDEX IF NOT EXISTS idx_grades_student_course ON grades(student_id, course_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_ts ON audit_log(ts);
  `;

  db.exec(schema);
}

initDb();

module.exports = db;
