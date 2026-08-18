import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, LogOut, Menu, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // BUG-002: Search clear button clears text box input but fails to trigger search results refresh
  const handleClearSearch = () => {
    setSearchQuery('');
    // Intentionally DOES NOT navigate back to empty search or trigger re-fetch!
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        <Link to="/" className="brand-logo">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <span>Bug<span style={{ color: 'var(--primary)' }}>Mart</span></span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="search-bar-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search products, brands & categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button type="button" onClick={handleClearSearch} className="search-clear-btn" title="Clear search">
              <X size={16} />
            </button>
          ) : (
            <button type="submit" className="search-clear-btn" title="Search">
              <Search size={16} />
            </button>
          )}
        </form>

        {/* Desktop Nav Links */}
        <nav className="nav-links">
          <Link to="/products" className="nav-link">Shop</Link>
          <Link to="/search" className="nav-link">Search</Link>
          
          <Link to="/cart" className="nav-link cart-icon-btn">
            <ShoppingBag size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <>
              <Link to="/orders" className="nav-link">Orders</Link>
              <Link to="/profile" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={18} />
                <span>{user.name.split(' ')[0]}</span>
              </Link>
              
              {/* BUG-041: Admin link shown if role is ADMIN, but route is accessible to all */}
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="nav-link text-primary" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  <ShieldAlert size={18} />
                  Admin
                </Link>
              )}

              <button onClick={logout} className="nav-link" style={{ color: 'var(--danger)' }} title="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Menu Toggle Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Sheet */}
      {/* BUG-009: Mobile navigation drawer sheet does NOT close after selecting an item */}
      <div className={`mobile-nav-sheet ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Intentionally missing setMobileMenuOpen(false) on link clicks! */}
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/products" className="nav-link">All Products</Link>
        <Link to="/search" className="nav-link">Search</Link>
        <Link to="/cart" className="nav-link">Cart ({cartCount})</Link>
        {user ? (
          <>
            <Link to="/profile" className="nav-link">Profile ({user.name})</Link>
            <Link to="/orders" className="nav-link">My Orders</Link>
            <Link to="/admin" className="nav-link">Admin Dashboard</Link>
            <button onClick={logout} className="nav-link" style={{ color: 'var(--danger)', textAlign: 'left' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-link text-primary">Login / Register</Link>
        )}
      </div>
    </header>
  );
};
