'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError('Email inválido.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(nickname)) {
      setError('Apelido deve ter 3-30 caracteres (letras, números, . _ -).');
      return;
    }

    setLoading(true);
    const r = await register({ firstName, lastName, nickname, email, password });
    if (r.success) {
      // AuthContext.register sets keyvault-auth + hard-reloads to /
      router.push('/');
    } else {
      setError(r.error || 'Falha no cadastro');
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <section className="section" style={{ paddingTop: '64px' }}>
        <div className="container" style={{ maxWidth: '480px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
              NOVA CONTA
            </div>
            <h1 className="section-title" style={{ fontFamily: 'var(--font-display)', marginBottom: 6 }}>
              Criar conta
            </h1>
            <p className="section-subtitle">
              Acesso instantâneo ao catálogo, wishlist e biblioteca.
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={labelStyle}>
                Nome
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength={30}
                  autoComplete="given-name"
                  style={fieldStyle}
                />
              </label>
              <label style={labelStyle}>
                Sobrenome
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  maxLength={30}
                  autoComplete="family-name"
                  style={fieldStyle}
                />
              </label>
            </div>

            <label style={labelStyle}>
              Apelido (nickname público)
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                autoComplete="username"
                placeholder="ex: paulo_gamer"
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={labelStyle}>
                Senha
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  style={fieldStyle}
                />
              </label>
              <label style={labelStyle}>
                Confirmar
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  style={fieldStyle}
                />
              </label>
            </div>

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

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Ao criar a conta você concorda em receber comunicações sobre seus pedidos. Não compartilhamos seu email.
            </p>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 4 }}>
              {loading ? 'Criando conta…' : 'Criar conta'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 16 }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: 'var(--accent-primary)' }}>
              Entrar
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: '0.82rem',
  color: 'var(--text-secondary)',
};

const fieldStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '11px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  fontSize: '0.92rem',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
};
