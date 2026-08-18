import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { Package, Eye } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // BUG-039: Renders page briefly before redirecting unauthenticated user after timeout
    if (!token) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 1500); // 1.5 second delay allowing unauthenticated render!
      return () => clearTimeout(timer);
    }

    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        }
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  }, [token, navigate]);

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">Order History</h1>

      {!token && (
        <div className="error-alert" style={{ marginBottom: '20px' }}>
          ⚠️ BUG-039 Triggered: Unauthenticated user rendering order history table (Redirecting to login in 1.5s...)
        </div>
      )}

      {loading ? (
        <p>Loading your orders...</p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', background: 'white', padding: '48px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <Package size={48} className="text-muted" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>No Orders Found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>You haven't placed any orders yet.</p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.id}>
                  <td style={{ fontWeight: 700 }}>#{ord.id}</td>
                  <td>{new Date(ord.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background:
                          ord.status === 'DELIVERED'
                            ? '#dcfce7'
                            : ord.status === 'SHIPPED'
                            ? '#e0f2fe'
                            : ord.status === 'CANCELLED'
                            ? '#fee2e2'
                            : '#fef3c7',
                        color:
                          ord.status === 'DELIVERED'
                            ? '#166534'
                            : ord.status === 'SHIPPED'
                            ? '#0369a1'
                            : ord.status === 'CANCELLED'
                            ? '#991b1b'
                            : '#92400e'
                      }}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td>{ord.paymentMethod}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{ord.totalAmount.toFixed(2)}</td>
                  <td>
                    <Link to={`/orders/${ord.id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={14} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
