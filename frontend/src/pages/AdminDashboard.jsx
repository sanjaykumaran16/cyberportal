import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Shield, Users, Database, FileText, UserPlus, RefreshCw, Trash2, CheckCircle, AlertCircle, Key } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' | 'records' | 'audit'

  // Data states
  const [usersList, setUsersList] = useState([]);
  const [systemRecords, setSystemRecords] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // New user form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('Password123!');
  const [newRole, setNewRole] = useState('student');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('Computer Science');
  const [newYear, setNewYear] = useState(1);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, recordsRes, auditRes] = await Promise.all([
        api.getAllUsers(),
        api.getAllRecords(),
        api.getAuditLogs(100),
      ]);
      setUsersList(usersRes.data);
      setSystemRecords(recordsRes.data);
      setAuditLogs(auditRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch administrator data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser({
        username: newUsername,
        password: newPassword,
        role: newRole,
        name: newRole === 'student' ? newName : undefined,
        dept: newRole === 'student' ? newDept : undefined,
        year: newRole === 'student' ? parseInt(newYear, 10) : undefined,
      });

      setNotification({ type: 'success', text: `User ${newUsername} successfully created.` });
      setShowCreateModal(false);
      setNewUsername('');
      newName && setNewName('');
      fetchAllData();
    } catch (err) {
      setNotification({ type: 'error', text: err.data?.message || err.message || 'Failed to create user' });
    }
  };

  const handleRoleChange = async (userId, targetRole) => {
    try {
      await api.updateUserRole(userId, targetRole);
      setNotification({ type: 'success', text: `Role updated to ${targetRole}. Audit logged.` });
      fetchAllData();
    } catch (err) {
      setNotification({ type: 'error', text: err.data?.message || err.message || 'Failed to update role' });
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user ${username}?`)) return;
    try {
      await api.deleteUser(userId);
      setNotification({ type: 'success', text: `User ${username} deleted. Audit logged.` });
      fetchAllData();
    } catch (err) {
      setNotification({ type: 'error', text: err.data?.message || err.message || 'Failed to delete user' });
    }
  };

  if (loading && !usersList.length) {
    return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>Loading security administration panel...</div>;
  }

  return (
    <div>
      {/* Admin Top Header Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Shield style={{ color: '#f43f5e' }} size={22} />
            Administrator Control Center & Security Audit Inspector
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-admin">Privilege: System Admin</span>
            <button className="btn btn-secondary btn-sm" onClick={fetchAllData} title="Refresh all tables">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {notification && (
          <div className={`alert-box ${notification.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <div>{notification.text}</div>
          </div>
        )}

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} />
            <div>{error}</div>
          </div>
        )}

        {/* Sub-navigation tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <button
            className={`btn btn-sm ${activeSubTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('users')}
          >
            <Users size={16} /> User & Role Management ({usersList.length})
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('audit')}
          >
            <FileText size={16} /> Immutable Audit Logs ({auditLogs.length})
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'records' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('records')}
          >
            <Database size={16} /> All System Records
          </button>
        </div>
      </div>

      {/* TAB 1: User & Role Management */}
      {activeSubTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.05rem' }}>
              <Users size={18} /> User Accounts & Role Assignment
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(!showCreateModal)}>
              <UserPlus size={14} /> {showCreateModal ? 'Close Form' : 'Create New User'}
            </button>
          </div>

          {showCreateModal && (
            <form
              onSubmit={handleCreateUser}
              style={{
                background: 'var(--bg-surface)',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '1rem' }}>Add Synthetic Account</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    placeholder="e.g. prof_curie"
                  />
                </div>
                <div>
                  <label className="form-label">Initial Password</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Assigned Role</label>
                  <select className="form-select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                {newRole === 'student' && (
                  <>
                    <div>
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Marie Curie"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newDept}
                        onChange={(e) => setNewDept(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Year (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        className="form-input"
                        value={newYear}
                        onChange={(e) => setNewYear(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                Confirm & Create User
              </button>
            </form>
          )}

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Profile / Name</th>
                  <th>Department & Year</th>
                  <th>Current Role</th>
                  <th>Modify Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>#{u.id}</td>
                    <td style={{ fontWeight: '600' }}>{u.username}</td>
                    <td>{u.name || '<N/A>'}</td>
                    <td style={{ color: '#94a3b8' }}>{u.dept ? `${u.dept} (Yr ${u.year})` : '-'}</td>
                    <td>
                      <span className={`badge badge-${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === user.id}
                      >
                        <option value="student">student</option>
                        <option value="faculty">faculty</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        disabled={u.id === user.id}
                        title={u.id === user.id ? 'Cannot delete your own account' : 'Delete user'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Audit Logs */}
      {activeSubTab === 'audit' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.05rem' }}>
              <FileText size={18} /> Central Security Audit Log Trail
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Latest 100 Events</span>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Immutable security log recording logins, privilege escalation attempts, grade mutations, role updates, and access denials. Passwords & tokens are strictly excluded.
          </p>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Timestamp</th>
                  <th>User ID / Username</th>
                  <th>Action</th>
                  <th>Resource / Details</th>
                  <th>Result</th>
                  <th>Client IP</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>#{log.id}</td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(log.ts).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {log.username ? `${log.username} (ID: ${log.user_id})` : log.user_id ? `ID: ${log.user_id}` : 'Anonymous / None'}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: '#38bdf8',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '300px', wordBreak: 'break-word' }}>
                      {log.resource}
                    </td>
                    <td>
                      <span className={`badge ${log.result === 'SUCCESS' || log.result === 'ALLOWED' ? 'badge-success' : 'badge-denied'}`}>
                        {log.result}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748b' }}>
                      {log.ip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: All System Records */}
      {activeSubTab === 'records' && systemRecords && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.05rem' }}>
              <Database size={18} /> System-Wide Courses & Enrolled Grades Overview
            </h3>
          </div>

          <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem' }}>All Courses & Faculty Instructors</h4>
          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Course ID</th>
                  <th>Code</th>
                  <th>Course Title</th>
                  <th>Faculty Instructor</th>
                </tr>
              </thead>
              <tbody>
                {systemRecords.courses.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>#{c.id}</td>
                    <td style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{c.code}</td>
                    <td>{c.title}</td>
                    <td style={{ color: '#f59e0b', fontWeight: '600' }}>{c.faculty_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem' }}>All Student Enrollments & Current Grades</h4>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Course Code</th>
                  <th>Marks</th>
                </tr>
              </thead>
              <tbody>
                {systemRecords.enrollments.map((e, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>#{e.student_id}</td>
                    <td style={{ fontWeight: '600' }}>{e.student_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{e.course_code}</td>
                    <td>
                      {e.marks !== null ? (
                        <span className="badge badge-success">{e.marks} / 100</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
