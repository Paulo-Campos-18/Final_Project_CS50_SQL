import Link from 'next/link';
import AddToCartButton from './AddToCartButton';
import WishlistToggle from './WishlistToggle';
interface GameCardProps {
  id: number;
  name: string;
  studio: string;
  price: number;
  platform: string;
  rating?: number | null;
  genres?: string[];
  icon?: string;
}

// Map game names to emoji icons for visual representation
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

export default function GameCard({ id, name, studio, price, platform, rating, genres }: GameCardProps) {
  const icon = getGameIcon(name);

  return (
    <Link href={`/games/${id}`} className="game-card" id={`game-card-${id}`}>
      <div className="game-card-image">
        <span className="game-card-icon">{icon}</span>
        <span className="game-card-platform">{platform}</span>
      </div>
      <div className="game-card-body">
        <h3 className="game-card-title">{name}</h3>
        <p className="game-card-studio">{studio}</p>
        <div className="game-card-meta">
          <span className="game-card-price">${price.toFixed(2)}</span>
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
              <span key={g} className="genre-tag">{g}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
