'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { getUserPurchasedKeys } from '@/actions/profile';
import { getWishlist } from '@/actions/wishlist';
import GameCard from '@/components/GameCard';

type PurchasedKey = {
  orderId: number;
  purchaseDate: string | null;
  gameName: string;
  platform: string;
  keyCode: string;
  price: number;
};

type WishlistItem = {
  id: number;
  name: string;
  studio: string;
  price: number;
  platform: string;
  coverImageUrl: string | null;
  tagline: string | null;
  avgRating: number | null;
};

export default function LibraryPage() {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const { format } = useCurrency();
  const isPT = language === 'pt-BR';

  const [keys, setKeys] = useState<PurchasedKey[]>([]);
  const [wishlist, setWishlistItems] = useState<WishlistItem[]>([]);
  const [tab, setTab] = useState<'owned' | 'wishlist'>('owned');
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      getUserPurchasedKeys(user.id),
      getWishlist(user.id),
    ])
      .then(([k, w]) => {
        setKeys(k as PurchasedKey[]);
        setWishlistItems(w as WishlistItem[]);
      })
      .finally(() => setLoading(false));
  }, [user, isLoading]);

  if (isLoading || loading) {
    return (
      <main>
        <section className="section" style={{ paddingTop: 60 }}>
          <div className="container">
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              {isPT ? 'Carregando biblioteca…' : 'Loading library…'}
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <section className="section" style={{ paddingTop: 60 }}>
          <div className="container" style={{ maxWidth: 520, textAlign: 'center' }}>
            <h1 className="section-title" style={{ fontFamily: 'var(--font-display)' }}>
              {isPT ? 'Sua biblioteca' : 'Your library'}
            </h1>
            <p className="section-subtitle">
              {isPT
                ? 'Faça login para ver suas chaves e a lista de desejos.'
                : 'Sign in to see your keys and your tracked wishlist.'}
            </p>
            <Link href="/login" className="btn btn-primary" style={{ marginTop: 16 }}>
              {isPT ? 'Entrar' : 'Sign in'}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
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
              {isPT ? 'BIBLIOTECA · MINHA COLEÇÃO' : 'LIBRARY · MY COLLECTION'}
            </div>
            <h1 className="section-title" style={{ fontFamily: 'var(--font-display)' }}>
              {isPT ? 'Sua biblioteca' : 'Your library'}
            </h1>
            <p className="section-subtitle">
              {isPT
                ? `${keys.length} chave(s) compradas · ${wishlist.length} item(ns) na lista de desejos.`
                : `${keys.length} owned key(s) · ${wishlist.length} wishlist item(s).`}
            </p>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'inline-flex',
              gap: 4,
              padding: 4,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-glass)',
              marginBottom: 24,
            }}
          >
            {[
              { key: 'owned' as const, label: isPT ? `Chaves (${keys.length})` : `Keys (${keys.length})` },
              { key: 'wishlist' as const, label: isPT ? `Wishlist (${wishlist.length})` : `Wishlist (${wishlist.length})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.06em',
                  background: tab === t.key ? 'var(--accent-primary)' : 'transparent',
                  color: tab === t.key ? 'oklch(0.18 0.02 260)' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'owned' && (
            keys.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {keys.map((k) => {
                  const id = `${k.orderId}-${k.keyCode}`;
                  const isRevealed = !!revealed[id];
                  return (
                    <div
                      key={id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: 16,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: 48, height: 48, borderRadius: 'var(--radius-sm)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--accent-primary)',
                          color: 'oklch(0.18 0.02 260)',
                          fontSize: '1.4rem',
                        }}
                      >
                        🔑
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {k.gameName}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {k.platform} · #{k.orderId.toString().padStart(5, '0')} · {k.purchaseDate?.slice(0, 10) ?? '—'}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-glass)',
                          color: isRevealed ? 'var(--accent-primary)' : 'var(--text-muted)',
                          letterSpacing: '0.08em',
                          minWidth: 200,
                          textAlign: 'center',
                          filter: isRevealed ? 'none' : 'blur(4px)',
                          transition: 'filter 0.25s',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                        onClick={() => setRevealed((r) => ({ ...r, [id]: !r[id] }))}
                      >
                        {k.keyCode}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(k.keyCode);
                          setRevealed((r) => ({ ...r, [id]: true }));
                        }}
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        {isPT ? 'Copiar' : 'Copy'}
                      </button>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          minWidth: 80,
                          textAlign: 'right',
                        }}
                      >
                        {format(k.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔑</div>
                <p>{isPT ? 'Você ainda não tem chaves. Comece a comprar!' : 'No keys yet — go buy something good.'}</p>
                <Link href="/games" className="btn btn-primary" style={{ marginTop: 12 }}>
                  {isPT ? 'Ver catálogo' : 'Browse catalog'}
                </Link>
              </div>
            )
          )}

          {tab === 'wishlist' && (
            wishlist.length > 0 ? (
              <div className="game-grid">
                {wishlist.map((g) => (
                  <GameCard
                    key={g.id}
                    id={g.id}
                    name={g.name}
                    studio={g.studio}
                    price={g.price}
                    platform={g.platform}
                    rating={g.avgRating}
                    coverImageUrl={g.coverImageUrl}
                    tagline={g.tagline}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">💚</div>
                <p>{isPT ? 'Nada na lista de desejos. Adicione alguns jogos!' : 'Wishlist is empty — pick a few games.'}</p>
                <Link href="/games" className="btn btn-primary" style={{ marginTop: 12 }}>
                  {isPT ? 'Ver catálogo' : 'Browse catalog'}
                </Link>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}
