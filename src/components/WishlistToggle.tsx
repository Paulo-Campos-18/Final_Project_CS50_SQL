'use client';

import { useState, useEffect } from 'react';
import { toggleWishlist, getIsWishlisted } from '@/actions/wishlist';

interface WishlistToggleProps {
  gameId: number;
  className?: string;
}

export default function WishlistToggle({ gameId, className = '' }: WishlistToggleProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('keyvault-auth');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUserId(user.id);
      getIsWishlisted(gameId, user.id).then(setIsWishlisted);
    }
  }, [gameId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      alert('Faça login para adicionar à wishlist.');
      return;
    }

    // Optimistic update
    setIsWishlisted(!isWishlisted);

    const result = await toggleWishlist(gameId, userId);
    if (!result.success) {
      // Revert if failed
      setIsWishlisted(isWishlisted);
      alert(result.error || 'Failed to toggle wishlist');
    }
  };

  return (
    <button 
      className={`btn btn-outline ${className}`} 
      onClick={handleToggle}
      style={{ 
        padding: '6px 10px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        color: isWishlisted ? 'var(--accent-danger)' : 'inherit',
        borderColor: isWishlisted ? 'var(--accent-danger)' : 'var(--border-color)'
      }}
      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
    >
      {isWishlisted ? '❤️' : '🤍'}
    </button>
  );
}
