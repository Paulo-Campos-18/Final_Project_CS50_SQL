'use client';

import { useState } from 'react';
import GameCard from '@/components/GameCard';

interface Game {
  id: number;
  name: string;
  studio: string;
  price: number;
  platform: string;
  avgRating: number | null;
  genres: string[];
}

interface GamesFilterProps {
  games: Game[];
  genres: { id: number; name: string }[];
  platforms: { id: number; name: string }[];
}

export default function GamesFilter({ games, genres, platforms }: GamesFilterProps) {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const filtered = games.filter((game) => {
    const matchesSearch =
      search === '' ||
      game.name.toLowerCase().includes(search.toLowerCase()) ||
      game.studio.toLowerCase().includes(search.toLowerCase());

    const matchesGenre = !selectedGenre || game.genres.includes(selectedGenre);
    const matchesPlatform = !selectedPlatform || game.platform === selectedPlatform;

    return matchesSearch && matchesGenre && matchesPlatform;
  });

  return (
    <>
      <div className="filter-bar" id="games-filter">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search games or studios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="search-games"
        />

        <button
          className={`filter-chip ${!selectedGenre ? 'active' : ''}`}
          onClick={() => setSelectedGenre(null)}
        >
          All Genres
        </button>
        {genres.map((genre) => (
          <button
            key={genre.id}
            className={`filter-chip ${selectedGenre === genre.name ? 'active' : ''}`}
            onClick={() => setSelectedGenre(selectedGenre === genre.name ? null : genre.name)}
          >
            {genre.name}
          </button>
        ))}
      </div>

      <div className="filter-bar" style={{ marginTop: '-16px' }}>
        <button
          className={`filter-chip ${!selectedPlatform ? 'active' : ''}`}
          onClick={() => setSelectedPlatform(null)}
        >
          All Platforms
        </button>
        {platforms.map((platform) => (
          <button
            key={platform.id}
            className={`filter-chip ${selectedPlatform === platform.name ? 'active' : ''}`}
            onClick={() =>
              setSelectedPlatform(selectedPlatform === platform.name ? null : platform.name)
            }
          >
            {platform.name}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="game-grid">
          {filtered.map((game) => (
            <GameCard
              key={game.id}
              id={game.id}
              name={game.name}
              studio={game.studio}
              price={game.price}
              platform={game.platform}
              rating={game.avgRating}
              genres={game.genres}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No games found matching your filters.</p>
        </div>
      )}
    </>
  );
}
