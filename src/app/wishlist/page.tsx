'use client';

import { useEffect, useState } from 'react';
import { getWishlist } from '@/actions/wishlist';
import GameCard from '@/components/GameCard';
import Link from 'next/link';

type WishlistItem = {
  id: number;
  name: string;
  studio: string;
  price: number;
  platform: string;
  avgRating: number | null;
  genres?: string[]; // We might need to fetch genres too
};

export default function WishlistPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('keyvault-auth');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      getWishlist(u.id).then((data) => {
        setGames(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>Loading your wishlist...</div>;
  }

  if (!user) {
    return (
      <main className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <h1 className="section-title">Wishlist</h1>
        <p className="section-subtitle">Please select a user from the Navbar to view your wishlist.</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: '80px' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">❤️ My Wishlist</h1>
          <p className="section-subtitle">Games you've saved for later</p>
        </div>
        <Link href="/games" className="btn btn-primary">Browse More Games</Link>
      </div>

      {games.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤍</div>
          <p>Your wishlist is empty.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Click the heart icon on any game to save it here.</p>
        </div>
      ) : (
        <div className="game-grid">
          {games.map((game) => (
            <GameCard
              key={game.id}
              id={game.id}
              name={game.name}
              studio={game.studio}
              price={game.price}
              platform={game.platform}
              rating={game.avgRating ? Number(game.avgRating) : null}
            />
          ))}
        </div>
      )}
    </main>
  );
}
