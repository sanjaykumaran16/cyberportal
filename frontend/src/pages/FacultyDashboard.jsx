import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { BookOpen, Users, CheckCircle, AlertCircle, Save, ShieldAlert, Sparkles } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Grade edit buffer: { [studentId]: marks }
  const [gradeEdits, setGradeEdits] = useState({});
  const [savingStudentId, setSavingStudentId] = useState(null);

  // Security test state
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        const res = await api.getFacultyCourses();
        setCourses(res.data);
        if (res.data.length > 0) {
          setSelectedCourse(res.data[0]);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch assigned courses');
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;

    async function loadStudents() {
      try {
        setStudentsLoading(true);
        setStatusMessage(null);
        const res = await api.getCourseStudents(selectedCourse.id);
        setStudents(res.data);
        
        // Initialize grade edit buffer
        const buffer = {};
        res.data.forEach((s) => {
          buffer[s.student_id] = s.marks !== null && s.marks !== undefined ? s.marks : '';
        });
        setGradeEdits(buffer);
      } catch (err) {
        setError(err.message || 'Failed to fetch enrolled students');
      } finally {
        setStudentsLoading(false);
      }
    }
    loadStudents();
  }, [selectedCourse]);

  const handleGradeChange = (studentId, value) => {
    setGradeEdits((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleSaveGrade = async (studentId) => {
    const rawVal = gradeEdits[studentId];
    const marks = parseFloat(rawVal);

    if (isNaN(marks) || marks < 0 || marks > 100) {
      alert('Please enter a valid grade between 0 and 100.');
      return;
    }

    try {
      setSavingStudentId(studentId);
      setStatusMessage(null);
      await api.updateGrade(studentId, selectedCourse.id, marks);

      setStatusMessage({
        type: 'success',
        text: `Grade successfully updated to ${marks} for Student #${studentId}. Audit event logged.`,
      });

      // Update student table state
      setStudents((prev) =>
        prev.map((s) => (s.student_id === studentId ? { ...s, marks, updated_at: new Date().toISOString() } : s))
      );
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.data?.message || err.message || 'Failed to update grade',
      });
    } finally {
      setSavingStudentId(null);
    }
  };

  // Test Course Assignment Guard: Try updating grade for course ID 3 (CY301) or an unassigned course
  const handleTestUnassignedCourse = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      // If Prof Alan, try CY301 (id: 3). If Prof Ada, try CS101 (id: 1)
      const targetUnassignedCourseId = user.username === 'prof_ada' ? 1 : 3;
      await api.updateGrade(1, targetUnassignedCourseId, 99.0);

      setTestResult({
        status: 200,
        type: 'vulnerable',
        message: 'CRITICAL: Grade was modified for unassigned course!',
      });
    } catch (err) {
      setTestResult({
        status: err.status || 403,
        type: 'secure',
        message: err.data?.message || err.message || 'Access Denied',
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>Loading faculty courses...</div>;
  }

  return (
    <div>
      {/* Course Selection Cards */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <BookOpen style={{ color: '#f59e0b' }} size={22} />
            Assigned Courses for Instruction
          </h2>
          <span className="badge badge-faculty">Role: Faculty</span>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
          You are authorized to view and grade <strong>only</strong> the courses assigned to your faculty ID in the database.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {courses.map((c) => {
            const isSelected = selectedCourse?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCourse(c)}
                style={{
                  background: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? '#f59e0b' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#f59e0b' }}>{c.code}</span>
                  <span className="badge" style={{ background: '#334155', color: '#94a3b8', fontSize: '0.7rem' }}>
                    {c.enrolled_count} Enrolled
                  </span>
                </div>
                <div style={{ fontWeight: '600', color: '#fff', marginTop: '0.5rem' }}>{c.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enrolled Students & Grade Editor */}
      {selectedCourse && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Users style={{ color: '#38bdf8' }} size={22} />
              Enrolled Students in {selectedCourse.code}: {selectedCourse.title}
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {students.length} Enrolled Students
            </span>
          </div>

          {statusMessage && (
            <div className={`alert-box ${statusMessage.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
              {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <div>{statusMessage.text}</div>
            </div>
          )}

          {studentsLoading ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1.5rem' }}>Loading course enrollment...</div>
          ) : students.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>No students enrolled.</div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th>Academic Year</th>
                    <th>Grade Marks (0 - 100)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.student_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>#{s.student_id}</td>
                      <td style={{ fontWeight: '600' }}>{s.student_name}</td>
                      <td style={{ color: '#94a3b8' }}>{s.dept}</td>
                      <td style={{ color: '#94a3b8' }}>Year {s.year}</td>
                      <td>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          className="form-input"
                          style={{ width: '110px', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                          value={gradeEdits[s.student_id] ?? ''}
                          onChange={(e) => handleGradeChange(s.student_id, e.target.value)}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSaveGrade(s.student_id)}
                          disabled={savingStudentId === s.student_id}
                        >
                          <Save size={14} />
                          {savingStudentId === s.student_id ? 'Saving...' : 'Update Grade'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Security Check for Faculty Course Assignment */}
      <div className="card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
        <div className="card-header">
          <h2 className="card-title">
            <ShieldAlert style={{ color: '#f59e0b' }} size={20} />
            Security Control Check: Course Assignment Verification
          </h2>
          <span className="badge badge-faculty">Server Verification</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Attempt updating marks for a course <strong>not assigned</strong> to your faculty ID (e.g., trying to tamper with {user.username === 'prof_ada' ? 'CS101' : 'CY301'}).
        </p>

        <button
          className="btn btn-secondary btn-sm"
          onClick={handleTestUnassignedCourse}
          disabled={testLoading}
          style={{ borderColor: 'rgba(244, 63, 94, 0.4)' }}
        >
          {testLoading ? 'Testing...' : 'Simulate Grade Tampering for Unassigned Course'}
        </button>

        {testResult && (
          <div
            className={`alert-box ${testResult.status === 403 ? 'alert-danger' : 'alert-success'}`}
            style={{ marginTop: '1rem' }}
          >
            {testResult.status === 403 ? (
              <CheckCircle size={18} style={{ color: '#34d399', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} style={{ color: '#f43f5e', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontWeight: '700', marginBottom: '0.2rem' }}>
                HTTP {testResult.status} Response: {testResult.status === 403 ? 'Tamper Blocked by Backend!' : 'Warning'}
              </div>
              <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                Server message: "{testResult.message}"
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
