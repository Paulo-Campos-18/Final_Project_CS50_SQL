'use client';

import Link from 'next/link';
import AddToCartButton from './AddToCartButton';
import WishlistToggle from './WishlistToggle';
import { useLanguage } from '@/context/LanguageContext';

interface GameCardProps {
  id: number;
  name: string;
  studio: string;
  price: number;
  platform: string;
  rating?: number | null;
  genres?: string[];
  coverImageUrl?: string | null;
  tagline?: string | null;
}

// Procedural fallback gradient by name (only used when no cover URL is present)
function gradientFor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('witcher') || lower.includes('hollow') || lower.includes('silksong')) {
    return 'linear-gradient(135deg, oklch(0.30 0.10 290), oklch(0.18 0.06 250))';
  }
  if (lower.includes('cyberpunk') || lower.includes('mass effect') || lower.includes('portal')) {
    return 'linear-gradient(140deg, oklch(0.22 0.06 200), oklch(0.15 0.04 220))';
  }
  if (lower.includes('god of war') || lower.includes('red dead') || lower.includes('tomb')) {
    return 'linear-gradient(150deg, oklch(0.24 0.08 50), oklch(0.14 0.04 40))';
  }
  if (lower.includes('zelda') || lower.includes('rocket') || lower.includes('horizon')) {
    return 'linear-gradient(150deg, oklch(0.24 0.04 140), oklch(0.14 0.03 150))';
  }
  return 'linear-gradient(135deg, oklch(0.22 0.02 280), oklch(0.13 0.02 270))';
}

export default function GameCard({
  id,
  name,
  studio,
  price,
  platform,
  rating,
  genres,
  coverImageUrl,
  tagline,
}: GameCardProps) {
  const { dict } = useLanguage();
  const platformLabel = (dict.platformMap as Record<string, string>)?.[platform] || platform;

  return (
    <Link href={`/games/${id}`} className="game-card" id={`game-card-${id}`}>
      <div className="game-card-image">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={name}
            className="game-card-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="game-card-cover-fallback" style={{ background: gradientFor(name) }} />
        )}
        <div className="game-card-image-shade" aria-hidden />
        <span className="game-card-platform">{platformLabel}</span>
        {tagline && <span className="game-card-tagline">{tagline}</span>}
      </div>
      <div className="game-card-body">
        <h3 className="game-card-title">{name}</h3>
        <p className="game-card-studio">{studio}</p>
        <div className="game-card-meta">
          <span className="game-card-price">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {rating != null && (
              <span className="game-card-rating">
                ⭐ {rating.toFixed(1)}
              </span>
            )}
            <WishlistToggle gameId={id} />
            <AddToCartButton game={{ gameId: id, name, price, platform }} />
          </div>
        </div>
        {genres && genres.length > 0 && (
          <div className="game-card-genres">
            {genres.map((g) => (
              <span key={g} className="genre-tag">
                {(dict.genreMap as Record<string, string>)?.[g] || g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
