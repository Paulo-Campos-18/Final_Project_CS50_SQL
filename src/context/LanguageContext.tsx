'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ptBR } from '@/i18n/pt-BR';
import { en } from '@/i18n/en';

type Language = 'pt-BR' | 'en';
type Dictionary = typeof ptBR;

interface LanguageContextType {
  language: Language;
  t: (key: keyof Dictionary) => string;
  dict: Dictionary;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('pt-BR');
  const router = useRouter();

  // Load language from cookie
  useEffect(() => {
    const match = document.cookie.match(/(^| )NEXT_LOCALE=([^;]+)/);
    if (match && (match[2] === 'pt-BR' || match[2] === 'en')) {
      setLanguage(match[2] as Language);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'pt-BR' ? 'en' : 'pt-BR';
    setLanguage(newLang);
    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000`;
    router.refresh();
  };

  const dict = language === 'pt-BR' ? ptBR : en;

  const t = (key: keyof Dictionary): string => {
    return dict[key] as unknown as string || key as string;
  };

  return (
    <LanguageContext.Provider value={{ language, t, dict, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
