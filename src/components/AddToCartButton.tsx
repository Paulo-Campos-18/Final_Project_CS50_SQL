'use client';

import { useCart } from '@/context/CartContext';

interface AddToCartButtonProps {
  game: {
    gameId: number;
    name: string;
    price: number;
    platform: string;
  };
  className?: string;
  showText?: boolean;
}

export default function AddToCartButton({ game, className = '', showText = false }: AddToCartButtonProps) {
  const { addToCart } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Stop Link navigation if inside a Link
    e.stopPropagation();
    addToCart(game);
  };

  return (
    <button 
      className={`btn btn-primary ${className}`} 
      onClick={handleAdd}
      style={{ padding: showText ? '8px 16px' : '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
      title="Add to Cart"
    >
      🛒 {showText && <span>Add to Cart</span>}
    </button>
  );
}
