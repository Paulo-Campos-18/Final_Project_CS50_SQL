'use server';

import { db } from '@/infra/database/connection';
import { gameRating, gameComments, orderKeys, orders, keys } from '@/infra/database/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function submitReview(gameId: number, userId: number, rating: number, comment: string) {
  try {
    return db.transaction((tx) => {
      // 1. Delete existing rating/comment if they exist (to allow updating)
      tx.delete(gameRating)
        .where(and(eq(gameRating.userId, userId), eq(gameRating.gameId, gameId)))
        .run();
      
      tx.delete(gameComments)
        .where(and(eq(gameComments.userId, userId), eq(gameComments.gameId, gameId)))
        .run();

      // 2. Insert new rating
      tx.insert(gameRating)
        .values({
          userId,
          gameId,
          rating,
        })
        .run();

      // 3. Insert new comment
      tx.insert(gameComments)
        .values({
          userId,
          gameId,
          commentText: comment,
        })
        .run();

      revalidatePath(`/games/${gameId}`);
      return { success: true };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function canUserReview(gameId: number, userId: number) {
  // Check if user bought this game
  const purchase = db
    .select()
    .from(orders)
    .innerJoin(orderKeys, eq(orderKeys.orderId, orders.id))
    .innerJoin(keys, eq(keys.id, orderKeys.keyId))
    .where(and(eq(orders.userId, userId), eq(keys.gameId, gameId)))
    .get();

  return !!purchase;
}
