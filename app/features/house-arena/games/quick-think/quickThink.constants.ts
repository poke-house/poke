import { QuickThinkQuestionOption } from './quickThink.types';

export interface MockQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_pt: string;
  question_en: string;
  options: QuickThinkQuestionOption[];
  correct_option_id: string;
  explanation_pt: string;
  explanation_en: string;
}

export const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: 'q_1',
    category: 'RECIPES',
    difficulty: 'medium',
    question_pt: 'Qual é a proteína principal da Cozy Chicken?',
    question_en: 'What is the main protein of Cozy Chicken?',
    options: [
      { id: 'opt_1', text_pt: 'Frango Vietnamita', text_en: 'Vietnamese Chicken' },
      { id: 'opt_2', text_pt: 'Frango Teriyaki', text_en: 'Teriyaki Chicken' },
      { id: 'opt_3', text_pt: 'Frango Grelhado', text_en: 'Grilled Chicken' },
      { id: 'opt_4', text_pt: 'Tofu', text_en: 'Tofu' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'O Cozy Chicken é preparado tradicionalmente com Frango Vietnamita aromatizado.',
    explanation_en: 'Cozy Chicken is traditionally prepared with flavorful Vietnamese Chicken.'
  },
  {
    id: 'q_2',
    category: 'RECIPES',
    difficulty: 'easy',
    question_pt: 'O "Egg & Spinach" contém quantos ovos?',
    question_en: 'How many eggs does "Egg & Spinach" contain?',
    options: [
      { id: 'opt_1', text_pt: '2', text_en: '2' },
      { id: 'opt_2', text_pt: '1', text_en: '1' },
      { id: 'opt_3', text_pt: '3', text_en: '3' },
      { id: 'opt_4', text_pt: '4', text_en: '4' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'A receita oficial de Egg & Spinach leva exatamente 2 ovos cozidos.',
    explanation_en: 'The official recipe for Egg & Spinach includes exactly 2 boiled eggs.'
  },
  {
    id: 'q_3',
    category: 'HISTORY',
    difficulty: 'easy',
    question_pt: 'Onde foi fundada a Poke House?',
    question_en: 'Where was Poke House founded?',
    options: [
      { id: 'opt_1', text_pt: 'Milão', text_en: 'Milan' },
      { id: 'opt_2', text_pt: 'Los Angeles', text_en: 'Los Angeles' },
      { id: 'opt_3', text_pt: 'Lisboa', text_en: 'Lisbon' },
      { id: 'opt_4', text_pt: 'Londres', text_en: 'London' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'A Poke House foi fundada em Milão, Itália, em 2018.',
    explanation_en: 'Poke House was founded in Milan, Italy, in 2018.'
  },
  {
    id: 'q_4',
    category: 'HISTORY',
    difficulty: 'easy',
    question_pt: 'O que significa "Poke" em havaiano?',
    question_en: 'What does "Poke" mean in Hawaiian?',
    options: [
      { id: 'opt_1', text_pt: 'Cortado em cubos', text_en: 'Cut in cubes' },
      { id: 'opt_2', text_pt: 'Peixe fresco', text_en: 'Fresh fish' },
      { id: 'opt_3', text_pt: 'Arroz cozido', text_en: 'Cooked rice' },
      { id: 'opt_4', text_pt: 'Prato de peixe', text_en: 'Fish dish' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'Poke significa literalmente cortar ou fatiar transversalmente em pedaços em Havaiano.',
    explanation_en: 'Poke literally means to slice or cut crosswise into pieces in Hawaiian.'
  },
  {
    id: 'q_5',
    category: 'RECIPES',
    difficulty: 'medium',
    question_pt: 'O Sésamo conta como um dos 2 Toppings incluídos?',
    question_en: 'Does Sesame count as one of the 2 included Toppings?',
    options: [
      { id: 'opt_1', text_pt: 'Não', text_en: 'No' },
      { id: 'opt_2', text_pt: 'Sim', text_en: 'Yes' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'O Sésamo é um topping gratuito de cortesia e não conta para o limite de 2 toppings padrão.',
    explanation_en: 'Sesame is a complimentary free topping and does not count against the standard 2 toppings limit.'
  },
  {
    id: 'q_6',
    category: 'OPERATIONS',
    difficulty: 'easy',
    question_pt: 'O que significa FOH?',
    question_en: 'What does FOH stand for?',
    options: [
      { id: 'opt_1', text_pt: 'Front of House', text_en: 'Front of House' },
      { id: 'opt_2', text_pt: 'Full of House', text_en: 'Full of House' },
      { id: 'opt_3', text_pt: 'Fresh of House', text_en: 'Fresh of House' },
      { id: 'opt_4', text_pt: 'Fast of House', text_en: 'Fast of House' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'FOH significa Front of House (Frente de Loja), a área de atendimento direto ao cliente.',
    explanation_en: 'FOH stands for Front of House, the customer-facing area of the store.'
  },
  {
    id: 'q_7',
    category: 'OPERATIONS',
    difficulty: 'easy',
    question_pt: 'O que significa BOH?',
    question_en: 'What does BOH stand for?',
    options: [
      { id: 'opt_1', text_pt: 'Back of House', text_en: 'Back of House' },
      { id: 'opt_2', text_pt: 'Best of House', text_en: 'Best of House' },
      { id: 'opt_3', text_pt: 'Base of House', text_en: 'Base of House' },
      { id: 'opt_4', text_pt: 'Big of House', text_en: 'Big of House' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'BOH significa Back of House (Cozinha/Bastidores), onde é feita a preparação e armazenamento.',
    explanation_en: 'BOH stands for Back of House, the kitchen and preparation/storage area.'
  },
  {
    id: 'q_8',
    category: 'SAFETY',
    difficulty: 'medium',
    question_pt: 'Qual a validade máxima das Proteínas Juicy na linha?',
    question_en: 'What is the maximum shelf life of Juicy Proteins on the line?',
    options: [
      { id: 'opt_1', text_pt: '2 horas', text_en: '2 hours' },
      { id: 'opt_2', text_pt: '4 horas', text_en: '4 hours' },
      { id: 'opt_3', text_pt: '24 horas', text_en: '24 hours' },
      { id: 'opt_4', text_pt: '30 minutos', text_en: '30 minutes' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'Proteínas temperadas ou "Juicy" devem ser descartadas ou substituídas após 2 horas na linha.',
    explanation_en: 'Seasoned or "Juicy" proteins must be discarded or replaced after 2 hours on the serving line.'
  },
  {
    id: 'q_9',
    category: 'SAFETY',
    difficulty: 'hard',
    question_pt: 'O que significa HACCP?',
    question_en: 'What does HACCP stand for?',
    options: [
      { id: 'opt_1', text_pt: 'Análise de Perigos e Pontos Críticos de Controle', text_en: 'Hazard Analysis and Critical Control Points' },
      { id: 'opt_2', text_pt: 'Higiene Alimentar e Controlo de Cozinha', text_en: 'Food Hygiene and Kitchen Control' },
      { id: 'opt_3', text_pt: 'Manual de Segurança Alimentar', text_en: 'Food Safety Manual' },
      { id: 'opt_4', text_pt: 'Regras de Limpeza Profissional', text_en: 'Professional Cleaning Rules' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'HACCP é o sistema internacional de gestão de segurança alimentar preventivo.',
    explanation_en: 'HACCP is the international preventive food safety management system.'
  },
  {
    id: 'q_10',
    category: 'SAFETY',
    difficulty: 'medium',
    question_pt: 'Qual a temperatura regulamentar dos frigoríficos de conservação?',
    question_en: 'What is the required temperature for conservation refrigerators?',
    options: [
      { id: 'opt_1', text_pt: '0 a 4 graus', text_en: '0 to 4 degrees' },
      { id: 'opt_2', text_pt: '-18 graus', text_en: '-18 degrees' },
      { id: 'opt_3', text_pt: '10 graus', text_en: '10 degrees' },
      { id: 'opt_4', text_pt: '20 graus', text_en: '20 degrees' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'Os frigoríficos de conservação de alimentos frescos devem operar estritamente entre 0°C e 4°C.',
    explanation_en: 'Conservation refrigerators for fresh food must operate strictly between 0°C and 4°C.'
  },
  {
    id: 'q_11',
    category: 'SAFETY',
    difficulty: 'easy',
    question_pt: 'É permitido usar anéis ou pulseiras visíveis na linha de serviço?',
    question_en: 'Are visible rings or bracelets allowed on the serving line?',
    options: [
      { id: 'opt_1', text_pt: 'Não', text_en: 'No' },
      { id: 'opt_2', text_pt: 'Sim', text_en: 'Yes' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'Para evitar contaminação física e biológica, adornos pessoais como anéis e pulseiras são proibidos.',
    explanation_en: 'To prevent physical and biological contamination, personal adornments like rings or bracelets are forbidden.'
  },
  {
    id: 'q_12',
    category: 'SAFETY',
    difficulty: 'medium',
    question_pt: 'É permitido armazenar caixas de papelão originais do fornecedor no frigorífico?',
    question_en: 'Is it allowed to store original supplier cardboard boxes in the refrigerator?',
    options: [
      { id: 'opt_1', text_pt: 'Não', text_en: 'No' },
      { id: 'opt_2', text_pt: 'Sim', text_en: 'Yes' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'Não, caixas de papelão externas podem trazer pragas ou contaminação e devem ser descarregadas antes.',
    explanation_en: 'No, external cardboard boxes can carry pests or contamination and must be unpacked beforehand.'
  },
  {
    id: 'q_13',
    category: 'RECIPES',
    difficulty: 'medium',
    question_pt: 'Quanto vai de arroz de sushi na bowl regular?',
    question_en: 'How much sushi rice goes into a regular bowl?',
    options: [
      { id: 'opt_1', text_pt: '180g', text_en: '180g' },
      { id: 'opt_2', text_pt: '150g', text_en: '150g' },
      { id: 'opt_3', text_pt: '200g', text_en: '200g' },
      { id: 'opt_4', text_pt: '250g', text_en: '250g' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'O peso padrão para a porção de arroz de sushi na bowl Regular é de 180g.',
    explanation_en: 'The standard portion weight of sushi rice in a Regular bowl is 180g.'
  },
  {
    id: 'q_14',
    category: 'RECIPES',
    difficulty: 'medium',
    question_pt: 'Quanto vai de arroz de sushi na bowl large?',
    question_en: 'How much sushi rice goes into a large bowl?',
    options: [
      { id: 'opt_1', text_pt: '270g', text_en: '270g' },
      { id: 'opt_2', text_pt: '300g', text_en: '300g' },
      { id: 'opt_3', text_pt: '350g', text_en: '350g' },
      { id: 'opt_4', text_pt: '400g', text_en: '400g' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'O peso padrão para a porção de arroz de sushi na bowl Large é de 270g.',
    explanation_en: 'The standard portion weight of sushi rice in a Large bowl is 270g.'
  },
  {
    id: 'q_15',
    category: 'SAFETY',
    difficulty: 'medium',
    question_pt: 'O camarão panado (Crispy Shrimp) contém glúten?',
    question_en: 'Does breaded shrimp (Crispy Shrimp) contain gluten?',
    options: [
      { id: 'opt_1', text_pt: 'Sim', text_en: 'Yes' },
      { id: 'opt_2', text_pt: 'Não', text_en: 'No' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'Sim, o panado do camarão é feito com farinha de trigo, contendo glúten.',
    explanation_en: 'Yes, the shrimp breading is made with wheat flour, which contains gluten.'
  },
  {
    id: 'q_16',
    category: 'OPERATIONS',
    difficulty: 'easy',
    question_pt: 'O que significa "Waste" nos registos de fecho?',
    question_en: 'What does "Waste" mean in closing logs?',
    options: [
      { id: 'opt_1', text_pt: 'Desperdício/Lixo', text_en: 'Waste/Trash' },
      { id: 'opt_2', text_pt: 'Limpeza', text_en: 'Cleaning' },
      { id: 'opt_3', text_pt: 'Armazenamento', text_en: 'Storage' },
      { id: 'opt_4', text_pt: 'Produção', text_en: 'Production' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'Waste refere-se a todo o desperdício ou lixo de alimentos registado para controlo de custos.',
    explanation_en: 'Waste refers to all logged food waste or scrap tracked for food cost control.'
  },
  {
    id: 'q_17',
    category: 'HISTORY',
    difficulty: 'easy',
    question_pt: 'Em que ano foi fundada a Poke House?',
    question_en: 'In which year was Poke House founded?',
    options: [
      { id: 'opt_1', text_pt: '2018', text_en: '2018' },
      { id: 'opt_2', text_pt: '2015', text_en: '2015' },
      { id: 'opt_3', text_pt: '2016', text_en: '2016' },
      { id: 'opt_4', text_pt: '2020', text_en: '2020' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'A Poke House nasceu oficialmente no ano de 2018, em Milão.',
    explanation_en: 'Poke House officially launched in the year 2018, in Milan.'
  },
  {
    id: 'q_18',
    category: 'RECIPES',
    difficulty: 'easy',
    question_pt: 'Quantas colheres de proteína estão incluídas numa Bowl Regular?',
    question_en: 'How many scoops of protein are included in a Regular Bowl?',
    options: [
      { id: 'opt_1', text_pt: '2 colheres', text_en: '2 scoops' },
      { id: 'opt_2', text_pt: '1 colher', text_en: '1 scoop' },
      { id: 'opt_3', text_pt: '3 colheres', text_en: '3 scoops' },
      { id: 'opt_4', text_pt: '4 colheres', text_en: '4 scoops' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'A bowl Regular oficial inclui exatamente 2 colheres rasas de proteína.',
    explanation_en: 'The official Regular bowl includes exactly 2 level scoops of protein.'
  },
  {
    id: 'q_19',
    category: 'RECIPES',
    difficulty: 'easy',
    question_pt: 'Quantas colheres de proteína estão incluídas numa Bowl Large?',
    question_en: 'How many scoops of protein are included in a Large Bowl?',
    options: [
      { id: 'opt_1', text_pt: '3 colheres', text_en: '3 scoops' },
      { id: 'opt_2', text_pt: '2 colheres', text_en: '2 scoops' },
      { id: 'opt_3', text_pt: '4 colheres', text_en: '4 scoops' },
      { id: 'opt_4', text_pt: '5 colheres', text_en: '5 scoops' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'A bowl Large oficial inclui exatamente 3 colheres rasas de proteína.',
    explanation_en: 'The official Large bowl includes exactly 3 level scoops of protein.'
  },
  {
    id: 'q_20',
    category: 'RECIPES',
    difficulty: 'easy',
    question_pt: 'Quantos Toppings crocantes (Crispy) estão incluídos em qualquer tamanho de bowl de casa?',
    question_en: 'How many crunchy toppings (Crispy) are included in any standard size house bowl?',
    options: [
      { id: 'opt_1', text_pt: '2 toppings', text_en: '2 toppings' },
      { id: 'opt_2', text_pt: '1 topping', text_en: '1 topping' },
      { id: 'opt_3', text_pt: '3 toppings', text_en: '3 toppings' },
      { id: 'opt_4', text_pt: '4 toppings', text_en: '4 toppings' }
    ],
    correct_option_id: 'opt_1',
    explanation_pt: 'Todas as bowls de receita da casa incluem um limite máximo de 2 toppings crocantes.',
    explanation_en: 'All house recipe bowls include a maximum limit of 2 crunchy toppings.'
  }
];
