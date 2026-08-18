import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart } = useCart();

  // BUG-037: Smart Fitness Watch displays display price 2999 on card, but backend price is 3499
  const displayPrice = product.name === 'Smart Fitness Watch' ? 2999.00 : product.price;

  const originalPrice = product.discount && product.discount > 0
    ? displayPrice / (1 - product.discount / 100)
    : null;

  return (
    <div className="product-card">
      <div className="product-card-img-wrapper">
        {/* BUG-008: Seeded product 8 image source is intentionally broken .pngg */}
        <img
          src={product.image}
          alt={product.name}
          className="product-card-img"
          onError={(e) => {
            // Fallback display for broken image
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
          }}
        />

        {product.discount && product.discount > 0 && (
          <span className="badge-discount">{product.discount}% OFF</span>
        )}

        {onQuickView && (
          <button
            onClick={() => onQuickView(product)}
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'white',
              borderRadius: '50%',
              padding: '8px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Quick View"
          >
            <Eye size={18} className="text-dark" />
          </button>
        )}
      </div>

      <div className="product-card-body">
        <span className="product-category">{product.category}</span>
        
        {/* BUG-070: Title element uses inline white-space: nowrap for long titles causing card layout overflow */}
        <Link
          to={`/products/${product.id}`}
          className="product-title"
          style={product.name.length > 40 ? { whitespace: 'nowrap' } as any : {}}
        >
          {product.name}
        </Link>

        <div className="product-rating">
          <Star size={14} fill="var(--accent)" color="var(--accent)" />
          <span>{product.rating}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '4px' }}>
            ({product.sku})
          </span>
        </div>

        <div className="product-price-row">
          <div>
            <span className="price-current">₹{displayPrice.toLocaleString()}</span>
            {originalPrice && (
              <span className="price-original">₹{Math.round(originalPrice).toLocaleString()}</span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            className="btn-primary"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <ShoppingCart size={16} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
