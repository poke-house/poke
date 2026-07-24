import { useState, useEffect, useRef } from 'react';
import { SlopClockService } from '../../../services/slopClock.service';
import { SlopClockChallenge, ArenaRoom } from '../../../houseArena.types';
import { getFullIngredientList, getCurrentPhases } from '../../../../training/training.utils';
import { Recipe, RecipePhaseKey } from '../../../../../types';

interface UseSlopClockGameplayProps {
  room: ArenaRoom;
  reconnectToken: string;
  onRoundFinished?: () => void;
}

export const useSlopClockGameplay = ({
  room,
  reconnectToken,
  onRoundFinished
}: UseSlopClockGameplayProps) => {
  const service = useRef(new SlopClockService());

  const [challenge, setChallenge] = useState<SlopClockChallenge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Countdown timer (browser-level presentation)
  const [timeLeft, setTimeLeft] = useState<number>(600);

  // Selections state mapped by phase key
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);

  // Toasts / feedback states
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error' | null; message: string }>({
    status: null,
    message: ''
  });

  // Fetch initial challenge on mount
  useEffect(() => {
    let active = true;

    const loadChallenge = async () => {
      setLoading(true);
      try {
        const data = await service.current.getOrCreateActiveChallenge(room.roomCode, reconnectToken);
        if (active && data) {
          setChallenge(data);
          setTimeLeft(Math.max(0, data.remainingRoundSeconds));
          initializeSelections(data);
        }
      } catch (err) {
        console.error('[useSlopClockGameplay] Error loading challenge:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadChallenge();

    return () => {
      active = false;
    };
  }, [room.roomCode, reconnectToken]);

  // Handle countdown ticking
  useEffect(() => {
    if (timeLeft <= 0) {
      if (challenge && onRoundFinished) {
        onRoundFinished();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onRoundFinished) {
            onRoundFinished();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onRoundFinished, challenge]);

  // Helper to initialize or clear selection map based on required ingredients
  const initializeSelections = (ch: SlopClockChallenge) => {
    const initial: Record<string, string[]> = {};
    const phases = getRecipePhases(ch.recipeCategory);
    phases.forEach((p) => {
      initial[p.key] = [];
    });
    setSelections(initial);
    setCurrentPhaseIndex(0);
  };

  const getRecipePhases = (category: string) => {
    // If smoothie, return smoothie phases, otherwise bowl phases
    if (category === 'SMOOTHIE') {
      return [
        { key: 'smoothie_liquid', title: 'Líquido' },
        { key: 'smoothie_ingredients', title: 'Ingredientes' },
        { key: 'smoothie_mode', title: 'Blender' },
        { key: 'smoothie_marbling', title: 'Marmorização' }
      ];
    }
    return [
      { key: 'base', title: 'Base' },
      { key: 'sauce_base', title: 'Molho Base' },
      { key: 'greens', title: 'Greens' },
      { key: 'protein', title: 'Proteína' },
      { key: 'sauce_final', title: 'Molho Final' },
      { key: 'crispy', title: 'Crispy' },
      { key: 'sesame', title: 'Sésamo' }
    ];
  };

  const currentPhases = challenge ? getRecipePhases(challenge.recipeCategory) : [];
  const currentPhase = currentPhases[currentPhaseIndex];

  // Gets expected count for current phase based on server challenge definition
  const getPhaseLimit = (): number => {
    if (!challenge || !currentPhase) return 0;
    const req = challenge.requiredIngredients[currentPhase.key] || [];
    return req.length;
  };

  // Toggle item in current phase selection
  const handleSelectItem = (item: string) => {
    if (!currentPhase) return;
    const phaseKey = currentPhase.key;
    const currentList = selections[phaseKey] || [];
    const limit = getPhaseLimit();

    let newList: string[];
    if (limit === 1) {
      // Single-select phase: tapping replaces; tapping the same one clears it
      newList = currentList[0] === item ? [] : [item];
    } else {
      // Multi-select: each tap adds one more unit, up to the limit.
      // Duplicates are allowed (multiset).
      if (currentList.length >= limit) {
        return; // at limit, ignore further taps
      }
      newList = [...currentList, item];
    }

    setSelections((prev) => ({ ...prev, [phaseKey]: newList }));
  };

  const handleRemoveOneItem = (item: string) => {
    if (!currentPhase) return;
    const phaseKey = currentPhase.key;
    const currentList = selections[phaseKey] || [];
    const idx = currentList.indexOf(item);
    if (idx === -1) return;
    const newList = [...currentList.slice(0, idx), ...currentList.slice(idx + 1)];
    setSelections((prev) => ({ ...prev, [phaseKey]: newList }));
  };

  const handleNextPhase = () => {
    if (currentPhaseIndex < currentPhases.length - 1) {
      setCurrentPhaseIndex((prev) => prev + 1);
    }
  };

  const handlePrevPhase = () => {
    if (currentPhaseIndex > 0) {
      setCurrentPhaseIndex((prev) => prev - 1);
    }
  };

  const handleClearSelections = () => {
    if (!currentPhase) return;
    setSelections((prev) => ({
      ...prev,
      [currentPhase.key]: []
    }));
  };

  const submitBowl = async () => {
    if (!challenge || submitting) return;
    setSubmitting(true);
    setFeedback({ status: null, message: '' });

    try {
      const res = await service.current.submitBowlCompletion(
        room.roomCode,
        reconnectToken,
        challenge.challengeId,
        selections
      );

      if (res.isAccepted) {
        setFeedback({
          status: 'success',
          message: 'slop_clock_correct_toast'
        });

        // Setup next challenge
        if (res.nextChallengeId) {
          const nextCh: SlopClockChallenge = {
            challengeId: res.nextChallengeId,
            challengeSequence: res.nextChallengeSequence || 1,
            recipeId: res.nextRecipeId || '',
            recipeName: res.nextRecipeName || '',
            recipeSize: res.nextRecipeSize || 'Regular',
            recipeCategory: res.nextRecipeCategory || 'HOUSE',
            requiredIngredients: res.nextRequiredIngredients || {},
            remainingRoundSeconds: res.remainingRoundSeconds,
            roundScore: res.updatedRoundScore,
            totalScore: res.updatedTotalScore,
            challengeCompletionCount: res.challengeCompletionCount
          };
          setChallenge(nextCh);
          initializeSelections(nextCh);
        } else {
          // No next challenge means round finished!
          if (onRoundFinished) {
            onRoundFinished();
          }
        }
      } else {
        setFeedback({
          status: 'error',
          message: 'slop_clock_incorrect_toast'
        });
      }
    } catch (err) {
      console.error('[useSlopClockGameplay] Submit bowl error:', err);
      setFeedback({
        status: 'error',
        message: 'slop_clock_incorrect_toast'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const clearFeedback = () => {
    setFeedback({ status: null, message: '' });
  };

  return {
    challenge,
    loading,
    submitting,
    timeLeft,
    selections,
    currentPhaseIndex,
    setCurrentPhaseIndex,
    currentPhases,
    currentPhase,
    phaseLimit: getPhaseLimit(),
    feedback,
    clearFeedback,
    handleSelectItem,
    handleRemoveOneItem,
    handleNextPhase,
    handlePrevPhase,
    handleClearSelections,
    submitBowl
  };
};
