import Link from 'next/link';
import { db } from '@/infra/database/connection';
import { games, platforms, gameRating, gameGenres, genres, users, keys, keyStatus, transactions } from '@/infra/database/schema';
import { eq, sql, avg, count, and, sum } from 'drizzle-orm';
import GameCard from '@/components/GameCard';
import StatCard from '@/components/StatCard';
import { cookies } from 'next/headers';
import { getDictionary } from '@/i18n';

async function getHomeData() {
  // Top-rated games with platform info and average rating
  const topGames = db
    .select({
      id: games.id,
      name: games.name,
      studio: games.studio,
      price: games.price,
      platform: platforms.name,
      avgRating: avg(gameRating.rating).as('avgRating'),
    })
    .from(games)
    .innerJoin(platforms, eq(games.activePlatformId, platforms.id))
    .leftJoin(gameRating, eq(games.id, gameRating.gameId))
    .where(eq(games.deleted, 0))
    .groupBy(games.id)
    .orderBy(sql`avgRating DESC NULLS LAST`)
    .limit(6)
    .all();

  // Get genres for each game
  const gamesWithGenres = topGames.map((game) => {
    const gameGenresList = db
      .select({ name: genres.name })
      .from(gameGenres)
      .innerJoin(genres, eq(gameGenres.genreId, genres.id))
      .where(eq(gameGenres.gameId, game.id))
      .all();
    return {
      ...game,
      avgRating: game.avgRating ? Number(game.avgRating) : null,
      genres: gameGenresList.map((g) => g.name),
    };
  });

  // Stats
  const totalGames = db.select({ count: count() }).from(games).where(eq(games.deleted, 0)).get();
  const totalUsers = db.select({ count: count() }).from(users).where(eq(users.deleted, 0)).get();

  return {
    topGames: gamesWithGenres,
    stats: {
      totalGames: totalGames?.count ?? 0,
      totalUsers: totalUsers?.count ?? 0,
    },
  };
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get('NEXT_LOCALE')?.value || 'pt-BR';
  const t = getDictionary(lang);

  const { topGames, stats } = await getHomeData();

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
              />
            ))}
          </div>
        </div>
      </section>



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
