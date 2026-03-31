'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Friend {
  friendshipId: number;
  friendId: number;
  firstName: string;
  lastName: string;
  nickname: string;
}

interface PendingRequest {
  friendshipId: number;
  fromUserId?: number;
  toUserId?: number;
  firstName: string;
  lastName: string;
  nickname: string;
}

export default function FriendsPage() {
  const { user, isLoading } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendEmail, setFriendEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchFriends = async () => {
    if (!user) return;
    const res = await fetch(`/api/friends?userId=${user.id}`);
    const data = await res.json();
    setFriends(data.friends || []);
    setPendingReceived(data.pendingReceived || []);
    setPendingSent(data.pendingSent || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!isLoading && user) fetchFriends();
    else if (!isLoading) setLoading(false);
  }, [user, isLoading]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAdding(true); setAddError(''); setAddSuccess('');
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, friendEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error); }
      else { setAddSuccess(data.message); setFriendEmail(''); fetchFriends(); }
    } catch { setAddError('Erro de conexão'); }
    setIsAdding(false);
  };

  const handleAction = async (friendshipId: number, action: 'accept' | 'reject') => {
    await fetch('/api/friends', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId, action }),
    });
    fetchFriends();
  };

  if (isLoading || loading) {
    return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Carregando...</p></div>;
  }

  if (!user) {
    return (
      <main className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <h1 className="section-title">🔒 Login Necessário</h1>
        <p className="section-subtitle">Faça login para ver seus amigos.</p>
      </main>
    );
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
    background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
    fontFamily: 'var(--font-body)', flex: 1, minWidth: '200px', boxSizing: 'border-box' as const,
  };

  return (
    <main className="container" style={{ paddingTop: '80px' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">👥 Amigos</h1>
          <p className="section-subtitle">Gerencie seus amigos e pedidos de amizade</p>
        </div>
      </div>

      {/* Add friend */}
      <section className="dashboard-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>➕ Adicionar Amigo</h3>
        <form onSubmit={handleAddFriend} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <input
            type="email" value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)}
            placeholder="Digite o e-mail do amigo..." required style={inputStyle}
          />
          <button type="submit" disabled={isAdding} className="btn btn-primary" style={{ padding: '10px 20px', opacity: isAdding ? 0.7 : 1 }}>
            {isAdding ? 'Enviando...' : 'Enviar Pedido'}
          </button>
        </form>
        {addError && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '8px' }}>{addError}</p>}
        {addSuccess && <p style={{ color: 'var(--accent-success)', fontSize: '0.85rem', marginTop: '8px' }}>{addSuccess}</p>}
      </section>

      {/* Pending received */}
      {pendingReceived.length > 0 && (
        <section className="dashboard-card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>📨 Pedidos Recebidos ({pendingReceived.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingReceived.map((p) => (
              <div key={p.friendshipId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                flexWrap: 'wrap', gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-warm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white',
                  }}>
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{p.nickname}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleAction(p.friendshipId, 'accept')} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                    ✅ Aceitar
                  </button>
                  <button onClick={() => handleAction(p.friendshipId, 'reject')} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.82rem', color: '#f87171', borderColor: '#f87171' }}>
                    ✕ Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending sent */}
      {pendingSent.length > 0 && (
        <section className="dashboard-card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>📤 Pedidos Enviados ({pendingSent.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingSent.map((p) => (
              <div key={p.friendshipId} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-cool)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white',
                }}>
                  {p.firstName[0]}{p.lastName[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{p.nickname}</div>
                </div>
                <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>Pendente</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section className="dashboard-card">
        <h3 style={{ marginBottom: '16px' }}>🤝 Meus Amigos ({friends.length})</h3>
        {friends.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
            <p>Você ainda não tem amigos adicionados.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Use o campo acima para enviar um pedido de amizade por e-mail!
            </p>
          </div>
        ) : (
          <div className="user-grid">
            {friends.map((f) => (
              <div key={f.friendshipId} className="user-card">
                <div className="user-avatar">{f.firstName[0]}{f.lastName[0]}</div>
                <div className="user-info">
                  <h3>{f.firstName} {f.lastName}</h3>
                  <p className="user-nickname">@{f.nickname}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
