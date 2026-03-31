'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addGame, getAdminData } from '@/actions/admin';
import Link from 'next/link';

export default function AddGamePage() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<{id: number, name: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminData().then(data => {
      setPlatforms(data.platforms);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await addGame(formData);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Failed to add game');
    }
  };

  if (loading) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>Loading...</div>;

  return (
    <main className="container" style={{ paddingTop: '80px', maxWidth: '600px' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">➕ Add New Game</h1>
          <p className="section-subtitle">Register a new title in the store catalog</p>
        </div>
        <Link href="/dashboard" className="btn btn-outline">Back</Link>
      </div>

      <form onSubmit={handleSubmit} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <div style={{ color: 'var(--accent-danger)' }}>{error}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Game Name</label>
          <input name="name" type="text" required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }} placeholder="E.g., Half-Life 3" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Studio / Developer</label>
          <input name="studio" type="text" required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }} placeholder="E.g., Valve" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Platform</label>
            <select name="activePlatformId" required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Retail Price ($)</label>
            <input name="price" type="number" step="0.01" required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }} placeholder="59.99" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Release Date</label>
          <input name="releaseDate" type="date" required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Description</label>
          <textarea name="description" rows={4} className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', resize: 'vertical' }} placeholder="Short summary of the game..."></textarea>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', justifyContent: 'center' }}>
          Save Game
        </button>
      </form>
    </main>
  );
}
