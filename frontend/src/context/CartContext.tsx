import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  addToCartFromModal: (product: Product, quantity?: number) => Promise<void>; // BUG-005
  removeFromCart: (cartItemId: number) => Promise<void>; // BUG-007
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>; // BUG-006, BUG-035
  clearCart: () => void;
  appliedCoupon: { code: string; discountPercent: number; discountAmount: number } | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
  } | null>(null);

  const fetchCart = async () => {
    if (!token) {
      // BUG-059: Guest cart from localStorage persists indefinitely across logouts
      const savedGuestCart = localStorage.getItem('bugmart_guest_cart');
      if (savedGuestCart) {
        const parsed = JSON.parse(savedGuestCart);
        setItems(parsed);
        setCartCount(parsed.reduce((acc: number, i: any) => acc + i.quantity, 0));
      }
      return;
    }

    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setCartSubtotal(data.subtotal);
        setCartCount(data.itemCount);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const addToCart = async (product: Product, quantity = 1) => {
    if (!token) {
      // Guest cart mode
      const newItem: CartItem = {
        id: Date.now(),
        userId: 0,
        productId: product.id,
        quantity,
        product
      };
      const updated = [...items, newItem];
      setItems(updated);
      setCartCount((prev) => prev + quantity);
      localStorage.setItem('bugmart_guest_cart', JSON.stringify(updated)); // BUG-059
      return;
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id, quantity })
      });

      if (res.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  // BUG-005: Add to cart from quick view modal adds item but fails to update cart count badge!
  const addToCartFromModal = async (product: Product, quantity = 1) => {
    if (!token) return;

    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id, quantity })
      });

      // Fetches cart items array but intentionally DOES NOT call setCartCount!
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        // setCartCount(data.itemCount); <-- INTENTIONALLY OMITTED FOR BUG-005!
      }
    } catch (err) {
      console.error('Quick add failed:', err);
    }
  };

  // BUG-007: Removing from cart updates UI state but does NOT call DELETE /api/cart/:id API!
  const removeFromCart = async (cartItemId: number) => {
    // Intentionally only updates local state array!
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
    // Missing API call: fetch(`/api/cart/${cartItemId}`, { method: 'DELETE' })
  };

  // BUG-006 & BUG-035: Rapid quantity clicks drop updates & subtotal does not recalculate
  const updateQuantity = async (cartItemId: number, quantity: number) => {
    // BUG-006: Stale closure on local state without prev callback
    const itemIndex = items.findIndex((i) => i.id === cartItemId);
    if (itemIndex > -1) {
      const newItems = [...items];
      newItems[itemIndex].quantity = quantity;
      setItems(newItems);
      // BUG-035: Does NOT recalculate cartSubtotal or grand total until full refresh!
    }

    if (token) {
      try {
        await fetch(`/api/cart/${cartItemId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ quantity })
        });
      } catch (err) {
        console.error('Update qty error:', err);
      }
    }
  };

  const clearCart = () => {
    setItems([]);
    setCartCount(0);
    setCartSubtotal(0);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartSubtotal })
      });

      const data = await res.json();
      if (data.success) {
        setAppliedCoupon({
          code: data.code,
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount
        });
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Invalid coupon' };
      }
    } catch (err: any) {
      return { success: false, message: 'Server error applying coupon' };
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        cartSubtotal,
        addToCart,
        addToCartFromModal,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedCoupon,
        applyCoupon,
        fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
