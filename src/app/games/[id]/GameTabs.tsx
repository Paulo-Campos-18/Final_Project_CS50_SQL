'use client';

import { useState } from 'react';
import Link from 'next/link';

interface GameTabsProps {
  comments: any[];
  relatedGames: any[];
}

export default function GameTabs({ comments, relatedGames }: GameTabsProps) {
  const [activeTab, setActiveTab] = useState<'reviews' | 'related'>('reviews');

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            background: activeTab === 'reviews' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'reviews' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600, transition: 'all 0.2s', border: 'none', cursor: 'pointer'
          }}
        >
          Avaliações ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab('related')}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            background: activeTab === 'related' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'related' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600, transition: 'all 0.2s', border: 'none', cursor: 'pointer'
          }}
        >
          Jogos Relacionados
        </button>
      </div>

      {activeTab === 'reviews' && (
        <div className="comment-list">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="comment-card">
                <div className="comment-header">
                  <div className="comment-avatar">
                    {comment.firstName[0]}{comment.lastName[0]}
                  </div>
                  <span className="comment-author">{comment.nickname}</span>
                  {comment.createdAt && (
                    <span className="comment-date">{comment.createdAt}</span>
                  )}
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ padding: '24px' }}>
              <p>Nenhuma avaliação ainda.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'related' && (
        <div>
          {relatedGames.length > 0 ? (
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
              {relatedGames.map(rg => (
                <Link key={rg.id} href={`/games/${rg.id}`} style={{
                  minWidth: '220px', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', padding: '16px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
                }}>
                  <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '12px' }}>🎮</div>
                  <div style={{ fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rg.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{rg.studio}</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-success)', marginTop: 'auto' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rg.price)}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px' }}>
              <p>Nenhum jogo relacionado encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
