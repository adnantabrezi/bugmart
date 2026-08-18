import React from 'react';
import { X, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { addToCartFromModal } = useCart(); // BUG-005: uses addToCartFromModal which omits cart badge update

  if (!product) return null;

  const handleAdd = () => {
    addToCartFromModal(product, 1);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '220px', height: '220px', objectFit: 'cover', borderRadius: '8px' }}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>
              {product.category}
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '6px 0 10px 0' }}>{product.name}</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Star size={16} fill="var(--accent)" color="var(--accent)" />
              <span style={{ fontWeight: 600 }}>{product.rating}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>| SKU: {product.sku}</span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.4 }}>
              {product.description}
            </p>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{product.price.toLocaleString()}</span>
                {product.stock > 0 ? (
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                    In Stock ({product.stock} left)
                  </span>
                ) : (
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>
                    Out of Stock
                  </span>
                )}
              </div>

              <button onClick={handleAdd} className="btn-primary">
                <ShoppingCart size={18} />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
