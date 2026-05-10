import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infra/database/connection';
import { games, genres, gameGenres, users, suppliers, platforms, gamePriceLog } from '@/infra/database/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'addGame': {
        const { name, studio, description, price, platformId, genreIds } = data;
        if (!name || !studio || !price || !platformId) {
          return NextResponse.json({ error: 'Nome, estúdio, preço e plataforma são obrigatórios' }, { status: 400 });
        }
        const result = db.insert(games).values({
          name, studio, description: description || null,
          price: Number(price), activePlatformId: Number(platformId), deleted: 0,
        }).run();
        const gameId = Number(result.lastInsertRowid);
        // Add genres
        if (genreIds && Array.isArray(genreIds)) {
          for (const gId of genreIds) {
            db.insert(gameGenres).values({ gameId, genreId: Number(gId) }).run();
          }
        }
        return NextResponse.json({ message: 'Jogo adicionado!', gameId }, { status: 201 });
      }

      case 'createUser': {
        const { firstName, lastName, nickname, email, password, role } = data;
        if (!firstName || !lastName || !nickname || !email || !password) {
          return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
        }
        const existing = db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
        if (existing) return NextResponse.json({ error: 'E-mail já em uso' }, { status: 409 });
        db.insert(users).values({
          firstName, lastName, nickname, email, password,
          role: role || 'user', amount: 0, deleted: 0,
        }).run();
        return NextResponse.json({ message: 'Usuário criado!' }, { status: 201 });
      }

      case 'deleteUser': {
        const { userId } = data;
        if (!userId) return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
        db.update(users).set({ deleted: 1 }).where(eq(users.id, Number(userId))).run();
        return NextResponse.json({ message: 'Usuário deletado (soft delete)' });
      }

      case 'addSupplier': {
        const { name, website, contactEmail, platformId } = data;
        if (!name || !website || !contactEmail || !platformId) {
          return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
        }
        db.insert(suppliers).values({ name, website, contactEmail, platformId: Number(platformId), deleted: 0 }).run();
        return NextResponse.json({ message: 'Fornecedor adicionado!' }, { status: 201 });
      }

      case 'addGenre': {
        const { name } = data;
        if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        const exists = db.select({ id: genres.id }).from(genres).where(eq(genres.name, name)).get();
        if (exists) return NextResponse.json({ error: 'Categoria já existe' }, { status: 409 });
        db.insert(genres).values({ name }).run();
        return NextResponse.json({ message: 'Categoria adicionada!' }, { status: 201 });
      }

      case 'setDiscount': {
        const { gameId, discountPercent } = data;
        if (!gameId) return NextResponse.json({ error: 'gameId obrigatório' }, { status: 400 });
        const game = db.select({ price: games.price, name: games.name }).from(games).where(eq(games.id, Number(gameId))).get();
        if (!game) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
        const pct = Math.max(0, Math.min(90, Number(discountPercent) || 0));
        // peak = highest old_price ever logged or current price (whichever bigger)
        const peakRow = db
          .select({ peak: sql<number | null>`MAX(${gamePriceLog.oldPrice})`.as('peak') })
          .from(gamePriceLog)
          .where(eq(gamePriceLog.gameId, Number(gameId)))
          .get();
        const peak = Math.max(Number(game.price), Number(peakRow?.peak ?? 0));
        const newPrice = Math.round(peak * (1 - pct / 100) * 100) / 100;
        if (Math.abs(newPrice - Number(game.price)) > 0.005) {
          db.insert(gamePriceLog).values({
            gameId: Number(gameId),
            oldPrice: Number(game.price),
            newPrice,
          }).run();
          db.update(games).set({ price: newPrice }).where(eq(games.id, Number(gameId))).run();
        }
        return NextResponse.json({
          message: pct === 0 ? `Preço de ${game.name} restaurado para $${peak}` : `${game.name}: -${pct}% (de $${peak} para $${newPrice})`,
          newPrice,
          peak,
        });
      }

      case 'updateGameGenres': {
        const { gameId, genreIds } = data;
        if (!gameId || !Array.isArray(genreIds)) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
        // Remove all current genres
        db.delete(gameGenres).where(eq(gameGenres.gameId, Number(gameId))).run();
        // Add new ones
        for (const gId of genreIds) {
          db.insert(gameGenres).values({ gameId: Number(gameId), genreId: Number(gId) }).run();
        }
        return NextResponse.json({ message: 'Categorias do jogo atualizadas!' });
      }

      default:
        return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// GET: fetch data needed by admin forms
export async function GET() {
  const allGames = db
    .select({
      id: games.id,
      name: games.name,
      price: games.price,
      coverImageUrl: games.coverImageUrl,
      peak: sql<number | null>`MAX(${gamePriceLog.oldPrice})`.as('peak'),
    })
    .from(games)
    .leftJoin(gamePriceLog, eq(gamePriceLog.gameId, games.id))
    .where(eq(games.deleted, 0))
    .groupBy(games.id)
    .all();
  const allGenres = db.select({ id: genres.id, name: genres.name }).from(genres).all();
  const allPlatforms = db.select({ id: platforms.id, name: platforms.name }).from(platforms).all();
  const allUsers = db.select({
    id: users.id, firstName: users.firstName, lastName: users.lastName,
    nickname: users.nickname, email: users.email, deleted: users.deleted, role: users.role, amount: users.amount,
  }).from(users).all();

  // Get genres for each game
  const gameGenresMap: Record<number, number[]> = {};
  const allGameGenres = db.select({ gameId: gameGenres.gameId, genreId: gameGenres.genreId }).from(gameGenres).all();
  for (const gg of allGameGenres) {
    if (!gameGenresMap[gg.gameId]) gameGenresMap[gg.gameId] = [];
    gameGenresMap[gg.gameId].push(gg.genreId);
  }

  return NextResponse.json({ games: allGames, genres: allGenres, platforms: allPlatforms, users: allUsers, gameGenresMap });
}
