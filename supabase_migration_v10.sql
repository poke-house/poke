-- ============================================================================
-- FIX: search_path para pgcrypto (create_arena_room error)
-- Poke House Training — aplicar no Supabase SQL Editor
--
-- CAUSA: no Supabase, o pgcrypto está pré-instalado no schema 'extensions',
-- não em 'public'. As funções foram definidas com SET search_path = public,
-- por isso não encontram gen_random_bytes() nem digest() -> erro ao criar sala.
--
-- CORREÇÃO: acrescentar 'extensions' (e 'pg_temp', obrigatório em SECURITY
-- DEFINER por segurança) ao search_path de TODAS as funções. Não toca em
-- tabelas, dados, políticas nem no cron — só reconfigura o path das funções.
--
-- SEGURO E IDEMPOTENTE: pode ser re-executado. NÃO altera nenhum dado.
--
-- Testado num PostgreSQL 16 que replica o ambiente Supabase (pgcrypto em
-- 'extensions'): create/join/reconnect + smoke test de 19 verificações do
-- torneio completo, todos a passar.
--
-- IMPORTANTE: ignora o supabase_migration_v10.sql que o assistente de código
-- gerou (usava search_path = public, extensions, SEM pg_temp, e editava os
-- ficheiros v4-v9). Este ficheiro substitui essa abordagem.
-- ============================================================================

ALTER FUNCTION public.submit_rush_score(p_player_name text, p_store_name text, p_score integer, p_submission_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.check_room_not_closed() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.prevent_modify_events() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.start_arena_tournament_if_eligible(p_room_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.join_arena_room(p_room_code text, p_display_name text, p_store_name text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.reconnect_arena_participant(p_room_code text, p_reconnect_token text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_or_create_active_challenge(p_room_code text, p_reconnect_token text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.arena_heartbeat(p_room_code text, p_reconnect_token text, p_status text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.process_arena_lobby_expirations() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.process_arena_inactive_rooms() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.complete_arena_round(p_round_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.complete_arena_tournament(p_room_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_arena_room_leaderboard(p_room_code text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.sort_jsonb_array(p_array jsonb) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.process_room_housekeeping(p_room_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.submit_slop_clock_bowl_completion(p_room_code text, p_reconnect_token text, p_challenge_id uuid, p_selected_items jsonb) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_arena_room_public_state(p_room_code text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_arena_tournament_leaderboard(p_room_code text, p_reconnect_token text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.generate_quick_think_round_questions() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_memory_match_round_state(p_room_code text, p_reconnect_token text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_arena_round_leaderboard(p_room_code text, p_reconnect_token text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_arena_tournament_results(p_room_code text, p_reconnect_token text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.submit_quick_think_answer(p_room_code text, p_reconnect_token text, p_round_question_id uuid, p_selected_option_id text, p_request_id text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_arena_participant_rank_summary(p_room_code text, p_reconnect_token text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.start_arena_round(p_room_id uuid, p_round_number integer, p_game_type text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.submit_memory_match_pair(p_room_code text, p_reconnect_token text, p_first_card_id uuid, p_second_card_id uuid, p_request_id text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.reveal_memory_match_card(p_room_code text, p_reconnect_token text, p_card_id uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.create_arena_room(p_display_name text, p_store_name text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.leave_arena_room(p_room_code text, p_reconnect_token text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_arena_round_results(p_room_code text, p_reconnect_token text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_active_quick_think_question(p_room_code text, p_reconnect_token text) SET search_path = public, extensions, pg_temp;

-- Verificação (opcional): confirmar que criar sala funciona
-- SELECT room_code FROM create_arena_room('Teste', 'Miraflores');
