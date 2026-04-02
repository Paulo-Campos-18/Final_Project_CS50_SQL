'use client';

import { useState } from 'react';
import GameCard from '@/components/GameCard';
import { useLanguage } from '@/context/LanguageContext';

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
  const { t, dict } = useLanguage();
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
          placeholder={t('filterSearch')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="search-games"
        />

        <select
          className="search-input"
          style={{ width: 'auto', minWidth: '180px', cursor: 'pointer' }}
          value={selectedGenre || ''}
          onChange={(e) => setSelectedGenre(e.target.value || null)}
        >
          <option value="">{t('filterAllGenres')}</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.name}>
              {dict.genreMap[genre.name] || genre.name}
            </option>
          ))}
        </select>

        <select
          className="search-input"
          style={{ width: 'auto', minWidth: '180px', cursor: 'pointer' }}
          value={selectedPlatform || ''}
          onChange={(e) => setSelectedPlatform(e.target.value || null)}
        >
          <option value="">{t('filterAllPlatforms')}</option>
          {platforms.map((platform) => (
            <option key={platform.id} value={platform.name}>
              {dict.platformMap[platform.name] || platform.name}
            </option>
          ))}
        </select>
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
          <p>{t('filterNoGames')}</p>
        </div>
      )}
    </>
  );
}
