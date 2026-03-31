'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getGameById, updateGame, getAdminData } from '@/actions/admin';
import Link from 'next/link';

export default function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const gameId = Number(id);

  const [platforms, setPlatforms] = useState<{id: number, name: string}[]>([]);
  const [game, setGame] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getAdminData(),
      getGameById(gameId)
    ]).then(([adminData, gameData]) => {
      setPlatforms(adminData.platforms);
      setGame(gameData);
      setLoading(false);
    });
  }, [gameId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateGame(gameId, formData);

    setIsSaving(false);
    if (result && result.success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError((result as { success: false, error: string }).error || 'Failed to update game');
    }
  };

  if (loading) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>Loading game data...</div>;
  if (!game) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>Game not found.</div>;

  return (
    <main className="container" style={{ paddingTop: '80px', maxWidth: '600px' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">✏️ Edit Game</h1>
          <p className="section-subtitle">Update details for {game.name}</p>
        </div>
        <Link href="/dashboard" className="btn btn-outline">Cancel</Link>
      </div>

      <form onSubmit={handleSubmit} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <div style={{ color: 'var(--accent-danger)' }}>{error}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Game Name</label>
          <input name="name" type="text" defaultValue={game.name} required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Studio / Developer</label>
          <input name="studio" type="text" defaultValue={game.studio} required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Platform</label>
            <select name="activePlatformId" defaultValue={game.activePlatformId} required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Retail Price ($)</label>
            <input name="price" type="number" step="0.01" defaultValue={game.price} required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Changes will be logged in Price History</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Release Date</label>
          <input name="releaseDate" type="date" defaultValue={game.releaseDate?.split('T')[0]} required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Description</label>
          <textarea name="description" rows={4} defaultValue={game.description} className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', resize: 'vertical' }}></textarea>
        </div>

        <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ marginTop: '16px', justifyContent: 'center' }}>
          {isSaving ? 'Saving Changes...' : 'Update Game Details'}
        </button>
      </form>
    </main>
  );
}
