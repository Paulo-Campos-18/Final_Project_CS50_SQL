import { db } from '@/infra/database/connection';
import { games, platforms, gameRating, gameGenres, genres } from '@/infra/database/schema';
import { eq, sql, avg, like } from 'drizzle-orm';
import GameCard from '@/components/GameCard';
import type { Metadata } from 'next';
import GamesFilter from './GamesFilter';

export const metadata: Metadata = {
  title: 'Games Catalog — KeyVault',
  description: 'Browse all available games in the KeyVault store. Filter by genre and platform.',
};

async function getGames() {
  // All games with platform and average rating
  const allGames = db
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
    .orderBy(sql`${games.name} ASC`)
    .all();

  // Get genres for each game
  const gamesWithGenres = allGames.map((game) => {
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

  // All genres for filter
  const allGenres = db.select({ id: genres.id, name: genres.name }).from(genres).all();

  // All platforms for filter
  const allPlatforms = db.select({ id: platforms.id, name: platforms.name }).from(platforms).all();

  return { games: gamesWithGenres, genres: allGenres, platforms: allPlatforms };
}

export default async function GamesPage() {
  const data = await getGames();

  return (
    <main>
      <section className="section" style={{ paddingTop: '40px' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h1 className="section-title">🎮 Games Catalog</h1>
              <p className="section-subtitle">{data.games.length} games available in the store</p>
            </div>
          </div>

          <GamesFilter
            games={data.games}
            genres={data.genres}
            platforms={data.platforms}
          />
        </div>
      </section>
    </main>
  );
}
