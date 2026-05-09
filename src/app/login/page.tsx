'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const r = await login(email, password);
    if (r.success) {
      router.push('/');
    } else {
      setError(r.error || 'Falha no login');
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <section className="section" style={{ paddingTop: '64px' }}>
        <div className="container" style={{ maxWidth: '460px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 className="section-title" style={{ fontFamily: 'var(--font-display)', marginBottom: 6 }}>
              Entrar
            </h1>
            <p className="section-subtitle">Acesse sua conta KEYFORGE.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="voce@email.com"
                style={fieldStyle}
              />
            </label>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Senha
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={fieldStyle}
              />
            </label>
            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'oklch(0.80 0.18 30 / 0.10)',
                  border: '1px solid oklch(0.80 0.18 30 / 0.40)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-warn)',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 16 }}>
            É administrador?{' '}
            <Link href="/admin/login" style={{ color: 'var(--accent-primary)' }}>
              Painel administrativo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

const fieldStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '12px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
};
