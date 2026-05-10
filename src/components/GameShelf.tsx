'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import GameCard from './GameCard';

export interface ShelfGame {
  id: number;
  name: string;
  studio: string;
  price: number;
  platform: string;
  avgRating: number | null;
  genres: string[];
  coverImageUrl: string | null;
  tagline: string | null;
  msrp?: number | null;
}

interface GameShelfProps {
  title: ReactNode;
  subtitle?: ReactNode;
  games: ShelfGame[];
  cardsPerView?: number;
}

export default function GameShelf({ title, subtitle, games, cardsPerView = 4 }: GameShelfProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => { update(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [games.length]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <section className="shelf">
      <header className="shelf-head">
        <div>
          <div className="shelf-title">{title}</div>
          {subtitle && <div className="shelf-sub">{subtitle}</div>}
        </div>
        <div className="shelf-arrows">
          <button onClick={() => scroll(-1)} disabled={!canL} aria-label="Scroll left" className="shelf-arrow">
            ←
          </button>
          <button onClick={() => scroll(1)} disabled={!canR} aria-label="Scroll right" className="shelf-arrow">
            →
          </button>
        </div>
      </header>
      <motion.div
        ref={ref}
        onScroll={update}
        className="shelf-track"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {games.map((g) => (
          <div
            key={g.id}
            className="shelf-slot"
            style={{ width: `calc((100% - ${cardsPerView - 1} * 16px) / ${cardsPerView})`, minWidth: 220 }}
          >
            <GameCard
              id={g.id}
              name={g.name}
              studio={g.studio}
              price={g.price}
              platform={g.platform}
              rating={g.avgRating}
              genres={g.genres}
              coverImageUrl={g.coverImageUrl}
              tagline={g.tagline}
              msrp={g.msrp}
            />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
