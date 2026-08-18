import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="container page-wrapper" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <AlertTriangle size={64} style={{ color: 'var(--accent)', margin: '0 auto 20px auto' }} />
      <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '12px' }}>404 — Page Not Found</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '28px', maxWidth: '500px', margin: '0 auto 28px auto' }}>
        The page URL you requested does not exist or may have been moved.
      </p>
      <Link to="/" className="btn-primary" style={{ padding: '12px 24px' }}>
        <Home size={18} />
        Back to Home Page
      </Link>
    </div>
  );
};
