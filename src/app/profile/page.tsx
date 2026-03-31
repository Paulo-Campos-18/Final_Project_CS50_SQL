'use client';

import { useEffect, useState } from 'react';
import { getUserPurchasedKeys, getUserOrders } from '@/actions/profile';
import Link from 'next/link';

type PurchasedKey = {
  orderId: number;
  purchaseDate: string | null;
  gameName: string;
  platform: string;
  keyCode: string;
  price: number;
};

type OrderData = {
  orderId: number;
  date: string | null;
  total: number;
  status: string;
};

export default function ProfilePage() {
  const [keys, setKeys] = useState<PurchasedKey[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: number; nickname: string; firstName: string; amount: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('keyvault-user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      Promise.all([
        getUserPurchasedKeys(u.id),
        getUserOrders(u.id)
      ]).then(([keysData, ordersData]) => {
        setKeys(keysData);
        setOrders(ordersData);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>Loading profile...</div>;
  }

  if (!user) {
    return (
      <main className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <h1 className="section-title">Auth Required</h1>
        <p className="section-subtitle">Please select a user from the Navbar to view your profile.</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: '80px' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">👋 Welcome back, {user.firstName}!</h1>
          <p className="section-subtitle">Manage your purchased games and account details</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Wallet Balance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-success)' }}>${user.amount.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Purchased Keys */}
        <section className="dashboard-card">
          <h3 style={{ marginBottom: '16px' }}>🔑 Your Game Keys ({keys.length})</h3>
          {keys.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
              <p>You haven't purchased any games yet.</p>
              <Link href="/games" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>Browse Store</Link>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Platform</th>
                    <th>Key Code</th>
                    <th>Purchase Date</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{k.gameName}</td>
                      <td><span className="badge badge-info">{k.platform}</span></td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary-light)', letterSpacing: '1px' }}>{k.keyCode}</td>
                      <td>{k.purchaseDate ? new Date(k.purchaseDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Order History */}
        {orders.length > 0 && (
          <section className="dashboard-card">
            <h3 style={{ marginBottom: '16px' }}>📦 Order History</h3>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.orderId}>
                      <td>#{o.orderId.toString().padStart(4, '0')}</td>
                      <td>{o.date ? new Date(o.date).toLocaleDateString() : 'N/A'}</td>
                      <td><span className="badge badge-success">{o.status}</span></td>
                      <td style={{ fontWeight: 600 }}>${o.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
