-- Migration v8: Pensa Rápido (Quick Think) Authoritative Multiplayer Quiz Engine
-- Creates the arena_quick_think_questions, arena_quick_think_round_questions, and arena_quick_think_answers tables, adds RLS, triggers, and RPC validation.

-- 1. Create arena_quick_think_questions table (Canonical server side question catalogue)
CREATE TABLE IF NOT EXISTS arena_quick_think_questions (
    id TEXT PRIMARY KEY,
    category TEXT,
    difficulty TEXT,
    question_pt TEXT NOT NULL,
    question_en TEXT NOT NULL,
    options JSONB NOT NULL, -- Format: [{"id": "opt_1", "text_pt": "...", "text_en": "..."}, ...]
    correct_option_id TEXT NOT NULL,
    explanation_pt TEXT,
    explanation_en TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on questions table
ALTER TABLE arena_quick_think_questions ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone can select active questions
CREATE POLICY "Allow select questions" ON arena_quick_think_questions
  FOR SELECT USING (is_active = true);


-- 2. Populate questions with 20 high-quality bilingual questions
INSERT INTO arena_quick_think_questions (id, category, difficulty, question_pt, question_en, options, correct_option_id, explanation_pt, explanation_en) VALUES
(
  'q_1', 'RECIPES', 'medium',
  'Qual é a proteína principal da Cozy Chicken?',
  'What is the main protein of Cozy Chicken?',
  '[
    {"id": "opt_1", "text_pt": "Frango Vietnamita", "text_en": "Vietnamese Chicken"},
    {"id": "opt_2", "text_pt": "Frango Teriyaki", "text_en": "Teriyaki Chicken"},
    {"id": "opt_3", "text_pt": "Frango Grelhado", "text_en": "Grilled Chicken"},
    {"id": "opt_4", "text_pt": "Tofu", "text_en": "Tofu"}
  ]'::jsonb,
  'opt_1',
  'O Cozy Chicken é preparado tradicionalmente com Frango Vietnamita aromatizado.',
  'Cozy Chicken is traditionally prepared with flavorful Vietnamese Chicken.'
),
(
  'q_2', 'RECIPES', 'easy',
  'O "Egg & Spinach" contém quantos ovos?',
  'How many eggs does "Egg & Spinach" contain?',
  '[
    {"id": "opt_1", "text_pt": "2", "text_en": "2"},
    {"id": "opt_2", "text_pt": "1", "text_en": "1"},
    {"id": "opt_3", "text_pt": "3", "text_en": "3"},
    {"id": "opt_4", "text_pt": "4", "text_en": "4"}
  ]'::jsonb,
  'opt_1',
  'A receita oficial de Egg & Spinach leva exatamente 2 ovos cozidos.',
  'The official recipe for Egg & Spinach includes exactly 2 boiled eggs.'
),
(
  'q_3', 'HISTORY', 'easy',
  'Onde foi fundada a Poke House?',
  'Where was Poke House founded?',
  '[
    {"id": "opt_1", "text_pt": "Milão", "text_en": "Milan"},
    {"id": "opt_2", "text_pt": "Los Angeles", "text_en": "Los Angeles"},
    {"id": "opt_3", "text_pt": "Lisboa", "text_en": "Lisbon"},
    {"id": "opt_4", "text_pt": "Londres", "text_en": "London"}
  ]'::jsonb,
  'opt_1',
  'A Poke House foi fundada em Milão, Itália, em 2018.',
  'Poke House was founded in Milan, Italy, in 2018.'
),
(
  'q_4', 'HISTORY', 'easy',
  'O que significa "Poke" em havaiano?',
  'What does "Poke" mean in Hawaiian?',
  '[
    {"id": "opt_1", "text_pt": "Cortado em cubos", "text_en": "Cut in cubes"},
    {"id": "opt_2", "text_pt": "Peixe fresco", "text_en": "Fresh fish"},
    {"id": "opt_3", "text_pt": "Arroz cozido", "text_en": "Cooked rice"},
    {"id": "opt_4", "text_pt": "Prato de peixe", "text_en": "Fish dish"}
  ]'::jsonb,
  'opt_1',
  'Poke significa literalmente cortar ou fatiar transversalmente em pedaços em Havaiano.',
  'Poke literally means to slice or cut crosswise into pieces in Hawaiian.'
),
(
  'q_5', 'RECIPES', 'medium',
  'O Sésamo conta como um dos 2 Toppings incluídos?',
  'Does Sesame count as one of the 2 included Toppings?',
  '[
    {"id": "opt_1", "text_pt": "Não", "text_en": "No"},
    {"id": "opt_2", "text_pt": "Sim", "text_en": "Yes"}
  ]'::jsonb,
  'opt_1',
  'O Sésamo é um topping gratuito de cortesia e não conta para o limite de 2 toppings padrão.',
  'Sesame is a complimentary free topping and does not count against the standard 2 toppings limit.'
),
(
  'q_6', 'OPERATIONS', 'easy',
  'O que significa FOH?',
  'What does FOH stand for?',
  '[
    {"id": "opt_1", "text_pt": "Front of House", "text_en": "Front of House"},
    {"id": "opt_2", "text_pt": "Full of House", "text_en": "Full of House"},
    {"id": "opt_3", "text_pt": "Fresh of House", "text_en": "Fresh of House"},
    {"id": "opt_4", "text_pt": "Fast of House", "text_en": "Fast of House"}
  ]'::jsonb,
  'opt_1',
  'FOH significa Front of House (Frente de Loja), a área de atendimento direto ao cliente.',
  'FOH stands for Front of House, the customer-facing area of the store.'
),
(
  'q_7', 'OPERATIONS', 'easy',
  'O que significa BOH?',
  'What does BOH stand for?',
  '[
    {"id": "opt_1", "text_pt": "Back of House", "text_en": "Back of House"},
    {"id": "opt_2", "text_pt": "Best of House", "text_en": "Best of House"},
    {"id": "opt_3", "text_pt": "Base of House", "text_en": "Base of House"},
    {"id": "opt_4", "text_pt": "Big of House", "text_en": "Big of House"}
  ]'::jsonb,
  'opt_1',
  'BOH significa Back of House (Cozinha/Bastidores), onde é feita a preparação e armazenamento.',
  'BOH stands for Back of House, the kitchen and preparation/storage area.'
),
(
  'q_8', 'SAFETY', 'medium',
  'Qual a validade máxima das Proteínas Juicy na linha?',
  'What is the maximum shelf life of Juicy Proteins on the line?',
  '[
    {"id": "opt_1", "text_pt": "2 horas", "text_en": "2 hours"},
    {"id": "opt_2", "text_pt": "4 horas", "text_en": "4 hours"},
    {"id": "opt_3", "text_pt": "24 horas", "text_en": "24 hours"},
    {"id": "opt_4", "text_pt": "30 minutos", "text_en": "30 minutes"}
  ]'::jsonb,
  'opt_1',
  'Proteínas temperadas ou "Juicy" devem ser descartadas ou substituídas após 2 horas na linha.',
  'Seasoned or "Juicy" proteins must be discarded or replaced after 2 hours on the serving line.'
),
(
  'q_9', 'SAFETY', 'hard',
  'O que significa HACCP?',
  'What does HACCP stand for?',
  '[
    {"id": "opt_1", "text_pt": "Análise de Perigos e Pontos Críticos de Controle", "text_en": "Hazard Analysis and Critical Control Points"},
    {"id": "opt_2", "text_pt": "Higiene Alimentar e Controlo de Cozinha", "text_en": "Food Hygiene and Kitchen Control"},
    {"id": "opt_3", "text_pt": "Manual de Segurança Alimentar", "text_en": "Food Safety Manual"},
    {"id": "opt_4", "text_pt": "Regras de Limpeza Profissional", "text_en": "Professional Cleaning Rules"}
  ]'::jsonb,
  'opt_1',
  'HACCP é o sistema internacional de gestão de segurança alimentar preventivo.',
  'HACCP is the international preventive food safety management system.'
),
(
  'q_10', 'SAFETY', 'medium',
  'Qual a temperatura regulamentar dos frigoríficos de conservação?',
  'What is the required temperature for conservation refrigerators?',
  '[
    {"id": "opt_1", "text_pt": "0 a 4 graus", "text_en": "0 to 4 degrees"},
    {"id": "opt_2", "text_pt": "-18 graus", "text_en": "-18 degrees"},
    {"id": "opt_3", "text_pt": "10 graus", "text_en": "10 degrees"},
    {"id": "opt_4", "text_pt": "20 graus", "text_en": "20 degrees"}
  ]'::jsonb,
  'opt_1',
  'Os frigoríficos de conservação de alimentos frescos devem operar estritamente entre 0°C e 4°C.',
  'Conservation refrigerators for fresh food must operate strictly between 0°C and 4°C.'
),
(
  'q_11', 'SAFETY', 'easy',
  'É permitido usar anéis ou pulseiras visíveis na linha de serviço?',
  'Are visible rings or bracelets allowed on the serving line?',
  '[
    {"id": "opt_1", "text_pt": "Não", "text_en": "No"},
    {"id": "opt_2", "text_pt": "Sim", "text_en": "Yes"}
  ]'::jsonb,
  'opt_1',
  'Para evitar contaminação física e biológica, adornos pessoais como anéis e pulseiras são proibidos.',
  'To prevent physical and biological contamination, personal adornments like rings or bracelets are forbidden.'
),
(
  'q_12', 'SAFETY', 'medium',
  'É permitido armazenar caixas de papelão originais do fornecedor no frigorífico?',
  'Is it allowed to store original supplier cardboard boxes in the refrigerator?',
  '[
    {"id": "opt_1", "text_pt": "Não", "text_en": "No"},
    {"id": "opt_2", "text_pt": "Sim", "text_en": "Yes"}
  ]'::jsonb,
  'opt_1',
  'Não, caixas de papelão externas podem trazer pragas ou contaminação e devem ser descarregadas antes.',
  'No, external cardboard boxes can carry pests or contamination and must be unpacked beforehand.'
),
(
  'q_13', 'RECIPES', 'medium',
  'Quanto vai de arroz de sushi na bowl regular?',
  'How much sushi rice goes into a regular bowl?',
  '[
    {"id": "opt_1", "text_pt": "180g", "text_en": "180g"},
    {"id": "opt_2", "text_pt": "150g", "text_en": "150g"},
    {"id": "opt_3", "text_pt": "200g", "text_en": "200g"},
    {"id": "opt_4", "text_pt": "250g", "text_en": "250g"}
  ]'::jsonb,
  'opt_1',
  'O peso padrão para a porção de arroz de sushi na bowl Regular é de 180g.',
  'The standard portion weight of sushi rice in a Regular bowl is 180g.'
),
(
  'q_14', 'RECIPES', 'medium',
  'Quanto vai de arroz de sushi na bowl large?',
  'How much sushi rice goes into a large bowl?',
  '[
    {"id": "opt_1", "text_pt": "270g", "text_en": "270g"},
    {"id": "opt_2", "text_pt": "300g", "text_en": "300g"},
    {"id": "opt_3", "text_pt": "350g", "text_en": "350g"},
    {"id": "opt_4", "text_pt": "400g", "text_en": "400g"}
  ]'::jsonb,
  'opt_1',
  'O peso padrão para a porção de arroz de sushi na bowl Large é de 270g.',
  'The standard portion weight of sushi rice in a Large bowl is 270g.'
),
(
  'q_15', 'SAFETY', 'medium',
  'O camarão panado (Crispy Shrimp) contém glúten?',
  'Does breaded shrimp (Crispy Shrimp) contain gluten?',
  '[
    {"id": "opt_1", "text_pt": "Sim", "text_en": "Yes"},
    {"id": "opt_2", "text_pt": "Não", "text_en": "No"}
  ]'::jsonb,
  'opt_1',
  'Sim, o panado do camarão é feito com farinha de trigo, contendo glúten.',
  'Yes, the shrimp breading is made with wheat flour, which contains gluten.'
),
(
  'q_16', 'OPERATIONS', 'easy',
  'O que significa "Waste" nos registos de fecho?',
  'What does "Waste" mean in closing logs?',
  '[
    {"id": "opt_1", "text_pt": "Desperdício/Lixo", "text_en": "Waste/Trash"},
    {"id": "opt_2", "text_pt": "Limpeza", "text_en": "Cleaning"},
    {"id": "opt_3", "text_pt": "Armazenamento", "text_en": "Storage"},
    {"id": "opt_4", "text_pt": "Produção", "text_en": "Production"}
  ]'::jsonb,
  'opt_1',
  'Waste refere-se a todo o desperdício ou lixo de alimentos registado para controlo de custos.',
  'Waste refers to all logged food waste or scrap tracked for food cost control.'
),
(
  'q_17', 'HISTORY', 'easy',
  'Em que ano foi fundada a Poke House?',
  'In which year was Poke House founded?',
  '[
    {"id": "opt_1", "text_pt": "2018", "text_en": "2018"},
    {"id": "opt_2", "text_pt": "2015", "text_en": "2015"},
    {"id": "opt_3", "text_pt": "2016", "text_en": "2016"},
    {"id": "opt_4", "text_pt": "2020", "text_en": "2020"}
  ]'::jsonb,
  'opt_1',
  'A Poke House nasceu oficialmente no ano de 2018, em Milão.',
  'Poke House officially launched in the year 2018, in Milan.'
),
(
  'q_18', 'RECIPES', 'easy',
  'Quantas colheres de proteína estão incluídas numa Bowl Regular?',
  'How many scoops of protein are included in a Regular Bowl?',
  '[
    {"id": "opt_1", "text_pt": "2 colheres", "text_en": "2 scoops"},
    {"id": "opt_2", "text_pt": "1 colher", "text_en": "1 scoop"},
    {"id": "opt_3", "text_pt": "3 colheres", "text_en": "3 scoops"},
    {"id": "opt_4", "text_pt": "4 colheres", "text_en": "4 scoops"}
  ]'::jsonb,
  'opt_1',
  'A bowl Regular oficial inclui exatamente 2 colheres rasas de proteína.',
  'The official Regular bowl includes exactly 2 level scoops of protein.'
),
(
  'q_19', 'RECIPES', 'easy',
  'Quantas colheres de proteína estão incluídas numa Bowl Large?',
  'How many scoops of protein are included in a Large Bowl?',
  '[
    {"id": "opt_1", "text_pt": "3 colheres", "text_en": "3 scoops"},
    {"id": "opt_2", "text_pt": "2 colheres", "text_en": "2 scoops"},
    {"id": "opt_3", "text_pt": "4 colheres", "text_en": "4 scoops"},
    {"id": "opt_4", "text_pt": "5 colheres", "text_en": "5 scoops"}
  ]'::jsonb,
  'opt_1',
  'A bowl Large oficial inclui exatamente 3 colheres rasas de proteína.',
  'The official Large bowl includes exactly 3 level scoops of protein.'
),
(
  'q_20', 'RECIPES', 'easy',
  'Quantos Toppings crocantes (Crispy) estão incluídos em qualquer tamanho de bowl de casa?',
  'How many crunchy toppings (Crispy) are included in any standard size house bowl?',
  '[
    {"id": "opt_1", "text_pt": "2 toppings", "text_en": "2 toppings"},
    {"id": "opt_2", "text_pt": "1 topping", "text_en": "1 topping"},
    {"id": "opt_3", "text_pt": "3 toppings", "text_en": "3 toppings"},
    {"id": "opt_4", "text_pt": "4 toppings", "text_en": "4 toppings"}
  ]'::jsonb,
  'opt_1',
  'Todas as bowls de receita da casa incluem um limite máximo de 2 toppings crocantes.',
  'All house recipe bowls include a maximum limit of 2 crunchy toppings.'
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  question_pt = EXCLUDED.question_pt,
  question_en = EXCLUDED.question_en,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation_pt = EXCLUDED.explanation_pt,
  explanation_en = EXCLUDED.explanation_en;


