import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstName: text('first_name', { length: 30 }).notNull(),
  lastName: text('last_name', { length: 30 }).notNull(),
  nickname: text('nickname', { length: 30 }).notNull().unique(),
  email: text('email', { length: 100 }).notNull().unique(),
  password: text('password').notNull(),
  amount: real('amount').notNull().default(0),
  role: text('role').notNull().default('user'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  deleted: integer('deleted').notNull().default(0),
});

// ─── Genres ──────────────────────────────────────────────
export const genres = sqliteTable('genres', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name', { length: 30 }).notNull().unique(),
});

// ─── Platforms ───────────────────────────────────────────
export const platforms = sqliteTable('platforms', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name', { length: 40 }).notNull().unique(),
});

// ─── Games ───────────────────────────────────────────────
export const games = sqliteTable('games', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activePlatformId: integer('active_platform_id').notNull().references(() => platforms.id),
  name: text('name', { length: 40 }).notNull().unique(),
  studio: text('studio', { length: 30 }).notNull(),
  description: text('description'),
  releaseDate: text('release_date'),
  price: real('price').notNull(),
  deleted: integer('deleted').notNull().default(0),
});

// ─── Game Genres (many-to-many) ──────────────────────────
export const gameGenres = sqliteTable('game_genres', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id').notNull().references(() => games.id),
  genreId: integer('genre_id').notNull().references(() => genres.id),
});

// ─── Wishlist ────────────────────────────────────────────
export const wishlist = sqliteTable('wishlist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  gameId: integer('game_id').notNull().references(() => games.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── Game Comments ───────────────────────────────────────
export const gameComments = sqliteTable('game_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  gameId: integer('game_id').notNull().references(() => games.id),
  commentText: text('comment_text').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  deleted: integer('deleted').notNull().default(0),
});

// ─── Game Rating ─────────────────────────────────────────
export const gameRating = sqliteTable('game_rating', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  gameId: integer('game_id').notNull().references(() => games.id),
  rating: real('rating').notNull(),
});

// ─── Game Price Log ──────────────────────────────────────
export const gamePriceLog = sqliteTable('game_price_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id').notNull().references(() => games.id),
  oldPrice: real('old_price').notNull(),
  newPrice: real('new_price').notNull(),
  changedAt: text('changed_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ─── Key Status ──────────────────────────────────────────
export const keyStatus = sqliteTable('key_status', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  status: text('status', { length: 30 }).notNull().unique(),
});

// ─── Suppliers ───────────────────────────────────────────
export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  platformId: integer('platform_id').notNull().references(() => platforms.id),
  name: text('name', { length: 30 }).notNull().unique(),
  website: text('website', { length: 100 }).notNull(),
  contactEmail: text('contact_email', { length: 100 }).notNull(),
  deleted: integer('deleted').notNull().default(0),
});

// ─── Key Batches ─────────────────────────────────────────
export const keyBatches = sqliteTable('key_batches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id').notNull().references(() => games.id),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id),
  unitPrice: real('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  purchaseDate: text('purchase_date').default(sql`CURRENT_TIMESTAMP`),
});

// ─── Keys ────────────────────────────────────────────────
export const keys = sqliteTable('keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id').notNull().references(() => games.id),
  batchId: integer('batch_id').notNull().references(() => keyBatches.id),
  keyStatusId: integer('key_status_id').notNull().references(() => keyStatus.id),
  keyCode: text('key_code', { length: 40 }).notNull().unique(),
});

// ─── Orders ──────────────────────────────────────────────
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  purchaseDatetime: text('purchase_datetime').default(sql`CURRENT_TIMESTAMP`),
});

// ─── Order Keys ──────────────────────────────────────────
export const orderKeys = sqliteTable('order_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  keyId: integer('key_id').notNull().references(() => keys.id),
  unitPrice: real('unit_price').notNull(),
});

// ─── Payment Method ──────────────────────────────────────
export const paymentMethod = sqliteTable('payment_method', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name', { length: 30 }).notNull(),
});

// ─── Transactions ────────────────────────────────────────
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  paymentMethodId: integer('payment_method_id').notNull().references(() => paymentMethod.id),
  status: text('status').notNull().default('Sold'),
  transactionDatetime: text('transaction_datetime').default(sql`CURRENT_TIMESTAMP`),
  totalPrice: real('total_price').notNull(),
});

// ─── Friendships ─────────────────────────────────────────
export const friendships = sqliteTable('friendships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  friendId: integer('friend_id').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'), // pending, accepted, rejected
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
