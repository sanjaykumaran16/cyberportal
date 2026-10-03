import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { GraduationCap, Award, BookOpen, ShieldAlert, CheckCircle2, User, AlertCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live IDOR testing state
  const [idorTargetId, setIdorTargetId] = useState(2);
  const [idorResult, setIdorResult] = useState(null);
  const [idorLoading, setIdorLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [profileRes, gradesRes] = await Promise.all([
          api.getMyProfile(),
          api.getMyGrades(),
        ]);
        setProfile(profileRes.data);
        setGrades(gradesRes.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch student data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleTestIdor = async () => {
    setIdorLoading(true);
    setIdorResult(null);
    try {
      const res = await api.getStudentGradesById(idorTargetId);
      setIdorResult({
        status: 200,
        type: 'vulnerable',
        message: 'CRITICAL: Peer record accessed!',
        data: res.data,
      });
    } catch (err) {
      setIdorResult({
        status: err.status || 403,
        type: 'secure',
        message: err.data?.message || err.message || 'Access Denied',
      });
    } finally {
      setIdorLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>Loading student records...</div>;
  }

  if (error) {
    return (
      <div className="alert-box alert-danger">
        <AlertCircle size={18} />
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Student Profile Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <GraduationCap style={{ color: '#34d399' }} size={22} />
            Student Identity & Enrolled Profile
          </h2>
          <span className="badge badge-student">Role: Student</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
              Full Name
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginTop: '0.2rem' }}>
              {profile?.name}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
              Department
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginTop: '0.2rem' }}>
              {profile?.dept}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
              Academic Year
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginTop: '0.2rem' }}>
              Year {profile?.year}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
              Database Student ID
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
              ID: {profile?.student_id}
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Courses & Grades Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Award style={{ color: '#38bdf8' }} size={22} />
            My Enrolled Courses & Academic Grades
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{grades.length} Courses Enrolled</span>
        </div>

        {grades.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>No course enrollments found.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Faculty Instructor</th>
                  <th>Grade (Marks)</th>
                  <th>Last Evaluated</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((item) => (
                  <tr key={item.course_code}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#38bdf8' }}>
                        {item.course_code}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>{item.course_title}</td>
                    <td style={{ color: '#94a3b8' }}>{item.instructor_username}</td>
                    <td>
                      {item.marks !== null && item.marks !== undefined ? (
                        <span
                          className="badge"
                          style={{
                            background: item.marks >= 85 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            color: item.marks >= 85 ? '#34d399' : '#38bdf8',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.85rem',
                          }}
                        >
                          {item.marks.toFixed(1)} / 100
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Pending</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Demonstration: Anti-IDOR Check */}
      <div className="card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
        <div className="card-header">
          <h2 className="card-title">
            <ShieldAlert style={{ color: '#f59e0b' }} size={20} />
            Live Security Check: Insecure Direct Object Reference (IDOR) Test
          </h2>
          <span className="badge badge-faculty">Server Verification</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Test horizontal privilege separation: As <strong>{profile?.name}</strong> (Student ID {profile?.student_id}), attempt to query another student's grades endpoint (<code>/api/students/:id/grades</code>).
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#fff' }}>Target Peer Student ID:</label>
          <input
            type="number"
            className="form-input"
            style={{ width: '90px' }}
            value={idorTargetId}
            onChange={(e) => setIdorTargetId(parseInt(e.target.value, 10) || 1)}
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleTestIdor}
            disabled={idorLoading}
            style={{ borderColor: 'rgba(244, 63, 94, 0.4)' }}
          >
            {idorLoading ? 'Testing...' : `Attempt Fetching Student #${idorTargetId} Grades`}
          </button>
        </div>

        {idorResult && (
          <div
            className={`alert-box ${idorResult.status === 403 ? 'alert-danger' : 'alert-success'}`}
            style={{ marginTop: '0.5rem' }}
          >
            {idorResult.status === 403 ? (
              <CheckCircle2 size={18} style={{ color: '#34d399', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} style={{ color: '#f43f5e', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontWeight: '700', marginBottom: '0.2rem' }}>
                HTTP {idorResult.status} Response: {idorResult.status === 403 ? 'IDOR Successfully Blocked!' : 'Warning'}
              </div>
              <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                Server message: "{idorResult.message}"
              </div>
              {idorResult.status === 403 && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Enforced by <code>requireStudentOwnership</code> middleware. Attempt logged to immutable security audit trail.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
