'use client';

import AdminGuard from '@/components/AdminGuard';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

type AdminData = {
  games: { id: number; name: string }[];
  genres: { id: number; name: string }[];
  platforms: { id: number; name: string }[];
  users: { id: number; firstName: string; lastName: string; nickname: string; email: string; deleted: number; role: string; amount: number }[];
  gameGenresMap: Record<number, number[]>;
};

type TabId = 'addGame' | 'createUser' | 'viewUsers' | 'addSupplier' | 'addGenre' | 'editGameGenres';

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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('addGame');
  const [data, setData] = useState<AdminData | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'viewUsers', label: t('adminTabUsers'), icon: '👥' },
    { id: 'addGame', label: t('adminTabAddGame'), icon: '🎮' },
    { id: 'createUser', label: t('adminTabCreateUser'), icon: '👤' },
    { id: 'addSupplier', label: t('adminTabAddSupplier'), icon: '📦' },
    { id: 'addGenre', label: t('adminTabAddGenre'), icon: '🏷️' },
    { id: 'editGameGenres', label: t('adminTabEditGenres'), icon: '✏️' },
  ];

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

  const [filterText, setFilterText] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

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
            <h1 className="section-title">{t('adminTitle')}</h1>
            <p className="section-subtitle">{t('adminSubtitle')}</p>
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
              <h3>{t('adminSectAddGame')}</h3>
              <div><label style={labelStyle}>{t('adminLabelName')}</label><input style={inputStyle} value={gameName} onChange={(e) => setGameName(e.target.value)} required /></div>
              <div><label style={labelStyle}>{t('adminLabelStudio')}</label><input style={inputStyle} value={gameStudio} onChange={(e) => setGameStudio(e.target.value)} required /></div>
              <div><label style={labelStyle}>{t('adminLabelDesc')}</label><textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={gameDesc} onChange={(e) => setGameDesc(e.target.value)} /></div>
              <div><label style={labelStyle}>{t('adminLabelPrice')} (R$)</label><input type="number" step="0.01" style={inputStyle} value={gamePrice} onChange={(e) => setGamePrice(e.target.value)} required /></div>
              <div>
                <label style={labelStyle}>{t('adminLabelPlatform')}</label>
                <select style={inputStyle} value={gamePlatform} onChange={(e) => setGamePlatform(e.target.value)} required>
                  <option value="">{t('adminSelect')}</option>
                  {data?.platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('adminLabelGenres')}</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {data?.genres.map((g) => (
                    <button key={g.id} type="button" onClick={() => handleGameGenreToggle(g.id)} style={{ padding: '6px 12px', borderRadius: '99px', border: '1px solid var(--border-color)', background: gameGenreIds.includes(g.id) ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: gameGenreIds.includes(g.id) ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s' }}>
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', opacity: loading ? 0.7 : 1 }}>
                {loading ? t('adminBtnAdding') : t('adminBtnAddGame')}
              </button>
            </form>
          )}

          {/* Create User */}
          {activeTab === 'createUser' && (
            <form onSubmit={(e) => { e.preventDefault(); adminAction('createUser', { firstName: userFirstName, lastName: userLastName, nickname: userNickname, email: userEmail, password: userPassword, role: userRole }); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>{t('adminSectCreateUser')}</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>{t('adminLabelName')}</label><input style={inputStyle} value={userFirstName} onChange={(e) => setUserFirstName(e.target.value)} required /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>{t('adminLabelLastName')}</label><input style={inputStyle} value={userLastName} onChange={(e) => setUserLastName(e.target.value)} required /></div>
              </div>
              <div><label style={labelStyle}>{t('adminLabelNickname')}</label><input style={inputStyle} value={userNickname} onChange={(e) => setUserNickname(e.target.value)} required /></div>
              <div><label style={labelStyle}>{t('adminLabelEmail')}</label><input type="email" style={inputStyle} value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required /></div>
              <div><label style={labelStyle}>{t('adminLabelPassword')}</label><input type="password" style={inputStyle} value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required /></div>
              <div>
                <label style={labelStyle}>{t('adminLabelRole')}</label>
                <select style={inputStyle} value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                  <option value="user">{t('adminRoleUser')}</option>
                  <option value="admin">{t('adminRoleAdmin')}</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', opacity: loading ? 0.7 : 1 }}>
                {loading ? t('adminBtnCreating') : t('adminBtnCreateUser')}
              </button>
            </form>
          )}

          {/* View / Manage Users */}
          {activeTab === 'viewUsers' && (
            <div>
              <h3 style={{ marginBottom: '16px' }}>{t('adminSectViewUsers')}</h3>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder={t('adminSearchUserPlaceholder')}
                  style={{ ...inputStyle, flex: '1 1 200px' }}
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
                <select style={{ ...inputStyle, flex: '0 0 auto', width: 'auto' }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                  <option value="all">{t('adminFilterAllRoles')}</option>
                  <option value="user">{t('adminFilterNormalUsers')}</option>
                  <option value="admin">{t('adminFilterAdmins')}</option>
                </select>
                <select style={{ ...inputStyle, flex: '0 0 auto', width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">{t('adminFilterAllStatus')}</option>
                  <option value="active">{t('adminFilterActive')}</option>
                  <option value="deleted">{t('adminFilterDeleted')}</option>
                </select>
              </div>

              <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th>{t('adminColNameNick')}</th>
                      <th>{t('adminColEmail')}</th>
                      <th>{t('adminColRole')}</th>
                      <th>{t('adminColBalance')}</th>
                      <th>{t('adminColStatus')}</th>
                      <th>{t('adminColActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.users.filter(u => {
                      const regex = new RegExp(filterText, 'i');
                      const textMatch = regex.test(u.firstName) || regex.test(u.lastName) || regex.test(u.nickname) || regex.test(u.email);
                      const roleMatch = filterRole === 'all' || u.role === filterRole;
                      const statusMatch = filterStatus === 'all' || (filterStatus === 'active' && u.deleted === 0) || (filterStatus === 'deleted' && u.deleted !== 0);
                      return textMatch && roleMatch && statusMatch;
                    }).map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary-light)' }}>@{u.nickname}</div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td>
                          {u.role === 'admin' 
                            ? <span className="badge badge-info" style={{ padding: '2px 8px' }}>{t('adminBadgeAdmin')}</span>
                            : <span className="badge badge-secondary" style={{ padding: '2px 8px' }}>{t('adminBadgeUser')}</span>}
                        </td>
                        <td style={{ color: 'var(--accent-success)', fontWeight: 600 }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(u.amount)}
                        </td>
                        <td>
                          {u.deleted === 0
                            ? <span className="badge badge-success" style={{ padding: '2px 8px' }}>{t('adminBadgeActive')}</span>
                            : <span className="badge badge-danger" style={{ padding: '2px 8px' }}>{t('adminBadgeDeleted')}</span>}
                        </td>
                        <td>
                          {u.deleted === 0 && (
                            <button
                              onClick={() => { if (confirm(`${t('adminConfirmDelete')} ${u.firstName}?`)) adminAction('deleteUser', { userId: u.id }); }}
                              className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#f87171', borderColor: '#f87171' }}
                            >
                              {t('adminBtnDelete')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Supplier */}
          {activeTab === 'addSupplier' && (
            <form onSubmit={(e) => { e.preventDefault(); adminAction('addSupplier', { name: supplierName, website: supplierWebsite, contactEmail: supplierEmail, platformId: supplierPlatform }); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>{t('adminSectAddSupplier')}</h3>
              <div><label style={labelStyle}>{t('adminLabelName')}</label><input style={inputStyle} value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required /></div>
              <div><label style={labelStyle}>{t('adminLabelWebsite')}</label><input type="url" style={inputStyle} value={supplierWebsite} onChange={(e) => setSupplierWebsite(e.target.value)} required /></div>
              <div><label style={labelStyle}>{t('adminLabelContactEmail')}</label><input type="email" style={inputStyle} value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} required /></div>
              <div>
                <label style={labelStyle}>{t('adminLabelPlatform')}</label>
                <select style={inputStyle} value={supplierPlatform} onChange={(e) => setSupplierPlatform(e.target.value)} required>
                  <option value="">{t('adminSelect')}</option>
                  {data?.platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', opacity: loading ? 0.7 : 1 }}>
                {loading ? t('adminBtnAdding') : t('adminBtnAddSupplier')}
              </button>
            </form>
          )}

          {/* Add Genre */}
          {activeTab === 'addGenre' && (
            <form onSubmit={(e) => { e.preventDefault(); adminAction('addGenre', { name: genreName }); setGenreName(''); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>{t('adminSectAddGenre')}</h3>
              <div><label style={labelStyle}>{t('adminLabelGenreName')}</label><input style={inputStyle} value={genreName} onChange={(e) => setGenreName(e.target.value)} required /></div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', opacity: loading ? 0.7 : 1 }}>
                {loading ? t('adminBtnAdding') : t('adminBtnAdd')}
              </button>
              {data && data.genres.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>{t('adminExistingGenres')}</h4>
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
              <h3>{t('adminSectEditGenres')}</h3>
              <div>
                <label style={labelStyle}>{t('adminLabelSelectGame')}</label>
                <select style={inputStyle} value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)}>
                  <option value="">{t('adminSelect')}</option>
                  {data?.games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              {selectedGameId && (
                <>
                  <div>
                    <label style={labelStyle}>{t('adminLabelGenres')}</label>
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
                    {loading ? t('adminBtnSaving') : t('adminBtnSaveGenres')}
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
