'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { getUserPurchasedKeys, getUserOrders } from '@/actions/profile';
import Link from 'next/link';
import { Gamepad2, Package, Key as KeyIcon, Users, Heart, Lock } from 'lucide-react';

type PurchasedKey = { gameName: string; platform: string; keyCode: string; price: number; purchaseDate: string | null };
type OrderData = { orderId: number; date: string | null; total: number; status: string };

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { format } = useCurrency();
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
    return (
      <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
        <section className="section" style={{ paddingTop: 80 }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.18em' }}>
              CARREGANDO PERFIL…
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
        <section className="section" style={{ paddingTop: 80 }}>
          <div className="container" style={{ maxWidth: 480, textAlign: 'center' }}>
            <Lock size={40} color="var(--accent-primary)" style={{ margin: '0 auto 12px' }} />
            <h1 className="section-title" style={{ fontFamily: 'var(--font-display)' }}>Login necessário</h1>
            <p className="section-subtitle" style={{ marginBottom: 18 }}>
              Faça login para ver seu perfil.
            </p>
            <Link href="/login" className="btn btn-primary">Entrar</Link>
          </div>
        </section>
      </main>
    );
  }

  const totalSpent = orders.reduce((acc, o) => acc + o.total, 0);
  const isAdmin = user.role === 'admin';

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">

          {/* Eyebrow */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              letterSpacing: '0.22em',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            CONTA · PERFIL
          </div>

          {/* Profile card */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '88px 1fr',
              gap: 24,
              alignItems: 'center',
              padding: 24,
              marginBottom: 24,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, oklch(0.85 0.18 165), oklch(0.65 0.16 220))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'oklch(0.18 0.02 260)',
              }}
            >
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.8rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {user.firstName} {user.lastName}
                </h1>
                {isAdmin && (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.15em',
                      fontWeight: 700,
                      background: 'oklch(0.85 0.18 165 / 0.15)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  marginTop: 4,
                }}
              >
                @{user.nickname}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: 18,
                  marginTop: 16,
                }}
              >
                <Stat label="Saldo" value={format(user.amount)} tone="accent" />
                <Stat label="Jogos" value={keys.length.toString()} />
                <Stat label="Pedidos" value={orders.length.toString()} />
                <Stat label="Total gasto" value={format(totalSpent)} tone="warn" />
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
            <QuickLink href="/my-keys" icon={<KeyIcon size={16} />} label="Minhas chaves" primary />
            <QuickLink href="/wishlist" icon={<Heart size={16} />} label="Wishlist" />
            <QuickLink href="/friends" icon={<Users size={16} />} label="Amigos" />
            <QuickLink href="/library" icon={<Gamepad2 size={16} />} label="Biblioteca" />
          </div>

          {/* Recent keys */}
          <section
            style={{
              padding: 22,
              marginBottom: 24,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--text-primary)',
                  }}
                >
                  <Gamepad2 size={18} color="var(--accent-primary)" />
                  Jogos recentes
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    color: 'var(--text-muted)',
                    marginTop: 4,
                  }}
                >
                  ÚLTIMAS COMPRAS
                </div>
              </div>
              {keys.length > 0 && (
                <Link
                  href="/my-keys"
                  style={{
                    color: 'var(--accent-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    letterSpacing: '0.06em',
                    textDecoration: 'none',
                  }}
                >
                  Ver todas →
                </Link>
              )}
            </div>
            {keys.length === 0 ? (
              <div
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                  Você ainda não comprou nenhum jogo.
                </p>
                <Link href="/games" className="btn btn-primary">Explorar loja</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                {keys.slice(0, 6).map((k, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg-glass)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        marginBottom: 6,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {k.gameName}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-muted)',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {k.platform}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          color: 'var(--accent-primary)',
                          fontSize: '0.92rem',
                        }}
                      >
                        {format(k.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent orders */}
          {orders.length > 0 && (
            <section
              style={{
                padding: 22,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Package size={18} color="var(--accent-primary)" />
                    Últimos pedidos
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.15em',
                      color: 'var(--text-muted)',
                      marginTop: 4,
                    }}
                  >
                    HISTÓRICO RECENTE
                  </div>
                </div>
                <Link
                  href="/my-keys"
                  style={{
                    color: 'var(--accent-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    letterSpacing: '0.06em',
                    textDecoration: 'none',
                  }}
                >
                  Ver todos →
                </Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        letterSpacing: '0.18em',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>PEDIDO</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>DATA</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>STATUS</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.orderId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>
                          #{o.orderId.toString().padStart(4, '0')}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {o.date ? new Date(o.date).toLocaleDateString('pt-BR') : 'N/A'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: 'oklch(0.85 0.18 165 / 0.15)',
                              color: 'var(--accent-primary)',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'right',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            color: 'var(--accent-primary)',
                          }}
                        >
                          {format(o.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'accent' | 'warn' }) {
  const color =
    tone === 'accent'
      ? 'var(--accent-primary)'
      : tone === 'warn'
        ? 'var(--accent-warn)'
        : 'var(--text-primary)';
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.35rem',
          fontWeight: 700,
          color,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          letterSpacing: '0.18em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        background: primary ? 'var(--accent-primary)' : 'var(--bg-card)',
        color: primary ? 'oklch(0.18 0.02 260)' : 'var(--text-primary)',
        border: `1px solid ${primary ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-sm)',
        textDecoration: 'none',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
        letterSpacing: '0.06em',
        fontWeight: 600,
        transition: 'all 0.15s',
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
