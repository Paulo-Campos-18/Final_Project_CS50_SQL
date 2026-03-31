'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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

const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function MyKeysPage() {
  const { user, isLoading } = useAuth();
  const [keys, setKeys] = useState<PurchasedKey[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'keys' | 'orders'>('keys');

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
    return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Carregando...</p></div>;
  }

  if (!user) {
    return (
      <main className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <h1 className="section-title">🔒 Login Necessário</h1>
        <p className="section-subtitle">Faça login para ver suas chaves e compras.</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: '80px' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">🔑 Minhas Chaves & Compras</h1>
          <p className="section-subtitle">Gerencie suas chaves de jogos e histórico de pedidos</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', maxWidth: '400px' }}>
        <button
          onClick={() => setActiveTab('keys')}
          style={{
            flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
            background: activeTab === 'keys' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: activeTab === 'keys' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s',
          }}
        >
          🔑 Chaves ({keys.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
            background: activeTab === 'orders' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: activeTab === 'orders' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s',
          }}
        >
          📦 Pedidos ({orders.length})
        </button>
      </div>

      {activeTab === 'keys' && (
        <section className="dashboard-card">
          {keys.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎮</div>
              <p style={{ marginBottom: '16px' }}>Você ainda não comprou nenhum jogo.</p>
              <Link href="/games" className="btn btn-primary" style={{ display: 'inline-block' }}>Explorar Loja</Link>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Jogo</th>
                    <th>Plataforma</th>
                    <th>Código da Chave</th>
                    <th>Preço</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{k.gameName}</td>
                      <td><span className="badge badge-info">{k.platform}</span></td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary-light)', letterSpacing: '1px', fontSize: '0.85rem' }}>{k.keyCode}</td>
                      <td style={{ fontWeight: 600 }}>{formatBRL(k.price)}</td>
                      <td>{k.purchaseDate ? new Date(k.purchaseDate).toLocaleDateString('pt-BR') : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'orders' && (
        <section className="dashboard-card">
          {orders.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
              <p>Nenhum pedido encontrado.</p>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pedido #</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
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
          )}
        </section>
      )}
    </main>
  );
}
