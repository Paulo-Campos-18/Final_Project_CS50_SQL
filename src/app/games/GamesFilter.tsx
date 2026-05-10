'use client';

import { useMemo, useState } from 'react';
import GameCard from '@/components/GameCard';
import GameShelf, { ShelfGame } from '@/components/GameShelf';
import { useLanguage } from '@/context/LanguageContext';

interface Game extends ShelfGame {}

interface GamesFilterProps {
  games: Game[];
  genres: { id: number; name: string }[];
  platforms: { id: number; name: string }[];
}

const SHELF_GENRES_PT = [
  { key: 'Action', label: 'Ação' },
  { key: 'RPG', label: 'RPG' },
  { key: 'Indie', label: 'Indie' },
  { key: 'Adventure', label: 'Aventura' },
  { key: 'Shooter', label: 'Shooter' },
  { key: 'Strategy', label: 'Estratégia' },
];

const SHELF_GENRES_EN = [
  { key: 'Action', label: 'Action' },
  { key: 'RPG', label: 'RPG' },
  { key: 'Indie', label: 'Indie' },
  { key: 'Adventure', label: 'Adventure' },
  { key: 'Shooter', label: 'Shooter' },
  { key: 'Strategy', label: 'Strategy' },
];

export default function GamesFilter({ games, genres, platforms }: GamesFilterProps) {
  const { t, dict, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      games.filter((game) => {
        const matchesSearch =
          search === '' ||
          game.name.toLowerCase().includes(search.toLowerCase()) ||
          game.studio.toLowerCase().includes(search.toLowerCase());
        const matchesGenre = !selectedGenre || game.genres.includes(selectedGenre);
        const matchesPlatform = !selectedPlatform || game.platform === selectedPlatform;
        return matchesSearch && matchesGenre && matchesPlatform;
      }),
    [games, search, selectedGenre, selectedPlatform],
  );

  const isFiltered = !!(search || selectedGenre || selectedPlatform);
  const shelves = useMemo(() => {
    if (isFiltered) return [];
    const list = language === 'pt-BR' ? SHELF_GENRES_PT : SHELF_GENRES_EN;
    const seenInShelf = new Set<number>();

    // First two shelves: Featured (top rated) + Drops (cards with msrp > price)
    const featured = [...games]
      .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
      .slice(0, 12);
    featured.forEach((g) => seenInShelf.add(g.id));

    const drops = games
      .filter((g) => g.msrp != null && (g.msrp as number) > g.price)
      .sort((a, b) => 1 - a.price / (a.msrp as number) - (1 - b.price / (b.msrp as number)))
      .reverse()
      .slice(0, 12);
    drops.forEach((g) => seenInShelf.add(g.id));

    const byGenre = list
      .map((sg) => {
        const list = games.filter((g) => g.genres.includes(sg.key)).slice(0, 12);
        return list.length ? { title: sg.label, sub: `GAME ⨝ GENRE · '${sg.key.toLowerCase()}'`, list } : null;
      })
      .filter(Boolean) as Array<{ title: string; sub: string; list: Game[] }>;

    return [
      {
        title: language === 'pt-BR' ? 'Em destaque' : 'Featured',
        sub: 'Top rated · ORDER BY rating DESC',
        list: featured,
      },
      ...(drops.length
        ? [{
            title: language === 'pt-BR' ? 'Em promoção' : 'On sale',
            sub: 'Maior queda vs. preço de pico',
            list: drops,
          }]
        : []),
      ...byGenre,
    ];
  }, [games, isFiltered, language]);

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

      {isFiltered ? (
        filtered.length > 0 ? (
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
                coverImageUrl={game.coverImageUrl}
                tagline={game.tagline}
                msrp={game.msrp}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <p>{t('filterNoGames')}</p>
          </div>
        )
      ) : (
        <>
          {shelves.map((s) => (
            <GameShelf key={s.title} title={s.title} subtitle={s.sub} games={s.list} />
          ))}
        </>
      )}
    </>
  );
}
