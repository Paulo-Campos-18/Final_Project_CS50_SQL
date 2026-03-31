'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserPurchasedKeys, getUserOrders } from '@/actions/profile';
import Link from 'next/link';

type PurchasedKey = { gameName: string; platform: string; keyCode: string; price: number; purchaseDate: string | null };
type OrderData = { orderId: number; date: string | null; total: number; status: string };

const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [keys, setKeys] = useState<PurchasedKey[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      Promise.all([
        getUserPurchasedKeys(user.id),
        getUserOrders(user.id),
      ]).then(([k, o]) => {
        setKeys(k);
        setOrders(o);
        setLoading(false);
      });
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [user, isLoading]);

  if (isLoading || loading) {
    return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Carregando perfil...</p></div>;
  }

  if (!user) {
    return (
      <main className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <h1 className="section-title">🔒 Login Necessário</h1>
        <p className="section-subtitle">Faça login para ver seu perfil.</p>
      </main>
    );
  }

  const totalSpent = orders.reduce((acc, o) => acc + o.total, 0);

  return (
    <main className="container" style={{ paddingTop: '80px' }}>
      {/* Profile card */}
      <div className="dashboard-card" style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'white', flexShrink: 0,
        }}>
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>{user.firstName} {user.lastName}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
            @{user.nickname}
            {user.role === 'admin' && (
              <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: 'rgba(139,92,246,0.2)', color: 'var(--accent-primary-light)', padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(139,92,246,0.3)' }}>Admin</span>
            )}
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-success)' }}>{formatBRL(user.amount)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{keys.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jogos</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{orders.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pedidos</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-tertiary)' }}>{formatBRL(totalSpent)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Gasto</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <Link href="/my-keys" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>🔑 Minhas Chaves</Link>
        <Link href="/friends" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>👥 Amigos</Link>
        <Link href="/wishlist" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>❤️ Wishlist</Link>
      </div>

      {/* Recent keys preview */}
      <section className="dashboard-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>🎮 Jogos Recentes</h3>
          {keys.length > 0 && <Link href="/my-keys" style={{ color: 'var(--accent-primary-light)', fontSize: '0.85rem' }}>Ver todos →</Link>}
        </div>
        {keys.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px', textAlign: 'center' }}>
            <p>Você ainda não comprou nenhum jogo.</p>
            <Link href="/games" className="btn btn-primary" style={{ marginTop: '12px', display: 'inline-block' }}>Explorar Loja</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {keys.slice(0, 6).map((k, i) => (
              <div key={i} style={{
                padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)', minWidth: '180px', flex: '1 1 180px',
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{k.gameName}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{k.platform}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-success)', fontWeight: 600 }}>{formatBRL(k.price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent orders preview */}
      {orders.length > 0 && (
        <section className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>📦 Últimos Pedidos</h3>
            <Link href="/my-keys" style={{ color: 'var(--accent-primary-light)', fontSize: '0.85rem' }}>Ver todos →</Link>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Pedido</th><th>Data</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.orderId}>
                    <td>#{o.orderId.toString().padStart(4, '0')}</td>
                    <td>{o.date ? new Date(o.date).toLocaleDateString('pt-BR') : 'N/A'}</td>
                    <td><span className="badge badge-success">{o.status}</span></td>
                    <td style={{ fontWeight: 600 }}>{formatBRL(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
