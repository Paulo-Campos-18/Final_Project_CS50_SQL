import { ptBR } from './pt-BR';
import { en } from './en';

export type Dictionary = typeof ptBR;

export const getDictionary = (lang: string): Dictionary => {
  if (lang === 'en') return en as unknown as Dictionary;
  return ptBR;
};
