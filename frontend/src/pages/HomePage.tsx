import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { Product } from '../types';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch('/api/products?limit=8')
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          setFeaturedProducts(data.products);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="container page-wrapper">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Testing Classroom Special
          </span>
          <h1 className="hero-title">Experience the Next Generation of E-Commerce.</h1>
          <p className="hero-subtitle">
            Browse our catalog of electronics, fashion, books, and home accessories with rapid local execution.
          </p>
          <Link to="/products" className="btn-primary">
            <span>Explore Catalog</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* BUG-066: Unoptimized 8MB high-res raw image causing slow render performance */}
        <div style={{ flexShrink: 0, maxWidth: '400px' }}>
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=4000&auto=format&fit=crop&q=100"
            alt="Hero Store Display"
            style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}
          />
        </div>
      </section>

      {/* Trust Badges */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '48px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Truck size={32} className="text-primary" />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Free Local Delivery</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>On eligible orders over ₹2,000</p>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ShieldCheck size={32} className="text-primary" />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>100% Secure Checkout</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Simulated test payment processing</p>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <RefreshCw size={32} className="text-primary" />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Easy 30-Day Returns</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No questions asked return policy</p>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Award size={32} className="text-primary" />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Quality Guarantee</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified lab demo environment</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Featured Products</h2>
          <Link to="/products" className="text-primary" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            View All ({featuredProducts.length}) →
          </Link>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      </section>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
