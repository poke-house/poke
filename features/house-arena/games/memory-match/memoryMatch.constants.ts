export interface MockMemoryMatchPair {
  id: string;
  pairKey: string;
  emoji: string;
  leftLabelPt: string;
  leftLabelEn: string;
  rightLabelPt: string;
  rightLabelEn: string;
  category: string;
}

export const EMOJI_BY_PAIR_KEY: Record<string, string> = {
  salmon: '🐟',
  tuna: '🍣',
  sushi_rice: '🍚',
  brown_rice: '🌾',
  mango: '🥭',
  avocado: '🥑',
  wakame: '🌿',
  crispy_onion: '🧅',
  sesame_seeds: '⚪',
  teriyaki: '🍯',
  soy_sauce: '🥢',
  foh: '🛎️',
  boh: '👨‍🍳',
  haccp: '🛡️',
  cozy_chicken: '🍗',
  crispy_shrimp: '🍤'
};

export const MOCK_MEMORY_MATCH_PAIRS: MockMemoryMatchPair[] = [
  {
    id: 'p_1',
    pairKey: 'salmon',
    emoji: '🐟',
    leftLabelPt: 'Salmão',
    leftLabelEn: 'Salmon',
    rightLabelPt: 'Salmão Grelhado / Fresco',
    rightLabelEn: 'Grilled / Fresh Salmon',
    category: 'PROTEIN'
  },
  {
    id: 'p_2',
    pairKey: 'tuna',
    emoji: '🍣',
    leftLabelPt: 'Atum',
    leftLabelEn: 'Tuna',
    rightLabelPt: 'Atum Spicy / Fresco',
    rightLabelEn: 'Spicy / Fresh Tuna',
    category: 'PROTEIN'
  },
  {
    id: 'p_3',
    pairKey: 'sushi_rice',
    emoji: '🍚',
    leftLabelPt: 'Arroz de Sushi',
    leftLabelEn: 'Sushi Rice',
    rightLabelPt: 'Base tradicional temperada',
    rightLabelEn: 'Traditional seasoned base',
    category: 'BASE'
  },
  {
    id: 'p_4',
    pairKey: 'brown_rice',
    emoji: '🌾',
    leftLabelPt: 'Arroz Integral',
    leftLabelEn: 'Brown Rice',
    rightLabelPt: 'Base saudável rica em fibra',
    rightLabelEn: 'Healthy fiber-rich base',
    category: 'BASE'
  },
  {
    id: 'p_5',
    pairKey: 'mango',
    emoji: '🥭',
    leftLabelPt: 'Manga',
    leftLabelEn: 'Mango',
    rightLabelPt: 'Fruta doce tropical',
    rightLabelEn: 'Sweet tropical fruit',
    category: 'GREEN'
  },
  {
    id: 'p_6',
    pairKey: 'avocado',
    emoji: '🥑',
    leftLabelPt: 'Abacate',
    leftLabelEn: 'Avocado',
    rightLabelPt: 'Topping cremoso saudável',
    rightLabelEn: 'Healthy creamy topping',
    category: 'GREEN'
  },
  {
    id: 'p_7',
    pairKey: 'wakame',
    emoji: '🌿',
    leftLabelPt: 'Algas Wakame',
    leftLabelEn: 'Wakame Seaweed',
    rightLabelPt: 'Algas temperadas sésamo',
    rightLabelEn: 'Sesame seasoned seaweed',
    category: 'GREEN'
  },
  {
    id: 'p_8',
    pairKey: 'crispy_onion',
    emoji: '🧅',
    leftLabelPt: 'Cebola Frita',
    leftLabelEn: 'Crispy Onion',
    rightLabelPt: 'Topping estaladiço salgado',
    rightLabelEn: 'Salty crunchy topping',
    category: 'CRISPY'
  },
  {
    id: 'p_9',
    pairKey: 'sesame_seeds',
    emoji: '⚪',
    leftLabelPt: 'Sementes de Sésamo',
    leftLabelEn: 'Sesame Seeds',
    rightLabelPt: 'Topping de cortesia gratuito',
    rightLabelEn: 'Complimentary free topping',
    category: 'SESAME'
  },
  {
    id: 'p_10',
    pairKey: 'teriyaki',
    emoji: '🍯',
    leftLabelPt: 'Molho Teriyaki',
    leftLabelEn: 'Teriyaki Sauce',
    rightLabelPt: 'Molho doce japonês',
    rightLabelEn: 'Sweet Japanese sauce',
    category: 'SAUCE'
  },
  {
    id: 'p_11',
    pairKey: 'soy_sauce',
    emoji: '🥢',
    leftLabelPt: 'Molho de Soja',
    leftLabelEn: 'Soy Sauce',
    rightLabelPt: 'Molho salgado tradicional',
    rightLabelEn: 'Traditional salty sauce',
    category: 'SAUCE'
  },
  {
    id: 'p_12',
    pairKey: 'foh',
    emoji: '🛎️',
    leftLabelPt: 'Frente de Loja (FOH)',
    leftLabelEn: 'Front of House (FOH)',
    rightLabelPt: 'Área de atendimento ao cliente',
    rightLabelEn: 'Customer facing area',
    category: 'OPERATIONS'
  },
  {
    id: 'p_13',
    pairKey: 'boh',
    emoji: '👨‍🍳',
    leftLabelPt: 'Cozinha (BOH)',
    leftLabelEn: 'Back of House (BOH)',
    rightLabelPt: 'Área de preparação de alimentos',
    rightLabelEn: 'Food preparation area',
    category: 'OPERATIONS'
  },
  {
    id: 'p_14',
    pairKey: 'haccp',
    emoji: '🛡️',
    leftLabelPt: 'Segurança Alimentar',
    leftLabelEn: 'Food Safety',
    rightLabelPt: 'Sistema de prevenção HACCP',
    rightLabelEn: 'HACCP prevention system',
    category: 'SAFETY'
  },
  {
    id: 'p_15',
    pairKey: 'cozy_chicken',
    emoji: '🍗',
    leftLabelPt: 'Frango Vietnamita',
    leftLabelEn: 'Vietnamese Chicken',
    rightLabelPt: 'Proteína da Cozy Chicken',
    rightLabelEn: 'Cozy Chicken protein',
    category: 'RECIPE'
  },
  {
    id: 'p_16',
    pairKey: 'crispy_shrimp',
    emoji: '🍤',
    leftLabelPt: 'Camarão Panado',
    leftLabelEn: 'Breaded Shrimp',
    rightLabelPt: 'Proteína do Crispy Shrimp',
    rightLabelEn: 'Crispy Shrimp protein',
    category: 'RECIPE'
  }
];

