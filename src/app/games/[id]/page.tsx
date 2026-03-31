import { db } from '@/infra/database/connection';
import {
  games, platforms, gameRating, gameGenres, genres, gameComments,
  users, keys, keyStatus, gamePriceLog, wishlist,
} from '@/infra/database/schema';
import { eq, sql, avg, count, and } from 'drizzle-orm';
import Link from 'next/link';
import StarRating from '@/components/StarRating';
import AddToCartButton from '@/components/AddToCartButton';
import WishlistToggle from '@/components/WishlistToggle';
import ReviewForm from '@/components/ReviewForm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Map game names to emoji icons
function getGameIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('witcher')) return '⚔️';
  if (lower.includes('cyberpunk')) return '🤖';
  if (lower.includes('god of war')) return '🪓';
  if (lower.includes('grand theft') || lower.includes('gta')) return '🚗';
  if (lower.includes('red dead')) return '🤠';
  if (lower.includes('last of us')) return '🍄';
  if (lower.includes('zelda')) return '🧝';
  if (lower.includes('elden ring')) return '💍';
  if (lower.includes('baldur')) return '🐉';
  if (lower.includes('minecraft')) return '⛏️';
  if (lower.includes('spider')) return '🕷️';
  if (lower.includes('starfield')) return '🚀';
  if (lower.includes('alan wake')) return '🔦';
  return '🎮';
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const game = db.select({ name: games.name }).from(games).where(eq(games.id, Number(id))).get();
  return {
    title: game ? `${game.name} — KeyVault` : 'Game Not Found — KeyVault',
    description: game ? `Buy ${game.name} game keys on KeyVault.` : 'Game not found.',
  };
}

