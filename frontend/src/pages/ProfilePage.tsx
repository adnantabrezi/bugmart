import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User as UserType } from '../types';
import { User, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  // BUG-047: Reads query param userId to fetch another user's profile
  const requestedUserId = searchParams.get('userId');

  const [profile, setProfile] = useState<UserType | null>(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    let url = '/api/profile';
    if (requestedUserId) {
      url += `?userId=${requestedUserId}`; // BUG-047
    }

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  }, [token, requestedUserId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile?.name,
          address,
          phone
        })
      });

      if (res.ok) {
        setMsg('Profile updated successfully!');
      }
    } catch (err) {
      setMsg('Failed to update profile');
    }
  };

  if (loading) {
    return <div className="container page-wrapper"><p>Loading profile...</p></div>;
  }

  if (!profile) {
    return (
      <div className="container page-wrapper" style={{ textAlign: 'center', paddingTop: '60px' }}>
        <h2>Please Sign In</h2>
        <p>You must be logged in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container page-wrapper">
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '36px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{profile.name}</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Role: {profile.role}</span>
          </div>
        </div>

        {requestedUserId && (
          <div className="error-alert" style={{ marginBottom: '20px' }}>
            ⚠️ BUG-047 Triggered: Viewing profile record for User ID #{requestedUserId}
          </div>
        )}

        {msg && <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '16px' }}>{msg}</p>}

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Email Address (Read-only)</label>
            <div style={{ position: 'relative' }}>
              <input type="email" className="form-input" value={profile.email} disabled style={{ background: '#f1f5f9', paddingLeft: '40px' }} />
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Shipping Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
            Save Profile Changes
          </button>
        </form>
      </div>
    </div>
  );
};
