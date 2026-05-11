'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';

interface ChargeResponse {
  copyPaste: string;
  qrDataUrl: string;
  amount: number;
  txId: string;
  expiresAt: string;
  reconciliation: string;
}

interface StoreConfig {
  keyLocked: boolean;
  merchantName: string;
  merchantCity: string;
  maskedKey: string | null;
}

export default function PixDemoPage() {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('39.99');
  const [description, setDescription] = useState('Compra de chave KEYFORGE');
  const [charge, setCharge] = useState<ChargeResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/pix/charge')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig({ keyLocked: false, merchantName: 'KEYFORGE', merchantCity: 'CUIABA', maskedKey: null }));
  }, []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCharge(null);
    setLoading(true);
    try {
      const txId = `KFG${Date.now().toString().slice(-10)}`;
      const body: Record<string, unknown> = {
        amount: Number(amount),
        txId,
        description,
      };
      // Only send pixKey when the store hasn't locked one via env.
      if (!config?.keyLocked) body.pixKey = pixKey;
      const res = await fetch('/api/pix/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Falha ao gerar');
      } else {
        setCharge(data);
      }
    } catch (err) {
      setError('Erro de conexão');
    }
    setLoading(false);
  };

  const copy = () => {
    if (!charge) return;
    navigator.clipboard.writeText(charge.copyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AdminGuard>
      <main>
        <section className="section" style={{ paddingTop: 40 }}>
          <div className="container" style={{ maxWidth: 720 }}>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.22em',
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                PIX DEMO · BRCODE ESTÁTICO
              </div>
              <h1 className="section-title" style={{ fontFamily: 'var(--font-display)' }}>
                Gerador PIX
              </h1>
              <p className="section-subtitle">
                Cobrança PIX estática. Cliente paga do banco dele pra chave PIX informada.
                Reconciliação ainda é manual (admin confere extrato) — automação completa
                requer integrar PSP (Efí ou MercadoPago), descrito em <code>plano_producao.md</code>.
              </p>
            </div>

            <form
              onSubmit={generate}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                padding: 24,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {config?.keyLocked ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--accent-primary)',
                    background: 'var(--bg-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>🔒</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.62rem',
                        letterSpacing: '0.18em',
                        color: 'var(--text-muted)',
                      }}
                    >
                      CHAVE PIX DA LOJA · CONFIGURADA VIA <code>.env.local</code>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'var(--accent-primary)',
                        marginTop: 2,
                      }}
                    >
                      {config.maskedKey}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {config.merchantName} · {config.merchantCity}
                    </div>
                  </div>
                </div>
              ) : (
                <label style={labelStyle}>
                  Chave PIX (CPF / CNPJ / email / telefone / aleatória)
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="ex: 123.456.789-09 ou loja@keyforge.com"
                    required
                    style={fieldStyle}
                  />
                </label>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <label style={labelStyle}>
                  Valor (R$)
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    style={fieldStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Descrição (≤25 chars)
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={25}
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

              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Gerando…' : 'Gerar QR PIX'}
              </button>
            </form>

            {charge && (
              <div
                style={{
                  marginTop: 24,
                  padding: 24,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'grid',
                  gridTemplateColumns: '320px 1fr',
                  gap: 24,
                  alignItems: 'start',
                }}
              >
                <img
                  src={charge.qrDataUrl}
                  alt="QR Code PIX"
                  style={{ borderRadius: 'var(--radius-md)', background: 'white', padding: 12 }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.2em',
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    VALOR · TX ID
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.8rem',
                      fontWeight: 600,
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(charge.amount)}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 16,
                    }}
                  >
                    {charge.txId}
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      letterSpacing: '0.18em',
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    COPIA E COLA
                  </div>
                  <textarea
                    readOnly
                    value={charge.copyPaste}
                    rows={5}
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      padding: 10,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      resize: 'none',
                    }}
                  />
                  <button onClick={copy} className="btn btn-outline" style={{ marginTop: 10, width: '100%' }}>
                    {copied ? '✓ Copiado' : 'Copiar código'}
                  </button>

                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginTop: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    Cliente abre app do banco → Pix → Pix Copia e Cola → cola o código.
                    Expira em: <code>{new Date(charge.expiresAt).toLocaleTimeString('pt-BR')}</code>.
                    Reconciliação <strong>{charge.reconciliation}</strong> — confira o extrato pra confirmar.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </AdminGuard>
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
