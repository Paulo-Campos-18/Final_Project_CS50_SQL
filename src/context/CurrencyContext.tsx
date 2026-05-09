'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CurrencyCode = 'USD' | 'BRL' | 'EUR' | 'GBP';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  rate: number; // multiplier from USD base
  locale: string;
  flag: string;
  label: string;
}

// Game prices in the DB are stored in USD (matching the RAWG-sourced catalog).
// Rates mirror the design's data.jsx and only need updating quarterly.
export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: 'USD', symbol: '$',  rate: 1.0,  locale: 'en-US', flag: '🇺🇸', label: 'US Dollar' },
  BRL: { code: 'BRL', symbol: 'R$', rate: 5.1,  locale: 'pt-BR', flag: '🇧🇷', label: 'Real' },
  EUR: { code: 'EUR', symbol: '€',  rate: 0.93, locale: 'de-DE', flag: '🇪🇺', label: 'Euro' },
  GBP: { code: 'GBP', symbol: '£',  rate: 0.79, locale: 'en-GB', flag: '🇬🇧', label: 'British Pound' },
};

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  meta: CurrencyMeta;
  /** Convert a USD-denominated value to the active currency, formatted as money. */
  format: (usd: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('BRL');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('keyforge-currency')) as CurrencyCode | null;
    if (saved && CURRENCIES[saved]) setCurrencyState(saved);
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    if (typeof window !== 'undefined') localStorage.setItem('keyforge-currency', code);
  };

  const meta = CURRENCIES[currency];

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    setCurrency,
    meta,
    format: (usd: number) => {
      const converted = usd * meta.rate;
      try {
        return new Intl.NumberFormat(meta.locale, {
          style: 'currency',
          currency: meta.code,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(converted);
      } catch {
        return `${meta.symbol}${converted.toFixed(2)}`;
      }
    },
  }), [currency, meta]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
