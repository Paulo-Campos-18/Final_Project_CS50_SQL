import type { Metadata } from 'next';
import { db } from '@/infra/database/connection';
import { games, platforms, gameRating, gameGenres, genres, gamePriceLog } from '@/infra/database/schema';
import { eq, sql, avg } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getDictionary } from '@/i18n';
import DealsGrid from './DealsGrid';

export const metadata: Metadata = {
  title: 'Promoções — KEYFORGE',
  description: 'Os maiores descontos do catálogo, calculados a partir do histórico de preços (game_price_log).',
};

interface DealRow {
  id: number;
  name: string;
  studio: string;
  platform: string;
  price: number;
  coverImageUrl: string | null;
  tagline: string | null;
  msrp: number;
  drop: number; // 0..1
  avgRating: number | null;
  genres: string[];
}

async function getDeals(): Promise<DealRow[]> {
  // Latest price-log row per game (peak old_price seen in window).
  const rawDeals = db
    .select({
      id: games.id,
      name: games.name,
      studio: games.studio,
      platform: platforms.name,
      price: games.price,
      coverImageUrl: games.coverImageUrl,
      tagline: games.tagline,
      msrp: sql<number>`MAX(${gamePriceLog.oldPrice})`.as('msrp'),
      avgRating: avg(gameRating.rating).as('avgRating'),
    })
    .from(games)
    .innerJoin(platforms, eq(games.activePlatformId, platforms.id))
    .innerJoin(gamePriceLog, eq(gamePriceLog.gameId, games.id))
    .leftJoin(gameRating, eq(gameRating.gameId, games.id))
    .where(eq(games.deleted, 0))
    .groupBy(games.id)
    .all();

  const withDrop = rawDeals
    .map((g) => {
      const msrp = Number(g.msrp ?? g.price);
      const drop = msrp > g.price ? 1 - g.price / msrp : 0;
      return {
        ...g,
        msrp,
        drop,
        avgRating: g.avgRating ? Number(g.avgRating) : null,
      };
    })
    .filter((g) => g.drop > 0)
    .sort((a, b) => b.drop - a.drop);

  // Genres for each
  return withDrop.map((g) => {
    const gs = db
      .select({ name: genres.name })
      .from(gameGenres)
      .innerJoin(genres, eq(gameGenres.genreId, genres.id))
      .where(eq(gameGenres.gameId, g.id))
      .all();
    return { ...g, genres: gs.map((x) => x.name) };
  });
}

export default async function DealsPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get('NEXT_LOCALE')?.value || 'pt-BR';
  const t = getDictionary(lang);
  const deals = await getDeals();

  const isPT = lang === 'pt-BR';
  const featured = deals[0];
  const rest = deals.slice(1);

  return (
    <main>
      <section className="section" style={{ paddingTop: '40px' }}>
        <div className="container">
          <div className="section-header" style={{ alignItems: 'flex-end' }}>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.22em',
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                {isPT ? 'PROMOÇÕES · ORDER BY queda DESC' : 'DEALS · ORDER BY drop DESC'}
              </div>
              <h1 className="section-title" style={{ fontFamily: 'var(--font-display)' }}>
                {isPT ? 'Os maiores descontos da semana' : 'Biggest drops this week'}
              </h1>
              <p className="section-subtitle">
                {isPT
                  ? `${deals.length} título(s) abaixo do preço de pico, derivados do log de preços.`
                  : `${deals.length} title(s) below their peak price, derived from the price log.`}
              </p>
            </div>
          </div>

          {featured && (
            <div
              style={{
                marginTop: 24,
                marginBottom: 32,
                position: 'relative',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-lg)',
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)',
                minHeight: 280,
              }}
            >
              <div style={{ position: 'relative', minHeight: 280, background: 'var(--bg-tertiary)' }}>
                {featured.coverImageUrl ? (
                  <img
                    src={featured.coverImageUrl}
                    alt={featured.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : null}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(90deg, oklch(0 0 0 / 0) 30%, oklch(0 0 0 / 0.55) 100%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: 'var(--accent-primary)',
                    color: 'oklch(0.18 0.02 260)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                  }}
                >
                  −{Math.round(featured.drop * 100)}%
                </div>
              </div>
              <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.22em',
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                  }}
                >
                  {isPT ? 'MELHOR OFERTA' : 'BEST DEAL'}
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                    fontWeight: 600,
                    lineHeight: 1.05,
                    color: 'var(--text-primary)',
                    marginBottom: 6,
                  }}
                >
                  {featured.name}
                </h2>
                {featured.tagline && (
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      color: 'var(--accent-primary)',
                      letterSpacing: '0.04em',
                      marginBottom: 16,
                    }}
                  >
                    {featured.tagline}
                  </p>
                )}
                <DealsPriceRow price={featured.price} msrp={featured.msrp} />
                <a
                  href={`/games/${featured.id}`}
                  className="btn btn-primary"
                  style={{ marginTop: 18, alignSelf: 'flex-start' }}
                >
                  {isPT ? 'Ver detalhes →' : 'View details →'}
                </a>
              </div>
            </div>
          )}

          {rest.length > 0 ? (
            <DealsGrid
              lang={lang}
              cards={rest.map((g) => ({
                id: g.id,
                name: g.name,
                studio: g.studio,
                price: g.price,
                platform: g.platform,
                coverImageUrl: g.coverImageUrl,
                tagline: g.tagline,
                avgRating: g.avgRating,
                msrp: g.msrp ?? null,
                genres: g.genres,
              }))}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <p>{isPT ? 'Nenhuma promoção no momento.' : 'No deals at the moment.'}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function DealsPriceRow({ price, msrp }: { price: number; msrp: number }) {
  // Render is server-side; format as USD-base BRL approximation matching the
  // GameCard fallback. The full client-side currency context applies to the
  // card grid below.
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v * 5.1);
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
      {msrp > price && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.95rem',
            color: 'var(--text-muted)',
            textDecoration: 'line-through',
          }}
        >
          {fmt(msrp)}
        </span>
      )}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 600,
          color: 'var(--accent-primary)',
        }}
      >
        {fmt(price)}
      </span>
    </div>
  );
}
