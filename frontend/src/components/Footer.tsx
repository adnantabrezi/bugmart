import React from 'react';
import { ShoppingBag } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '30px' }}>
        <div style={{ maxWidth: '300px' }}>
          <div className="brand-logo" style={{ color: 'white', marginBottom: '12px' }}>
            <ShoppingBag className="w-6 h-6 text-primary" />
            <span>Bug<span style={{ color: 'var(--primary)' }}>Mart</span></span>
          </div>
          <p>The premium classroom demonstration e-commerce environment for software testing & QA bug hunting.</p>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '1rem' }}>Shop Categories</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><a href="/products?category=Electronics">Electronics</a></li>
            <li><a href="/products?category=Clothing">Clothing</a></li>
            <li><a href="/products?category=Books">Books</a></li>
            <li><a href="/products?category=Accessories">Accessories</a></li>
            <li><a href="/products?category=Home">Home & Living</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '1rem' }}>Testing Resources</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><a href="/instructor/seeded-bugs.json" target="_blank" rel="noreferrer">Seeded Bugs JSON (Instructor Only)</a></li>
            <li><a href="/admin">Admin Control Panel</a></li>
            <li><a href="/orders">Order History</a></li>
          </ul>
        </div>
      </div>

      <div className="container" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #334155', textAlign: 'center', fontSize: '0.85rem' }}>
        <p>© 2026 BugMart Software Testing Classroom Lab. All fake data. Local demo only.</p>
      </div>
    </footer>
  );
};
