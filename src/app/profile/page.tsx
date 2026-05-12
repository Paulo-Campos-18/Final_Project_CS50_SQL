'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { getUserPurchasedKeys, getUserOrders } from '@/actions/profile';
import {
  Activity, Receipt, Gamepad2, Wallet, Users, Heart, Key as KeyIcon,
  Library as LibraryIcon, Lock, ChevronRight,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Design tokens (mirrors public/keyforge/ui.jsx — keep both in sync)        */
/* -------------------------------------------------------------------------- */

const TK = {
  accent: 'oklch(0.85 0.18 165)',
  accentBg: 'oklch(0.85 0.18 165 / 0.15)',
  warn: 'oklch(0.80 0.18 30)',
  panelBg: 'var(--bg-card)',
  border: 'var(--border-color)',
  borderSoft: 'var(--border-soft)',
  text: 'var(--text-primary)',
  textMuted: 'var(--text-muted)',
  textDim: 'var(--text-muted)',
  elevBg: 'var(--bg-glass)',
};

const FONT_DISPLAY = 'var(--font-display)';
const FONT_MONO = 'var(--font-mono)';

/* -------------------------------------------------------------------------- */
/*  KPI tile — same shape as the admin design's KPI cards                     */
/* -------------------------------------------------------------------------- */

function KPI({
  label, value, sub, icon, accent,
}: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${TK.borderSoft}`,
        background: TK.panelBg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: TK.textDim,
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: TK.accentBg, color: TK.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: FONT_DISPLAY,
          fontSize: 28,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: accent ? TK.accent : TK.text,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 4, fontFamily: FONT_MONO, fontSize: 11, color: TK.textDim }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Panel — title + subtitle + content (admin design's panel pattern)         */
/* -------------------------------------------------------------------------- */

function Panel({
  title, subtitle, action, children,
}: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${TK.borderSoft}`,
        background: TK.panelBg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 500, color: TK.text }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ marginTop: 2, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.06em', color: TK.textDim }}>
              {subtitle}
            </div>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Account tabs — same idiom as admin TabBar                                 */
/* -------------------------------------------------------------------------- */

type Tab = 'overview' | 'keys' | 'orders';

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Visão geral', icon: <Activity size={16} strokeWidth={2} /> },
    { id: 'keys',     label: 'Minhas chaves', icon: <KeyIcon size={16} strokeWidth={2} /> },
    { id: 'orders',   label: 'Pedidos', icon: <Receipt size={16} strokeWidth={2} /> },
  ];
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 6,
        padding: 6,
        border: `1px solid ${TK.borderSoft}`,
        borderRadius: 12,
        background: TK.panelBg,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((opt) => {
        const on = tab === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setTab(opt.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontFamily: FONT_MONO,
              fontSize: 14,
              letterSpacing: '0.05em',
              fontWeight: 600,
              background: on ? TK.accent : 'transparent',
              color: on ? 'oklch(0.18 0.02 260)' : TK.textMuted,
              transition: 'all 0.15s',
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

type PurchasedKey = { gameName: string; platform: string; keyCode: string; price: number; purchaseDate: string | null };
type OrderData = { orderId: number; date: string | null; total: number; status: string };

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { format } = useCurrency();
  const [keys, setKeys] = useState<PurchasedKey[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

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

  const totalSpent = useMemo(() => orders.reduce((a, o) => a + o.total, 0), [orders]);
  const isAdmin = user?.role === 'admin';

  /* ---- Loading / not-authed states ------------------------------------- */
  if (isLoading || loading) {
    return (
      <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: '0.22em', color: TK.textMuted }}>
            CARREGANDO PERFIL…
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px 24px', textAlign: 'center' }}>
          <Lock size={36} color={TK.accent} style={{ margin: '0 auto 12px' }} />
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, color: TK.text }}>
            Login necessário
          </h1>
          <p style={{ color: TK.textMuted, marginTop: 8, marginBottom: 18 }}>
            Faça login para ver seu perfil.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-block', padding: '10px 18px', borderRadius: 8,
              background: TK.accent, color: 'oklch(0.18 0.02 260)',
              fontFamily: FONT_MONO, fontWeight: 700, textDecoration: 'none',
            }}
          >
            Entrar
          </Link>
        </div>
      </main>
    );
  }

  /* ---- Authed render --------------------------------------------------- */
  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* ---- header (mirrors admin page header) ---- */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  padding: '4px 10px', borderRadius: 6,
                  fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em',
                  background: TK.accentBg, color: TK.accent,
                }}
              >
                CONTA
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: '0.22em', color: TK.textDim }}>
                PROFILE · {tab.toUpperCase()}
              </div>
            </div>
            <h1
              style={{
                marginTop: 12,
                fontFamily: FONT_DISPLAY,
                fontSize: 44,
                fontWeight: 600,
                lineHeight: 1.05,
                color: TK.text,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              {user.firstName} {user.lastName}
              {isAdmin && (
                <span
                  style={{
                    padding: '4px 9px', borderRadius: 6,
                    fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
                    background: TK.accentBg, color: TK.accent,
                  }}
                >
                  ADMIN
                </span>
              )}
            </h1>
            <p
              style={{
                marginTop: 12,
                maxWidth: '60ch',
                fontSize: 16,
                lineHeight: 1.5,
                color: TK.textMuted,
              }}
            >
              Conta <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: TK.text }}>@{user.nickname}</span>{' '}
              · saldo, biblioteca, histórico e preferências.
            </p>
          </div>

          {/* Avatar */}
          <div
            style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg, oklch(0.85 0.18 165), oklch(0.65 0.16 220))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700,
              color: 'oklch(0.18 0.02 260)',
              flexShrink: 0,
            }}
          >
            {user.firstName[0]}{user.lastName[0]}
          </div>
        </div>

        {/* ---- KPI row ---- */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <KPI label="Saldo" value={format(user.amount)} sub="carteira disponível" icon={<Wallet size={14} />} accent />
          <KPI label="Chaves" value={keys.length.toLocaleString()} sub="bibilioteca" icon={<KeyIcon size={14} />} />
          <KPI label="Pedidos" value={orders.length.toLocaleString()} sub="histórico" icon={<Receipt size={14} />} />
          <KPI label="Total gasto" value={format(totalSpent)} sub="ao longo do tempo" icon={<Activity size={14} />} />
        </div>

        {/* ---- Tabs ---- */}
        <TabBar tab={tab} setTab={setTab} />

        {/* ---- Tab content ---- */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <Panel
              title="Atalhos da conta"
              subtitle="navegação rápida"
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
                <ShortcutTile href="/my-keys" icon={<KeyIcon size={16} />} label="Minhas chaves" />
                <ShortcutTile href="/wishlist" icon={<Heart size={16} />} label="Wishlist" />
                <ShortcutTile href="/friends" icon={<Users size={16} />} label="Amigos" />
                <ShortcutTile href="/library" icon={<LibraryIcon size={16} />} label="Biblioteca" />
                <ShortcutTile href="/" icon={<Gamepad2 size={16} />} label="Loja" />
                {isAdmin && (
                  <ShortcutTile href="/admin" icon={<Activity size={16} />} label="Painel admin" accent />
                )}
              </div>
            </Panel>

            <Panel
              title="Últimas chaves"
              subtitle="6 mais recentes"
              action={keys.length > 0 ? <SeeAllLink href="/my-keys" /> : null}
            >
              <KeysList keys={keys.slice(0, 6)} format={format} />
            </Panel>

            <Panel
              title="Últimos pedidos"
              subtitle="histórico recente"
              action={orders.length > 0 ? <SeeAllLink href="/my-keys" /> : null}
            >
              <OrdersTable orders={orders.slice(0, 5)} format={format} />
            </Panel>
          </div>
        )}

        {tab === 'keys' && (
          <Panel title="Todas as chaves" subtitle={`${keys.length} no total`}>
            <KeysList keys={keys} format={format} />
          </Panel>
        )}

        {tab === 'orders' && (
          <Panel title="Histórico de pedidos" subtitle={`${orders.length} pedido(s)`}>
            <OrdersTable orders={orders} format={format} />
          </Panel>
        )}

      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function ShortcutTile({
  href, icon, label, accent,
}: {
  href: string; icon: React.ReactNode; label: string; accent?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '14px 16px',
        borderRadius: 12,
        background: accent ? TK.accent : TK.elevBg,
        color: accent ? 'oklch(0.18 0.02 260)' : TK.text,
        border: `1px solid ${accent ? TK.accent : TK.borderSoft}`,
        textDecoration: 'none',
        fontFamily: FONT_MONO,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.04em',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        {icon}
        {label}
      </span>
      <ChevronRight size={14} />
    </Link>
  );
}

function SeeAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: FONT_MONO,
        fontSize: 11,
        letterSpacing: '0.06em',
        color: TK.accent,
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      ver todas <ChevronRight size={12} />
    </Link>
  );
}

function KeysList({ keys, format }: { keys: PurchasedKey[]; format: (n: number) => string }) {
  if (keys.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          border: `1px dashed ${TK.borderSoft}`,
          borderRadius: 12,
          color: TK.textMuted,
        }}
      >
        Você ainda não tem chaves compradas.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {keys.map((k, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 14,
            alignItems: 'center',
            padding: '12px 14px',
            border: `1px solid ${TK.borderSoft}`,
            borderRadius: 10,
            background: TK.elevBg,
          }}
        >
          <div
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: TK.accentBg, color: TK.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <KeyIcon size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 600,
                fontSize: 15,
                color: TK.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {k.gameName}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: TK.textDim, marginTop: 2 }}>
              {k.platform}{k.purchaseDate ? ` · ${new Date(k.purchaseDate).toLocaleDateString('pt-BR')}` : ''}
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY, fontWeight: 700, color: TK.accent, fontSize: 16,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {format(k.price)}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrdersTable({ orders, format }: { orders: OrderData[]; format: (n: number) => string }) {
  if (orders.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          border: `1px dashed ${TK.borderSoft}`,
          borderRadius: 12,
          color: TK.textMuted,
        }}
      >
        Nenhum pedido ainda.
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.18em', color: TK.textDim, textTransform: 'uppercase' }}>
            <th style={th()}>Pedido</th>
            <th style={th()}>Data</th>
            <th style={th()}>Status</th>
            <th style={{ ...th(), textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.orderId} style={{ borderTop: `1px solid ${TK.borderSoft}` }}>
              <td style={td()}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: TK.text }}>
                  #{String(o.orderId).padStart(5, '0')}
                </span>
              </td>
              <td style={{ ...td(), color: TK.textMuted, fontFamily: FONT_MONO, fontSize: 12 }}>
                {o.date ? new Date(o.date).toLocaleDateString('pt-BR') : '—'}
              </td>
              <td style={td()}>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 8px', borderRadius: 4,
                    fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.06em', fontWeight: 600,
                    background: o.status === 'Sold' ? TK.accentBg : 'oklch(0.80 0.18 30 / 0.15)',
                    color: o.status === 'Sold' ? TK.accent : TK.warn,
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                  {o.status === 'Sold' ? 'pago' : o.status.toLowerCase()}
                </span>
              </td>
              <td
                style={{
                  ...td(),
                  textAlign: 'right',
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 700,
                  color: TK.text,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {format(o.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function th(): React.CSSProperties { return { textAlign: 'left', padding: '10px 12px', background: TK.elevBg }; }
function td(): React.CSSProperties { return { padding: '12px 12px' }; }
