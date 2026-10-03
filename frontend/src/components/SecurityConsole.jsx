import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { ShieldCheck, ShieldAlert, Terminal, Play, CheckCircle2, XCircle } from 'lucide-react';

export default function SecurityConsole() {
  const { user, role } = useAuth();
  const [probeOutput, setProbeOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const runProbe = async (scenarioName, endpoint, options = {}) => {
    setLoading(true);
    setProbeOutput({ scenario: scenarioName, endpoint, status: 'Testing...', result: null });

    const startTime = performance.now();
    try {
      const res = await apiRequest(endpoint, options);
      const duration = (performance.now() - startTime).toFixed(1);
      setProbeOutput({
        scenario: scenarioName,
        endpoint: `${options.method || 'GET'} ${endpoint}`,
        httpStatus: 200,
        result: 'ALLOWED',
        duration: `${duration}ms`,
        data: res,
      });
    } catch (err) {
      const duration = (performance.now() - startTime).toFixed(1);
      setProbeOutput({
        scenario: scenarioName,
        endpoint: `${options.method || 'GET'} ${endpoint}`,
        httpStatus: err.status || 500,
        result: err.status === 403 ? '403 FORBIDDEN (DENIED)' : err.status === 401 ? '401 UNAUTHORIZED' : 'ERROR',
        duration: `${duration}ms`,
        error: err.data || { message: err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Terminal style={{ color: '#38bdf8' }} size={20} />
            Live Security Control & Anti-IDOR Assessment Probe
          </h2>
          <span className="badge badge-admin">Interactive Assessment</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Execute real-time penetration probes against the server-side RBAC and ownership middlewares as current user (
          <strong>{user?.username}</strong> / <span style={{ textTransform: 'uppercase', color: '#38bdf8' }}>{role}</span>).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {/* Probe 1 */}
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.35rem' }}>Probe 1: Own Profile (Student / Faculty)</h4>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              GET /api/students/me (Validates authenticated session)
            </p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              disabled={loading}
              onClick={() => runProbe('Own Profile Check', '/students/me')}
            >
              <Play size={14} /> Execute Probe
            </button>
          </div>

          {/* Probe 2 */}
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.35rem' }}>Probe 2: Peer Record IDOR Attack</h4>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              GET /api/students/2/grades (Targeting Peer Student ID 2)
            </p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', borderColor: 'rgba(244, 63, 94, 0.4)' }}
              disabled={loading}
              onClick={() => runProbe('Horizontal IDOR Probe', '/students/2/grades')}
            >
              <Play size={14} /> Test IDOR Protection
            </button>
          </div>

          {/* Probe 3 */}
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.35rem' }}>Probe 3: Vertical Admin Escalation</h4>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              GET /api/admin/audit-logs (Restricted to Administrator)
            </p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', borderColor: 'rgba(244, 63, 94, 0.4)' }}
              disabled={loading}
              onClick={() => runProbe('Vertical Privilege Escalation Probe', '/admin/audit-logs')}
            >
              <Play size={14} /> Test Role Escalation
            </button>
          </div>

          {/* Probe 4 */}
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.35rem' }}>Probe 4: Unassigned Course Grade Mutation</h4>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              POST /api/faculty/grades (Course 3, Student 1)
            </p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              disabled={loading}
              onClick={() =>
                runProbe('Unassigned Course Tampering Probe', '/faculty/grades', {
                  method: 'POST',
                  body: { student_id: 1, course_id: 3, marks: 99.0 },
                })
              }
            >
              <Play size={14} /> Test Course Assignment Check
            </button>
          </div>
        </div>

        {/* Live Terminal Output */}
        {probeOutput && (
          <div className="probe-card">
            <div className="probe-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={16} />
                <span>SERVER_RESPONSE_CONSOLE &gt; {probeOutput.scenario}</span>
              </div>
              <div>
                <span
                  style={{
                    color:
                      probeOutput.httpStatus === 200
                        ? '#34d399'
                        : probeOutput.httpStatus === 403
                        ? '#f43f5e'
                        : '#38bdf8',
                    fontWeight: 700,
                  }}
                >
                  HTTP {probeOutput.httpStatus} ({probeOutput.result})
                </span>
                <span style={{ color: '#64748b', marginLeft: '0.75rem' }}>{probeOutput.duration}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              <strong>Endpoint Tested:</strong> <code>{probeOutput.endpoint}</code>
            </div>

            <pre className="code-response">
              {JSON.stringify(probeOutput.data || probeOutput.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