-- 3. Create arena_quick_think_round_questions table
CREATE TABLE IF NOT EXISTS arena_quick_think_round_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES arena_rooms(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES arena_rounds(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES arena_quick_think_questions(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_arena_qt_round_order UNIQUE (round_id, question_order),
    CONSTRAINT uq_arena_qt_round_question UNIQUE (round_id, question_id),
    CONSTRAINT chk_arena_qt_round_question_status CHECK (status IN ('scheduled', 'active', 'completed', 'skipped')),
    CONSTRAINT chk_arena_qt_round_question_timing CHECK (starts_at < ends_at)
);

-- Enable RLS on round questions
ALTER TABLE arena_quick_think_round_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select round questions" ON arena_quick_think_round_questions
  FOR SELECT USING (true);


-- 4. Create arena_quick_think_answers table
CREATE TABLE IF NOT EXISTS arena_quick_think_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES arena_rooms(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES arena_rounds(id) ON DELETE CASCADE,
    round_question_id UUID NOT NULL REFERENCES arena_quick_think_round_questions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES arena_participants(id) ON DELETE CASCADE,
    selected_option_id TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    score_awarded INTEGER NOT NULL DEFAULT 0,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_arena_qt_answers_p_q UNIQUE (round_question_id, participant_id),
    CONSTRAINT chk_arena_qt_answers_score CHECK (score_awarded >= 0)
);

-- Enable RLS on answers
ALTER TABLE arena_quick_think_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select own answers" ON arena_quick_think_answers
  FOR SELECT USING (true);


-- 5. Trigger to automatically generate the 15-question sequence when a quick_think round is created
CREATE OR REPLACE FUNCTION generate_quick_think_round_questions()
RETURNS TRIGGER AS $$
DECLARE
  v_question_id TEXT;
  v_order INTEGER := 1;
  v_starts TIMESTAMPTZ;
  v_ends TIMESTAMPTZ;
BEGIN
  IF NEW.game_type = 'quick_think' AND NEW.status = 'active' THEN
    v_starts := NEW.starts_at;
    FOR v_question_id IN (
      SELECT id 
      FROM arena_quick_think_questions 
      WHERE is_active = true 
      ORDER BY random() 
      LIMIT 15
    ) LOOP
      v_ends := v_starts + INTERVAL '20 seconds';
      
      INSERT INTO arena_quick_think_round_questions (
        room_id, round_id, question_id, question_order, starts_at, ends_at, status
      ) VALUES (
        NEW.room_id, NEW.id, v_question_id, v_order, v_starts, v_ends, 'scheduled'
      );
      
      v_starts := v_ends;
      v_order := v_order + 1;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_generate_quick_think_questions
AFTER INSERT ON arena_rounds
FOR EACH ROW
EXECUTE FUNCTION generate_quick_think_round_questions();


-- 6. Create RPC function to retrieve the currently active question securely for a player
CREATE OR REPLACE FUNCTION get_active_quick_think_question(
  p_room_code TEXT,
  p_reconnect_token TEXT
)
RETURNS TABLE (
  round_question_id UUID,
  question_id TEXT,
  question_order INTEGER,
  question_pt TEXT,
  question_en TEXT,
  options JSONB,
  remaining_question_seconds INTEGER,
  remaining_round_seconds INTEGER,
  round_score INTEGER,
  total_score INTEGER,
  is_answered BOOLEAN,
  answered_option_id TEXT,
  correct_option_id TEXT, -- Note: This is returned only AFTER the question timer ends, or after the user answered!
  explanation_pt TEXT,   -- Only visible after submission or time is up
  explanation_en TEXT    -- Only visible after submission or time is up
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_room_status TEXT;
  v_participant_id UUID;
  v_round_id UUID;
  v_ends_at TIMESTAMPTZ;
  v_game_type TEXT;
  
  -- Active question fields
  v_rq_id UUID;
  v_q_id TEXT;
  v_q_order INTEGER;
  v_q_starts TIMESTAMPTZ;
  v_q_ends TIMESTAMPTZ;
  v_q_pt TEXT;
  v_q_en TEXT;
  v_q_options JSONB;
  v_correct_opt_id TEXT;
  v_exp_pt TEXT;
  v_exp_en TEXT;
  
  -- Player state
  v_round_score INTEGER;
  v_total_score INTEGER;
  v_ans_opt_id TEXT := NULL;
  v_is_ans BOOLEAN := false;
BEGIN
  -- A. Validate reconnection credentials
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id, r.status, p.total_score INTO v_participant_id, v_room_id, v_room_status, v_total_score
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code)) 
    AND r.status != 'closed';

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- B. Validate active round state
  SELECT id, game_type, ends_at INTO v_round_id, v_game_type, v_ends_at
  FROM arena_rounds
  WHERE room_id = v_room_id AND status = 'active';

  IF v_round_id IS NULL THEN
    RAISE EXCEPTION 'No active round found for this room.';
  END IF;

  IF v_game_type != 'quick_think' THEN
    RAISE EXCEPTION 'The current active round is not quick_think.';
  END IF;

  -- C. Fetch the current active question according to server time
  SELECT rq.id, rq.question_id, rq.question_order, rq.starts_at, rq.ends_at, q.question_pt, q.question_en, q.options, q.correct_option_id, q.explanation_pt, q.explanation_en
  INTO v_rq_id, v_q_id, v_q_order, v_q_starts, v_q_ends, v_q_pt, v_q_en, v_q_options, v_correct_opt_id, v_exp_pt, v_exp_en
  FROM arena_quick_think_round_questions rq
  JOIN arena_quick_think_questions q ON rq.question_id = q.id
  WHERE rq.round_id = v_round_id 
    AND NOW() >= rq.starts_at 
    AND NOW() < rq.ends_at
  LIMIT 1;

  -- D. If we found an active question, check if player has already submitted an answer
  IF v_rq_id IS NOT NULL THEN
    SELECT selected_option_id INTO v_ans_opt_id
    FROM arena_quick_think_answers
    WHERE round_question_id = v_rq_id 
      AND participant_id = v_participant_id;
      
    IF v_ans_opt_id IS NOT NULL THEN
      v_is_ans := true;
    END IF;
  END IF;

  -- E. Gather current round score
  SELECT COALESCE(round_score, 0) INTO v_round_score
  FROM arena_round_participants
  WHERE round_id = v_round_id AND participant_id = v_participant_id;

  -- F. Return the query results. 
  -- Secure validation rules: DO NOT expose the correct answer or explanations to the client before they have answered or before the question time is up!
  IF v_rq_id IS NOT NULL THEN
    RETURN QUERY SELECT
      v_rq_id as round_question_id,
      v_q_id as question_id,
      v_q_order as question_order,
      v_q_pt as question_pt,
      v_q_en as question_en,
      v_q_options as options,
      GREATEST(0, EXTRACT(EPOCH FROM (v_q_ends - NOW()))::integer) as remaining_question_seconds,
      GREATEST(0, EXTRACT(EPOCH FROM (v_ends_at - NOW()))::integer) as remaining_round_seconds,
      v_round_score as round_score,
      v_total_score as total_score,
      v_is_ans as is_answered,
      v_ans_opt_id as answered_option_id,
      -- Securely hide correct_option_id and explanations if the user has not submitted AND the question is still active
      (CASE WHEN v_is_ans OR NOW() >= v_q_ends THEN v_correct_opt_id ELSE NULL END) as correct_option_id,
      (CASE WHEN v_is_ans OR NOW() >= v_q_ends THEN v_exp_pt ELSE NULL END) as explanation_pt,
      (CASE WHEN v_is_ans OR NOW() >= v_q_ends THEN v_exp_en ELSE NULL END) as explanation_en;
  ELSE
    -- If no active question is running (between slots or before/after), return a clean empty row representing the interval
    RETURN QUERY SELECT
      NULL::uuid as round_question_id,
      NULL::text as question_id,
      NULL::integer as question_order,
      NULL::text as question_pt,
      NULL::text as question_en,
      NULL::jsonb as options,
      0::integer as remaining_question_seconds,
      GREATEST(0, EXTRACT(EPOCH FROM (v_ends_at - NOW()))::integer) as remaining_round_seconds,
      v_round_score as round_score,
      v_total_score as total_score,
      false as is_answered,
      NULL::text as answered_option_id,
      NULL::text as correct_option_id,
      NULL::text as explanation_pt,
      NULL::text as explanation_en;
  END IF;

END;
$$;


-- 7. Create RPC function to securely submit and validate answers
CREATE OR REPLACE FUNCTION submit_quick_think_answer(
  p_room_code TEXT,
  p_reconnect_token TEXT,
  p_round_question_id UUID,
  p_selected_option_id TEXT,
  p_request_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_accepted BOOLEAN,
  is_correct BOOLEAN,
  score_awarded INTEGER,
  updated_round_score INTEGER,
  updated_total_score INTEGER,
  correct_option_id TEXT,
  explanation_pt TEXT,
  explanation_en TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_room_status TEXT;
  v_participant_id UUID;
  v_round_id UUID;
  v_ends_at TIMESTAMPTZ;
  v_game_type TEXT;
  
  -- Question tracking
  v_q_id TEXT;
  v_q_starts TIMESTAMPTZ;
  v_q_ends TIMESTAMPTZ;
  v_correct_opt_id TEXT;
  v_exp_pt TEXT;
  v_exp_en TEXT;
  
  -- Answer state
  v_is_correct BOOLEAN := false;
  v_score_awarded INTEGER := 0;
  v_existing_id UUID;
  
  v_updated_round_score INTEGER;
  v_updated_total_score INTEGER;
BEGIN
  -- A. Validate reconnection credentials
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id, r.status, p.total_score INTO v_participant_id, v_room_id, v_room_status, v_updated_total_score
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code)) 
    AND r.status != 'closed';

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- B. Fetch active round details
  SELECT id, game_type, ends_at INTO v_round_id, v_game_type, v_ends_at
  FROM arena_rounds
  WHERE room_id = v_room_id AND status = 'active';

  IF v_round_id IS NULL THEN
    RAISE EXCEPTION 'No active round found for this room.';
  END IF;

  IF v_game_type != 'quick_think' THEN
    RAISE EXCEPTION 'The current active round is not quick_think.';
  END IF;

  -- C. Validate question and ensure it is currently active
  SELECT rq.question_id, rq.starts_at, rq.ends_at, q.correct_option_id, q.explanation_pt, q.explanation_en
  INTO v_q_id, v_q_starts, v_q_ends, v_correct_opt_id, v_exp_pt, v_exp_en
  FROM arena_quick_think_round_questions rq
  JOIN arena_quick_think_questions q ON rq.question_id = q.id
  WHERE rq.id = p_round_question_id 
    AND rq.round_id = v_round_id;

  IF v_q_id IS NULL THEN
    RAISE EXCEPTION 'Question not found in the current active round.';
  END IF;

  -- Check if time is up for this question
  IF NOW() < v_q_starts OR NOW() >= v_q_ends THEN
    RETURN QUERY SELECT
      false as is_accepted,
      false as is_correct,
      0 as score_awarded,
      0 as updated_round_score,
      v_updated_total_score as updated_total_score,
      v_correct_opt_id as correct_option_id,
      v_exp_pt as explanation_pt,
      v_exp_en as explanation_en;
    RETURN;
  END IF;

  -- D. Prevent duplicate submission for this question
  SELECT id INTO v_existing_id
  FROM arena_quick_think_answers
  WHERE round_question_id = p_round_question_id 
    AND participant_id = v_participant_id;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Duplicate submission: You have already answered this question.';
  END IF;

  -- E. Determine correctness and calculate score
  IF p_selected_option_id = v_correct_opt_id THEN
    v_is_correct := true;
    v_score_awarded := 1;
  END IF;

  -- F. Insert answer record
  INSERT INTO arena_quick_think_answers (
    room_id, round_id, round_question_id, participant_id, selected_option_id, is_correct, score_awarded, request_id
  ) VALUES (
    v_room_id, v_round_id, p_round_question_id, v_participant_id, p_selected_option_id, v_is_correct, v_score_awarded, p_request_id
  );

  -- G. Update participant score counters
  UPDATE arena_round_participants
  SET round_score = round_score + v_score_awarded,
      updated_at = NOW()
  WHERE round_id = v_round_id AND participant_id = v_participant_id;

  UPDATE arena_participants
  SET total_score = total_score + v_score_awarded,
      last_seen_at = NOW()
  WHERE id = v_participant_id;

  -- Fetch fresh scores
  SELECT round_score INTO v_updated_round_score
  FROM arena_round_participants
  WHERE round_id = v_round_id AND participant_id = v_participant_id;

  SELECT total_score INTO v_updated_total_score
  FROM arena_participants
  WHERE id = v_participant_id;

  RETURN QUERY SELECT
    true as is_accepted,
    v_is_correct as is_correct,
    v_score_awarded as score_awarded,
    v_updated_round_score as updated_round_score,
    v_updated_total_score as updated_total_score,
    v_correct_opt_id as correct_option_id,
    v_exp_pt as explanation_pt,
    v_exp_en as explanation_en;

END;
$$;
