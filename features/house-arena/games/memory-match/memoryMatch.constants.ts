export interface MockMemoryMatchPair {
  id: string;
  pairKey: string;
  leftLabelPt: string;
  leftLabelEn: string;
  rightLabelPt: string;
  rightLabelEn: string;
  category: string;
}

export const MOCK_MEMORY_MATCH_PAIRS: MockMemoryMatchPair[] = [
  {
    id: 'p_1',
    pairKey: 'salmon',
    leftLabelPt: 'Salmão',
    leftLabelEn: 'Salmon',
    rightLabelPt: 'Salmão Grelhado / Fresco',
    rightLabelEn: 'Grilled / Fresh Salmon',
    category: 'PROTEIN'
  },
  {
    id: 'p_2',
    pairKey: 'tuna',
    leftLabelPt: 'Atum',
    leftLabelEn: 'Tuna',
    rightLabelPt: 'Atum Spicy / Fresco',
    rightLabelEn: 'Spicy / Fresh Tuna',
    category: 'PROTEIN'
  },
  {
    id: 'p_3',
    pairKey: 'sushi_rice',
    leftLabelPt: 'Arroz de Sushi',
    leftLabelEn: 'Sushi Rice',
    rightLabelPt: 'Base tradicional temperada',
    rightLabelEn: 'Traditional seasoned base',
    category: 'BASE'
  },
  {
    id: 'p_4',
    pairKey: 'brown_rice',
    leftLabelPt: 'Arroz Integral',
    leftLabelEn: 'Brown Rice',
    rightLabelPt: 'Base saudável rica em fibra',
    rightLabelEn: 'Healthy fiber-rich base',
    category: 'BASE'
  },
  {
    id: 'p_5',
    pairKey: 'mango',
    leftLabelPt: 'Manga',
    leftLabelEn: 'Mango',
    rightLabelPt: 'Fruta doce tropical',
    rightLabelEn: 'Sweet tropical fruit',
    category: 'GREEN'
  },
  {
    id: 'p_6',
    pairKey: 'avocado',
    leftLabelPt: 'Abacate',
    leftLabelEn: 'Avocado',
    rightLabelPt: 'Topping cremoso saudável',
    rightLabelEn: 'Healthy creamy topping',
    category: 'GREEN'
  },
  {
    id: 'p_7',
    pairKey: 'wakame',
    leftLabelPt: 'Algas Wakame',
    leftLabelEn: 'Wakame Seaweed',
    rightLabelPt: 'Algas temperadas sésamo',
    rightLabelEn: 'Sesame seasoned seaweed',
    category: 'GREEN'
  },
  {
    id: 'p_8',
    pairKey: 'crispy_onion',
    leftLabelPt: 'Cebola Frita',
    leftLabelEn: 'Crispy Onion',
    rightLabelPt: 'Topping estaladiço salgado',
    rightLabelEn: 'Salty crunchy topping',
    category: 'CRISPY'
  },
  {
    id: 'p_9',
    pairKey: 'sesame_seeds',
    leftLabelPt: 'Sementes de Sésamo',
    leftLabelEn: 'Sesame Seeds',
    rightLabelPt: 'Topping de cortesia gratuito',
    rightLabelEn: 'Complimentary free topping',
    category: 'SESAME'
  },
  {
    id: 'p_10',
    pairKey: 'teriyaki',
    leftLabelPt: 'Molho Teriyaki',
    leftLabelEn: 'Teriyaki Sauce',
    rightLabelPt: 'Molho doce japonês',
    rightLabelEn: 'Sweet Japanese sauce',
    category: 'SAUCE'
  },
  {
    id: 'p_11',
    pairKey: 'soy_sauce',
    leftLabelPt: 'Molho de Soja',
    leftLabelEn: 'Soy Sauce',
    rightLabelPt: 'Molho salgado tradicional',
    rightLabelEn: 'Traditional salty sauce',
    category: 'SAUCE'
  },
  {
    id: 'p_12',
    pairKey: 'foh',
    leftLabelPt: 'Frente de Loja (FOH)',
    leftLabelEn: 'Front of House (FOH)',
    rightLabelPt: 'Área de atendimento ao cliente',
    rightLabelEn: 'Customer facing area',
    category: 'OPERATIONS'
  },
  {
    id: 'p_13',
    pairKey: 'boh',
    leftLabelPt: 'Cozinha (BOH)',
    leftLabelEn: 'Back of House (BOH)',
    rightLabelPt: 'Área de preparação de alimentos',
    rightLabelEn: 'Food preparation area',
    category: 'OPERATIONS'
  },
  {
    id: 'p_14',
    pairKey: 'haccp',
    leftLabelPt: 'Segurança Alimentar',
    leftLabelEn: 'Food Safety',
    rightLabelPt: 'Sistema de prevenção HACCP',
    rightLabelEn: 'HACCP prevention system',
    category: 'SAFETY'
  },
  {
    id: 'p_15',
    pairKey: 'cozy_chicken',
    leftLabelPt: 'Frango Vietnamita',
    leftLabelEn: 'Vietnamese Chicken',
    rightLabelPt: 'Proteína da Cozy Chicken',
    rightLabelEn: 'Cozy Chicken protein',
    category: 'RECIPE'
  },
  {
    id: 'p_16',
    pairKey: 'crispy_shrimp',
    leftLabelPt: 'Camarão Panado',
    leftLabelEn: 'Breaded Shrimp',
    rightLabelPt: 'Proteína do Crispy Shrimp',
    rightLabelEn: 'Crispy Shrimp protein',
    category: 'RECIPE'
  }
];
