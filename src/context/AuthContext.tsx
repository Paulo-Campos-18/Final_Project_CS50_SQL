'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: number;
  nickname: string;
  firstName: string;
  lastName: string;
  amount: number;
  role: UserRole;
}

interface AuthContextProps {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  updateUser: (data: { firstName?: string; lastName?: string; nickname?: string }) => Promise<{ success: boolean; error?: string }>;
  setAuthenticatedUser: (user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('keyvault-auth');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('keyvault-auth');
      }
    }
    // Clean up old key
    localStorage.removeItem('keyvault-user');
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Erro ao fazer login' };
      setUser(data.user);
      localStorage.setItem('keyvault-auth', JSON.stringify(data.user));
      // Hard reload so the static KEYFORGE SPA picks up the fresh auth on first paint.
      window.location.href = '/';
      return { success: true };
    } catch {
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) return { success: false, error: result.error || 'Erro ao criar conta' };
      setUser(result.user);
      localStorage.setItem('keyvault-auth', JSON.stringify(result.user));
      // Hard reload so the static KEYFORGE SPA picks up the fresh auth on first paint.
      window.location.href = '/';
      return { success: true };
    } catch {
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const updateUser = async (data: { firstName?: string; lastName?: string; nickname?: string }) => {
    if (!user) return { success: false, error: 'Não autenticado' };
    try {
      const res = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...data }),
      });
      const result = await res.json();
      if (!res.ok) return { success: false, error: result.error || 'Erro ao atualizar' };
      const updatedUser = { ...user, ...result.user };
      setUser(updatedUser);
      localStorage.setItem('keyvault-auth', JSON.stringify(updatedUser));
      return { success: true };
    } catch {
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const setAuthenticatedUser = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem('keyvault-auth', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('keyvault-auth');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateUser, setAuthenticatedUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
