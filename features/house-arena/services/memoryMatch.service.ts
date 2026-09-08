import { getSupabaseClient } from '../../../services/supabase/client';
import { MemoryMatchRoundState, MemoryMatchSubmissionResult, MemoryMatchCard } from '../games/memory-match/memoryMatch.types';
import { MOCK_MEMORY_MATCH_PAIRS, MockMemoryMatchPair } from '../games/memory-match/memoryMatch.constants';

const MOCK_MM_START_KEY = 'poke_house_mock_mm_start_time';
const MOCK_MM_CARDS_KEY = 'poke_house_mock_mm_cards';
const MOCK_MM_SCORE_ROUND_KEY = 'poke_house_mock_mm_score_round';
const MOCK_MM_SCORE_TOTAL_KEY = 'poke_house_mock_mm_score_total';

interface LocalMockCard {
  id: string;
  position: number;
  cardSide: 'left' | 'right';
  pairId: string;
  status: 'hidden' | 'revealed' | 'matched';
}

function isDuplicateBoardError(error: unknown): boolean {
  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };

  return (
    candidate?.code === '23505' ||
    candidate?.message?.includes('uq_arena_mm_board') === true ||
    candidate?.details?.includes('uq_arena_mm_board') === true
  );
}

export class MemoryMatchService {
  private readonly roundStateRequests = new Map<string, Promise<MemoryMatchRoundState | null>>();

  private getSupabase() {
    const res = getSupabaseClient();
    return res.status === 'available' ? res.client : null;
  }

  private sanitizeSupabaseError(error: unknown): Record<string, unknown> {
    if (!error || typeof error !== 'object') {
      return { message: String(error) };
    }
    const err = error as Record<string, unknown>;
    return {
      code: err.code,
      message: err.message,
      details: err.details,
      hint: err.hint
    };
  }

  /**
   * Fetches or generates the authoritative round state and card board.
   * Uses single-flight deduplication to coalesce concurrent requests.
   */
  getMemoryMatchRoundState(
    roomCode: string,
    reconnectToken: string
  ): Promise<MemoryMatchRoundState | null> {
    const normalizedRoomCode = roomCode.trim().toUpperCase();
    const key = `${normalizedRoomCode}:${reconnectToken}`;

    const existing = this.roundStateRequests.get(key);
    if (existing) {
      return existing;
    }

    const request = this.loadMemoryMatchRoundStateWithFallback(
      normalizedRoomCode,
      reconnectToken
    ).finally(() => {
      if (this.roundStateRequests.get(key) === request) {
        this.roundStateRequests.delete(key);
      }
    });

    this.roundStateRequests.set(key, request);
    return request;
  }

