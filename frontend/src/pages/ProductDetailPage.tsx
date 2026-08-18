import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft, Send } from 'lucide-react';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { token } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review form state
  const [newRating, setNewRating] = useState(5); // BUG-025: review accepts 0 or 6
  const [newComment, setNewComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    setLoading(true);

    // BUG-075: Unhandled non-numeric ID conversion throws runtime JS error for /products/abc
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Product not found in store database');
        }
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setReviewMsg('Please login to post a product review.');
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating: newRating, comment: newComment })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewMsg('Review submitted successfully!');
        setNewComment('');
        // Refresh product
        fetch(`/api/products/${id}`)
          .then((r) => r.json())
          .then((d) => setProduct(d));
      } else {
        setReviewMsg(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setReviewMsg('Review submission error');
    }
  };

  if (loading) {
    return <div className="container page-wrapper"><p>Loading product details...</p></div>;
  }

  if (error || !product) {
    return (
      <div className="container page-wrapper" style={{ textAlign: 'center', paddingTop: '60px' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Error Loading Product</h2>
        <p>{error || 'Product unavailable'}</p>
        <Link to="/products" className="btn-secondary" style={{ marginTop: '20px', display: 'inline-block' }}>
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="container page-wrapper">
      <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} />
        Back to Products
      </Link>

      <div style={{ background: 'white', padding: '36px', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', marginBottom: '40px' }}>
        {/* Product Image */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#f8fafc' }}>
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '100%', height: '400px', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
            }}
          />
        </div>

        {/* Product Info */}
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
            {product.category}
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 16px 0' }}>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Star size={18} fill="var(--accent)" color="var(--accent)" />
            <span style={{ fontWeight: 700 }}>{product.rating}</span>
            <span style={{ color: 'var(--text-muted)' }}>| SKU: {product.sku}</span>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              ₹{product.price.toLocaleString()}
            </span>
            
            {/* BUG-054: Null check missing on discount when discount is null */}
            {product.discount !== null && product.discount !== undefined && (
              <span style={{ marginLeft: '12px', background: 'var(--danger)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                {product.discount}% OFF
              </span>
            )}
          </div>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>
            {product.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Quantity:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>

            <button
              onClick={() => addToCart(product, quantity)}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '1rem', marginTop: '18px' }}
            >
              <ShoppingCart size={18} />
              <span>Add to Cart</span>
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <p>✔ In Stock ({product.stock} units available)</p>
            <p>✔ Free Local Demo Shipping</p>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section style={{ background: 'white', padding: '36px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Customer Reviews</h2>

        {/* Submit Review Form */}
        <form onSubmit={handleAddReview} style={{ marginBottom: '32px', background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>Write a Review</h4>
          {reviewMsg && <p style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '12px' }}>{reviewMsg}</p>}

          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Rating (1-5):</label>
              {/* BUG-025: Review boundary accepts rating 0 or 6 */}
              <input
                type="number"
                min="0"
                max="6"
                value={newRating}
                onChange={(e) => setNewRating(parseInt(e.target.value))}
                style={{ width: '80px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Comment:</label>
              <input
                type="text"
                placeholder="Write your review experience..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ width: '100%', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Send size={14} />
            Submit Review
          </button>
        </form>

        {/* Review List */}
        {product.reviews && product.reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {product.reviews.map((rev) => (
              <div key={rev.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700 }}>{rev.userName}</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(Math.min(5, Math.max(1, Math.round(rev.rating))))].map((_, i) => (
                      <Star key={i} size={12} fill="var(--accent)" color="var(--accent)" />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>{rev.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No customer reviews yet. Be the first to review!</p>
        )}
      </section>
    </div>
  );
};
