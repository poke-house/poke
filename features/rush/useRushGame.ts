import { useState, useEffect, useRef } from 'react';
import { GameState, Recipe, RushPlayer, RushScore, ScoreSubmitStatus, SupabaseAvailability, Variant, RecipePhaseKey } from '../../types';
import { TranslationKey } from '../../translations';
import { RECIPES, INGREDIENTS_DB, RUSH_MESSAGES, PHASES_BOWL, PHASES_SMOOTHIE } from '../../constants';
import { playSound } from '../../utils/sound';
import { shuffleArray, generateUUID } from '../../utils/helpers';
import { getSupabaseAvailability } from '../../services/supabase/availability';
import { submitRushScore } from '../../services/supabase/scores';
import { getRushLeaderboard, getRecentRushScores } from '../../services/supabase/leaderboard';
import { SubmitRushScoreFailure } from '../../services/supabase/types';

interface UseRushGameProps {
  language: string;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  onExit: () => void;
}

export function useRushGame({ language, t, onExit }: UseRushGameProps) {
  // Navigation / State routing
  const [rushGameState, setRushGameState] = useState<GameState>("RUSH_SELECT");
  const [showRushEntry, setShowRushEntry] = useState(false);
  const [pendingRushLives, setPendingRushLives] = useState<number>(3);

  // Gameplay States
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentSelections, setCurrentSelections] = useState<string[]>([]);
  const [allSelections, setAllSelections] = useState<Record<string, string[]>>({});
  const [phaseOptions, setPhaseOptions] = useState<string[]>([]);
  const [timer, setTimer] = useState(20);
  const [isPaused, setIsPaused] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [resultMessage, setResultMessage] = useState({ pt: "Foco! 🧐", en: "Focus! 🧐" });

  // Score & Metadata
  const [rushScore, setRushScore] = useState(0);
  const [rushLives, setRushLives] = useState(3);
  const [rushPlayer, setRushPlayer] = useState<RushPlayer | null>(null);
  const [rushSubmissionId, setRushSubmissionId] = useState<string>("");

  // Leaderboard lists and query states
  const [topScores, setTopScores] = useState<RushScore[]>([]);
  const [lastScores, setLastScores] = useState<RushScore[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseAvailability>("available");
  const [scoreSubmitStatus, setScoreSubmitStatus] = useState<ScoreSubmitStatus>("pending");
  const [scoreSubmitError, setScoreSubmitError] = useState<TranslationKey | null>(null);

  // Recipe pools
  const [rushPool, setRushPool] = useState<{ recipeId: number; size: string | null }[]>([]);

  // Refs for tracking and safe timer execution
  const rushGameStateRef = useRef<GameState>(rushGameState);
  const tRef = useRef(t);
  const rushScoreRef = useRef(rushScore);
  const rushLivesRef = useRef(rushLives);
  const rushSubmissionIdRef = useRef(rushSubmissionId);
  const rushPlayerRef = useRef(rushPlayer);
  const hasTriggeredTimeoutRef = useRef(false);

  // Synchronize refs on every render
  useEffect(() => {
    rushGameStateRef.current = rushGameState;
    tRef.current = t;
    rushScoreRef.current = rushScore;
    rushLivesRef.current = rushLives;
    rushSubmissionIdRef.current = rushSubmissionId;
    rushPlayerRef.current = rushPlayer;
  }, [rushGameState, t, rushScore, rushLives, rushSubmissionId, rushPlayer]);

  useEffect(() => {
    if (timer > 1) {
      hasTriggeredTimeoutRef.current = false;
    }
  }, [timer]);

  // Main countdown timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (rushGameState === "RUSH_PLAYING" && !isPaused) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (interval) {
              clearInterval(interval);
            }

            if (hasTriggeredTimeoutRef.current) {
              return 0;
            }
            hasTriggeredTimeoutRef.current = true;

            const currentT = tRef.current;
            handleRushError([currentT('timer_ended')]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (rushGameState !== "RUSH_PLAYING") {
      setTimer(20);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [rushGameState, isPaused]);

  // Generate shuffled Rush recipe options pool
  const generateRushPool = () => {
    const pool: { recipeId: number; size: string | null }[] = [];
    RECIPES.forEach(recipe => {
      if (recipe.category === "HOUSE") {
        pool.push({ recipeId: recipe.id, size: "Regular" });
        pool.push({ recipeId: recipe.id, size: "Large" });
      } else if (recipe.category === "GREEN") {
        pool.push({ recipeId: recipe.id, size: "Regular" });
      } else { // SMOOTHIE
        pool.push({ recipeId: recipe.id, size: null });
      }
    });
    return shuffleArray(pool);
  };

  // Setup options for current recipe phase
  const getCurrentPhases = (recipe: Recipe) => {
    if (recipe.category === "SMOOTHIE") return PHASES_SMOOTHIE;
    return PHASES_BOWL;
  };

  const getSmoothieIngredientList = (recipe: Recipe, key: RecipePhaseKey): string[] => {
    if (key === "smoothie_liquid") return recipe.smoothie_liquid || [];
    if (key === "smoothie_ingredients") return recipe.smoothie_ingredients || [];
    if (key === "smoothie_mode") return recipe.smoothie_mode || [];
    if (key === "smoothie_marbling") return recipe.smoothie_marbling || [];
    return [];
  };

  const getFullIngredientList = (key: RecipePhaseKey): string[] => {
    if (key === 'base') return INGREDIENTS_DB.bases;
    if (key === 'sauce_base') return INGREDIENTS_DB.sauces_base;
    if (key === 'greens') return INGREDIENTS_DB.greens;
    if (key === 'protein') return INGREDIENTS_DB.proteins;
    if (key === 'sauce_final') return INGREDIENTS_DB.sauces_final;
    if (key === 'crispy') return INGREDIENTS_DB.crispies;
    if (key === 'sesame') return INGREDIENTS_DB.sesame;
    if (key === 'smoothie_liquid') return INGREDIENTS_DB.smoothie_liquid;
    if (key === 'smoothie_ingredients') return INGREDIENTS_DB.smoothie_ingredients;
    if (key === 'smoothie_mode') return INGREDIENTS_DB.smoothie_mode;
    if (key === 'smoothie_marbling') return INGREDIENTS_DB.smoothie_marbling;
    return [];
  };

  useEffect(() => {
    if (rushGameState === "RUSH_PLAYING" && selectedRecipe) {
      const activePhases = getCurrentPhases(selectedRecipe);
      const phaseKey = activePhases[currentPhaseIndex].key;
      if (phaseKey === "size") {
        setPhaseOptions(INGREDIENTS_DB.sizes);
        return;
      }
      const fullList = getFullIngredientList(phaseKey);
      let requiredIngs: string[] = [];
      if (selectedRecipe.category === "SMOOTHIE") {
        requiredIngs = getSmoothieIngredientList(selectedRecipe, phaseKey);
      } else {
        const sizeToUse = selectedSize || "Regular";
        const phaseKeyVariant = phaseKey as keyof Variant;
        requiredIngs = selectedRecipe.variants && selectedRecipe.variants[sizeToUse]
          ? selectedRecipe.variants[sizeToUse][phaseKeyVariant]
          : [];
      }

      const requiredSet = new Set(requiredIngs);
      const requiredUnique = [...requiredSet];
      const distractors = fullList.filter(ing => !requiredSet.has(ing));

      const hasWeight = requiredUnique.some(ing => /\d+g/.test(ing));
      let finalDistractors: string[] = [];
      if (hasWeight) {
        const weightDistractors = distractors.filter(d => /\d+g/.test(d));
        const otherDistractors = distractors.filter(d => !/\d+g/.test(d));
        finalDistractors = [...shuffleArray(weightDistractors), ...shuffleArray(otherDistractors)];
      } else {
        finalDistractors = shuffleArray(distractors);
      }

      const slotsNeeded = Math.max(0, 9 - requiredUnique.length);
      const selectedDistractors = finalDistractors.slice(0, slotsNeeded);
      const combined = [...requiredUnique, ...selectedDistractors];
      const finalOptions = shuffleArray([...new Set(combined)]);
      setPhaseOptions(finalOptions);
    }
  }, [currentPhaseIndex, rushGameState, selectedRecipe, selectedSize]);

  // Fetch Supabase Leaderboard Rankings and Recents
  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    const status = getSupabaseAvailability();
    setSupabaseStatus(status);
    if (status === "unconfigured") {
      setLeaderboardLoading(false);
      return;
    }
    try {
      const topResult = await getRushLeaderboard(3);
      if (topResult.success) {
        setTopScores(topResult.data);
      } else {
        setSupabaseStatus("unavailable");
        setLeaderboardLoading(false);
        return;
      }

      const lastResult = await getRecentRushScores(10);
      if (lastResult.success) {
        setLastScores(lastResult.data);
      } else {
        setSupabaseStatus("unavailable");
        setLeaderboardLoading(false);
        return;
      }

      setSupabaseStatus("available");
    } catch (err) {
      console.warn("Error fetching leaderboard (non-fatal):", err);
      setSupabaseStatus("unavailable");
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Launch initial game setup
  const setupRecipeStart = (recipe: Recipe, forcedSize?: string | null) => {
    if (recipe.category === "GREEN") {
      setSelectedSize("Regular");
      setCurrentPhaseIndex(1);
    } else if (recipe.category === "SMOOTHIE") {
      setSelectedSize(null);
      setCurrentPhaseIndex(0);
    } else { // HOUSE
      const sizeToUse = forcedSize !== undefined ? forcedSize : (Math.random() > 0.5 ? "Regular" : "Large");
      setSelectedSize(sizeToUse);
      setCurrentPhaseIndex(1); // Skip size selection in Rush Mode
    }
    setCurrentSelections([]);
    setAllSelections({});
    setTimer(20);
    setIsPaused(false);
  };

  const confirmRushStart = (lives: number) => {
    setRushScore(0);
    setRushLives(lives);
    const subId = generateUUID();
    setRushSubmissionId(subId);

    const newPool = generateRushPool();
    const first = newPool[0];
    setRushPool(newPool.slice(1));

    const recipe = RECIPES.find(r => r.id === first.recipeId)!;
    setSelectedRecipe(recipe);
    setRushGameState("RUSH_PLAYING");
    setupRecipeStart(recipe, first.size);
  };

  const nextRushRound = () => {
    let currentPool = [...rushPool];
    if (currentPool.length === 0) {
      currentPool = generateRushPool();
    }
    const next = currentPool[0];
    setRushPool(currentPool.slice(1));

    const recipe = RECIPES.find(r => r.id === next.recipeId)!;
    setSelectedRecipe(recipe);
    setRushGameState("RUSH_PLAYING");
    setupRecipeStart(recipe, next.size);
  };

  const handleRushStart = (name: string, store: string) => {
    setRushPlayer({ name, store });
    setShowRushEntry(false);
    setScoreSubmitStatus("pending");
    setScoreSubmitError(null);
    confirmRushStart(pendingRushLives);
  };

  // Ingredients and phase handling
  const handleSelection = (ingredient: string) => {
    if (!selectedRecipe) return;
    const activePhases = getCurrentPhases(selectedRecipe);
    const phaseKey = activePhases[currentPhaseIndex].key;

    if (phaseKey === "size") {
      setSelectedSize(ingredient);
      setCurrentPhaseIndex(prev => prev + 1);
      setTimer(20);
      return;
    }

    let requiredList: string[] = [];
    if (selectedRecipe.category === "SMOOTHIE") {
      requiredList = getSmoothieIngredientList(selectedRecipe, phaseKey);
    } else {
      const phaseKeyVariant = phaseKey as keyof Variant;
      requiredList = selectedRecipe.variants ? selectedRecipe.variants[selectedSize || "Regular"][phaseKeyVariant] : [];
    }

    const isCorrect = requiredList.includes(ingredient);
    if (!isCorrect) {
      handleRushError([t('instr_error_prefix', { phase: t(('phase_' + phaseKey) as TranslationKey), required: requiredList.join(", ") })]);
      return;
    }

    playSound("happy");
    if (currentSelections.length >= requiredList.length && !requiredList.includes(ingredient)) return;
    const newSelections = [...currentSelections, ingredient];
    setCurrentSelections(newSelections);

    let shouldAdvance = newSelections.length === requiredList.length;
    if (selectedRecipe.name.includes("Nutty Fit") && phaseKey === "smoothie_ingredients") {
      const hasGotas = newSelections.includes("Gotas de Chocolate 1 TBSP 15 ml");
      if (!hasGotas && newSelections.length === requiredList.length - 1) {
        shouldAdvance = true;
      }
    }

    if (shouldAdvance) {
      const updatedAll = { ...allSelections, [phaseKey]: newSelections };
      setAllSelections(updatedAll);
      if (currentPhaseIndex < activePhases.length - 1) {
        setTimeout(() => {
          setCurrentPhaseIndex(prev => prev + 1);
          setCurrentSelections([]);
          setTimer(20);
        }, 250);
      } else {
        validateGame(updatedAll);
      }
    }
  };

  const handleUndo = () => {
    if (currentSelections.length > 0) {
      setCurrentSelections(prev => prev.slice(0, -1));
    }
  };

  const validateGame = (finalSelections: Record<string, string[]>) => {
    if (!selectedRecipe) return;
    const errors: string[] = [];
    const activePhases = getCurrentPhases(selectedRecipe);
    const phasesToValidate = activePhases.filter(p => p.key !== "size");

    phasesToValidate.forEach(phase => {
      let required: string[] = [];
      if (selectedRecipe.category === "SMOOTHIE") {
        required = getSmoothieIngredientList(selectedRecipe, phase.key);
      } else {
        const phaseKeyVariant = phase.key as keyof Variant;
        required = selectedRecipe.variants ? selectedRecipe.variants[selectedSize || "Regular"][phaseKeyVariant] : [];
      }

      const actualStr = JSON.stringify([...(finalSelections[phase.key] || [])].sort());
      const reqStr = JSON.stringify([...required].sort());

      let isValid = actualStr === reqStr;
      if (!isValid && selectedRecipe.name.includes("Nutty Fit") && phase.key === "smoothie_ingredients") {
        const reqWithoutGotas = required.filter(i => i !== "Gotas de Chocolate 1 TBSP 15 ml");
        if (actualStr === JSON.stringify([...reqWithoutGotas].sort())) {
          isValid = true;
        }
      }

      if (!isValid) {
        errors.push(t('instr_error_prefix', { phase: t(('phase_' + phase.key) as TranslationKey), required: required.join(", ") }));
      }
    });

    if (errors.length === 0) {
      setRushScore(s => s + 1);
      playSound("happy");
      if (window.confetti) {
        window.confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      }
      nextRushRound();
    } else {
      handleRushError(errors);
    }
  };

  const handleRushError = (errors: string[]) => {
    playSound("sad");
    setErrorDetails(errors);
    const currentLives = rushLivesRef.current;
    if (currentLives > 1) {
      setRushGameState("RUSH_ERROR");
    } else {
      handleRushGameOver(errors);
    }
  };

  const consumeRushLife = () => {
    setRushLives(prev => prev - 1);
    nextRushRound();
  };

  // DB Submission
  const handleRushGameOver = async (errors: string[] = []) => {
    playSound("sad");
    setErrorDetails(errors);
    setRushGameState("RUSH_GAME_OVER");
    setRushLives(0);

    const sorted = [...RUSH_MESSAGES].sort((a, b) => b.threshold - a.threshold);
    const currentScore = rushScoreRef.current;
    setResultMessage(sorted.find(m => currentScore >= m.threshold)?.msg || { pt: "Foco! 🧐", en: "Focus! 🧐" });

    const status = getSupabaseAvailability();
    if (status === "unconfigured") {
      setScoreSubmitStatus("unconfigured");
      setScoreSubmitError("err_unconfigured");
      return;
    }

    const player = rushPlayerRef.current;
    const subId = rushSubmissionIdRef.current;
    if (player) {
      setScoreSubmitStatus("saving");
      setScoreSubmitError(null);
      try {
        const result = await submitRushScore({
          player_name: player.name,
          store_name: player.store,
          score: currentScore,
          submission_id: subId
        });
        if (result.success) {
          setScoreSubmitStatus("success");
          setSupabaseStatus("available");
          fetchLeaderboard();
        } else {
          const failResult = result as SubmitRushScoreFailure;
          setScoreSubmitStatus("failed");
          setScoreSubmitError(failResult.classifiedError);
          setSupabaseStatus("unavailable");
          console.error("Error saving score via RPC:", failResult.error);
        }
      } catch (err) {
        setScoreSubmitStatus("failed");
        setScoreSubmitError("err_unexpected");
        setSupabaseStatus("unavailable");
        console.error("Unexpected error saving score:", err);
      }
    }
  };

  const handleRetrySubmit = async () => {
    if (scoreSubmitStatus === "saving") return;
    const player = rushPlayerRef.current;
    if (!player) return;

    setScoreSubmitStatus("saving");
    setScoreSubmitError(null);
    try {
      const result = await submitRushScore({
        player_name: player.name,
        store_name: player.store,
        score: rushScoreRef.current,
        submission_id: rushSubmissionIdRef.current
      });
      if (result.success) {
        setScoreSubmitStatus("success");
        setSupabaseStatus("available");
        fetchLeaderboard();
      } else {
        const failResult = result as SubmitRushScoreFailure;
        setScoreSubmitStatus("failed");
        setScoreSubmitError(failResult.classifiedError);
        setSupabaseStatus("unavailable");
        console.error("Error retrying score submission via RPC:", failResult.error);
      }
    } catch (err) {
      setScoreSubmitStatus("failed");
      setScoreSubmitError("err_unexpected");
      setSupabaseStatus("unavailable");
      console.error("Unexpected error retrying score:", err);
    }
  };

  const resetToHomeAndExit = () => {
    setRushGameState("RUSH_SELECT");
    setSelectedRecipe(null);
    setSelectedSize(null);
    setTimer(20);
    onExit();
  };

  return {
    rushGameState,
    setRushGameState,
    showRushEntry,
    setShowRushEntry,
    pendingRushLives,
    setPendingRushLives,

    // Gameplay
    selectedRecipe,
    selectedSize,
    currentPhaseIndex,
    currentSelections,
    phaseOptions,
    timer,
    isPaused,
    setIsPaused,
    errorDetails,
    resultMessage,

    // Score & metadata
    rushScore,
    rushLives,
    rushPlayer,
    rushSubmissionId,

    // Leaderboards
    topScores,
    lastScores,
    leaderboardLoading,
    supabaseStatus,
    scoreSubmitStatus,
    scoreSubmitError,

    // Handlers
    fetchLeaderboard,
    handleRushStart,
    handleSelection,
    handleUndo,
    consumeRushLife,
    handleRetrySubmit,
    resetToHomeAndExit,
    getCurrentPhaseKey: () => selectedRecipe ? getCurrentPhases(selectedRecipe)[currentPhaseIndex].key : "size" as RecipePhaseKey
  };
}
