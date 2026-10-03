import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, AlertCircle, Sparkles, Check } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('student_alice');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const personas = [
    { name: 'Alice Smith', username: 'student_alice', role: 'student', desc: 'Enrolled in CS101, CY301' },
    { name: 'Bob Jones', username: 'student_bob', role: 'student', desc: 'Enrolled in CS101, CS201' },
    { name: 'Dr. Alan Turing', username: 'prof_alan', role: 'faculty', desc: 'Instructor for CS101, CS201' },
    { name: 'Dr. Ada Lovelace', username: 'prof_ada', role: 'faculty', desc: 'Instructor for CY301' },
    { name: 'Security Admin', username: 'admin_user', role: 'admin', desc: 'Full System & Audit Access' },
  ];

  const handlePersonaSelect = (p) => {
    setUsername(p.username);
    setPassword('Password123!');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(59, 130, 246, 0.2))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              marginBottom: '1rem',
            }}
          >
            <Shield size={28} style={{ color: '#38bdf8' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginBottom: '0.35rem' }}>
            College Portal Access
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Role-Based Access Control & Principle of Least Privilege
          </p>
        </div>

        {/* Demo Persona Quickfill */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
            <Sparkles size={14} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '0.775rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
              Select Synthetic Test Persona
            </span>
          </div>
          <div className="persona-grid">
            {personas.map((p) => {
              const isSelected = username === p.username;
              return (
                <div
                  key={p.username}
                  className="persona-btn"
                  onClick={() => handlePersonaSelect(p)}
                  style={{
                    borderColor: isSelected ? '#38bdf8' : 'var(--border-color)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-surface)',
                  }}
                >
                  <span className={`persona-role badge-${p.role}`}>{p.role}</span>
                  <div className="persona-name">{p.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>{p.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Authentication Failure:</strong> {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="username"
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: '#64748b',
            lineHeight: '1.5',
            textAlign: 'center',
          }}
        >
          🔒 Protected by <strong>Rate Limiting</strong>, <strong>bcrypt hashing</strong>, <strong>httpOnly JWT</strong>, and <strong>Centralized Audit Logging</strong>.
        </div>
      </div>
    </div>
  );
}
