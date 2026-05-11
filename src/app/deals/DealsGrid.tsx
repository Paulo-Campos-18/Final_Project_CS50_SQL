'use client';

import { useEffect, useState } from 'react';
import GameCard from '@/components/GameCard';

export interface DealCard {
  id: number;
  name: string;
  studio: string;
  price: number;
  platform: string;
  coverImageUrl: string | null;
  tagline: string | null;
  avgRating: number | null;
  msrp: number | null;
  genres: string[];
}

type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'kf-deals-prefs';
const COL_OPTIONS = [3, 4, 5, 6] as const;
type ColCount = typeof COL_OPTIONS[number];

export default function DealsGrid({ cards, lang }: { cards: DealCard[]; lang: string }) {
  const [view, setView] = useState<ViewMode>('grid');
  const [cols, setCols] = useState<ColCount>(4);
  const [lightTheme, setLightTheme] = useState(false);

  // Load persisted preference + read theme on mount (client-only — avoids SSR `document` crash).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.view === 'list' || p.view === 'grid') setView(p.view);
        if (COL_OPTIONS.includes(p.cols)) setCols(p.cols);
      }
    } catch {}
    setLightTheme(document.documentElement.dataset.theme === 'light');
    const obs = new MutationObserver(() => setLightTheme(document.documentElement.dataset.theme === 'light'));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // Persist on change.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ view, cols })); } catch {}
  }, [view, cols]);

  const isPT = lang === 'pt-BR';

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 18,
          padding: '10px 14px',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 3,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {(['grid', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: view === v ? 'var(--accent-primary)' : 'transparent',
                color: view === v ? (lightTheme ? 'white' : '#0c0c12') : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {v === 'grid'
                ? (isPT ? '▦ Grade' : '▦ Grid')
                : (isPT ? '☰ Lista' : '☰ List')}
            </button>
          ))}
        </div>

        {/* Per-row selector (grid only) */}
        {view === 'grid' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                color: 'var(--text-muted)',
              }}
            >
              {isPT ? 'POR LINHA' : 'PER ROW'}
            </span>
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: 3,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {COL_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCols(n)}
                  style={{
                    width: 38,
                    padding: '7px 0',
                    fontSize: '0.92rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    background: cols === n ? 'var(--accent-primary)' : 'transparent',
                    color: cols === n
                      ? (lightTheme ? 'white' : '#0c0c12')
                      : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {cards.length} {isPT ? 'jogo(s)' : 'game(s)'}
        </div>
      </div>

      {view === 'grid' ? (
        <div
          className="game-grid"
          style={{
            // Force exact column count via CSS var consumed in globals.css
            ['--grid-cols' as string]: `repeat(${cols}, 1fr)`,
          }}
        >
          {cards.map((g) => (
            <GameCard
              key={g.id}
              id={g.id}
              name={g.name}
              studio={g.studio}
              price={g.price}
              platform={g.platform}
              rating={g.avgRating}
              genres={g.genres}
              coverImageUrl={g.coverImageUrl}
              tagline={g.tagline}
              msrp={g.msrp}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cards.map((g) => (
            <DealListItem key={g.id} card={g} isPT={isPT} />
          ))}
        </div>
      )}
    </>
  );
}

function DealListItem({ card, isPT }: { card: DealCard; isPT: boolean }) {
  const drop = card.msrp && card.msrp > card.price ? Math.round((1 - card.price / card.msrp) * 100) : 0;
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v * 5.1);

  return (
    <a
      href={`/games/${card.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr auto',
        gap: 16,
        alignItems: 'center',
        padding: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s',
      }}
    >
      <div
        style={{
          width: 120,
          height: 70,
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          background: card.coverImageUrl ? `center / cover url(${card.coverImageUrl})` : 'var(--bg-tertiary)',
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {card.name}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {card.studio} · {card.platform}
        </div>
        {card.tagline && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--accent-primary)',
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {card.tagline}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        {drop > 0 && (
          <div
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              borderRadius: 4,
              background: 'var(--accent-primary)',
              color: '#0c0c12',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            −{drop}%
          </div>
        )}
        {card.msrp && card.msrp > card.price && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              textDecoration: 'line-through',
            }}
          >
            {fmt(card.msrp)}
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
          {fmt(card.price)}
        </div>
      </div>
    </a>
  );
}
