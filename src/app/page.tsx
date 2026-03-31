import Link from 'next/link';
import { db } from '@/infra/database/connection';
import { games, platforms, gameRating, gameGenres, genres, users, keys, keyStatus, transactions } from '@/infra/database/schema';
import { eq, sql, avg, count, and, sum } from 'drizzle-orm';
import GameCard from '@/components/GameCard';
import StatCard from '@/components/StatCard';

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
  const availableKeys = db
    .select({ count: count() })
    .from(keys)
    .innerJoin(keyStatus, eq(keys.keyStatusId, keyStatus.id))
    .where(eq(keyStatus.status, 'Available'))
    .get();
  const totalRevenue = db
    .select({ total: sum(transactions.totalPrice) })
    .from(transactions)
    .where(eq(transactions.status, 'Sold'))
    .get();

  return {
    topGames: gamesWithGenres,
    stats: {
      totalGames: totalGames?.count ?? 0,
      totalUsers: totalUsers?.count ?? 0,
      availableKeys: availableKeys?.count ?? 0,
      totalRevenue: totalRevenue?.total ? Number(totalRevenue.total) : 0,
    },
  };
}

export default async function HomePage() {
  const { topGames, stats } = await getHomeData();

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">🔑 CS50 SQL Final Project</div>
            <h1>
              Your Digital
              <br />
              <span className="gradient-text">Game Key Marketplace</span>
            </h1>
            <p>
              Browse, buy, and resell digital game keys across all major platforms.
              Powered by a robust SQLite database with advanced triggers, views, and optimizations.
            </p>

            <div className="hero-stats">
              <div className="hero-stat animate-fade-in-up stagger-1">
                <div className="hero-stat-value">{stats.totalGames}</div>
                <div className="hero-stat-label">Games</div>
              </div>
              <div className="hero-stat animate-fade-in-up stagger-2">
                <div className="hero-stat-value">{stats.totalUsers}</div>
                <div className="hero-stat-label">Users</div>
              </div>
              <div className="hero-stat animate-fade-in-up stagger-3">
                <div className="hero-stat-value">{stats.availableKeys}</div>
                <div className="hero-stat-label">Keys Available</div>
              </div>
              <div className="hero-stat animate-fade-in-up stagger-4">
                <div className="hero-stat-value">${stats.totalRevenue.toFixed(0)}</div>
                <div className="hero-stat-label">Revenue</div>
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
              <h2 className="section-title">⭐ Top Rated Games</h2>
              <p className="section-subtitle">The highest rated games in our store</p>
            </div>
            <Link href="/games" className="section-link">
              View All Games →
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

      {/* Quick Stats */}
      <section className="section" id="store-stats">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">📈 Store Overview</h2>
              <p className="section-subtitle">Key metrics at a glance</p>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard icon="🎮" value={stats.totalGames} label="Total Games" color="purple" />
            <StatCard icon="👥" value={stats.totalUsers} label="Active Users" color="cyan" />
            <StatCard icon="🔑" value={stats.availableKeys} label="Keys in Stock" color="amber" />
            <StatCard
              icon="💰"
              value={`$${stats.totalRevenue.toFixed(2)}`}
              label="Total Revenue"
              color="green"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title" style={{ marginBottom: '12px' }}>
            Explore the Full Database
          </h2>
          <p className="section-subtitle" style={{ marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Dive into the dashboard to see revenue analytics, supplier data, key inventory, and more.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/dashboard" className="btn btn-primary">
              📊 Open Dashboard
            </Link>
            <Link href="/games" className="btn btn-outline">
              🎮 Browse Games
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
