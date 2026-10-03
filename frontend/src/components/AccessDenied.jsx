import React from 'react';
import { ShieldX, AlertTriangle } from 'lucide-react';

export default function AccessDenied({ message, details }) {
  return (
    <div className="card" style={{ maxWidth: '640px', margin: '3rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(244, 63, 94, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}
      >
        <ShieldX size={40} style={{ color: '#f43f5e' }} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', color: '#fff' }}>
        403 — Access Denied
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        {message || 'You do not have the required permissions or role assignment to view this resource.'}
      </p>

      {details && (
        <div
          style={{
            background: '#060911',
            border: '1px solid #334155',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: '#fb7185',
            textAlign: 'left',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <AlertTriangle size={14} />
            <strong>Security Middleware Response:</strong>
          </div>
          <div>{details}</div>
        </div>
      )}

      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
        Principle of Least Privilege enforced server-side. Unmatched access attempts are recorded in the security audit log.
      </div>
    </div>
  );
}
