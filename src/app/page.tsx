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
            <div className="hero-badge">🔑 Loja Premium de Chaves Digitais</div>
            <h1>
              Seu próximo jogo
              <br />
              <span className="gradient-text">está aqui</span>
            </h1>
            <p>
              Compre chaves digitais com os melhores preços do mercado.
              Catálogo atualizado, entrega imediata e pagamento seguro.
            </p>

            <div className="hero-stats">
              <div className="hero-stat animate-fade-in-up stagger-1">
                <div className="hero-stat-value">{stats.totalGames}</div>
                <div className="hero-stat-label">Jogos</div>
              </div>
              <div className="hero-stat animate-fade-in-up stagger-2">
                <div className="hero-stat-value">{stats.totalUsers}</div>
                <div className="hero-stat-label">Usuários</div>
              </div>
              <div className="hero-stat animate-fade-in-up stagger-3">
                <div className="hero-stat-value">{stats.availableKeys}</div>
                <div className="hero-stat-label">Chaves Disponíveis</div>
              </div>
              <div className="hero-stat animate-fade-in-up stagger-4">
                <div className="hero-stat-value">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.totalRevenue)}</div>
                <div className="hero-stat-label">Em Vendas</div>
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
              <h2 className="section-title">⭐ Mais Bem Avaliados</h2>
              <p className="section-subtitle">Os jogos mais bem avaliados da nossa loja</p>
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



      {/* CTA Section */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title" style={{ marginBottom: '12px' }}>
            Explore todo o catálogo
          </h2>
          <p className="section-subtitle" style={{ marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Encontre o jogo perfeito com os melhores preços. Pagamento seguro e entrega imediata.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/games" className="btn btn-primary">
              🎮 Ver Todos os Jogos
            </Link>
            <Link href="/wishlist" className="btn btn-outline">
              ❤️ Minha Wishlist
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