async function getGameDetail(id: number) {
  // Main game info
  const game = db
    .select({
      id: games.id,
      name: games.name,
      studio: games.studio,
      description: games.description,
      releaseDate: games.releaseDate,
      price: games.price,
      platform: platforms.name,
    })
    .from(games)
    .innerJoin(platforms, eq(games.activePlatformId, platforms.id))
    .where(eq(games.id, id))
    .get();

  if (!game) return null;

  // Average rating
  const ratingData = db
    .select({ avg: avg(gameRating.rating), count: count() })
    .from(gameRating)
    .where(eq(gameRating.gameId, id))
    .get();

  // Genres
  const gameGenresList = db
    .select({ name: genres.name })
    .from(gameGenres)
    .innerJoin(genres, eq(gameGenres.genreId, genres.id))
    .where(eq(gameGenres.gameId, id))
    .all();

  // Comments with user info
  const comments = db
    .select({
      id: gameComments.id,
      text: gameComments.commentText,
      createdAt: gameComments.createdAt,
      nickname: users.nickname,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(gameComments)
    .innerJoin(users, eq(gameComments.userId, users.id))
    .where(and(eq(gameComments.gameId, id), eq(gameComments.deleted, 0)))
    .orderBy(sql`${gameComments.createdAt} DESC`)
    .all();

  // Available keys count
  const availableKeysCount = db
    .select({ count: count() })
    .from(keys)
    .innerJoin(keyStatus, eq(keys.keyStatusId, keyStatus.id))
    .where(and(eq(keys.gameId, id), eq(keyStatus.status, 'Available')))
    .get();

  // Total keys
  const totalKeysCount = db
    .select({ count: count() })
    .from(keys)
    .where(eq(keys.gameId, id))
    .get();

  // Price history
  const priceHistory = db
    .select({
      oldPrice: gamePriceLog.oldPrice,
      newPrice: gamePriceLog.newPrice,
      changedAt: gamePriceLog.changedAt,
    })
    .from(gamePriceLog)
    .where(eq(gamePriceLog.gameId, id))
    .orderBy(sql`${gamePriceLog.changedAt} DESC`)
    .all();

  // Wishlist count
  const wishlistCount = db
    .select({ count: count() })
    .from(wishlist)
    .where(eq(wishlist.gameId, id))
    .get();

  // Individual ratings
  const ratings = db
    .select({
      rating: gameRating.rating,
      nickname: users.nickname,
    })
    .from(gameRating)
    .innerJoin(users, eq(gameRating.userId, users.id))
    .where(eq(gameRating.gameId, id))
    .all();

  return {
    game,
    avgRating: ratingData?.avg ? Number(ratingData.avg) : null,
    ratingCount: ratingData?.count ?? 0,
    genres: gameGenresList.map((g) => g.name),
    comments,
    availableKeys: availableKeysCount?.count ?? 0,
    totalKeys: totalKeysCount?.count ?? 0,
    priceHistory,
    wishlistCount: wishlistCount?.count ?? 0,
    ratings,
  };
}

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getGameDetail(Number(id));

  if (!data) {
    notFound();
  }

  const { game, avgRating, ratingCount, genres: gameGenreNames, comments, availableKeys, totalKeys, priceHistory, wishlistCount, ratings } = data;
  const icon = getGameIcon(game.name);

  return (
    <main>
      <section className="detail-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/games">Games</Link>
            <span>/</span>
            <span>{game.name}</span>
          </div>

          <div className="detail-grid">
            {/* Main Content */}
            <div className="detail-main">
              <div className="detail-image">
                <span style={{ zIndex: 1 }}>{icon}</span>
              </div>

              <div>
                <h1 className="detail-title">{game.name}</h1>
                <p className="detail-studio">by {game.studio}</p>
              </div>

              <div className="game-card-genres" style={{ marginTop: 0 }}>
                {gameGenreNames.map((g) => (
                  <span key={g} className="genre-tag">{g}</span>
                ))}
              </div>

              {game.description && (
                <div className="detail-info-card">
                  <h3>📖 Description</h3>
                  <p className="detail-description">{game.description}</p>
                </div>
              )}

              {/* Comments */}
              <div className="detail-info-card">
                <h3>💬 Reviews ({comments.length})</h3>
                {comments.length > 0 ? (
                  <div className="comment-list">
                    {comments.map((comment) => (
                      <div key={comment.id} className="comment-card">
                        <div className="comment-header">
                          <div className="comment-avatar">
                            {comment.firstName[0]}{comment.lastName[0]}
                          </div>
                          <span className="comment-author">{comment.nickname}</span>
                          {comment.createdAt && (
                            <span className="comment-date">{comment.createdAt}</span>
                          )}
                        </div>
                        <p className="comment-text">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '24px' }}>
                    <p>No reviews yet.</p>
                  </div>
                )}
              </div>

              {/* Review Form */}
              <ReviewForm gameId={game.id} />
            </div>

            {/* Sidebar */}
            <div className="detail-sidebar">
              {/* Price & Purchase */}
              <div className="detail-info-card">
                <div className="detail-price-big">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(game.price)}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                  {availableKeys > 0 ? (
                    <span className="badge badge-success">✓ {availableKeys} keys in stock</span>
                  ) : (
                    <span className="badge badge-danger">✕ Out of stock</span>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <WishlistToggle gameId={game.id} />
                    {availableKeys > 0 && (
                      <AddToCartButton 
                        game={{ gameId: game.id, name: game.name, price: game.price, platform: game.platform }} 
                        showText={true}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Game Info */}
              <div className="detail-info-card">
                <h3>ℹ️ Game Details</h3>
                <div className="detail-info-row">
                  <span className="label">Platform</span>
                  <span className="value">{game.platform}</span>
                </div>
                <div className="detail-info-row">
                  <span className="label">Release Date</span>
                  <span className="value">{game.releaseDate ?? 'N/A'}</span>
                </div>
                <div className="detail-info-row">
                  <span className="label">Total Keys</span>
                  <span className="value">{totalKeys}</span>
                </div>
                <div className="detail-info-row">
                  <span className="label">Wishlisted</span>
                  <span className="value">{wishlistCount}×</span>
                </div>
              </div>

              {/* Rating */}
              <div className="detail-info-card">
                <h3>⭐ Ratings ({ratingCount})</h3>
                {avgRating !== null ? (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <StarRating rating={avgRating} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {ratings.map((r, i) => (
                        <div key={i} className="detail-info-row" style={{ padding: '6px 0' }}>
                          <span className="label">{r.nickname}</span>
                          <span className="value" style={{ color: '#f59e0b' }}>{r.rating.toFixed(1)}/10</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No ratings yet.</p>
                )}
              </div>

              {/* Price History */}
              {priceHistory.length > 0 && (
                <div className="detail-info-card">
                  <h3>📉 Price History</h3>
                  {priceHistory.map((ph, i) => (
                    <div key={i} className="price-history-item">
                      <span className="price-old">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ph.oldPrice)}</span>
                      <span className="price-arrow">→</span>
                      <span className="price-new">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ph.newPrice)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
