'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { restockKeys, getAdminData } from '@/actions/admin';
import Link from 'next/link';

export default function RestockPage() {
  const router = useRouter();
  const [data, setData] = useState<{games: {id:number, name:string}[], suppliers: {id:number, name:string}[]}>({ games: [], suppliers: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    getAdminData().then(d => {
      setData({ games: d.games, suppliers: d.suppliers });
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    const formData = new FormData(e.currentTarget);
    const result = await restockKeys(formData);
    
    setIsProcessing(false);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Failed to restock keys');
    }
  };

  if (loading) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>Loading...</div>;

  return (
    <main className="container" style={{ paddingTop: '80px', maxWidth: '600px' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">📦 Restock Keys</h1>
          <p className="section-subtitle">Add a new batch of product keys</p>
        </div>
        <Link href="/dashboard" className="btn btn-outline">Back</Link>
      </div>

      <form onSubmit={handleSubmit} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <div style={{ color: 'var(--accent-danger)' }}>{error}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Game</label>
          <select name="gameId" required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            {data.games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Supplier</label>
          <select name="supplierId" required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            {data.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Cost Unit Price ($)</label>
            <input name="unitPrice" type="number" step="0.01" required className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }} placeholder="20.00" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>What we paid per key</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Quantity</label>
            <input name="quantity" type="number" required min="1" max="1000" className="user-select-input" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }} placeholder="50" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mux 1000 at once</span>
          </div>
        </div>

        <button type="submit" disabled={isProcessing} className="btn btn-primary" style={{ marginTop: '16px', justifyContent: 'center' }}>
          {isProcessing ? 'Generating Keys...' : 'Generate and Stock Keys'}
        </button>
      </form>
    </main>
  );
}
