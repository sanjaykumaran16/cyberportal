import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, LogOut, User, BookOpen, Users, Terminal } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, role, logout } = useAuth();

  const getRoleBadgeClass = (r) => {
    switch (r) {
      case 'admin':
        return 'badge-admin';
      case 'faculty':
        return 'badge-faculty';
      case 'student':
        return 'badge-student';
      default:
        return '';
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="brand">
            <Shield style={{ color: '#38bdf8' }} size={24} />
            <span>CyberPortal</span>
            <span className="brand-badge">RBAC ENFORCED</span>
          </div>

          {user && (
            <nav style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <BookOpen size={16} />
                Dashboard
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'security-probe' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('security-probe')}
                style={{ borderColor: 'rgba(56, 189, 248, 0.4)' }}
              >
                <Terminal size={16} />
                Security Assessment Probe
              </button>
            </nav>
          )}
        </div>

        {user && (
          <div className="nav-user">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <User size={16} style={{ color: '#94a3b8' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user.username}</span>
              <span className={`badge ${getRoleBadgeClass(role)}`}>{role}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={logout} title="Invalidate session & logout">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
