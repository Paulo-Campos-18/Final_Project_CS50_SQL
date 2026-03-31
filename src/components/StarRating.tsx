interface StarRatingProps {
  rating: number;
  maxRating?: number;
  showValue?: boolean;
}

export default function StarRating({ rating, maxRating = 10, showValue = true }: StarRatingProps) {
  // Convert to 5-star scale
  const stars5 = (rating / maxRating) * 5;
  const fullStars = Math.floor(stars5);
  const hasHalf = stars5 - fullStars >= 0.25;

  return (
    <span className="star-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < fullStars ? '#f59e0b' : (i === fullStars && hasHalf ? '#f59e0b' : '#3a3a52'), fontSize: '0.9em' }}>
          {i < fullStars ? '★' : (i === fullStars && hasHalf ? '★' : '☆')}
        </span>
      ))}
      {showValue && (
        <span style={{ marginLeft: '6px', fontSize: '0.85em', fontWeight: 600, color: '#f59e0b' }}>
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
