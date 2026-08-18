import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { ArrowLeft, Package, MapPin, Phone } from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    // BUG-046: Fetches order details directly without checking ownership
    fetch(`/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Order not found');
        }
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, token]);

  if (loading) return <div className="container page-wrapper"><p>Loading order details...</p></div>;
  if (error || !order) return <div className="container page-wrapper"><h2>Order Not Found</h2></div>;

  return (
    <div className="container page-wrapper">
      <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} />
        Back to Order History
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>Order #{order.id}</h1>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Placed on {new Date(order.createdAt).toLocaleString()}
        </span>
      </div>

      {/* BUG-046 Vulnerability Warning */}
      <div className="error-alert" style={{ marginBottom: '24px' }}>
        ⚠️ BUG-046 Notice: Order loaded without ownership verification. Customer Email: <strong>{order.user?.email}</strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Items Table */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Purchased Items</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {order.orderItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qty: {item.quantity} × ₹{item.price.toFixed(2)}</span>
                </div>
                <span style={{ fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details Breakdown */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Order Details</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} className="text-primary" />
              <span>Status: <strong>{order.status}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} className="text-primary" />
              <span>Address: <strong>{order.shippingAddress}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={18} className="text-primary" />
              <span>Phone: <strong>{order.contactPhone}</strong></span>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Tax:</span>
                <span>₹{order.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Shipping:</span>
                <span>₹{order.shipping.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--primary)' }}>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
