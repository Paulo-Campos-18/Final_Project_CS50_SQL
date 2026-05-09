import Link from 'next/link';
import { db } from '@/infra/database/connection';
import { games, platforms, gameRating, gameGenres, genres, users, gamePriceLog } from '@/infra/database/schema';
import { eq, sql, avg, count } from 'drizzle-orm';
import GameCard from '@/components/GameCard';
import { cookies } from 'next/headers';
import { getDictionary } from '@/i18n';

async function getHomeData() {
  // Top-rated games (6) with platform, average rating and peak price (msrp).
  const topGames = db
    .select({
      id: games.id,
      name: games.name,
      studio: games.studio,
      price: games.price,
      platform: platforms.name,
      coverImageUrl: games.coverImageUrl,
      tagline: games.tagline,
      avgRating: avg(gameRating.rating).as('avgRating'),
      msrp: sql<number | null>`MAX(${gamePriceLog.oldPrice})`.as('msrp'),
    })
    .from(games)
    .innerJoin(platforms, eq(games.activePlatformId, platforms.id))
    .leftJoin(gameRating, eq(games.id, gameRating.gameId))
    .leftJoin(gamePriceLog, eq(gamePriceLog.gameId, games.id))
    .where(eq(games.deleted, 0))
    .groupBy(games.id)
    .orderBy(sql`avgRating DESC NULLS LAST`)
    .limit(6)
    .all();

  // Top deals (6) ordered by largest discount derived from price_log.
  const dealRows = db
    .select({
      id: games.id,
      name: games.name,
      studio: games.studio,
      price: games.price,
      platform: platforms.name,
      coverImageUrl: games.coverImageUrl,
      tagline: games.tagline,
      avgRating: avg(gameRating.rating).as('avgRating'),
      msrp: sql<number>`MAX(${gamePriceLog.oldPrice})`.as('msrp'),
    })
    .from(games)
    .innerJoin(platforms, eq(games.activePlatformId, platforms.id))
    .innerJoin(gamePriceLog, eq(gamePriceLog.gameId, games.id))
    .leftJoin(gameRating, eq(games.id, gameRating.gameId))
    .where(eq(games.deleted, 0))
    .groupBy(games.id)
    .all();

  const topDeals = dealRows
    .map((g) => ({
      ...g,
      avgRating: g.avgRating ? Number(g.avgRating) : null,
      msrp: Number(g.msrp ?? g.price),
    }))
    .filter((g) => g.msrp > g.price)
    .sort((a, b) => 1 - a.price / a.msrp - (1 - b.price / b.msrp))
    .reverse()
    .slice(0, 6);

  const attachGenres = (rows: typeof topGames | typeof topDeals) =>
    rows.map((game) => {
      const gs = db
        .select({ name: genres.name })
        .from(gameGenres)
        .innerJoin(genres, eq(gameGenres.genreId, genres.id))
        .where(eq(gameGenres.gameId, game.id))
        .all();
      return {
        ...game,
        avgRating: game.avgRating != null ? Number(game.avgRating) : null,
        msrp: game.msrp != null ? Number(game.msrp) : null,
        genres: gs.map((g) => g.name),
      };
    });

  const stats = {
    totalGames: db.select({ count: count() }).from(games).where(eq(games.deleted, 0)).get()?.count ?? 0,
    totalUsers: db.select({ count: count() }).from(users).where(eq(users.deleted, 0)).get()?.count ?? 0,
  };

  return {
    topGames: attachGenres(topGames),
    topDeals: attachGenres(topDeals),
    stats,
  };
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get('NEXT_LOCALE')?.value || 'pt-BR';
  const t = getDictionary(lang);

  const { topGames, topDeals, stats } = await getHomeData();

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">{t.homeHeroBadge}</div>
            <h1>
              {t.homeHeroTitle1}
              <br />
              <span className="gradient-text">{t.homeHeroTitle2}</span>
            </h1>
            <p>
              {t.homeHeroDesc}
            </p>

            <div className="hero-stats">
              <div className="hero-stat animate-fade-in-up stagger-1">
                <div className="hero-stat-value">{stats.totalGames}</div>
                <div className="hero-stat-label">{t.homeStatGames}</div>
              </div>
              <div className="hero-stat animate-fade-in-up stagger-2">
                <div className="hero-stat-value">{stats.totalUsers}</div>
                <div className="hero-stat-label">{t.homeStatUsers}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Rated Games */}
      <section className="section" id="top-games">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t.homeTopGamesTitle}</h2>
              <p className="section-subtitle">{t.homeTopGamesDesc}</p>
            </div>
            <Link href="/games" className="section-link">
              {t.homeViewAll}
            </Link>
          </div>

          <div className="game-grid">
            {topGames.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                name={game.name}
                studio={game.studio}
                price={game.price}
                platform={game.platform}
                rating={game.avgRating}
                genres={game.genres}
                coverImageUrl={game.coverImageUrl}
                tagline={game.tagline}
                msrp={game.msrp}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Em promoção */}
      {topDeals.length > 0 && (
        <section className="section" id="top-deals">
          <div className="container">
            <div className="section-header">
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
                  {lang === 'pt-BR' ? 'EM PROMOÇÃO · ORDER BY queda DESC' : 'ON SALE · ORDER BY drop DESC'}
                </div>
                <h2 className="section-title" style={{ fontFamily: 'var(--font-display)' }}>
                  {lang === 'pt-BR' ? 'Maiores quedas vs. preço de pico' : 'Biggest drops vs. peak price'}
                </h2>
                <p className="section-subtitle">
                  {lang === 'pt-BR'
                    ? `${topDeals.length} título(s) com desconto agora.`
                    : `${topDeals.length} title(s) on sale right now.`}
                </p>
              </div>
              <Link href="/deals" className="section-link">
                {lang === 'pt-BR' ? 'Ver todas as ofertas' : 'View all deals'}
              </Link>
            </div>
            <div className="game-grid">
              {topDeals.map((game) => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  name={game.name}
                  studio={game.studio}
                  price={game.price}
                  platform={game.platform}
                  rating={game.avgRating}
                  genres={game.genres}
                  coverImageUrl={game.coverImageUrl}
                  tagline={game.tagline}
                  msrp={game.msrp}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title" style={{ marginBottom: '12px' }}>
            {t.homeCTATitle}
          </h2>
          <p className="section-subtitle" style={{ marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            {t.homeCTADesc}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/games" className="btn btn-primary">
              {t.homeCTABtnGames}
            </Link>
            <Link href="/wishlist" className="btn btn-outline">
              {t.homeCTABtnWishlist}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
