import { getSupabaseClient } from '../../../services/supabase/client';
import { QuickThinkQuestionState, QuickThinkSubmissionResult } from '../games/quick-think/quickThink.types';
import { MOCK_QUESTIONS, MockQuestion } from '../games/quick-think/quickThink.constants';

const MOCK_ROUND_START_KEY = 'poke_house_mock_qt_start_time';
const MOCK_SEQUENCE_KEY = 'poke_house_mock_qt_sequence';
const MOCK_ANSWERS_KEY = 'poke_house_mock_qt_answers';
const MOCK_SCORES_KEY = 'poke_house_mock_qt_scores';

export class QuickThinkService {
  private getSupabase() {
    const res = getSupabaseClient();
    return res.status === 'available' ? res.client : null;
  }

  /**
   * Retrieves the currently active question securely from the server.
   */
  async getActiveQuestion(
    roomCode: string,
    reconnectToken: string
  ): Promise<QuickThinkQuestionState | null> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          console.log('[QuickThinkService] Supabase unconfigured. Invoking local mock engine.');
          return this.getActiveQuestionMock();
        }
        return null;
      }

      const { data, error } = await supabase.rpc('get_active_quick_think_question', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken
      });

      if (error) {
        console.error('[QuickThinkService] get_active_quick_think_question error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const row = data[0];
      if (!row.round_question_id) {
        // Returned an interval gap or sync gap
        return {
          roundQuestionId: null,
          questionId: null,
          questionOrder: null,
          questionPt: null,
          questionEn: null,
          options: null,
          remainingQuestionSeconds: 0,
          remainingRoundSeconds: row.remaining_round_seconds,
          roundScore: row.round_score,
          totalScore: row.total_score,
          isAnswered: false,
          answeredOptionId: null,
          correctOptionId: null,
          explanationPt: null,
          explanationEn: null
        };
      }

      return {
        roundQuestionId: row.round_question_id,
        questionId: row.question_id,
        questionOrder: row.question_order,
        questionPt: row.question_pt,
        questionEn: row.question_en,
        options: row.options,
        remainingQuestionSeconds: row.remaining_question_seconds,
        remainingRoundSeconds: row.remaining_round_seconds,
        roundScore: row.round_score,
        totalScore: row.total_score,
        isAnswered: row.is_answered,
        answeredOptionId: row.answered_option_id,
        correctOptionId: row.correct_option_id,
        explanationPt: row.explanation_pt,
        explanationEn: row.explanation_en
      };
    } catch (err) {
      console.error('[QuickThinkService] Failed to retrieve active question:', err);
      return null;
    }
  }

  /**
   * Securely submits the selected option to the server for validation and grading.
   */
  async submitAnswer(
    roomCode: string,
    reconnectToken: string,
    roundQuestionId: string,
    selectedOptionId: string
  ): Promise<QuickThinkSubmissionResult> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          console.log('[QuickThinkService] Supabase unconfigured. Submitting to local mock validator.');
          return this.submitAnswerMock(roundQuestionId, selectedOptionId);
        }
        return {
          isAccepted: false,
          isCorrect: false,
          scoreAwarded: 0,
          updatedRoundScore: 0,
          updatedTotalScore: 0,
          correctOptionId: '',
          explanationPt: 'Supabase is not configured.',
          explanationEn: 'Supabase is not configured.'
        };
      }

      const { data, error } = await supabase.rpc('submit_quick_think_answer', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken,
        p_round_question_id: roundQuestionId,
        p_selected_option_id: selectedOptionId
      });

      if (error) {
        console.error('[QuickThinkService] RPC submit_quick_think_answer error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Empty validation payload received from database.');
      }

      const row = data[0];
      return {
        isAccepted: row.is_accepted,
        isCorrect: row.is_correct,
        scoreAwarded: row.score_awarded,
        updatedRoundScore: row.updated_round_score,
        updatedTotalScore: row.updated_total_score,
        correctOptionId: row.correct_option_id,
        explanationPt: row.explanation_pt,
        explanationEn: row.explanation_en
      };
    } catch (err) {
      console.error('[QuickThinkService] Answer submission error:', err);
      return {
        isAccepted: false,
        isCorrect: false,
        scoreAwarded: 0,
        updatedRoundScore: 0,
        updatedTotalScore: 0,
        correctOptionId: '',
        explanationPt: 'Erro inesperado ao validar a resposta.',
        explanationEn: 'Unexpected error while validating the answer.'
      };
    }
  }

  // ============================================================================
  // HIGH-FIDELITY OFFLINE MOCK SIMULATION ENGINE
  // ============================================================================

  private getOrCreateMockStartTime(): number {
    let start = localStorage.getItem(MOCK_ROUND_START_KEY);
    if (!start) {
      const now = Date.now();
      localStorage.setItem(MOCK_ROUND_START_KEY, String(now));
      return now;
    }
    return Number(start);
  }

  private getOrCreateMockSequence(): string[] {
    const cached = localStorage.getItem(MOCK_SEQUENCE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fail-safe
      }
    }

    // Shuffle and pick 15 mock questions
    const shuffled = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5);
    const selectedIds = shuffled.slice(0, 15).map(q => q.id);
    localStorage.setItem(MOCK_SEQUENCE_KEY, JSON.stringify(selectedIds));
    return selectedIds;
  }

  private getMockAnswers(): Record<string, string> {
    const cached = localStorage.getItem(MOCK_ANSWERS_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fail-safe
      }
    }
    return {};
  }

  private saveMockAnswers(answers: Record<string, string>) {
    localStorage.setItem(MOCK_ANSWERS_KEY, JSON.stringify(answers));
  }

  private getMockScores(): { roundScore: number; totalScore: number } {
    const cached = localStorage.getItem(MOCK_SCORES_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fail-safe
      }
    }
    return { roundScore: 0, totalScore: 0 };
  }

  private saveMockScores(scores: { roundScore: number; totalScore: number }) {
    localStorage.setItem(MOCK_SCORES_KEY, JSON.stringify(scores));
  }

  private getActiveQuestionMock(): QuickThinkQuestionState | null {
    const startTime = this.getOrCreateMockStartTime();
    const sequence = this.getOrCreateMockSequence();
    const answers = this.getMockAnswers();
    const scores = this.getMockScores();

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const roundDuration = 300; // 300 seconds

    if (elapsedSeconds >= roundDuration) {
      // Round ended
      return null;
    }

    const questionIndex = Math.floor(elapsedSeconds / 20); // 20s per question
    if (questionIndex < 0 || questionIndex >= sequence.length) {
      return null;
    }

    const questionId = sequence[questionIndex];
    const question = MOCK_QUESTIONS.find(q => q.id === questionId);

    if (!question) {
      return null;
    }

    const currentQuestionElapsed = elapsedSeconds % 20;
    const remainingQuestionSeconds = 20 - currentQuestionElapsed;
    const remainingRoundSeconds = Math.max(0, roundDuration - elapsedSeconds);

    const roundQuestionId = `mock_rq_${questionId}`;
    const answeredOptionId = answers[roundQuestionId] || null;
    const isAnswered = answeredOptionId !== null;

    return {
      roundQuestionId,
      questionId,
      questionOrder: questionIndex + 1,
      questionPt: question.question_pt,
      questionEn: question.question_en,
      options: question.options,
      remainingQuestionSeconds,
      remainingRoundSeconds,
      roundScore: scores.roundScore,
      totalScore: scores.totalScore,
      isAnswered,
      answeredOptionId,
      correctOptionId: isAnswered ? question.correct_option_id : null,
      explanationPt: isAnswered ? question.explanation_pt : null,
      explanationEn: isAnswered ? question.explanation_en : null
    };
  }

  private submitAnswerMock(
    roundQuestionId: string,
    selectedOptionId: string
  ): QuickThinkSubmissionResult {
    const answers = this.getMockAnswers();
    if (answers[roundQuestionId]) {
      throw new Error('Duplicate submission: You have already answered this question.');
    }

    // Extract original question id from mock_rq_q_X format
    const questionId = roundQuestionId.replace('mock_rq_', '');
    const question = MOCK_QUESTIONS.find(q => q.id === questionId);

    if (!question) {
      throw new Error('Question not found.');
    }

    const isCorrect = selectedOptionId === question.correct_option_id;
    const scoreAwarded = isCorrect ? 1 : 0;

    // Save answer
    answers[roundQuestionId] = selectedOptionId;
    this.saveMockAnswers(answers);

    // Update scores
    const scores = this.getMockScores();
    scores.roundScore += scoreAwarded;
    scores.totalScore += scoreAwarded;
    this.saveMockScores(scores);

    return {
      isAccepted: true,
      isCorrect,
      scoreAwarded,
      updatedRoundScore: scores.roundScore,
      updatedTotalScore: scores.totalScore,
      correctOptionId: question.correct_option_id,
      explanationPt: question.explanation_pt,
      explanationEn: question.explanation_en
    };
  }

  /**
   * Safe clean-up for simulation testing
   */
  resetMockSession() {
    localStorage.removeItem(MOCK_ROUND_START_KEY);
    localStorage.removeItem(MOCK_SEQUENCE_KEY);
    localStorage.removeItem(MOCK_ANSWERS_KEY);
    localStorage.removeItem(MOCK_SCORES_KEY);
  }
}
export const quickThinkService = new QuickThinkService();
