import { ArenaGameType } from '../houseArena.types';

export function getGameName(gameType: ArenaGameType | string, lang: 'pt' | 'en'): string {
  if (gameType === 'slop_clock') {
    return lang === 'pt' ? 'Hora do Lodo' : 'Rush Hour';
  }
  if (gameType === 'quick_think') {
    return lang === 'pt' ? 'Pensa Rápido' : 'Fast Thinker';
  }
  if (gameType === 'memory_match') {
    return lang === 'pt' ? 'Memory Match' : 'SOP Memory Match';
  }
  return gameType;
}

export function formatOrdinalRank(rank: number, lang: 'pt' | 'en'): string {
  if (lang === 'pt') {
    return `${rank}º`;
  }
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `${rank}th`;
}
