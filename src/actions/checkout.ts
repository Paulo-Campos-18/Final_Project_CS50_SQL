'use server';

import { db } from '@/infra/database/connection';
import { users, orders, orderKeys, keys, keyStatus, transactions, paymentMethod } from '@/infra/database/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

type CheckoutItem = {
  gameId: number;
  quantity: number;
  price: number;
};

export async function processCheckout(userId: number, items: CheckoutItem[], paymentMethodId: number) {
  try {
    // We start a pseudo-transaction by calculating all first. 
    // In SQLite with Drizzle we can use .transaction() but for better-sqlite3 it's straightforward.
    let totalSufficient = 0;

    // 1. Get user to check balance
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return { success: false, error: 'User not found' };

    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (user.amount < totalPrice) {
      return { success: false, error: 'Insufficient funds in wallet' };
    }

    // 2. Fetch the 'Available' and 'Sold' status IDs
    const availableStatus = db.select().from(keyStatus).where(eq(keyStatus.status, 'Available')).get();
    const soldStatus = db.select().from(keyStatus).where(eq(keyStatus.status, 'Sold')).get();

    if (!availableStatus || !soldStatus) return { success: false, error: 'Database status missing' };

    // 3. Find available keys for each game
    const keysToAssign: number[] = [];
    const orderItemsAssigned: { keyId: number, price: number }[] = [];

    for (const item of items) {
      const availableKeysForGame = db
        .select({ id: keys.id })
        .from(keys)
        .where(
          and(
            eq(keys.gameId, item.gameId),
            eq(keys.keyStatusId, availableStatus.id)
          )
        )
        .limit(item.quantity)
        .all();

      if (availableKeysForGame.length < item.quantity) {
        return { success: false, error: `Not enough keys available for game ID ${item.gameId}` };
      }

      availableKeysForGame.forEach(k => {
        keysToAssign.push(k.id);
        orderItemsAssigned.push({ keyId: k.id, price: item.price });
      });
    }

    // ACTUALLY APPLY CHANGES
    // Drizzle with better-sqlite3 supports transactions natively:
    return db.transaction((tx) => {
      // Create order
      const newOrderResult = tx.insert(orders).values({
        userId
      }).returning({ id: orders.id }).get();

      if (!newOrderResult) throw new Error('Failed to create order');

      // Update keys status
      tx.update(keys)
        .set({ keyStatusId: soldStatus.id })
        .where(inArray(keys.id, keysToAssign))
        .run();

      // Create order keys
      for (const ok of orderItemsAssigned) {
        tx.insert(orderKeys).values({
          orderId: newOrderResult.id,
          keyId: ok.keyId,
          unitPrice: ok.price
        }).run();
      }

      // Create transaction
      tx.insert(transactions).values({
        orderId: newOrderResult.id,
        paymentMethodId,
        totalPrice,
        status: 'Sold'
      }).run();

      // Update user wallet
      tx.update(users)
        .set({ amount: user.amount - totalPrice })
        .where(eq(users.id, userId))
        .run();

      return { success: true, orderId: newOrderResult.id };
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return { success: false, error: error.message || 'An error occurred during checkout' };
  }
}

export async function getPaymentMethods() {
  return db.select().from(paymentMethod).all();
}
