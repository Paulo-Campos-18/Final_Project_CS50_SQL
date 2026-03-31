'use client';

import AdminGuard from '@/components/AdminGuard';
import { useEffect, useState } from 'react';

type AdminData = {
  games: { id: number; name: string }[];
  genres: { id: number; name: string }[];
  platforms: { id: number; name: string }[];
  users: { id: number; firstName: string; lastName: string; nickname: string; email: string; deleted: number; role: string }[];
  gameGenresMap: Record<number, number[]>;
};

type TabId = 'addGame' | 'createUser' | 'deleteUser' | 'addSupplier' | 'addGenre' | 'editGameGenres';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'addGame', label: 'Adicionar Jogo', icon: '🎮' },
  { id: 'createUser', label: 'Criar Usuário', icon: '👤' },
  { id: 'deleteUser', label: 'Excluir Usuário', icon: '🗑️' },
  { id: 'addSupplier', label: 'Adicionar Fornecedor', icon: '📦' },
  { id: 'addGenre', label: 'Adicionar Categoria', icon: '🏷️' },
  { id: 'editGameGenres', label: 'Editar Categorias', icon: '✏️' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
  fontFamily: 'var(--font-body)', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.82rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)',
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('addGame');
  const [data, setData] = useState<AdminData | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [gameName, setGameName] = useState('');
  const [gameStudio, setGameStudio] = useState('');
  const [gameDesc, setGameDesc] = useState('');
  const [gamePrice, setGamePrice] = useState('');
  const [gamePlatform, setGamePlatform] = useState('');
  const [gameGenreIds, setGameGenreIds] = useState<number[]>([]);

  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userNickname, setUserNickname] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('user');

  const [supplierName, setSupplierName] = useState('');
  const [supplierWebsite, setSupplierWebsite] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPlatform, setSupplierPlatform] = useState('');

  const [genreName, setGenreName] = useState('');

  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);

  const fetchData = async () => {
    const res = await fetch('/api/admin');
    const d = await res.json();
    setData(d);
  };

  useEffect(() => { fetchData(); }, []);

  const adminAction = async (action: string, body: Record<string, unknown>) => {
    setLoading(true); setMessage(''); setError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const result = await res.json();
      if (!res.ok) setError(result.error);
      else { setMessage(result.message); fetchData(); }
    } catch { setError('Erro de conexão'); }
    setLoading(false);
  };

  const handleGameGenreToggle = (id: number) => {
    setGameGenreIds((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const handleSelectedGenreToggle = (id: number) => {
    setSelectedGenreIds((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  useEffect(() => {
    if (selectedGameId && data) {
      setSelectedGenreIds(data.gameGenresMap[Number(selectedGameId)] || []);
    }
  }, [selectedGameId, data]);

  return (
    <AdminGuard>
      <main className="container" style={{ paddingTop: '80px' }}>
        <div className="section-header">
          <div>
            <h1 className="section-title">⚙️ Painel Administrativo</h1>
            <p className="section-subtitle">Gerencie jogos, usuários, fornecedores e categorias</p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMessage(''); setError(''); }}
              style={{
                padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                background: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--bg-glass)',
                color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {message && <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius-sm)', color: '#4ade80', fontSize: '0.88rem', marginBottom: '16px' }}>{message}</div>}
        {error && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.88rem', marginBottom: '16px' }}>{error}</div>}

        <div className="dashboard-card">
          {/* Add Game */}
          {activeTab === 'addGame' && (
            <form onSubmit={(e) => { e.preventDefault(); adminAction('addGame', { name: gameName, studio: gameStudio, description: gameDesc, price: gamePrice, platformId: gamePlatform, genreIds: gameGenreIds }); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>🎮 Adicionar Novo Jogo</h3>
              <div><label style={labelStyle}>Nome</label><input style={inputStyle} value={gameName} onChange={(e) => setGameName(e.target.value)} required /></div>
              <div><label style={labelStyle}>Estúdio</label><input style={inputStyle} value={gameStudio} onChange={(e) => setGameStudio(e.target.value)} required /></div>
              <div><label style={labelStyle}>Descrição</label><textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={gameDesc} onChange={(e) => setGameDesc(e.target.value)} /></div>
              <div><label style={labelStyle}>Preço (R$)</label><input type="number" step="0.01" style={inputStyle} value={gamePrice} onChange={(e) => setGamePrice(e.target.value)} required /></div>
              <div>
                <label style={labelStyle}>Plataforma</label>
                <select style={inputStyle} value={gamePlatform} onChange={(e) => setGamePlatform(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {data?.platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Gêneros</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {data?.genres.map((g) => (
                    <button key={g.id} type="button" onClick={() => handleGameGenreToggle(g.id)} style={{ padding: '6px 12px', borderRadius: '99px', border: '1px solid var(--border-color)', background: gameGenreIds.includes(g.id) ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: gameGenreIds.includes(g.id) ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s' }}>
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Adicionando...' : 'Adicionar Jogo'}
              </button>
            </form>
          )}

          {/* Create User */}
          {activeTab === 'createUser' && (
            <form onSubmit={(e) => { e.preventDefault(); adminAction('createUser', { firstName: userFirstName, lastName: userLastName, nickname: userNickname, email: userEmail, password: userPassword, role: userRole }); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>👤 Criar Novo Usuário</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Nome</label><input style={inputStyle} value={userFirstName} onChange={(e) => setUserFirstName(e.target.value)} required /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Sobrenome</label><input style={inputStyle} value={userLastName} onChange={(e) => setUserLastName(e.target.value)} required /></div>
              </div>
              <div><label style={labelStyle}>Apelido</label><input style={inputStyle} value={userNickname} onChange={(e) => setUserNickname(e.target.value)} required /></div>
              <div><label style={labelStyle}>E-mail</label><input type="email" style={inputStyle} value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required /></div>
              <div><label style={labelStyle}>Senha</label><input type="password" style={inputStyle} value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required /></div>
              <div>
                <label style={labelStyle}>Papel</label>
                <select style={inputStyle} value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Criando...' : 'Criar Usuário'}
              </button>
            </form>
          )}

          {/* Delete User */}
          {activeTab === 'deleteUser' && (
            <div>
              <h3 style={{ marginBottom: '16px' }}>🗑️ Excluir Usuários</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data?.users.filter((u) => u.deleted === 0).map((u) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                    background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                  }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '8px' }}>@{u.nickname}</span>
                      {u.role === 'admin' && <span style={{ marginLeft: '6px', fontSize: '0.65rem', background: 'rgba(139,92,246,0.2)', color: 'var(--accent-primary-light)', padding: '1px 6px', borderRadius: '99px' }}>admin</span>}
                    </div>
                    <button
                      onClick={() => { if (confirm(`Tem certeza que deseja excluir ${u.firstName}?`)) adminAction('deleteUser', { userId: u.id }); }}
                      className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.82rem', color: '#f87171', borderColor: '#f87171' }}
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Supplier */}
          {activeTab === 'addSupplier' && (
            <form onSubmit={(e) => { e.preventDefault(); adminAction('addSupplier', { name: supplierName, website: supplierWebsite, contactEmail: supplierEmail, platformId: supplierPlatform }); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>📦 Adicionar Fornecedor</h3>
              <div><label style={labelStyle}>Nome</label><input style={inputStyle} value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required /></div>
              <div><label style={labelStyle}>Website</label><input type="url" style={inputStyle} value={supplierWebsite} onChange={(e) => setSupplierWebsite(e.target.value)} required /></div>
              <div><label style={labelStyle}>E-mail de Contato</label><input type="email" style={inputStyle} value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} required /></div>
              <div>
                <label style={labelStyle}>Plataforma</label>
                <select style={inputStyle} value={supplierPlatform} onChange={(e) => setSupplierPlatform(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {data?.platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Adicionando...' : 'Adicionar Fornecedor'}
              </button>
            </form>
          )}

          {/* Add Genre */}
          {activeTab === 'addGenre' && (
            <form onSubmit={(e) => { e.preventDefault(); adminAction('addGenre', { name: genreName }); setGenreName(''); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>🏷️ Adicionar Categoria</h3>
              <div><label style={labelStyle}>Nome da Categoria</label><input style={inputStyle} value={genreName} onChange={(e) => setGenreName(e.target.value)} required /></div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Adicionando...' : 'Adicionar'}
              </button>
              {data && data.genres.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>Categorias Existentes:</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {data.genres.map((g) => (
                      <span key={g.id} className="genre-tag">{g.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Edit Game Genres */}
          {activeTab === 'editGameGenres' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>✏️ Editar Categorias de um Jogo</h3>
              <div>
                <label style={labelStyle}>Selecione o Jogo</label>
                <select style={inputStyle} value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {data?.games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              {selectedGameId && (
                <>
                  <div>
                    <label style={labelStyle}>Categorias</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {data?.genres.map((g) => (
                        <button key={g.id} type="button" onClick={() => handleSelectedGenreToggle(g.id)} style={{ padding: '6px 14px', borderRadius: '99px', border: '1px solid var(--border-color)', background: selectedGenreIds.includes(g.id) ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: selectedGenreIds.includes(g.id) ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s' }}>
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => adminAction('updateGameGenres', { gameId: selectedGameId, genreIds: selectedGenreIds })}
                    disabled={loading} className="btn btn-primary" style={{ padding: '12px', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Salvando...' : 'Salvar Categorias'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </AdminGuard>
  );
}
