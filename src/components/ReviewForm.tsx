'use client';

import { useState, useEffect } from 'react';
import { submitReview, canUserReview } from '@/actions/reviews';

interface ReviewFormProps {
  gameId: number;
}

export default function ReviewForm({ gameId }: ReviewFormProps) {
  const [rating, setRating] = useState(10);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('keyvault-user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUserId(u.id);
      canUserReview(gameId, u.id).then(setAllowed);
    }
  }, [gameId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    setMsg(null);

    const result = await submitReview(gameId, userId, rating, comment);
    
    setIsSubmitting(false);
    if (result && result.success) {
      setMsg({ type: 'success', text: 'Review submitted! Thanks for your feedback.' });
      setComment('');
    } else {
      setMsg({ type: 'error', text: (result as { success: false, error: string }).error || 'Failed to submit review' });
    }
  };

  if (!userId) {
    return <div className="detail-info-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Login to leave a review.</div>;
  }

  if (!allowed) {
    return <div className="detail-info-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Only customers who purchased this game can leave a review.</div>;
  }

  return (
    <div className="detail-info-card">
      <h3 style={{ marginBottom: '20px' }}>✍️ Leave a Review</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Rating: <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{rating}/10</span></label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            step="0.5" 
            value={rating} 
            onChange={(e) => setRating(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Comment</label>
          <textarea 
            className="user-select-input"
            style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', minHeight: '100px', resize: 'vertical', border: '1px solid var(--border-color)' }}
            placeholder="What did you think of the game?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
        </div>

        {msg && (
          <div style={{ 
            padding: '12px', 
            borderRadius: 'var(--radius-sm)', 
            fontSize: '0.9rem', 
            background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: msg.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
            border: `1px solid ${msg.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)'}`
          }}>
            {msg.text}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={isSubmitting}
          style={{ justifyContent: 'center' }}
        >
          {isSubmitting ? 'Submitting...' : 'Post Review'}
        </button>
      </form>
    </div>
  );
}
