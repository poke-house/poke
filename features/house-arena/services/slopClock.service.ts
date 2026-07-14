import { getSupabaseClient } from '../../../services/supabase/client';
import { SlopClockChallenge, SlopClockSubmissionResult } from '../houseArena.types';
import { RECIPES } from '../../../constants';

const MOCK_CHALLENGE_KEY = 'poke_house_mock_challenge_v2';
const MOCK_SCORE_KEY = 'poke_house_mock_score_v2';

export class SlopClockService {
  private getSupabase() {
    const res = getSupabaseClient();
    return res.status === 'available' ? res.client : null;
  }

  /**
   * Retrieves or atomically generates the player's current active challenge from the server.
   */
  async getOrCreateActiveChallenge(
    roomCode: string,
    reconnectToken: string
  ): Promise<SlopClockChallenge | null> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        console.log('[SlopClockService] Supabase unconfigured. Invoking local mock engine.');
        return this.getOrCreateActiveChallengeMock();
      }

      const { data, error } = await supabase.rpc('get_or_create_active_challenge', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken
      });

      if (error) {
        console.error('[SlopClockService] get_or_create_active_challenge error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const row = data[0];
      return {
        challengeId: row.challenge_id,
        challengeSequence: row.challenge_sequence,
        recipeId: row.recipe_id,
        recipeName: row.recipe_name,
        recipeSize: row.recipe_size,
        recipeCategory: row.recipe_category,
        requiredIngredients: row.required_ingredients as Record<string, string[]>,
        remainingRoundSeconds: row.remaining_round_seconds,
        roundScore: row.round_score,
        totalScore: row.total_score,
        challengeCompletionCount: row.challenge_completion_count
      };
    } catch (err) {
      console.error('[SlopClockService] Failed to retrieve challenge:', err);
      return null;
    }
  }

  /**
   * Securely submits the completed ingredients payload for validation.
   */
  async submitBowlCompletion(
    roomCode: string,
    reconnectToken: string,
    challengeId: string,
    selectedItems: Record<string, string[]>
  ): Promise<SlopClockSubmissionResult> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        console.log('[SlopClockService] Supabase unconfigured. Submitting to local mock validator.');
        return this.submitBowlCompletionMock(challengeId, selectedItems);
      }

      const { data, error } = await supabase.rpc('submit_slop_clock_bowl_completion', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken,
        p_challenge_id: challengeId,
        p_selected_items: selectedItems
      });

      if (error) {
        console.error('[SlopClockService] RPC submit_slop_clock_bowl_completion error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Empty validation payload received from database.');
      }

      const row = data[0];
      return {
        isAccepted: row.is_accepted,
        reasonCategory: row.reason_category,
        awardedScore: row.awarded_score,
        updatedRoundScore: row.updated_round_score,
        updatedTotalScore: row.updated_total_score,
        nextChallengeId: row.next_challenge_id,
        nextChallengeSequence: row.next_challenge_sequence,
        nextRecipeId: row.next_recipe_id,
        nextRecipeName: row.next_recipe_name,
        nextRecipeSize: row.next_recipe_size,
        nextRecipeCategory: row.next_recipe_category,
        nextRequiredIngredients: row.next_required_ingredients as Record<string, string[]> | null,
        remainingRoundSeconds: row.remaining_round_seconds,
        challengeCompletionCount: row.challenge_completion_count
      };
    } catch (err) {
      console.error('[SlopClockService] Bowl completion submission error:', err);
      return {
        isAccepted: false,
        reasonCategory: 'unexpected_error',
        awardedScore: 0,
        updatedRoundScore: 0,
        updatedTotalScore: 0,
        nextChallengeId: null,
        nextChallengeSequence: null,
        nextRecipeId: null,
        nextRecipeName: null,
        nextRecipeSize: null,
        nextRecipeCategory: null,
        nextRequiredIngredients: null,
        remainingRoundSeconds: 0,
        challengeCompletionCount: 0
      };
    }
  }

  // ============================================================================
  // HIGH-FIDELITY OFFLINE MOCK SIMULATION ENGINE
  // ============================================================================

  private getOrCreateActiveChallengeMock(): SlopClockChallenge {
    const cached = localStorage.getItem(MOCK_CHALLENGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // clear corrupted
      }
    }

    // Draw random HOUSE recipe
    const houseRecipes = RECIPES.filter(r => r.category === 'HOUSE' || r.category === 'GREEN');
    const recipe = houseRecipes[Math.floor(Math.random() * houseRecipes.length)];
    const size = recipe.category === 'HOUSE' ? (Math.random() > 0.5 ? 'Large' : 'Regular') : 'Regular';
    const reqIngredients = recipe.category === 'SMOOTHIE' 
      ? {} 
      : (recipe.variants && recipe.variants[size] ? recipe.variants[size] : {});

    const mockScore = this.getMockScore();

    const challenge: SlopClockChallenge = {
      challengeId: 'mock-challenge-' + Math.random().toString(36).substring(2, 9),
      challengeSequence: mockScore.completedCount + 1,
      recipeId: String(recipe.id),
      recipeName: recipe.name,
      recipeSize: size,
      recipeCategory: recipe.category,
      requiredIngredients: reqIngredients as Record<string, string[]>,
      remainingRoundSeconds: 580, // Simulation countdown
      roundScore: mockScore.roundScore,
      totalScore: mockScore.totalScore,
      challengeCompletionCount: mockScore.completedCount
    };

    localStorage.setItem(MOCK_CHALLENGE_KEY, JSON.stringify(challenge));
    return challenge;
  }

  private submitBowlCompletionMock(
    challengeId: string,
    selectedItems: Record<string, string[]>
  ): SlopClockSubmissionResult {
    const cached = localStorage.getItem(MOCK_CHALLENGE_KEY);
    if (!cached) {
      return this.createFailedMockResult('challenge_not_found');
    }

    const currentChallenge: SlopClockChallenge = JSON.parse(cached);
    if (currentChallenge.challengeId !== challengeId) {
      return this.createFailedMockResult('challenge_mismatch');
    }

    // Validate selectedItems against requiredIngredients
    const req = currentChallenge.requiredIngredients;
    let isValid = true;
    let invalidPhase = '';

    const phases = ['base', 'sauce_base', 'greens', 'protein', 'sauce_final', 'crispy', 'sesame'];
    for (const phase of phases) {
      const requiredArr = [...(req[phase] || [])].sort();
      const selectedArr = [...(selectedItems[phase] || [])].sort();

      if (JSON.stringify(requiredArr) !== JSON.stringify(selectedArr)) {
        isValid = false;
        invalidPhase = phase;
        break;
      }
    }

    if (!isValid) {
      return this.createFailedMockResult('invalid_phase_' + invalidPhase, currentChallenge);
    }

    // Update scores
    const score = this.getMockScore();
    score.roundScore += 1;
    score.totalScore += 1;
    score.completedCount += 1;
    this.saveMockScore(score);

    // Create next mock challenge
    localStorage.removeItem(MOCK_CHALLENGE_KEY);
    const nextChallenge = this.getOrCreateActiveChallengeMock();

    return {
      isAccepted: true,
      reasonCategory: 'success',
      awardedScore: 1,
      updatedRoundScore: score.roundScore,
      updatedTotalScore: score.totalScore,
      nextChallengeId: nextChallenge.challengeId,
      nextChallengeSequence: nextChallenge.challengeSequence,
      nextRecipeId: nextChallenge.recipeId,
      nextRecipeName: nextChallenge.recipeName,
      nextRecipeSize: nextChallenge.recipeSize,
      nextRecipeCategory: nextChallenge.recipeCategory,
      nextRequiredIngredients: nextChallenge.requiredIngredients,
      remainingRoundSeconds: nextChallenge.remainingRoundSeconds,
      challengeCompletionCount: score.completedCount
    };
  }

  private getMockScore() {
    const cached = localStorage.getItem(MOCK_SCORE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // clear
      }
    }
    return { roundScore: 0, totalScore: 0, completedCount: 0 };
  }

  private saveMockScore(score: { roundScore: number; totalScore: number; completedCount: number }) {
    localStorage.setItem(MOCK_SCORE_KEY, JSON.stringify(score));
  }

  private createFailedMockResult(reason: string, ch?: SlopClockChallenge): SlopClockSubmissionResult {
    const score = this.getMockScore();
    return {
      isAccepted: false,
      reasonCategory: reason,
      awardedScore: 0,
      updatedRoundScore: score.roundScore,
      updatedTotalScore: score.totalScore,
      nextChallengeId: null,
      nextChallengeSequence: null,
      nextRecipeId: null,
      nextRecipeName: null,
      nextRecipeSize: null,
      nextRecipeCategory: null,
      nextRequiredIngredients: null,
      remainingRoundSeconds: ch ? ch.remainingRoundSeconds : 0,
      challengeCompletionCount: score.completedCount
    };
  }
}
