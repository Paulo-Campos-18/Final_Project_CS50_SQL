'use server';

import { db } from '@/infra/database/connection';
import { games, keyBatches, keys, suppliers, platforms, gamePriceLog } from '@/infra/database/schema';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

export async function addGame(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const studio = formData.get('studio') as string;
    const activePlatformId = Number(formData.get('activePlatformId'));
    const price = Number(formData.get('price'));
    const description = formData.get('description') as string;
    const releaseDate = formData.get('releaseDate') as string;

    if (!name || !studio || !activePlatformId || isNaN(price)) {
      return { success: false, error: 'Missing required fields' };
    }

    db.insert(games).values({
      name,
      studio,
      activePlatformId,
      price,
      description,
      releaseDate,
    }).run();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function generateFakeKey() {
  return crypto.randomBytes(8).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-') || 'KEY-ERR';
}

export async function restockKeys(formData: FormData) {
  try {
    const gameId = Number(formData.get('gameId'));
    const supplierId = Number(formData.get('supplierId'));
    const unitPrice = Number(formData.get('unitPrice'));
    const quantity = Number(formData.get('quantity'));

    if (!gameId || !supplierId || isNaN(unitPrice) || isNaN(quantity) || quantity <= 0) {
      return { success: false, error: 'Invalid fields' };
    }

    // Available status is ID 1 (based on seed data, but ideally we'd query it)
    // To be perfectly safe, let's hardcode 1 for 'Available' or fetch it.
    // In our SQLite seed, Available is 1.

    db.transaction((tx) => {
      // 1. Create Batch
      const batchResult = tx.insert(keyBatches).values({
        gameId,
        supplierId,
        unitPrice,
        quantity,
      }).returning({ id: keyBatches.id }).get();

      if (!batchResult) throw new Error('Failed to create batch');

      // 2. Insert Keys
      for (let i = 0; i < quantity; i++) {
        tx.insert(keys).values({
          gameId,
          batchId: batchResult.id,
          keyStatusId: 1, // 1 = Available
          keyCode: generateFakeKey(),
        }).run();
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getGameById(id: number) {
  return db.select().from(games).where(eq(games.id, id)).get();
}

export async function updateGame(gameId: number, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const studio = formData.get('studio') as string;
    const activePlatformId = Number(formData.get('activePlatformId'));
    const newPrice = Number(formData.get('price'));
    const description = formData.get('description') as string;
    const releaseDate = formData.get('releaseDate') as string;

    const oldGame = db.select().from(games).where(eq(games.id, gameId)).get();
    if (!oldGame) return { success: false, error: 'Game not found' };

    return db.transaction((tx) => {
      // 1. If price changed, log it
      if (oldGame.price !== newPrice) {
        tx.insert(gamePriceLog).values({
          gameId,
          oldPrice: oldGame.price,
          newPrice: newPrice,
        }).run();
      }

      // 2. Update game
      tx.update(games).set({
        name,
        studio,
        activePlatformId,
        price: newPrice,
        description,
        releaseDate,
      }).where(eq(games.id, gameId)).run();

      return { success: true };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdminData() {
  const allPlatforms = db.select({ id: platforms.id, name: platforms.name }).from(platforms).all();
  const allSuppliers = db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).where(eq(suppliers.deleted, 0)).all();
  const allGames = db.select({ id: games.id, name: games.name }).from(games).where(eq(games.deleted, 0)).all();

  return { platforms: allPlatforms, suppliers: allSuppliers, games: allGames };
}
