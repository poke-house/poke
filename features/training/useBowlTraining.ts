import { useState, useEffect, useRef } from 'react';
import { Recipe, RecipePhaseKey, Language, Variant } from '../../types';
import { playSound } from '../../utils/sound';
import { shuffleArray } from '../../utils/helpers';
import { INGREDIENTS_DB, SUCCESS_MESSAGES, FAIL_MESSAGES } from '../../constants';
import { 
  getCurrentPhases, 
  getRequiredIngredients, 
  getFullIngredientList, 
  getSelectionLimit 
} from './training.utils';

export function useBowlTraining(
  selectedRecipe: Recipe,
  language: Language,
  t: (key: any, params?: Record<string, string | number>) => string,
  resetToHome: () => void
) {
  const [gameState, setGameState] = useState<"PLAYING" | "RESULT_SUCCESS" | "RESULT_FAIL">("PLAYING");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentSelections, setCurrentSelections] = useState<string[]>([]);
  const [allSelections, setAllSelections] = useState<Record<string, string[]>>({});
  const [phaseOptions, setPhaseOptions] = useState<string[]>([]);
  const [timer, setTimer] = useState(20);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [resultMessage, setResultMessage] = useState({ pt: "", en: "" });
  
  // Feedback for the current phase (correct/incorrect active feedback during game)
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'incorrect' | null;
    message: string;
    item?: string;
  }>({ type: null, message: "" });

  // Detail error structure for timeout/failures to enable the rich learning screen
  const [failedPhaseKey, setFailedPhaseKey] = useState<RecipePhaseKey | null>(null);
  const [failedPhaseProgress, setFailedPhaseProgress] = useState<string>("");
  const [failedRequired, setFailedRequired] = useState<string[]>([]);
  const [failedSelected, setFailedSelected] = useState<string[]>([]);
  const [isTimeout, setIsTimeout] = useState(false);

  // Setup initial state for recipe
  useEffect(() => {
    if (selectedRecipe.category === "GREEN") {
      setSelectedSize("Regular");
      setCurrentPhaseIndex(1); // Skip size
    } else {
      setSelectedSize(null);
      setCurrentPhaseIndex(0);
    }
    setCurrentSelections([]);
    setAllSelections({});
    setTimer(20);
    setGameState("PLAYING");
    setErrorDetails([]);
    setFeedback({ type: null, message: "" });
    setFailedPhaseKey(null);
    setIsTimeout(false);
  }, [selectedRecipe]);

  // Generate options for the current phase
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const activePhases = getCurrentPhases(selectedRecipe);
    if (currentPhaseIndex >= activePhases.length) return;

    const phaseKey = activePhases[currentPhaseIndex].key;
    if (phaseKey === "size") {
      setPhaseOptions(INGREDIENTS_DB.sizes);
      return;
    }

    const requiredIngs = getRequiredIngredients(selectedRecipe, phaseKey, selectedSize);
    const requiredSet = new Set(requiredIngs);
    const requiredUnique = [...requiredSet];
    const fullList = getFullIngredientList(phaseKey);
    const distractors = fullList.filter(ing => !requiredSet.has(ing));

    // Fixed recipe rule: exactly max 4 distinct base options total
    if (phaseKey === "base") {
      const uniqueDistractors = distractors.filter(d => !requiredSet.has(d));
      const neededDistractors = Math.max(0, 4 - requiredUnique.length);
      const selectedDistractors = shuffleArray(uniqueDistractors).slice(0, neededDistractors);
      const combined = [...requiredUnique, ...selectedDistractors];
      const finalOptions = shuffleArray([...new Set(combined)]);
      setPhaseOptions(finalOptions);
      return;
    }

    // Weight Distractor Logic for other phases
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
  }, [currentPhaseIndex, gameState, selectedRecipe, selectedSize]);

  // Refs for callbacks to prevent closure issues in timer
  const handleTimeoutRef = useRef<() => void>(null);
  
  const handleTimeout = () => {
    setIsTimeout(true);
    playSound("sad");
    
    // Capture active phase details at timeout for learning feedback
    const activePhases = getCurrentPhases(selectedRecipe);
    const currentPhase = activePhases[currentPhaseIndex];
    if (currentPhase) {
      setFailedPhaseKey(currentPhase.key);
      setFailedPhaseProgress(`${currentPhaseIndex + 1} / ${activePhases.length}`);
      const req = getRequiredIngredients(selectedRecipe, currentPhase.key, selectedSize);
      setFailedRequired(req);
      setFailedSelected(currentSelections);
    }

    setErrorDetails([t('timer_ended')]);
    setGameState("RESULT_FAIL");
    setResultMessage(FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]);
  };

  handleTimeoutRef.current = handleTimeout;

  // Timer useEffect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (gameState === "PLAYING") {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            if (handleTimeoutRef.current) handleTimeoutRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimer(20);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);

  const handleSelection = (ingredient: string) => {
    if (gameState !== "PLAYING") return;

    const activePhases = getCurrentPhases(selectedRecipe);
    const phaseKey = activePhases[currentPhaseIndex].key;

    if (phaseKey === "size") {
      setSelectedSize(ingredient);
      setCurrentPhaseIndex(prev => prev + 1);
      setTimer(20);
      setFeedback({ type: null, message: "" });
      return;
    }

    const requiredList = getRequiredIngredients(selectedRecipe, phaseKey, selectedSize);
    const isCorrect = requiredList.includes(ingredient);

    playSound(isCorrect ? "happy" : "sad");

    if (currentSelections.length >= requiredList.length && !isCorrect) {
      // Limit reached, can't add more incorrect ones
      return;
    }

    const newSelections = [...currentSelections, ingredient];
    setCurrentSelections(newSelections);

    if (isCorrect) {
      setFeedback({
        type: 'correct',
        message: `${t('training_correct')}: ${t(('phase_' + phaseKey) as any)}`,
        item: ingredient
      });
    } else {
      setFeedback({
        type: 'incorrect',
        message: t('training_you_selected') + ` ${ingredient}. ` + t('training_you_needed') + ` ${requiredList.join(', ')}`,
        item: ingredient
      });
    }

    let shouldAdvance = newSelections.length === requiredList.length;
    
    // Nutty Fit edge case
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
          setFeedback({
            type: 'correct',
            message: t('training_phase_complete')
          });
        }, 350);
      } else {
        validateGame(updatedAll);
      }
    }
  };

  const handleUndo = () => {
    if (currentSelections.length > 0) {
      setCurrentSelections(prev => prev.slice(0, -1));
      setFeedback({ type: null, message: "" });
    }
  };

  const validateGame = (finalSelections: Record<string, string[]>) => {
    let errors: string[] = [];
    const activePhases = getCurrentPhases(selectedRecipe);
    const phasesToValidate = activePhases.filter(p => p.key !== "size");

    let firstFailedPhase: RecipePhaseKey | null = null;

    phasesToValidate.forEach(phase => {
      const required = getRequiredIngredients(selectedRecipe, phase.key, selectedSize);
      const actual = finalSelections[phase.key] || [];
      const actualStr = JSON.stringify([...actual].sort());
      const reqStr = JSON.stringify([...required].sort());

      let isValid = actualStr === reqStr;

      // Nutty Fit Edge Case
      if (!isValid && selectedRecipe.name.includes("Nutty Fit") && phase.key === "smoothie_ingredients") {
        const reqWithoutGotas = required.filter(i => i !== "Gotas de Chocolate 1 TBSP 15 ml");
        if (actualStr === JSON.stringify([...reqWithoutGotas].sort())) {
          isValid = true;
        }
      }

      if (!isValid) {
        if (!firstFailedPhase) {
          firstFailedPhase = phase.key;
          setFailedPhaseKey(phase.key);
          setFailedPhaseProgress(`${activePhases.findIndex(p => p.key === phase.key) + 1} / ${activePhases.length}`);
          setFailedRequired(required);
          setFailedSelected(actual);
        }
        errors.push(
          t('instr_error_prefix', {
            phase: t(('phase_' + phase.key) as any),
            required: required.join(", ")
          })
        );
      }
    });

    if (errors.length === 0) {
      setGameState("RESULT_SUCCESS");
      playSound("happy");
      if (window.confetti) {
        window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
      setResultMessage(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
    } else {
      setErrorDetails(errors);
      setGameState("RESULT_FAIL");
      playSound("sad");
      setResultMessage(FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]);
    }
  };

  const restart = () => {
    if (selectedRecipe.category === "GREEN") {
      setSelectedSize("Regular");
      setCurrentPhaseIndex(1);
    } else {
      setSelectedSize(null);
      setCurrentPhaseIndex(0);
    }
    setCurrentSelections([]);
    setAllSelections({});
    setTimer(20);
    setGameState("PLAYING");
    setErrorDetails([]);
    setFeedback({ type: null, message: "" });
    setFailedPhaseKey(null);
    setIsTimeout(false);
  };

  return {
    gameState,
    selectedSize,
    currentPhaseIndex,
    currentSelections,
    allSelections,
    phaseOptions,
    timer,
    errorDetails,
    resultMessage,
    feedback,
    failedPhaseKey,
    failedPhaseProgress,
    failedRequired,
    failedSelected,
    isTimeout,
    handleSelection,
    handleUndo,
    restart
  };
}
