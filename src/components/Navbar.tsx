'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency, CURRENCIES, CurrencyCode } from '@/context/CurrencyContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, setIsCartOpen } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user, login, register, updateUser, logout } = useAuth();
  const { language, t, toggleLanguage } = useLanguage();
  const { currency, setCurrency, format } = useCurrency();

  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register fields
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // User dropdown
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Edit profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editError, setEditError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    const result = await login(email, password);
    setIsLoggingIn(false);
    if (result.success) {
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } else {
      setLoginError(result.error || 'Erro ao fazer login');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegError('');
    const result = await register({
      firstName: regFirstName,
      lastName: regLastName,
      nickname: regNickname,
      email: regEmail,
      password: regPassword,
    });
    setIsRegistering(false);
    if (result.success) {
      setShowAuthModal(false);
      setRegFirstName(''); setRegLastName(''); setRegNickname('');
      setRegEmail(''); setRegPassword('');
    } else {
      setRegError(result.error || 'Erro ao criar conta');
    }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setEditError('');
    const result = await updateUser({
      firstName: editFirstName || undefined,
      lastName: editLastName || undefined,
      nickname: editNickname || undefined,
    });
    setIsSavingProfile(false);
    if (result.success) {
      setShowEditModal(false);
    } else {
      setEditError(result.error || 'Erro ao atualizar');
    }
  };

  const openEditModal = () => {
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditNickname(user?.nickname || '');
    setEditError('');
    setShowUserMenu(false);
    setShowEditModal(true);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const publicLinks = [
    { href: '/', label: t('navHome') },
    { href: '/games', label: t('navGames') },
    { href: '/deals', label: language === 'pt-BR' ? 'Promoções' : 'Deals' },
    { href: '/wishlist', label: t('navWishlist') },
  ];

  const adminLinks = [
    { href: '/dashboard', label: t('navDashboard') },
    { href: '/admin', label: t('navManage') },
  ];

  const links = [
    ...publicLinks,
    ...(user?.role === 'admin' ? adminLinks : []),
  ];

  // user.amount is stored as a USD-equivalent wallet balance
  const formatBRL = (value: number) => format(value);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
    fontFamily: 'var(--font-body)', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.82rem', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)',
  };

  return (
    <>
      <nav className="navbar" id="main-navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">
            <div className="navbar-logo-icon">🔑</div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.01em' }}>KEYFORGE</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.22em', color: 'var(--text-muted)', marginTop: 2 }}>DIGITAL KEY VAULT</span>
            </div>
          </Link>

          <ul className="navbar-links">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={pathname === link.href ? 'active' : ''}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={toggleLanguage}
              className="btn btn-outline"
              style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', fontSize: '1rem', width: '40px', display: 'flex', justifyContent: 'center' }}
              title={t('langToggle')}
            >
              {language === 'pt-BR' ? '🇧🇷' : '🇺🇸'}
            </button>
            <button
              onClick={toggleTheme}
              className="btn btn-outline"
              style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', width: '40px', display: 'flex', justifyContent: 'center' }}
              title={theme === 'dark' ? t('themeLight') : t('themeDark')}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {user ? (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px',
                    background: 'var(--bg-glass)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white',
                  }}>
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      @{user.nickname}
                      {user.role === 'admin' && (
                        <span style={{ marginLeft: '4px', fontSize: '0.6rem', background: 'rgba(139,92,246,0.2)', color: 'var(--accent-primary-light)', padding: '1px 5px', borderRadius: '99px', border: '1px solid rgba(139,92,246,0.3)' }}>admin</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--accent-success)' }}>
                      {formatBRL(user.amount)}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '2px' }}>▼</span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: '260px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden', zIndex: 1500, padding: '6px 0',
                  }}>
                    {/* Currency selector */}
                    <div style={{ padding: '10px 14px 4px' }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                        letterSpacing: '0.18em', color: 'var(--text-muted)',
                        marginBottom: 6, paddingLeft: 2,
                      }}>
                        {language === 'pt-BR' ? 'MOEDA' : 'CURRENCY'}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {(Object.values(CURRENCIES) as Array<{ code: CurrencyCode; symbol: string; rate: number; flag: string; label: string }>).map((c) => {
                          const active = currency === c.code;
                          return (
                            <button
                              key={c.code}
                              onClick={() => setCurrency(c.code)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                background: active ? 'var(--bg-glass-hover)' : 'transparent',
                                color: 'var(--text-primary)',
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'all 0.15s',
                              }}
                            >
                              <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>{c.flag}</span>
                              <div style={{ minWidth: 0, lineHeight: 1.15 }}>
                                <div style={{
                                  fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600,
                                  color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
                                }}>
                                  {c.code}
                                </div>
                                <div style={{
                                  fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                                  color: 'var(--text-muted)',
                                }}>
                                  {c.symbol} · {c.rate.toFixed(2)}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0 4px' }} />

                    {[
                      { label: `👤 ${t('myProfile')}`, href: '/profile' },
                      { label: `🔑 ${t('myKeys')}`, href: '/my-keys' },
                      { label: `👥 ${t('friends')}`, href: '/friends' },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowUserMenu(false)}
                        style={{
                          display: 'block', padding: '10px 16px', fontSize: '0.88rem',
                          color: 'var(--text-primary)', textDecoration: 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                    <button
                      onClick={openEditModal}
                      style={{
                        display: 'block', width: '100%', padding: '10px 16px', fontSize: '0.88rem',
                        color: 'var(--text-primary)', background: 'transparent', border: 'none',
                        textAlign: 'left', cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      ✏️ {t('editProfile')}
                    </button>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', padding: '10px 16px', fontSize: '0.88rem',
                        color: '#f87171', background: 'transparent', border: 'none',
                        textAlign: 'left', cursor: 'pointer', transition: 'background 0.15s',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="btn btn-primary" style={{ padding: '8px 18px' }}>
                {t('login')}
              </button>
            )}

            <button
              className="cart-toggle-btn btn btn-outline"
              onClick={() => setIsCartOpen(true)}
              style={{ position: 'relative', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
            >
              🛒
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-8px',
                  background: 'var(--accent-primary)', color: 'white',
                  borderRadius: '50%', width: '20px', height: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 'bold'
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Auth Modal (Login / Register) */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuthModal(false); }}
        >
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)', padding: '40px', width: '100%', maxWidth: '440px',
            boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔑</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: '700', marginBottom: '6px' }}>
                {authMode === 'login' ? t('loginTitle') : t('registerTitle')}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {authMode === 'login' ? t('loginSubtitle') : t('registerSubtitle')}
              </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0px', marginBottom: '24px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => { setAuthMode('login'); setLoginError(''); setRegError(''); }}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                  background: authMode === 'login' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: authMode === 'login' ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                {t('login')}
              </button>
              <button
                onClick={() => { setAuthMode('register'); setLoginError(''); setRegError(''); }}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                  background: authMode === 'register' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: authMode === 'register' ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                {t('register')}
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>{t('email')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t('password')}</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required style={inputStyle} />
                </div>
                {loginError && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.85rem' }}>
                    {loginError}
                  </div>
                )}
                <button type="submit" disabled={isLoggingIn} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem', opacity: isLoggingIn ? 0.7 : 1 }}>
                  {isLoggingIn ? t('loggingIn') : t('loginAction')}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('testAccount')}: <strong>paulo@gmail.com</strong> / <strong>123456</strong>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>{t('firstName')}</label>
                    <input type="text" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} placeholder="João" required style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>{t('lastName')}</label>
                    <input type="text" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} placeholder="Silva" required style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{t('nickname')}</label>
                  <input type="text" value={regNickname} onChange={(e) => setRegNickname(e.target.value)} placeholder="joao_silva" required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t('email')}</label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="joao@email.com" required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t('password')}</label>
                  <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••" required style={inputStyle} minLength={4} />
                </div>
                {regError && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.85rem' }}>
                    {regError}
                  </div>
                )}
                <button type="submit" disabled={isRegistering} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem', opacity: isRegistering ? 0.7 : 1 }}>
                  {isRegistering ? t('registering') : t('registerAction')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}
        >
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)', padding: '40px', width: '100%', maxWidth: '420px',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
              ✏️ {t('editProfile')}
            </h2>
            <form onSubmit={handleEditProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>{t('firstName')}</label>
                <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('lastName')}</label>
                <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('nickname')}</label>
                <input type="text" value={editNickname} onChange={(e) => setEditNickname(e.target.value)} style={inputStyle} />
              </div>
              {editError && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.85rem' }}>
                  {editError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline" style={{ flex: 1, padding: '10px' }}>
                  {t('cancel')}
                </button>
                <button type="submit" disabled={isSavingProfile} className="btn btn-primary" style={{ flex: 1, padding: '10px', opacity: isSavingProfile ? 0.7 : 1 }}>
                  {isSavingProfile ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
