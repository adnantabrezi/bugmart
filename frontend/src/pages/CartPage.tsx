import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { items, cartSubtotal, removeFromCart, updateQuantity, appliedCoupon, applyCoupon } = useCart();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const res = await applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message || 'Invalid coupon');
    }
  };

  const discountAmount = appliedCoupon
    ? appliedCoupon.discountPercent > 0
      ? (cartSubtotal * appliedCoupon.discountPercent) / 100
      : appliedCoupon.discountAmount
    : 0;

  const estimatedTax = cartSubtotal * 0.18;
  const estimatedShipping = cartSubtotal > 2000 ? 0 : 99; // BUG-023: strictly > 2000
  const grandTotal = Math.max(0, cartSubtotal - discountAmount + estimatedTax + estimatedShipping);

  if (items.length === 0) {
    return (
      <div className="container page-wrapper" style={{ textAlign: 'center', paddingTop: '60px' }}>
        <ShoppingBag size={64} className="text-muted" style={{ margin: '0 auto 20px auto', opacity: 0.5 }} />
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '12px' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Looks like you haven't added any products yet.</p>
        <Link to="/products" className="btn-primary" style={{ padding: '12px 28px' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container page-wrapper">
      <h1 className="section-title">Shopping Cart ({items.length} Items)</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {/* Cart Table Container */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px', overflowX: 'auto' }}>
          {/* BUG-071: Mobile layout squishes quantity buttons */}
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const itemPrice = item.product.price * (1 - (item.product.discount || 0) / 100);
                const rowTotal = itemPrice * item.quantity;

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={item.product.image} alt={item.product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                        <div>
                          <Link to={`/products/${item.productId}`} style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {item.product.name}
                          </Link>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            SKU: {item.product.sku}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={{ fontWeight: 600 }}>₹{itemPrice.toFixed(2)}</td>

                    <td>
                      {/* BUG-014: Allows 0 quantity input */}
                      {/* BUG-021: Max quantity 10 fails when qty is set to 10 */}
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                        style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      />
                    </td>

                    <td style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                      ₹{rowTotal.toFixed(2)}
                    </td>

                    <td>
                      {/* BUG-007: Remove from cart removes UI row but omits API call */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{ color: 'var(--danger)', padding: '6px' }}
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Order Summary & Coupons Box */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Order Summary</h3>

          {/* Coupon Code Input */}
          <form onSubmit={handleCouponSubmit} style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Apply Coupon:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. WELCOME10"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
              />
              <button type="submit" className="btn-secondary" style={{ padding: '8px 14px' }}>
                <Tag size={16} />
              </button>
            </div>
            {couponError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>{couponError}</p>}
            {appliedCoupon && (
              <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 600 }}>
                ✔ Coupon {appliedCoupon.code} Applied!
              </p>
            )}
          </form>

          {/* Subtotals List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>₹{cartSubtotal.toLocaleString()}</span>
            </div>

            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>Discount ({appliedCoupon.code}):</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Est. GST Tax (18%):</span>
              <span>₹{estimatedTax.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Est. Delivery Shipping:</span>
              <span>{estimatedShipping === 0 ? 'FREE' : `₹${estimatedShipping}`}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', fontSize: '1.25rem', fontWeight: 800 }}>
              <span>Total:</span>
              <span style={{ color: 'var(--primary)' }}>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '24px', fontSize: '1rem', justifyContent: 'center' }}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
