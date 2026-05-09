'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <h1 className="section-title">🔒 Acesso administrativo</h1>
        <p className="section-subtitle">Redirecionando para o login do painel...</p>
      </div>
    );
  }

  return <>{children}</>;
}
