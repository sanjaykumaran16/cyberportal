import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SecurityConsole from './components/SecurityConsole';
import AccessDenied from './components/AccessDenied';

function AppContent() {
  const { user, role, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'security-probe'

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          color: '#38bdf8',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>[SYSTEM] Initializing secure cryptographic session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <header className="navbar">
          <div className="navbar-inner">
            <div className="brand">
              <span style={{ color: '#38bdf8' }}>🛡️</span>
              <span>CyberPortal</span>
              <span className="brand-badge">SECURE RBAC</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Cybersecurity Assessment Build</div>
          </div>
        </header>
        <main className="main-content">
          <LoginPage />
        </main>
      </div>
    );
  }

  // Render role-specific dashboard based strictly on server validated user.role
  const renderDashboardByRole = () => {
    switch (role) {
      case 'student':
        return <StudentDashboard />;
      case 'faculty':
        return <FacultyDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <AccessDenied
            message="Your account has an unassigned or unrecognized role in the system."
            details={`Current role token claim: "${role}"`}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'dashboard' && renderDashboardByRole()}
        {activeTab === 'security-probe' && <SecurityConsole />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
