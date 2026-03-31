'use server';

import { db } from '@/infra/database/connection';
import { orders, orderKeys, keys, games, platforms, transactions } from '@/infra/database/schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserPurchasedKeys(userId: number) {
  // Query all keys the user has bought.
  // user -> orders -> orderKeys -> keys
  const purchasedKeys = db
    .select({
      orderId: orders.id,
      purchaseDate: orders.purchaseDatetime,
      gameName: games.name,
      platform: platforms.name,
      keyCode: keys.keyCode,
      price: orderKeys.unitPrice,
    })
    .from(orders)
    .innerJoin(orderKeys, eq(orderKeys.orderId, orders.id))
    .innerJoin(keys, eq(keys.id, orderKeys.keyId))
    .innerJoin(games, eq(games.id, keys.gameId))
    .innerJoin(platforms, eq(platforms.id, games.activePlatformId))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.purchaseDatetime))
    .all();

  return purchasedKeys;
}

export async function getUserOrders(userId: number) {
  const userOrders = db
    .select({
      orderId: orders.id,
      date: orders.purchaseDatetime,
      total: transactions.totalPrice,
      status: transactions.status
    })
    .from(orders)
    .innerJoin(transactions, eq(transactions.orderId, orders.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.purchaseDatetime))
    .all();
    
  return userOrders;
}