  /**
   * Loads round state with a single fallback retry for legacy deployments (23505).
   */
  private async loadMemoryMatchRoundStateWithFallback(
    roomCode: string,
    reconnectToken: string
  ): Promise<MemoryMatchRoundState | null> {
    try {
      return await this.loadMemoryMatchRoundState(roomCode, reconnectToken);
    } catch (err: unknown) {
      // Temporary compatibility fallback for legacy deployments before migration v12 is applied:
      // If 23505 race condition occurs, wait briefly for concurrent creation to complete and retry exactly once.
      if (isDuplicateBoardError(err)) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        try {
          return await this.loadMemoryMatchRoundState(roomCode, reconnectToken);
        } catch (retryErr: unknown) {
          console.error(
            '[MemoryMatchService] Failed to retrieve round state after retry:',
            this.sanitizeSupabaseError(retryErr)
          );
          return null;
        }
      }

      console.error(
        '[MemoryMatchService] Failed to retrieve round state:',
        this.sanitizeSupabaseError(err)
      );
      return null;
    }
  }

  /**
   * Internal worker making the Supabase RPC call.
   */
  private async loadMemoryMatchRoundState(
    roomCode: string,
    reconnectToken: string
  ): Promise<MemoryMatchRoundState | null> {
    const supabase = this.getSupabase();
    if (!supabase) {
      if (import.meta.env.DEV) {
        console.log('[MemoryMatchService] Supabase unconfigured. Invoking local mock engine.');
        return this.getRoundStateMock();
      }
      return null;
    }

    const { data, error } = await supabase.rpc('get_memory_match_round_state', {
      p_room_code: roomCode,
      p_reconnect_token: reconnectToken
    });

    if (error) {
      const msg = error.message || '';
      if (
        msg.includes('closed') ||
        msg.includes('No active round') ||
        msg.includes('not memory_match') ||
        msg.includes('Unauthorized') ||
        error.code === 'P0001'
      ) {
        console.info('[MemoryMatchService] Round not active or room closed:', msg);
        return null;
      }
      // Throw once so it is cleanly caught and logged by the caller
      throw error;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const cards: MemoryMatchCard[] = data.map((row: any) => ({
      id: row.card_id,
      position: row.position,
      cardSide: row.card_side as 'left' | 'right',
      status: row.status as 'hidden' | 'revealed' | 'matched',
      labelPt: row.label_pt,
      labelEn: row.label_en
    }));

    const firstRow = data[0];
    return {
      cards,
      roundScore: firstRow.round_score,
      totalScore: firstRow.total_score,
      remainingRoundSeconds: firstRow.remaining_round_seconds,
      boardCompleted: firstRow.board_completed
    };
  }

  /**
   * Secures authoritative card reveal from the server.
   */
  async revealCard(
    roomCode: string,
    reconnectToken: string,
    cardId: string
  ): Promise<MemoryMatchCard | null> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          console.log('[MemoryMatchService] Supabase unconfigured. Revealing card via local mock.');
          return this.revealCardMock(cardId);
        }
        return null;
      }

      const { data, error } = await supabase.rpc('reveal_memory_match_card', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken,
        p_card_id: cardId
      });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const row = data[0];
      return {
        id: row.card_id,
        position: row.position,
        cardSide: row.card_side as 'left' | 'right',
        status: row.status as 'hidden' | 'revealed' | 'matched',
        labelPt: row.label_pt,
        labelEn: row.label_en
      };
    } catch (err) {
      console.error('[MemoryMatchService] Failed to reveal card:', this.sanitizeSupabaseError(err));
      return null;
    }
  }

  /**
   * Submits a pair selection to the server for validation and score credit.
   */
  async submitPair(
    roomCode: string,
    reconnectToken: string,
    firstCardId: string,
    secondCardId: string
  ): Promise<MemoryMatchSubmissionResult> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          console.log('[MemoryMatchService] Supabase unconfigured. Evaluating pair via local mock.');
          return this.submitPairMock(firstCardId, secondCardId);
        }
        return {
          isMatch: false,
          scoreAwarded: 0,
          updatedRoundScore: 0,
          updatedTotalScore: 0,
          boardCompleted: false,
          firstPairId: '',
          secondPairId: ''
        };
      }

      const { data, error } = await supabase.rpc('submit_memory_match_pair', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken,
        p_first_card_id: firstCardId,
        p_second_card_id: secondCardId
      });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Empty payload returned from submit pair rpc.');
      }

      const row = data[0];
      return {
        isMatch: row.is_match,
        scoreAwarded: row.score_awarded,
        updatedRoundScore: row.updated_round_score,
        updatedTotalScore: row.updated_total_score,
        boardCompleted: row.board_completed,
        firstPairId: row.first_pair_id,
        secondPairId: row.second_pair_id
      };
    } catch (err) {
      console.error('[MemoryMatchService] Failed to submit pair:', this.sanitizeSupabaseError(err));
      return {
        isMatch: false,
        scoreAwarded: 0,
        updatedRoundScore: 0,
        updatedTotalScore: 0,
        boardCompleted: false,
        firstPairId: '',
        secondPairId: ''
      };
    }
  }

  // ============================================================================
  // HIGH-FIDELITY OFFLINE MOCK SIMULATION ENGINE FOR MEMORY MATCH
  // ============================================================================

  private getOrCreateMockStartTime(): number {
    let start = localStorage.getItem(MOCK_MM_START_KEY);
    if (!start) {
      const now = Date.now();
      localStorage.setItem(MOCK_MM_START_KEY, String(now));
      return now;
    }
    return Number(start);
  }

  private getMockScores(): { roundScore: number; totalScore: number } {
    const roundScore = Number(localStorage.getItem(MOCK_MM_SCORE_ROUND_KEY) || '0');
    const totalScore = Number(localStorage.getItem(MOCK_MM_SCORE_TOTAL_KEY) || '0');
    return { roundScore, totalScore };
  }

  private saveMockScores(roundScore: number, totalScore: number) {
    localStorage.setItem(MOCK_MM_SCORE_ROUND_KEY, String(roundScore));
    localStorage.setItem(MOCK_MM_SCORE_TOTAL_KEY, String(totalScore));
  }

  private getMockCards(): LocalMockCard[] {
    const cached = localStorage.getItem(MOCK_MM_CARDS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === 20) {
          return parsed;
        }
      } catch {
        // fail-safe
      }
    }

    // Generate fresh board cards with 20 cards (10 pairs)
    const fresh = this.generateFreshMockCardsPool();
    localStorage.setItem(MOCK_MM_CARDS_KEY, JSON.stringify(fresh));
    return fresh;
  }

  private generateFreshMockCardsPool(): LocalMockCard[] {
    // Select 10 random pairs from MOCK_MEMORY_MATCH_PAIRS to produce exactly 20 cards
    const shuffledPairs = [...MOCK_MEMORY_MATCH_PAIRS].sort(() => Math.random() - 0.5);
    const selected = shuffledPairs.slice(0, 10);

    const cards: Omit<LocalMockCard, 'position'>[] = [];
    selected.forEach((p) => {
      cards.push({
        id: `card_${p.pairKey}_left_${Math.random().toString(36).substr(2, 9)}`,
        cardSide: 'left',
        pairId: p.id,
        status: 'hidden'
      });
      cards.push({
        id: `card_${p.pairKey}_right_${Math.random().toString(36).substr(2, 9)}`,
        cardSide: 'right',
        pairId: p.id,
        status: 'hidden'
      });
    });

    // Shuffle positions 0 to 19
    const shuffledCards = cards.sort(() => Math.random() - 0.5);
    return shuffledCards.map((c, index) => ({
      ...c,
      position: index
    }));
  }

  private getRoundStateMock(): MemoryMatchRoundState | null {
    const startTime = this.getOrCreateMockStartTime();
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const roundDuration = 300; // 300 seconds (5 mins)

    if (elapsedSeconds >= roundDuration) {
      return null;
    }

    const localCards = this.getMockCards();
    const scores = this.getMockScores();

    // Map localCards to client MemoryMatchCard format, concealing hidden labels
    const clientCards: MemoryMatchCard[] = localCards.map((c) => {
      const isRevealedOrMatched = c.status === 'revealed' || c.status === 'matched';
      let labelPt: string | null = null;
      let labelEn: string | null = null;

      let emoji: string | undefined = undefined;

      if (isRevealedOrMatched) {
        const pair = MOCK_MEMORY_MATCH_PAIRS.find((p) => p.id === c.pairId);
        if (pair) {
          labelPt = c.cardSide === 'left' ? pair.leftLabelPt : pair.rightLabelPt;
          labelEn = c.cardSide === 'left' ? pair.leftLabelEn : pair.rightLabelEn;
          emoji = pair.emoji;
        }
      }

      return {
        id: c.id,
        position: c.position,
        cardSide: c.cardSide,
        status: c.status,
        labelPt,
        labelEn,
        emoji
      };
    });

    const isAllMatched = localCards.every((c) => c.status === 'matched');

    return {
      cards: clientCards,
      roundScore: scores.roundScore,
      totalScore: scores.totalScore,
      remainingRoundSeconds: Math.max(0, roundDuration - elapsedSeconds),
      boardCompleted: isAllMatched
    };
  }

  private revealCardMock(cardId: string): MemoryMatchCard | null {
    const cards = this.getMockCards();
    const card = cards.find((c) => c.id === cardId);

    if (!card) return null;

    if (card.status === 'hidden') {
      card.status = 'revealed';
      localStorage.setItem(MOCK_MM_CARDS_KEY, JSON.stringify(cards));
    }

    const pair = MOCK_MEMORY_MATCH_PAIRS.find((p) => p.id === card.pairId);
    return {
      id: card.id,
      position: card.position,
      cardSide: card.cardSide,
      status: card.status,
      labelPt: pair ? (card.cardSide === 'left' ? pair.leftLabelPt : pair.rightLabelPt) : null,
      labelEn: pair ? (card.cardSide === 'left' ? pair.leftLabelEn : pair.rightLabelEn) : null,
      emoji: pair ? pair.emoji : undefined
    };
  }

  private submitPairMock(firstCardId: string, secondCardId: string): MemoryMatchSubmissionResult {
    const cards = this.getMockCards();
    const c1 = cards.find((c) => c.id === firstCardId);
    const c2 = cards.find((c) => c.id === secondCardId);

    if (!c1 || !c2) {
      throw new Error('Cards not found on board.');
    }

    if (c1.id === c2.id) {
      throw new Error('A card cannot be matched with itself.');
    }

    if (c1.status === 'matched' || c2.status === 'matched') {
      throw new Error('One or both of these cards are already matched.');
    }

    const isMatch = c1.pairId === c2.pairId;
    let scoreAwarded = 0;
    const scores = this.getMockScores();

    if (isMatch) {
      scoreAwarded = 10;
      c1.status = 'matched';
      c2.status = 'matched';
      scores.roundScore += scoreAwarded;
      scores.totalScore += scoreAwarded;
      this.saveMockScores(scores.roundScore, scores.totalScore);
      localStorage.setItem(MOCK_MM_CARDS_KEY, JSON.stringify(cards));
    } else {
      c1.status = 'hidden';
      c2.status = 'hidden';
      localStorage.setItem(MOCK_MM_CARDS_KEY, JSON.stringify(cards));
    }

    const allMatched = cards.every((c) => c.status === 'matched');

    if (allMatched) {
      // Refresh board immediately for continuous mock play
      const freshPool = this.generateFreshMockCardsPool();
      localStorage.setItem(MOCK_MM_CARDS_KEY, JSON.stringify(freshPool));
    }

    return {
      isMatch,
      scoreAwarded,
      updatedRoundScore: scores.roundScore,
      updatedTotalScore: scores.totalScore,
      boardCompleted: allMatched,
      firstPairId: c1.pairId,
      secondPairId: c2.pairId
    };
  }

  /**
   * Resets the local mock session.
   */
  resetMockSession() {
    localStorage.removeItem(MOCK_MM_START_KEY);
    localStorage.removeItem(MOCK_MM_CARDS_KEY);
    localStorage.removeItem(MOCK_MM_SCORE_ROUND_KEY);
    localStorage.removeItem(MOCK_MM_SCORE_TOTAL_KEY);
  }
}

export const memoryMatchService = new MemoryMatchService();
