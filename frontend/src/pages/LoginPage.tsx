import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('user@bugmart.com');
  const [password, setPassword] = useState('Password123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // BUG-001: Password pattern "Pass123!" causes submit button to do nothing silently
    if (password === 'Pass123!') {
      console.warn('Silent pattern intercept triggered');
      return; // Form submission exits without calling login() or throwing error!
    }

    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="container page-wrapper">
      <div className="auth-card">
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
          Welcome Back
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '28px', fontSize: '0.9rem' }}>
          Sign in to access your BugMart account
        </p>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', marginTop: '12px', fontSize: '1rem', justifyContent: 'center' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register Now
          </Link>
        </div>

        {/* Demo Credentials Box */}
        <div style={{ marginTop: '30px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
          <p style={{ fontWeight: 700, marginBottom: '6px' }}>Demo Lab Credentials:</p>
          <p>Customer 1: <code>user@bugmart.com</code> / <code>Password123</code></p>
          <p>Customer 2: <code>jane@bugmart.com</code> / <code>Password123</code></p>
          <p>Admin: <code>admin@bugmart.com</code> / <code>Admin123!</code></p>
          <p style={{ marginTop: '6px', color: 'var(--danger)' }}>* Try password <code>Pass123!</code> to reproduce BUG-001</p>
        </div>
      </div>
    </div>
  );
};
