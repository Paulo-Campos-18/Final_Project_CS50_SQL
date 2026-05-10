import { db } from '@/infra/database/connection';
import { games, platforms, gameRating, gameGenres, genres, gamePriceLog } from '@/infra/database/schema';
import { eq, sql, avg } from 'drizzle-orm';
import type { Metadata } from 'next';
import GamesFilter from './GamesFilter';
import { cookies } from 'next/headers';
import { getDictionary } from '@/i18n';

export const metadata: Metadata = {
  title: 'Catálogo — KEYFORGE',
  description: 'Browse all available games in the KEYFORGE store. Filter by genre and platform.',
};

async function getGames() {
  // All games with platform, average rating and peak price (msrp)
  const allGames = db
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
      msrp: game.msrp != null ? Number(game.msrp) : null,
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
  const cookieStore = await cookies();
  const lang = cookieStore.get('NEXT_LOCALE')?.value || 'pt-BR';
  const t = getDictionary(lang);

  return (
    <main>
      <section className="section" style={{ paddingTop: '40px' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h1 className="section-title">🎮 {t.gamesCatalogTitle || 'Catálogo de Jogos'}</h1>
              <p className="section-subtitle">{data.games.length} {t.gamesCatalogSubtitle || 'jogos disponíveis na loja'}</p>
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
