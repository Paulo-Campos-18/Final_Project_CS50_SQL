'use server';

import { db } from '@/infra/database/connection';
import { wishlist, games, platforms, gameRating } from '@/infra/database/schema';
import { eq, and, avg, sql } from 'drizzle-orm';

export async function toggleWishlist(gameId: number, userId: number) {
  try {
    const existing = db
      .select()
      .from(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.gameId, gameId)))
      .get();

    if (existing) {
      db.delete(wishlist)
        .where(and(eq(wishlist.userId, userId), eq(wishlist.gameId, gameId)))
        .run();
      return { success: true, action: 'removed' };
    } else {
      db.insert(wishlist)
        .values({
          userId,
          gameId,
        })
        .run();
      return { success: true, action: 'added' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getIsWishlisted(gameId: number, userId: number) {
  const existing = db
    .select()
    .from(wishlist)
    .where(and(eq(wishlist.userId, userId), eq(wishlist.gameId, gameId)))
    .get();
  return !!existing;
}

export async function getWishlist(userId: number) {
  const data = db
    .select({
      id: games.id,
      name: games.name,
      studio: games.studio,
      price: games.price,
      platform: platforms.name,
      coverImageUrl: games.coverImageUrl,
      tagline: games.tagline,
      avgRating: avg(gameRating.rating),
    })
    .from(wishlist)
    .innerJoin(games, eq(wishlist.gameId, games.id))
    .innerJoin(platforms, eq(games.activePlatformId, platforms.id))
    .leftJoin(gameRating, eq(games.id, gameRating.gameId))
    .where(eq(wishlist.userId, userId))
    .groupBy(games.id)
    .all();

  return data.map((d) => ({
    ...d,
    avgRating: d.avgRating != null ? Number(d.avgRating) : null,
  }));
}
