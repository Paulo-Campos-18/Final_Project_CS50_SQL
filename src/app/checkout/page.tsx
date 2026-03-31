'use client';

import { useCart } from '@/context/CartContext';
import { getPaymentMethods, processCheckout } from '@/actions/checkout';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type PaymentMethod = { id: number; name: string };

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getPaymentMethods().then(methods => {
      setPaymentMethods(methods);
      if (methods.length > 0) setSelectedMethod(methods[0].id);
    });
  }, []);

  const handleCheckout = async () => {
    const savedUser = localStorage.getItem('keyvault-user');
    if (!savedUser) {
      setError('You must select a user from the Navbar before checking out.');
      return;
    }

    if (!selectedMethod) {
      setError('Please select a payment method.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const user = JSON.parse(savedUser);
    const result = await processCheckout(
      user.id,
      cart.map(i => ({ gameId: i.gameId, price: i.price, quantity: i.quantity })),
      selectedMethod
    );

    setIsProcessing(false);

    if (result && result.success) {
      setSuccess(true);
      clearCart();
    } else {
      setError((result as { success: false, error: string }).error || 'Failed to process checkout');
    }
  };

  if (success) {
    return (
      <main className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <div className="section-header" style={{ justifyContent: 'center', marginBottom: '40px' }}>
          <h1 className="section-title">🎉 Order Confirmed!</h1>
        </div>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--bg-card)', padding: '40px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent-success)' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '24px' }}>
            Thank you for your purchase! Your game keys are now available in your profile.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/profile" className="btn btn-primary">Go to Profile</Link>
            <Link href="/games" className="btn btn-outline">Continue Shopping</Link>
          </div>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <h1 className="section-title" style={{ marginBottom: '20px' }}>Checkout</h1>
        <p className="section-subtitle">Your cart is empty.</p>
        <Link href="/games" className="btn btn-primary" style={{ marginTop: '24px' }}>Go to Store</Link>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: '80px' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">🛍️ Checkout</h1>
          <p className="section-subtitle">Review your items and complete purchase</p>
        </div>
      </div>

      <div className="detail-grid" style={{ gridTemplateColumns: '1fr 360px' }}>
        <div className="cart-items">
          <div className="detail-info-card">
            <h3 style={{ marginBottom: '24px' }}>Order Summary</h3>
            <table className="data-table" style={{ border: 'none' }}>
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Platform</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.gameId}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td><span className="badge badge-info">{item.platform}</span></td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>{item.quantity}×</td>
                    <td style={{ color: 'var(--accent-success)' }}>${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="detail-info-card">
            <h3>💳 Payment Method</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {paymentMethods.map(pm => (
                <label key={pm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: selectedMethod === pm.id ? '1px solid var(--accent-primary)' : '1px solid transparent' }}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value={pm.id} 
                    checked={selectedMethod === pm.id} 
                    onChange={() => setSelectedMethod(pm.id)} 
                  />
                  {pm.name}
                </label>
              ))}
            </div>
          </div>

          <div className="detail-info-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>
              <span>Total to Pay:</span>
              <span style={{ color: 'var(--accent-success)' }}>${cartTotal.toFixed(2)}</span>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', marginBottom: '16px', border: '1px solid var(--accent-danger)' }}>
                {error}
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing... ⏳' : 'Confirm Purchase ✅'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
