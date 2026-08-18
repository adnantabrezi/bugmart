import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Truck, Wallet, CheckCircle, ArrowLeft } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, cartSubtotal, appliedCoupon, clearCart } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // BUG-045: Stale cached user address when switching accounts
  const [shippingAddress, setShippingAddress] = useState(user?.address || '   '); // BUG-016: Accepts spaces
  const [contactPhone, setContactPhone] = useState(user?.phone || '+1-800-CALL-ME'); // BUG-020: Accepts letters
  const [paymentMethod, setPaymentMethod] = useState('Test Card');
  const [simulateFailure, setSimulateFailure] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false); // BUG-074
  const [errorMsg, setErrorMsg] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  const discountAmount = appliedCoupon
    ? appliedCoupon.discountPercent > 0
      ? (cartSubtotal * appliedCoupon.discountPercent) / 100
      : appliedCoupon.discountAmount
    : 0;

  // BUG-029: Tax calculated on raw subtotal BEFORE discount
  const taxAmount = cartSubtotal * 0.18;

  // BUG-023: Free shipping condition subtotal > 2000 (adds 99 on exact 2000)
  const shippingFee = cartSubtotal > 2000 ? 0 : 99;

  // BUG-032: Discount allowed to exceed subtotal resulting in negative total
  const previewTotal = cartSubtotal - discountAmount + taxAmount + shippingFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }

    setIsProcessing(true); // BUG-074: Spinner turns on
    setErrorMsg('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingAddress,
          contactPhone,
          paymentMethod,
          couponCode: appliedCoupon?.code,
          forceFail: simulateFailure
        })
      });

      const data = await res.json();

      if (!res.ok) {
        // BUG-074: On error, if simulateFailure is true, retains isProcessing=true (spinner hangs!)
        if (!simulateFailure) {
          setIsProcessing(false);
        }
        setErrorMsg(data.error || 'Checkout process failed');
        return;
      }

      setIsProcessing(false);
      clearCart();
      setCreatedOrderId(data.order.id);
      setOrderComplete(true);
    } catch (err: any) {
      if (!simulateFailure) {
        setIsProcessing(false);
      }
      setErrorMsg('Network processing exception');
    }
  };

  if (orderComplete && createdOrderId) {
    return (
      <div className="container page-wrapper" style={{ textAlign: 'center', paddingTop: '60px' }}>
        <CheckCircle size={64} className="text-success" style={{ color: 'var(--success)', margin: '0 auto 20px auto' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>Order Placed Successfully!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Your order ID is <strong>#{createdOrderId}</strong>. Thank you for testing with BugMart!
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Link to={`/orders/${createdOrderId}`} className="btn-primary" style={{ padding: '12px 24px' }}>
            View Order Details
          </Link>
          <Link to="/products" className="btn-secondary" style={{ padding: '12px 24px' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-wrapper">
      {/* BUG-010: Back button from checkout navigates to /profile instead of /products */}
      <Link to="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} />
        Back to Shopping
      </Link>

      <h1 className="section-title">Checkout</h1>

      {errorMsg && <div className="error-alert">{errorMsg}</div>}

      {/* BUG-068: Tablet layout breakage container */}
      <div className="checkout-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {/* Shipping & Payment Form */}
        <div style={{ background: 'white', padding: '28px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Shipping Information</h3>

          <form onSubmit={handlePlaceOrder}>
            <div className="form-group">
              <label className="form-label">Full Address (Required)</label>
              {/* BUG-016: Accepts string of spaces */}
              <textarea
                className="form-input"
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter complete shipping address..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone Number</label>
              {/* BUG-020: Phone number allows non-numeric characters */}
              <input
                type="text"
                className="form-input"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +1 555 019 2831"
              />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '28px 0 16px 0' }}>Payment Method</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="payment"
                  value="Test Card"
                  checked={paymentMethod === 'Test Card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <CreditCard size={20} className="text-primary" />
                <div>
                  <span style={{ fontWeight: 600, display: 'block' }}>Test Card (Demo)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simulated instant card authorization</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="payment"
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <Truck size={20} />
                <div>
                  <span style={{ fontWeight: 600, display: 'block' }}>Cash on Delivery</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pay upon order arrival</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="payment"
                  value="Demo Wallet"
                  checked={paymentMethod === 'Demo Wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <Wallet size={20} />
                <div>
                  <span style={{ fontWeight: 600, display: 'block' }}>Demo Wallet</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simulated balance payment</span>
                </div>
              </label>
            </div>

            {/* Test Simulation Checkbox */}
            <div style={{ marginBottom: '20px', background: '#fffbebfb', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                />
                <span>Simulate Gateway Payment Error (reproduces BUG-074 & BUG-076)</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isProcessing}
              style={{ width: '100%', padding: '14px', fontSize: '1rem', justifyContent: 'center' }}
            >
              {isProcessing ? 'Processing Payment...' : `Complete Order — ₹${previewTotal.toFixed(2)}`}
            </button>
          </form>
        </div>

        {/* Summary Sidebar */}
        <div style={{ background: 'white', padding: '28px', borderRadius: '12px', border: '1px solid var(--border)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Order Items</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '240px', overflowY: 'auto' }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={item.product.image} alt={item.product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>{item.product.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Cart Subtotal:</span>
              <span>₹{cartSubtotal.toFixed(2)}</span>
            </div>

            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>Discount ({appliedCoupon.code}):</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tax (18% pre-discount):</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Shipping Fee:</span>
              <span>₹{shippingFee}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', fontSize: '1.2rem', fontWeight: 800 }}>
              <span>Summary Total:</span>
              <span style={{ color: 'var(--primary)' }}>₹{previewTotal.toFixed(2)}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px' }}>
              * Note: Database saved order total will differ (BUG-036)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