export function getCardEmoji(card: {
  id?: string;
  emoji?: string;
  labelPt?: string | null;
  labelEn?: string | null;
}): string {
  if (card.emoji) return card.emoji;

  // Check card.id (e.g. card_salmon_left_...)
  if (card.id) {
    const idLower = card.id.toLowerCase();
    for (const key of Object.keys(EMOJI_BY_PAIR_KEY)) {
      if (idLower.includes(key)) {
        return EMOJI_BY_PAIR_KEY[key];
      }
    }
  }

  // Check labels
  const text = `${card.labelPt || ''} ${card.labelEn || ''}`.toLowerCase();
  if (text.includes('salm')) return '🐟';
  if (text.includes('atum') || text.includes('tuna')) return '🍣';
  if (text.includes('arroz') || text.includes('rice')) return '🍚';
  if (text.includes('manga') || text.includes('mango')) return '🥭';
  if (text.includes('abacate') || text.includes('avocado')) return '🥑';
  if (text.includes('wakame') || text.includes('alga')) return '🌿';
  if (text.includes('cebola') || text.includes('onion')) return '🧅';
  if (text.includes('sésamo') || text.includes('sesame')) return '⚪';
  if (text.includes('teriyaki')) return '🍯';
  if (text.includes('soja') || text.includes('soy')) return '🥢';
  if (text.includes('foh') || text.includes('frente')) return '🛎️';
  if (text.includes('boh') || text.includes('cozinha')) return '👨‍🍳';
  if (text.includes('haccp') || text.includes('segurança')) return '🛡️';
  if (text.includes('frango') || text.includes('chicken')) return '🍗';
  if (text.includes('camarão') || text.includes('shrimp')) return '🍤';

  return '🥑';
}
