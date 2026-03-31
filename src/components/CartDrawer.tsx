'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useEffect } from 'react';

export default function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, cartTotal } = useCart();

  // Close when pressing Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <>
      <div className="cart-backdrop" onClick={() => setIsCartOpen(false)} />
      <div className="cart-drawer">
        <div className="cart-header">
          <h2>🛒 Your Cart</h2>
          <button className="cart-close" onClick={() => setIsCartOpen(false)}>
            ✕
          </button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty.</p>
              <button
                className="btn btn-primary"
                onClick={() => setIsCartOpen(false)}
                style={{ marginTop: '16px' }}
              >
                Browse Games
              </button>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.gameId} className="cart-item">
                  <div className="cart-item-details">
                    <h4>{item.name}</h4>
                    <span className="cart-item-platform">{item.platform}</span>
                    <div className="cart-item-price">${item.price.toFixed(2)}</div>
                  </div>
                  <div className="cart-item-actions">
                    <button onClick={() => updateQuantity(item.gameId, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.gameId, item.quantity + 1)}>+</button>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.gameId)}
                      title="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setIsCartOpen(false)}
            >
              Confirm Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
