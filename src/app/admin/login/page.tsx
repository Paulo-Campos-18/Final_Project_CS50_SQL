'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuthenticatedUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Falha no login administrativo.');
        setLoading(false);
        return;
      }

      setAuthenticatedUser(data.user);
      router.push('/admin');
    } catch (err) {
      console.error(err);
      setError('Não foi possível conectar ao servidor.');
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <section className="section" style={{ paddingTop: '64px' }}>
        <div
          className="container"
          style={{ maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.22em',
                color: 'var(--accent-primary)',
                marginBottom: '14px',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }} />
              ADMIN ACCESS
            </div>
            <h1
              className="section-title"
              style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: 8 }}
            >
              Painel administrativo
            </h1>
            <p className="section-subtitle">
              Acesso restrito para operações de inventário, vendas e fornecedores.
            </p>
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
            <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="paulo@gmail.com"
                style={inputStyle}
              />
            </label>

            <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Senha
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••"
                style={inputStyle}
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

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 4 }}>
              {loading ? 'Verificando...' : 'Entrar como admin'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            É cliente?{' '}
            <Link href="/login" style={{ color: 'var(--accent-primary)' }}>
              Acesse a loja
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
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
