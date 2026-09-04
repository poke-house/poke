import { useState, useMemo } from 'react';
import { Recipe } from '../../types';
import { buildBowlSteps, columnSteps, BowlStep } from '../../utils/bowlSteps';
import { playSound } from '../../utils/sound';

export interface UseUniversityBowlResult {
    selectedRecipe: Recipe | null;
    uniCurrentStep: number;
    bowl: ReturnType<typeof buildBowlSteps> | null;
    stepsR: ReturnType<typeof columnSteps>;
    stepsL: ReturnType<typeof columnSteps>;
    startUniversityLevel: (recipe: Recipe) => void;
    handleUniNext: (onSuccess: () => void) => void;
    handleUniPrev: () => void;
    resetUniversity: () => void;
}

export function useUniversityBowl(): UseUniversityBowlResult {
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [uniCurrentStep, setUniCurrentStep] = useState<number>(0);

    const bowl = useMemo(() => {
        return selectedRecipe ? buildBowlSteps(selectedRecipe) : null;
    }, [selectedRecipe]);

    const stepsR = useMemo(() => {
        return bowl ? columnSteps(bowl.steps, "R") : [];
    }, [bowl]);

    const stepsL = useMemo(() => {
        return bowl ? columnSteps(bowl.steps, "L") : [];
    }, [bowl]);

    const startUniversityLevel = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setUniCurrentStep(0);
    };

    const handleUniNext = (onSuccess: () => void) => {
        const maxSteps = bowl ? bowl.total : 0;
        if (uniCurrentStep < maxSteps - 1) {
            setUniCurrentStep(prev => prev + 1);
            playSound("happy");
        } else if (uniCurrentStep === maxSteps - 1) {
            playSound("happy");
            if (window.confetti) {
                window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }
            onSuccess();
        }
    };

    const handleUniPrev = () => {
        if (uniCurrentStep > 0) {
            setUniCurrentStep(prev => prev - 1);
        }
    };

    const resetUniversity = () => {
        setSelectedRecipe(null);
        setUniCurrentStep(0);
    };

    return {
        selectedRecipe,
        uniCurrentStep,
        bowl,
        stepsR,
        stepsL,
        startUniversityLevel,
        handleUniNext,
        handleUniPrev,
        resetUniversity
    };
}
