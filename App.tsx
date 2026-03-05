

import React, { useState, useEffect, useRef } from 'react';
import { GameState, Recipe, PaPersona, Language, BilingualMessage, QuizQuestion, RushScore, RushPlayer } from './types';
import { 
    RECIPES, INGREDIENTS_DB, THEMES, SUCCESS_MESSAGES, FAIL_MESSAGES, 
    PA_NAMES, PA_EMOJIS, FINAL_CUSTOM_PHRASES, PHASES_BOWL, PHASES_SMOOTHIE, CHANGELOG, RUSH_MESSAGES,
    QUIZ_QUESTIONS
} from './constants';
import { TRANSLATIONS } from './translations';
import { playSound } from './utils/sound';
import { shuffleArray } from './utils/helpers';
import { getSupabase } from './utils/supabaseClient';
import { IconHome, IconArrowLeft, IconArrowRight, IconCheck, IconRotate } from './components/Icons';
import { FoodRain } from './components/FoodRain';
import { PopupModal, ChangelogModal, RushEntryModal } from './components/Modals';
import { MessageBubble } from './components/MessageBubble';

function App() {
    const [gameState, setGameState] = useState<GameState>("HOME");
    const [language, setLanguage] = useState<Language>('pt');
    const [menuCategory, setMenuCategory] = useState<string | null>(null); 
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null); 
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [currentSelections, setCurrentSelections] = useState<string[]>([]);
    const [allSelections, setAllSelections] = useState<{[key: string]: string | string[]}>({});
    const [phaseOptions, setPhaseOptions] = useState<string[]>([]);
    const [timer, setTimer] = useState(20);
    const [errorDetails, setErrorDetails] = useState<string[]>([]);
    const [showChangelog, setShowChangelog] = useState(false);
    const [resultMessage, setResultMessage] = useState<BilingualMessage>({pt: "", en: ""});
    const [customPhase, setCustomPhase] = useState(0);
    const [paPersona, setPaPersona] = useState<PaPersona>({ name: "", emoji: "" });
    const [showPopup, setShowPopup] = useState<{ msg: string; callback: () => void } | null>(null);
    const [easterEggTrigger, setEasterEggTrigger] = useState(0);
    const [dancingEmoji, setDancingEmoji] = useState<number | null>(null);
    const [rushScore, setRushScore] = useState(0);
    const [rushLives, setRushLives] = useState(3);
    const [rushPlayer, setRushPlayer] = useState<RushPlayer | null>(null);
    const [topScores, setTopScores] = useState<RushScore[]>([]);
    const [lastScores, setLastScores] = useState<RushScore[]>([]);
    const [showRushEntry, setShowRushEntry] = useState(false);
    const [pendingRushLives, setPendingRushLives] = useState<number>(3);
    const [rushPool, setRushPool] = useState<{recipeId: number, size: string | null}[]>([]);

    // Quiz States
    const [currentQuizQuestion, setCurrentQuizQuestion] = useState<QuizQuestion | null>(null);
    const [quizOptions, setQuizOptions] = useState<string[]>([]);
    const [quizCorrectAnswer, setQuizCorrectAnswer] = useState<string>("");
    const [quizFeedbackTimer, setQuizFeedbackTimer] = useState<number | null>(null);
    const [quizScore, setQuizScore] = useState(0);

    // University Mode States
    const [uniSteps, setUniSteps] = useState<{phase: string, item: string, count: number}[]>([]);
    const [uniStepsLarge, setUniStepsLarge] = useState<{phase: string, item: string, count: number}[]>([]);
    const [uniCurrentStep, setUniCurrentStep] = useState(0);

    const handleEasterEggClick = () => { if (window.innerWidth < 768) { setEasterEggTrigger(prev => prev + 1); } };
    
    const t = (key: string, params: {[key: string]: string | number} = {}) => {
        // @ts-ignore
        const text = TRANSLATIONS[language][key] || key;
        return Object.keys(params).reduce((acc, param) => {
            return acc.replace(`{${param}}`, String(params[param]));
        }, text);
    };

    useEffect(() => {
        if (gameState !== "HOME" && menuCategory !== null) {
            setDancingEmoji(null);
            return;
        }
        const interval = setInterval(() => {
            const next = Math.floor(Math.random() * 6);
            setDancingEmoji(next);
            setTimeout(() => setDancingEmoji(null), 1500);
        }, 3000);
        return () => clearInterval(interval);
    }, [gameState, menuCategory]);

    const getCurrentPhases = () => { if (selectedRecipe?.category === "SMOOTHIE") return PHASES_SMOOTHIE; return PHASES_BOWL; };
    const getFullIngredientList = (key: string): string[] => { 
        if(key === 'base') return INGREDIENTS_DB.bases; 
        if(key === 'sauce_base') return INGREDIENTS_DB.sauces_base; 
        if(key === 'greens') return INGREDIENTS_DB.greens; 
        if(key === 'protein') return INGREDIENTS_DB.proteins; 
        if(key === 'sauce_final') return INGREDIENTS_DB.sauces_final; 
        if(key === 'crispy') return INGREDIENTS_DB.crispies; 
        if(key === 'sesame') return INGREDIENTS_DB.sesame; 
        if(key === 'smoothie_liquid') return INGREDIENTS_DB.smoothie_liquid; 
        if(key === 'smoothie_amount') return INGREDIENTS_DB.smoothie_amount; 
        if(key === 'smoothie_ingredients') return INGREDIENTS_DB.smoothie_ingredients; 
        if(key === 'smoothie_ice') return INGREDIENTS_DB.smoothie_ice; 
        if(key === 'smoothie_mode') return INGREDIENTS_DB.smoothie_mode; 
        return []; 
    };
    const getCurrentPhaseData = () => { if(!selectedRecipe) return { key: '', title: '' }; const phases = getCurrentPhases(); return phases[currentPhaseIndex]; };
    
    const getSelectionLimit = () => { 
        if (!selectedRecipe) return 0; 
        const phaseKey = getCurrentPhases()[currentPhaseIndex].key; 
        if (phaseKey === "size") return 1; 
        if (selectedRecipe.category === "SMOOTHIE") { 
            return (selectedRecipe as any)[phaseKey]?.length || 0; 
        } else { 
            const sizeToUse = selectedSize || "Regular"; 
            return selectedRecipe.variants && selectedRecipe.variants[sizeToUse] ? selectedRecipe.variants[sizeToUse][phaseKey].length : 0; 
        } 
    };

    const getInstructionText = () => {
        const phase = getCurrentPhaseData();
        const limit = getSelectionLimit();
        if (selectedRecipe?.category === 'HOUSE') {
            if (phase.key === 'size') return t('instr_house_size');
            if (phase.key === 'base') return t('instr_house_base');
        }
        if (limit > 1) return t('instr_generic_limit', {limit: limit});
        return t('instr_generic_single');
    };

    const currentTheme = selectedRecipe ? THEMES[selectedRecipe.category] : (gameState.startsWith("QUIZ") ? THEMES.QUIZ : THEMES.HOUSE);

    const getSidebarClass = () => {
        if (menuCategory === null && gameState !== "CUSTOM_BOWL" && gameState !== "UNIVERSITY_SELECT") return "bg-white/80 backdrop-blur-md";
        if (menuCategory === "HOUSE") return "bg-pastel-blue-50";
        if (menuCategory === "GREEN") return "bg-pastel-pink-50";
        if (menuCategory === "SMOOTHIE") return "bg-pastel-yellow-50";
        return "bg-white";
    };

    const getBackBtnClass = () => {
        if (menuCategory === "HOUSE") return "text-pastel-blue-text hover:bg-pastel-blue-100";
        if (menuCategory === "GREEN") return "text-pastel-pink-text hover:bg-pastel-pink-100";
        if (menuCategory === "SMOOTHIE") return "text-pastel-yellow-text hover:bg-pastel-yellow-100";
        return "text-gray-500 hover:text-brand-blue";
    };

    const getRecipeHoverClass = () => {
        if (menuCategory === "HOUSE") return "hover:bg-pastel-blue-100";
        if (menuCategory === "GREEN") return "hover:bg-pastel-pink-100";
        if (menuCategory === "SMOOTHIE") return "hover:bg-pastel-yellow-100";
        return "hover:bg-gray-100";
    };

    const getScrollClass = () => {
        if ((gameState === "PLAYING" || gameState === "RUSH_PLAYING" || gameState === "UNIVERSITY_PLAYING") && selectedRecipe) {
            if (selectedRecipe.category === "HOUSE") return "scroll-blue";
            if (selectedRecipe.category === "GREEN") return "scroll-pink";
            if (selectedRecipe.category === "SMOOTHIE") return "scroll-yellow";
        }
        if (gameState === "CUSTOM_BOWL") {
            if (customPhase === 5) return "scroll-pink"; 
            if (customPhase === 7) return "scroll-yellow"; 
            return "scroll-blue"; 
        }
        if (gameState === "RUSH_GAME_OVER" || gameState === "RUSH_ERROR" || gameState === "RUSH_SELECT") return "scroll-rush";
        if (gameState === "RESULT_FAIL") return "scroll-red";
        if (gameState.startsWith("QUIZ")) return "scroll-blue";
        return "scroll-blue";
    };

    const scrollClass = getScrollClass();
    const sidebarScrollClass = menuCategory === "HOUSE" ? "scroll-blue" : menuCategory === "GREEN" ? "scroll-pink" : menuCategory === "SMOOTHIE" ? "scroll-yellow" : "";

    useEffect(() => {
        let interval: any;
        if (gameState === "PLAYING" || gameState === "RUSH_PLAYING" || gameState === "QUIZ_PLAYING") {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (gameState === "RUSH_PLAYING") handleRushError([t('timer_ended')]);
                        else if (gameState === "QUIZ_PLAYING") handleQuizFail();
                        else handleGameOver(false, [t('timer_ended')]);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else { if (gameState !== "QUIZ_FEEDBACK") setTimer(20); }
        return () => clearInterval(interval);
    }, [gameState]);
    
    useEffect(() => {
        if ((gameState === "PLAYING" || gameState === "RUSH_PLAYING") && selectedRecipe) {
            const activePhases = getCurrentPhases();
            const phaseKey = activePhases[currentPhaseIndex].key;
            if (phaseKey === "size") { setPhaseOptions(INGREDIENTS_DB.sizes); return; }
            let fullList = getFullIngredientList(phaseKey);
            let requiredIngs: string[] = [];
            if (selectedRecipe.category === "SMOOTHIE") { 
                requiredIngs = (selectedRecipe as any)[phaseKey] || []; 
            } else { 
                const sizeToUse = selectedSize || "Regular"; 
                requiredIngs = selectedRecipe.variants && selectedRecipe.variants[sizeToUse] ? selectedRecipe.variants[sizeToUse][phaseKey] : []; 
            }
            
            const requiredSet = new Set(requiredIngs);
            const requiredUnique = [...requiredSet];
            let distractors = fullList.filter(ing => !requiredSet.has(ing));
            
            // Intelligent Distractor Logic for Weights
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
    }, [currentPhaseIndex, gameState, selectedRecipe, selectedSize]);

    const startGame = (recipe: Recipe) => { setSelectedRecipe(recipe); setGameState("PLAYING"); setupRecipeStart(recipe, false); };
    const startRushMode = async () => { 
        setGameState("RUSH_SELECT");
        fetchLeaderboard();
    };

    const fetchLeaderboard = async () => {
        const supabase = getSupabase();
        if (!supabase) {
            console.warn("Supabase not configured. Leaderboard will be empty.");
            return;
        }
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: topRaw } = await supabase
                .from('rush_scores')
                .select('*')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('score', { ascending: false })
                .limit(50);

            const { data: last } = await supabase
                .from('rush_scores')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (topRaw) {
                // Filter to keep only the highest score per player
                const uniquePlayers = new Map<string, any>();
                for (const score of topRaw) {
                    const key = score.player_name.toLowerCase().trim();
                    if (!uniquePlayers.has(key)) {
                        uniquePlayers.set(key, score);
                    }
                }
                const top = Array.from(uniquePlayers.values()).slice(0, 3);
                setTopScores(top);
            }
            if (last) setLastScores(last);
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
        }
    };

    const handleRushStart = (name: string, store: string) => {
        setRushPlayer({ name, store });
        setShowRushEntry(false);
        confirmRushStart(pendingRushLives);
    };

    const startQuizMode = () => { setQuizScore(0); setGameState("QUIZ_PLAYING"); nextQuizQuestion(); };
    const startUniversityMode = () => setGameState("UNIVERSITY_SELECT");

    const startUniversityLevel = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        const generateLevelSteps = (variantName: string | null) => {
             let steps: {phase: string, item: string, count: number}[] = [];
             const phases = recipe.category === "SMOOTHIE" ? PHASES_SMOOTHIE : PHASES_BOWL;
             const validPhases = phases.filter(p => p.key !== "size");
             validPhases.forEach(phase => {
                let items: string[] = [];
                if (recipe.category === "SMOOTHIE") items = (recipe as any)[phase.key] || [];
                else items = recipe.variants && recipe.variants[variantName || "Regular"] ? recipe.variants[variantName || "Regular"][phase.key] : [];
                items.forEach(item => {
                    if (steps.length > 0 && steps[steps.length - 1].phase === phase.title && steps[steps.length - 1].item === item) {
                        steps[steps.length - 1].count += 1;
                    } else steps.push({ phase: phase.title, item: item, count: 1 });
                });
             });
             return steps;
        };
        setUniSteps(generateLevelSteps("Regular"));
        setUniStepsLarge(recipe.category !== "SMOOTHIE" ? generateLevelSteps("Large") : []);
        setUniCurrentStep(0);
        setGameState("UNIVERSITY_PLAYING");
    };

    const handleUniNext = () => {
        const maxSteps = Math.max(uniSteps.length, uniStepsLarge.length);
        if (uniCurrentStep < maxSteps) {
            setUniCurrentStep(prev => prev + 1);
            playSound("happy");
            if (uniCurrentStep === maxSteps - 1) {
                if (window.confetti) window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                setTimeout(() => setGameState("UNIVERSITY_SUCCESS"), 1000);
            }
        }
    };

    const handleUniPrev = () => { if (uniCurrentStep > 0) setUniCurrentStep(prev => prev - 1); };

    const nextQuizQuestion = () => {
        const randomIndex = Math.floor(Math.random() * QUIZ_QUESTIONS.length);
        const q = QUIZ_QUESTIONS[randomIndex];
        setCurrentQuizQuestion(q);
        setQuizCorrectAnswer(q.options[0]);
        setQuizOptions(shuffleArray([...q.options]));
        setTimer(10);
        setGameState("QUIZ_PLAYING");
    };

    const handleQuizAnswer = (answer: string) => {
        if (gameState !== "QUIZ_PLAYING") return;
        if (answer === quizCorrectAnswer) {
            setQuizScore(prev => prev + 1);
            playSound("happy");
            if (window.confetti) window.confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 }, colors: ['#10B981'] });
            nextQuizQuestion();
        } else handleQuizFail();
    };

    const handleQuizFail = () => { playSound("sad"); setGameState("QUIZ_FEEDBACK"); setQuizFeedbackTimer(5); };

    useEffect(() => {
        let interval: any;
        if (gameState === "QUIZ_FEEDBACK" && quizFeedbackTimer !== null) {
            interval = setInterval(() => {
                setQuizFeedbackTimer(prev => {
                    if (prev !== null && prev <= 1) { clearInterval(interval); resetToHome(); return null; }
                    return prev !== null ? prev - 1 : null;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, quizFeedbackTimer]);

    const generateRushPool = () => {
        const pool: {recipeId: number, size: string | null}[] = [];
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

    const confirmRushStart = (lives: number) => { 
        setRushScore(0); 
        setRushLives(lives); 
        const newPool = generateRushPool();
        const first = newPool[0];
        setRushPool(newPool.slice(1));
        
        const recipe = RECIPES.find(r => r.id === first.recipeId)!;
        setSelectedRecipe(recipe);
        setGameState("RUSH_PLAYING");
        setupRecipeStart(recipe, true, first.size);
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
        setGameState("RUSH_PLAYING");
        setupRecipeStart(recipe, true, next.size);
    };

    const setupRecipeStart = (recipe: Recipe, isRush: boolean = false, forcedSize?: string | null) => {
        if (recipe.category === "GREEN") { 
            setSelectedSize("Regular"); 
            setCurrentPhaseIndex(1); 
        } else if (recipe.category === "SMOOTHIE") { 
            setSelectedSize(null); 
            setCurrentPhaseIndex(0); 
        } else { // HOUSE
            if (isRush) {
                const sizeToUse = forcedSize !== undefined ? forcedSize : (Math.random() > 0.5 ? "Regular" : "Large");
                setSelectedSize(sizeToUse);
                setCurrentPhaseIndex(1); // Skip size selection in Rush Mode
            } else {
                setSelectedSize(null); 
                setCurrentPhaseIndex(0); 
            }
        } 
        setCurrentSelections([]); 
        setAllSelections({}); 
        setTimer(20);
    };

    const resetToHome = () => { setGameState("HOME"); setMenuCategory(null); setSelectedRecipe(null); setSelectedSize(null); setCurrentQuizQuestion(null); setTimer(20); };
    
    const handleSelection = (ingredient: string) => {
        const activePhases = getCurrentPhases(); 
        const phaseKey = activePhases[currentPhaseIndex].key;
        if (phaseKey === "size") { setSelectedSize(ingredient); setCurrentPhaseIndex(prev => prev + 1); setTimer(20); return; }
        let requiredList: string[] = []; 
        if (selectedRecipe?.category === "SMOOTHIE") requiredList = (selectedRecipe as any)[phaseKey]; 
        else requiredList = selectedRecipe?.variants ? selectedRecipe.variants[selectedSize || "Regular"][phaseKey] : [];
        
        const isCorrect = requiredList.includes(ingredient); 
        if (gameState === "RUSH_PLAYING" && !isCorrect) {
            handleRushError([t('instr_error_prefix', {phase: t('phase_' + phaseKey), required: requiredList.join(", ")})]);
            return;
        }
        playSound(isCorrect ? "happy" : "sad");
        if (currentSelections.length >= requiredList.length && !requiredList.includes(ingredient)) return;
        const newSelections = [...currentSelections, ingredient]; 
        setCurrentSelections(newSelections);
        if (newSelections.length === requiredList.length) {
            const updatedAll = { ...allSelections, [phaseKey]: newSelections }; 
            setAllSelections(updatedAll);
            if (currentPhaseIndex < activePhases.length - 1) { 
                setTimeout(() => { setCurrentPhaseIndex(prev => prev + 1); setCurrentSelections([]); setTimer(20); }, 250); 
            } else validateGame(updatedAll); 
        }
    };

    const handleUndo = () => { if (currentSelections.length > 0) setCurrentSelections(prev => prev.slice(0, -1)); };

    const validateGame = (finalSelections: any) => { 
        let errors: string[] = []; 
        const activePhases = getCurrentPhases(); 
        const phasesToValidate = activePhases.filter(p => p.key !== "size"); 
        phasesToValidate.forEach(phase => { 
            let required: string[] = []; 
            if (selectedRecipe?.category === "SMOOTHIE") required = (selectedRecipe as any)[phase.key]; 
            else required = selectedRecipe?.variants ? selectedRecipe.variants[selectedSize || "Regular"][phase.key] : []; 
            if (JSON.stringify([...required].sort()) !== JSON.stringify([...finalSelections[phase.key]].sort())) { 
                errors.push(t('instr_error_prefix', {phase: t('phase_' + phase.key), required: required.join(", ")})); 
            } 
        }); 
        if (gameState === "RUSH_PLAYING") {
             if (errors.length === 0) {
                 setRushScore(s => s + 1); playSound("happy");
                 if (window.confetti) window.confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
                 nextRushRound();
             } else handleRushError(errors);
        } else handleGameOver(errors.length === 0, errors);
    };

    const handleRushError = (errors: string[]) => { playSound("sad"); setErrorDetails(errors); if (rushLives > 1) setGameState("RUSH_ERROR"); else handleRushGameOver(errors); }
    const consumeRushLife = () => { setRushLives(prev => prev - 1); nextRushRound(); }
    const handleRushGameOver = async (errors: string[] = []) => {
        playSound("sad"); setErrorDetails(errors); setGameState("RUSH_GAME_OVER"); setRushLives(0);
        const sorted = [...RUSH_MESSAGES].sort((a,b) => b.threshold - a.threshold);
        setResultMessage(sorted.find(m => rushScore >= m.threshold)?.msg || { pt: "Foco! 🧐", en: "Focus! 🧐" });
        
        if (rushPlayer) {
            const supabase = getSupabase();
            if (supabase) {
                try {
                    await supabase.from('rush_scores').insert([{
                        player_name: rushPlayer.name,
                        store_name: rushPlayer.store,
                        score: rushScore
                    }]);
                } catch (err) {
                    console.error("Error saving score:", err);
                }
            } else {
                console.warn("Supabase not configured. Score not saved.");
            }
        }
    };

    const handleGameOver = (success: boolean, errors: string[]) => { 
        if (success) { 
            setGameState("RESULT_SUCCESS"); playSound("happy"); 
            if (window.confetti) window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            setResultMessage(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]); 
        } else { setErrorDetails(errors); setGameState("RESULT_FAIL"); playSound("sad"); setResultMessage(FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]); } 
    };

    const initCustomGame = () => { 
        const isFemale = Math.random() > 0.5; 
        setPaPersona({ name: (isFemale ? PA_NAMES.FEMALE : PA_NAMES.MALE)[Math.floor(Math.random() * 6)], emoji: (isFemale ? PA_EMOJIS.FEMALE : PA_EMOJIS.MALE)[Math.floor(Math.random() * 4)] }); 
        setGameState("CUSTOM_BOWL"); setCustomPhase(1); setAllSelections({}); setCurrentSelections([]); 
    };

    const handleCustomSize = (size: string) => { setAllSelections(prev => ({...prev, size: size})); setCustomPhase(4); setCurrentSelections([]); };
    const handleCustomNext = () => { setCustomPhase(prev => (prev < 4 ? prev + 1 : prev === 8 ? 9 : prev + 1)); setCurrentSelections([]); };
    const handleCustomBack = () => { 
        if (currentSelections.length > 0) { setCurrentSelections(prev => prev.slice(0, -1)); return; } 
        if (customPhase === 1) setGameState("HOME"); else setCustomPhase(prev => prev - 1);
    };

    const finishCustomBowl = () => { setResultMessage(FINAL_CUSTOM_PHRASES[Math.floor(Math.random() * FINAL_CUSTOM_PHRASES.length)]); setCustomPhase(10); };

    const handleCustomSelection = (item: string, type: string) => { 
        const popupTrigger = (msg: string) => setShowPopup({ msg, callback: () => { setShowPopup(null); addCustomItem(item, type); } }); 
        const size = (allSelections['size'] as string) || "Regular";
        if (type === 'base' && item === "Espinafres") return popupTrigger(t('popup_base_oil')); 
        if (type === 'base' && item === "Winter Salad") return popupTrigger(t('popup_base_vinaigrette')); 
        if (type === 'green') {
            const limit = size === "Large" ? 5 : 4;
            const currentCount = currentSelections.length;
            const isAbacate = item === "Abacate";
            const isOtherPremium = ["Philadelphia", "Wakame", "Manga"].includes(item);
            if (currentCount >= limit) return popupTrigger(t(isAbacate ? 'popup_extra_premium' : isOtherPremium ? 'popup_extra_premium' : 'popup_extra', {val: isAbacate ? '1' : '0.80'}));
            if (isAbacate) return popupTrigger(t('popup_premium', {val: '0.50'}));
            if (isOtherPremium) return popupTrigger(t('popup_premium', {val: '0.30'}));
        }
        if (type === 'sauce') {
             if (currentSelections.length >= 1) return popupTrigger(t('popup_generic_extra', {val: item === "Creme de Abacate" ? '0.60' : '0.30'}));
             else if (item === "Creme de Abacate") return popupTrigger(t('popup_sauce_avocado')); 
        }
        if (type === 'protein') {
            const limit = size === "Large" ? 3 : 2;
            const isExpensive = item === "Salmão Braseado" || item === "Filé de Salmão";
             if (currentSelections.length >= limit) return popupTrigger(t('popup_generic_extra', {val: isExpensive ? '2.00' : '1.50'}));
             else if (isExpensive) return popupTrigger(t('popup_protein_expensive')); 
        }
        addCustomItem(item, type); 
    };

    const addCustomItem = (item: string, type: string) => { 
        let limit = type === 'base' ? 2 : type === 'crispy' ? 2 : 99; 
        if (currentSelections.length < limit) { setCurrentSelections(prev => [...prev, item]); playSound("happy"); } 
    };
    
    const checkStepComplete = () => {
        const size = (allSelections['size'] as string) || "Regular";
        let stepLimit = customPhase === 4 ? 2 : customPhase === 5 ? (size === "Large" ? 5 : 4) : customPhase === 6 ? (size === "Large" ? 3 : 2) : customPhase === 7 ? 1 : customPhase === 8 ? 2 : 0;
        return stepLimit > 0 && currentSelections.length >= stepLimit;
    };

    const renderCustomBowl = () => {
        const size = (allSelections['size'] as string) || "Regular";
        const renderGreenSection = (title: string, items: string[]) => (
            <div className="mb-6 last:mb-0">
                <h4 className="text-pastel-pink-text font-bold text-md mb-2 px-1 opacity-80 uppercase tracking-wide text-xs">{title}</h4>
                <div className="grid grid-cols-2 gap-3">{items.map(ing => {
                    const count = currentSelections.filter(i => i === ing).length;
                    return (
                        <button key={ing} onClick={() => handleCustomSelection(ing, 'green')} className={`relative p-3 rounded-win shadow-sm text-sm font-medium text-left btn-transition ${currentSelections.includes(ing) ? 'bg-pastel-pink-100 text-pastel-pink-text' : 'bg-white text-gray-700 hover:bg-pastel-pink-50 hover:text-pastel-pink-text'}`}>
                            {ing}{count > 0 && <div className="absolute top-0 right-0 bg-brand-pink text-white w-8 h-8 flex items-center justify-center font-bold text-lg shadow-sm">{count}</div>}
                        </button>
                    );
                })}</div>
            </div>
        );

        switch(customPhase) {
            case 1: return ( <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 animate-fade-in"><div className="text-6xl mb-4">{paPersona.emoji}</div><MessageBubble className="bg-pastel-blue-50 text-pastel-blue-text" text={t('cb_intro', {name: paPersona.name})} /><button onClick={handleCustomNext} className="bg-brand-pink text-white px-8 py-3 rounded-win font-bold text-lg shadow-fluent hover:bg-pink-600 transition-all btn-transition">{t('cb_intro_btn')}</button></div> );
            case 2: return ( <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 animate-fade-in relative"><MessageBubble className="bg-pastel-blue-50 text-pastel-blue-text" text={t('cb_here_togo')} /><div className="flex gap-4"><button onClick={handleCustomNext} className="bg-white text-pastel-blue-text px-8 py-4 rounded-win font-bold text-xl shadow-sm hover:bg-pastel-blue-50 btn-transition">{t('cb_btn_here')}</button><button onClick={() => setShowPopup({ msg: t('cb_togo_confirm'), callback: () => { setShowPopup(null); handleCustomNext(); } })} className="bg-white text-pastel-pink-text px-8 py-4 rounded-win font-bold text-xl shadow-sm hover:bg-pastel-pink-50 btn-transition">{t('cb_btn_togo')}</button></div><button onClick={handleCustomBack} className="absolute bottom-6 left-6 text-gray-500 hover:text-[#29B6F6] flex items-center gap-2 font-medium transition-colors"><IconArrowLeft size={20} /> {t('btn_back')}</button></div> );
            case 3: return ( <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 animate-fade-in relative"><MessageBubble className="bg-pastel-blue-50 text-pastel-blue-text" text={t('cb_size_q')} /><div className="flex gap-4"><button onClick={() => handleCustomSize("Large")} className="bg-white text-pastel-blue-text px-8 py-6 rounded-win font-bold text-2xl shadow-sm hover:bg-pastel-blue-50 hover:scale-105 btn-transition">LARGE</button><button onClick={() => handleCustomSize("Regular")} className="bg-white text-pastel-pink-text px-8 py-6 rounded-win font-bold text-2xl shadow-sm hover:bg-pastel-pink-50 hover:scale-105 btn-transition">REGULAR</button></div><button onClick={handleCustomBack} className="absolute bottom-6 left-6 text-gray-500 hover:text-[#29B6F6] flex items-center gap-2 font-medium transition-colors"><IconArrowLeft size={20} /> {t('btn_back')}</button></div> );
            case 4: return ( <div className="flex flex-col h-full p-4 animate-fade-in"><div className="mb-4"><MessageBubble className="bg-pastel-blue-50 text-pastel-blue-text" text={t('cb_base_q')} isTitle={true} /></div><div className={`flex-1 overflow-y-auto grid grid-cols-2 gap-3 pb-20 custom-scroll ${scrollClass}`}>{INGREDIENTS_DB.bases.map(ing => (
                <button key={ing} onClick={() => handleCustomSelection(ing, 'base')} className={`relative p-4 rounded-win shadow-sm font-medium text-left btn-transition ${currentSelections.includes(ing) ? 'bg-pastel-blue-100 text-pastel-blue-text' : 'bg-white text-gray-700 hover:bg-pastel-blue-50 hover:text-pastel-blue-text'}`}>
                    {ing}{currentSelections.filter(i => i === ing).length > 0 && <div className="absolute top-0 right-0 bg-brand-blue text-white w-8 h-8 flex items-center justify-center font-bold text-lg shadow-sm">{currentSelections.filter(i => i === ing).length}</div>}
                </button>
            ))}</div></div> );
            case 5: return ( <div className="flex flex-col h-full p-4 animate-fade-in"><div className="mb-4"><MessageBubble className="bg-pastel-pink-50 text-pastel-pink-text" text={t('cb_greens_q', {limit: size === "Large" ? 5 : 4})} isTitle={true} /></div><div className={`flex-1 overflow-y-auto pb-20 custom-scroll ${scrollClass}`}>{renderGreenSection(t('sec_naturals'), ["Hummus", "Abacaxi", "Edamame", "Tomate Cherry", "Couve roxa", "Courgette", "Cenoura", "Grana Padano", "Pepino", "Feta", "Jalapeños", "Pickle Cebola", "Azeitonas", "Beterraba"])}{renderGreenSection(t('sec_cooked'), ["Batata Doce com Alecrim", "Brócolis", "Milho", "Cenoura c/ Soja"])}{renderGreenSection(t('sec_premium'), ["Abacate", "Philadelphia", "Wakame", "Manga"])}</div></div> );
            case 6: return ( <div className="flex flex-col h-full p-4 animate-fade-in"><div className="mb-4"><MessageBubble className="bg-pastel-blue-50 text-pastel-blue-text" text={t('cb_protein_q', {limit: size === "Large" ? 3 : 2})} isTitle={true} /></div><div className={`flex-1 overflow-y-auto grid grid-cols-2 gap-3 pb-20 custom-scroll ${scrollClass}`}>{INGREDIENTS_DB.proteins.filter(p => p !== "Wakame").map(ing => (
                <button key={ing} onClick={() => handleCustomSelection(ing, 'protein')} className={`relative p-4 rounded-win shadow-sm font-medium text-left btn-transition ${currentSelections.includes(ing) ? 'bg-pastel-blue-100 text-pastel-blue-text' : 'bg-white text-gray-700 hover:bg-pastel-blue-50 hover:text-pastel-blue-text'}`}>
                    {ing}{currentSelections.filter(i => i === ing).length > 0 && <div className="absolute top-0 right-0 bg-brand-blue text-white w-8 h-8 flex items-center justify-center font-bold text-lg shadow-sm">{currentSelections.filter(i => i === ing).length}</div>}
                </button>
            ))}</div></div> );
            case 7: return ( <div className="flex flex-col h-full p-4 animate-fade-in"><div className="mb-4"><MessageBubble className="bg-pastel-yellow-50 text-pastel-yellow-text" text={t('cb_sauce_q')} isTitle={true} /></div><div className={`flex-1 overflow-y-auto grid grid-cols-2 gap-3 pb-20 custom-scroll ${scrollClass}`}>{INGREDIENTS_DB.sauces_final.map(ing => (
                <button key={ing} onClick={() => handleCustomSelection(ing, 'sauce')} className={`relative p-4 rounded-win shadow-sm font-medium text-left btn-transition ${currentSelections.includes(ing) ? 'bg-pastel-yellow-100 text-pastel-yellow-text' : 'bg-white text-gray-700 hover:bg-pastel-yellow-50 hover:text-pastel-yellow-text'}`}>
                    {ing}{currentSelections.filter(i => i === ing).length > 0 && <div className="absolute top-0 right-0 bg-yellow-500 text-white w-8 h-8 flex items-center justify-center font-bold text-lg shadow-sm">{currentSelections.filter(i => i === ing).length}</div>}
                </button>
            ))}</div></div> );
            case 8: return ( <div className="flex flex-col h-full p-4 animate-fade-in"><div className="mb-4"><MessageBubble className="bg-pastel-blue-50 text-pastel-blue-text" text={t('cb_crispy_q')} isTitle={true} /></div><div className={`flex-1 overflow-y-auto grid grid-cols-2 gap-3 pb-20 custom-scroll ${scrollClass}`}>{INGREDIENTS_DB.crispies.map(ing => (
                <button key={ing} onClick={() => handleCustomSelection(ing, 'crispy')} className={`relative p-4 rounded-win shadow-sm font-medium text-left btn-transition ${currentSelections.includes(ing) ? 'bg-pastel-blue-100 text-pastel-blue-text' : 'bg-white text-gray-700 hover:bg-pastel-blue-50 hover:text-pastel-blue-text'}`}>
                    {ing}{currentSelections.filter(i => i === ing).length > 0 && <div className="absolute top-0 right-0 bg-brand-blue text-white w-8 h-8 flex items-center justify-center font-bold text-lg shadow-sm">{currentSelections.filter(i => i === ing).length}</div>}
                </button>
            ))}</div></div> );
            case 9: return ( <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 animate-fade-in"><MessageBubble className="bg-pastel-blue-50 text-pastel-blue-text" text={t('cb_sesame_q')} /><div className="flex gap-4"><button onClick={finishCustomBowl} className="bg-white text-pastel-blue-text px-8 py-4 rounded-win font-bold text-xl shadow-sm hover:bg-pastel-blue-50 btn-transition">{t('cb_btn_yes')}</button><button onClick={finishCustomBowl} className="bg-white text-pastel-pink-text px-8 py-4 rounded-win font-bold text-xl shadow-sm hover:bg-pastel-pink-50 btn-transition">{t('cb_btn_no')}</button></div></div> );
            case 10: return ( <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 animate-slide-up"><h2 className="text-3xl font-bold text-brand-blue">{resultMessage[language]}</h2><button onClick={resetToHome} className="bg-brand-pink text-white px-8 py-3 rounded-win font-bold shadow-fluent hover:bg-pink-600 transition-all flex items-center justify-center gap-2 w-full max-w-xs"><IconHome /> {t('cb_result_btn')}</button></div> );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full font-sans text-brand-dark flex flex-col md:flex-row overflow-hidden bg-[#efbeb1]">
            <FoodRain trigger={easterEggTrigger} quantity={1} />
            {showPopup && <PopupModal message={showPopup.msg} onConfirm={showPopup.callback} />}
            {showRushEntry && (
                <RushEntryModal 
                    onStart={handleRushStart} 
                    onClose={() => setShowRushEntry(false)}
                />
            )}

            <div className={`p-6 md:w-80 flex flex-col gap-4 z-10 shadow-fluent transition-colors duration-300 ${getSidebarClass()} ${(gameState === "HOME" || gameState === "UNIVERSITY_SELECT") ? "w-full h-full" : (gameState === "CUSTOM_BOWL" || gameState === "UNIVERSITY_PLAYING" || gameState === "UNIVERSITY_SUCCESS" ? "hidden" : "hidden md:flex h-full")} overflow-hidden custom-scroll ${sidebarScrollClass}`}>
                <div className="flex-shrink flex justify-center min-h-[50px]"><img src="https://i.imgur.com/ILFq2UI.png" alt="Poke House" className="max-h-24 w-auto h-auto object-contain" /></div>
                {menuCategory === null && gameState !== "CUSTOM_BOWL" && gameState !== "UNIVERSITY_SELECT" ? ( 
                    <div className="flex-1 flex flex-col gap-3 md:gap-2 justify-center md:justify-start overflow-y-auto custom-scroll">
                        <div onClick={handleEasterEggClick} className="md:hidden text-5xl text-center py-4 cursor-pointer animate-bounce">🥗</div>
                        <button onClick={initCustomGame} className="bg-gradient-to-r from-brand-pink to-pink-500 text-white p-4 md:p-3 rounded-win shadow-fluent hover:shadow-fluent-hover font-bold text-lg md:text-base flex items-center justify-center gap-2 transform hover:scale-[1.02]">✨ {t('btn_create_bowl')} ✨</button> 
                        <button onClick={startUniversityMode} className="group bg-purple-100 text-purple-900 p-5 md:p-3 rounded-win shadow-sm hover:bg-purple-200 transition-all font-semibold text-lg md:text-base flex items-center gap-3 md:gap-2 relative">
                            <span className="text-2xl md:text-xl group-hover:animate-dance">🎓</span> {t('menu_university')}
                            <div className="absolute bottom-1 right-2 bg-yellow-400 text-yellow-900 text-[9px] md:text-[8px] font-black px-1.5 py-0.5 -rotate-6 shadow-sm border border-white rounded-sm z-10">NEW MODE</div>
                        </button>
                        <button onClick={() => setMenuCategory("HOUSE")} className="group bg-pastel-blue-50 text-pastel-blue-text p-5 md:p-3 rounded-win shadow-sm hover:bg-pastel-blue-100 transition-all font-semibold text-lg md:text-base flex items-center gap-3 md:gap-2"><span className="text-2xl md:text-xl group-hover:animate-dance">🐟</span> {t('menu_house')}</button>
                        <button onClick={() => setMenuCategory("GREEN")} className="group bg-pastel-pink-50 text-pastel-pink-text p-5 md:p-3 rounded-win shadow-sm hover:bg-pastel-pink-100 transition-all font-semibold text-lg md:text-base flex items-center gap-3 md:gap-2"><span className="text-2xl md:text-xl group-hover:animate-dance">🥗</span> {t('menu_green')}</button>
                        <button onClick={() => setMenuCategory("SMOOTHIE")} className="group bg-pastel-yellow-50 text-pastel-yellow-text p-5 md:p-3 rounded-win shadow-sm hover:bg-pastel-yellow-100 transition-all font-semibold text-lg md:text-base flex items-center gap-3 md:gap-2"><span className="text-2xl md:text-xl group-hover:animate-dance">🥤</span> {t('menu_smoothie')}</button>
                        <button onClick={startRushMode} className="group bg-rush-100 text-rush-900 p-5 md:p-3 rounded-win shadow-sm hover:bg-rush-200 transition-all font-semibold text-lg md:text-base flex items-center gap-3 md:gap-2"><span className="text-2xl md:text-xl group-hover:animate-dance">😰</span> {t('menu_rush')}</button>
                        <button onClick={startQuizMode} className="group bg-emerald-100 text-emerald-900 p-5 md:p-3 rounded-win shadow-sm hover:bg-emerald-200 transition-all font-semibold text-lg md:text-base flex items-center gap-3 md:gap-2 relative">
                            <span className="text-2xl md:text-xl group-hover:animate-dance">⁉️</span> {t('menu_quiz')}
                            <div className="absolute bottom-1 right-2 bg-yellow-400 text-yellow-900 text-[9px] md:text-[8px] font-black px-1.5 py-0.5 -rotate-6 shadow-sm border border-white rounded-sm z-10">NEW MODE</div>
                        </button>
                    </div> 
                ) : gameState !== "CUSTOM_BOWL" && ( 
                    <div className="flex-1 flex flex-col gap-2 animate-fade-in overflow-y-auto custom-scroll">
                        <button onClick={() => { if(gameState === "UNIVERSITY_SELECT" && menuCategory === null) resetToHome(); else setMenuCategory(null); }} className={`mb-2 font-medium flex items-center gap-2 px-3 py-2 rounded-win ${getBackBtnClass()}`}><IconArrowLeft size={18}/> {t('btn_back')}</button>
                        <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">{menuCategory || "MENU"}</h3>
                        {gameState === "UNIVERSITY_SELECT" && !menuCategory ? (
                             <div className="flex flex-col gap-3">
                                <p className="text-gray-600 text-sm mb-2">{t('uni_select_category')}</p>
                                <button onClick={() => setMenuCategory("HOUSE")} className="bg-pastel-blue-50 text-pastel-blue-text p-4 rounded-win shadow-sm hover:bg-pastel-blue-100 transition-all font-semibold text-left">🐟 {t('menu_house')}</button>
                                <button onClick={() => setMenuCategory("GREEN")} className="bg-pastel-pink-50 text-pastel-pink-text p-4 rounded-win shadow-sm hover:bg-pastel-pink-100 transition-all font-semibold text-left">🥗 {t('menu_green')}</button>
                                <button onClick={() => setMenuCategory("SMOOTHIE")} className="bg-pastel-yellow-50 text-pastel-yellow-text p-4 rounded-win shadow-sm hover:bg-pastel-yellow-100 transition-all font-semibold text-left">🥤 {t('menu_smoothie')}</button>
                             </div>
                        ) : (
                            menuCategory && RECIPES.filter(r => r.category === menuCategory).map(recipe => ( 
                                <button key={recipe.id} onClick={() => { if (gameState === "UNIVERSITY_SELECT") startUniversityLevel(recipe); else startGame(recipe); }} className={`p-4 rounded-win text-left font-medium text-sm transition-all ${selectedRecipe?.id === recipe.id ? "bg-white/80 shadow-md scale-[1.02] font-bold" : `bg-transparent ${getRecipeHoverClass()}`}`}>{recipe.name}</button> 
                            ))
                        )}
                    </div> 
                )}
            </div>

            <div className={`flex-1 relative z-10 flex flex-col items-center justify-center p-4 pb-12 transition-colors duration-500 ${(gameState === "PLAYING" || gameState === "RUSH_PLAYING" || gameState === "QUIZ_PLAYING" || gameState === "QUIZ_FEEDBACK" || gameState === "UNIVERSITY_PLAYING") ? currentTheme.bg : "bg-[#efbeb1]"} ${gameState === "HOME" ? "hidden md:flex" : "flex h-full"}`}>
                
                {gameState === "RUSH_SELECT" && (
                    <div className="w-full max-w-4xl bg-white rounded-win shadow-fluent flex flex-col md:flex-row overflow-hidden animate-slide-up border-t-8 border-rush-500 max-h-[90vh] md:max-h-none">
                        {/* Leaderboard Side */}
                        <div className="md:w-1/2 bg-gray-50 p-6 md:p-8 border-r border-gray-100 overflow-y-auto max-h-[300px] md:max-h-none custom-scroll">
                            <div className="space-y-6 md:space-y-8">
                                <div>
                                    <h3 className="flex items-center justify-between text-sm font-black text-rush-900 uppercase mb-4">
                                        <span>🥇 Melhores (30 dias)</span>
                                        <span className="text-[9px] opacity-40 font-bold">Reseta mensalmente</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {topScores.length > 0 ? topScores.map((score, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 md:p-3 bg-white rounded-win border border-gray-100 shadow-sm">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <span className="text-lg md:text-xl w-6 md:w-8 text-center">
                                                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                                                    </span>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] md:text-xs font-black text-rush-900 truncate max-w-[100px] md:max-w-[120px]">{score.player_name}</span>
                                                        <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold">{score.store_name}</span>
                                                    </div>
                                                </div>
                                                <span className="text-sm md:text-base font-black text-rush-500">{score.score}</span>
                                            </div>
                                        )) : (
                                            <p className="text-xs text-gray-400 italic">Nenhum recorde ainda...</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-black text-rush-900 uppercase mb-4">
                                        🕒 Últimos Jogadores
                                    </h3>
                                    <div className="space-y-2">
                                        {lastScores.length > 0 ? lastScores.map((score, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-white/50 rounded-win border border-gray-50">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">{score.player_name}</span>
                                                    <span className="text-[9px] text-gray-400 uppercase">{score.store_name}</span>
                                                </div>
                                                <span className="text-xs font-black text-gray-400">{score.score} pts</span>
                                            </div>
                                        )) : (
                                            <p className="text-xs text-gray-400 italic">Ninguém jogou recentemente.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Selection Side */}
                        <div className="md:w-1/2 p-4 md:p-8 flex flex-col justify-center text-center overflow-y-auto custom-scroll">
                            <h2 className="text-xl md:text-3xl font-black text-rush-900 mb-1 md:mb-2 uppercase tracking-tighter">🔥 Hora do Lodo 🔥</h2>
                            <p className="text-rush-300 mb-4 md:mb-8 font-bold uppercase text-[9px] md:text-xs tracking-widest">{t('rush_select_title')}</p>
                            
                            <div className="space-y-2 md:space-y-4">
                                <button 
                                    onClick={() => { setPendingRushLives(3); setShowRushEntry(true); }}
                                    className="w-full group relative overflow-hidden bg-white border-2 border-rush-100 p-3 md:p-6 rounded-win hover:border-rush-500 transition-all shadow-sm hover:shadow-md"
                                >
                                    <div className="relative z-10">
                                        <div className="text-lg md:text-2xl mb-0.5 md:mb-1">{t('rush_btn_douradores')}</div>
                                        <div className="text-[9px] md:text-xs font-black text-rush-300 uppercase tracking-widest">3 VIDAS • MODO NORMAL</div>
                                    </div>
                                    <div className="absolute inset-0 bg-rush-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                <button 
                                    onClick={() => { setPendingRushLives(1); setShowRushEntry(true); }}
                                    className="w-full group relative overflow-hidden bg-white border-2 border-rush-100 p-3 md:p-6 rounded-win hover:border-rush-500 transition-all shadow-sm hover:shadow-md"
                                >
                                    <div className="relative z-10">
                                        <div className="text-lg md:text-2xl mb-0.5 md:mb-1">{t('rush_btn_colombo')}</div>
                                        <div className="text-[9px] md:text-xs font-black text-red-500 uppercase tracking-widest">1 VIDA • MODO HARDCORE</div>
                                    </div>
                                    <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                <div className="pt-4 md:pt-8">
                                    <button 
                                        onClick={resetToHome}
                                        className="text-gray-400 hover:text-rush-500 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors"
                                    >
                                        <IconHome size={16} /> {t('btn_menu_main')} (SAIR)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {gameState === "UNIVERSITY_PLAYING" && selectedRecipe && (
                     <div className="w-full h-full md:h-auto md:max-h-[90vh] md:aspect-[3/4] max-w-4xl bg-white/90 backdrop-blur-xl rounded-win shadow-fluent flex flex-col animate-slide-up relative border border-white">
                        <div className={`p-4 md:p-6 border-b ${currentTheme.border} bg-white/50 flex flex-col items-center justify-center shrink-0 z-20`}>
                             <span className="text-xl md:text-2xl font-bold uppercase tracking-tight text-brand-dark">{selectedRecipe.name}</span>
                             <div className="w-full max-w-md bg-gray-200 h-1.5 mt-4 rounded-full overflow-hidden">
                                <div className="bg-brand-blue h-full transition-all duration-500" style={{ width: `${((uniCurrentStep + 1) / Math.max(uniSteps.length, uniStepsLarge.length || 0)) * 100}%` }}></div>
                             </div>
                             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{t('uni_step_progress', {current: uniCurrentStep + 1, total: Math.max(uniSteps.length, uniStepsLarge.length || 0)})}</div>
                        </div>

                        <div className="flex-1 relative w-full flex justify-center items-center gap-2 md:gap-8 px-2 md:px-4">
                            {[
                                { title: uniStepsLarge.length > 0 ? "REGULAR" : "", steps: uniSteps },
                                ...(uniStepsLarge.length > 0 ? [{ title: "LARGE", steps: uniStepsLarge }] : [])
                            ].map((group, colIndex) => (
                                <div key={colIndex} className="flex flex-col items-center">
                                    {group.title && <h3 className="mb-2 md:mb-4 font-black text-brand-dark tracking-widest text-xs md:text-sm">{group.title}</h3>}
                                    <div className="relative w-[42vw] md:w-56 h-56 md:h-80">
                                        {group.steps.map((step, index) => {
                                            if (index > uniCurrentStep) return null;
                                            const offset = uniCurrentStep - index;
                                            if (offset > 4) return null;
                                            const isCurrent = offset === 0;
                                            return (
                                                <div key={index} className="absolute top-0 left-0 w-full h-full transition-all duration-500 ease-out" style={{ transform: `translateY(${offset * 12}px) scale(${1 - offset * 0.05})`, zIndex: 50 - offset, opacity: Math.max(0, 1 - offset * 0.2), filter: isCurrent ? 'none' : 'grayscale(100%)' }}>
                                                    <div className={`w-full h-full p-3 md:p-6 rounded-win shadow-xl border flex flex-col items-center justify-center text-center bg-white ${isCurrent ? 'border-brand-blue ring-4 ring-brand-blue/10' : 'border-gray-300'}`}>
                                                        <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 md:mb-4">{step.phase}</div>
                                                        <div className={`text-sm md:text-2xl font-bold leading-tight ${isCurrent ? 'text-brand-dark scale-110' : 'text-gray-400'}`}>{step.item}</div>
                                                        {step.count > 1 && <div className={`text-xl md:text-4xl font-black mt-2 ${isCurrent ? 'text-brand-blue' : 'text-gray-300'}`}>{step.count}X</div>}
                                                        {isCurrent && <div className="mt-4 md:mt-6 text-brand-blue animate-bounce"><IconCheck size={24} className="md:w-8 md:h-8" /></div>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {uniCurrentStep >= group.steps.length && (
                                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-win"><IconCheck size={32} className="text-gray-300" /></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 md:p-6 bg-white/80 border-t border-gray-100 flex items-center justify-between gap-4 shrink-0 z-20">
                             <button onClick={resetToHome} className="p-3 text-gray-400 hover:text-brand-pink transition-colors"><IconHome size={24}/></button>
                             <div className="flex items-center gap-4 flex-1 justify-end">
                                <button onClick={handleUniPrev} disabled={uniCurrentStep === 0} className="p-3 md:p-4 rounded-win bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-all font-bold shadow-sm"><IconArrowLeft size={24} /></button>
                                <button onClick={handleUniNext} className={`px-6 py-3 md:px-8 md:py-4 rounded-win bg-brand-blue text-white font-bold shadow-md hover:bg-blue-600 transition-all flex items-center gap-2 transform active:scale-95 ${uniCurrentStep === Math.max(uniSteps.length, uniStepsLarge.length) - 1 ? 'bg-green-500 hover:bg-green-600' : ''}`}>{uniCurrentStep === Math.max(uniSteps.length, uniStepsLarge.length) - 1 ? <span>{t('btn_continue')}</span> : <IconArrowRight size={24} />}</button>
                             </div>
                        </div>
                     </div>
                )}

                {gameState === "UNIVERSITY_SUCCESS" && (
                    <div className="text-center p-12 bg-white rounded-win shadow-fluent animate-slide-up mx-4 max-w-md w-full border-t-8 border-purple-500">
                        <div className="text-6xl mb-6 animate-bounce">🎓</div>
                        <h2 className="text-3xl font-bold text-purple-900 mb-2">{t('res_uni_success_title')}</h2>
                        <p className="text-gray-600 mb-8">{t('res_uni_success_msg')}</p>
                        <button onClick={() => setGameState("UNIVERSITY_SELECT")} className="w-full bg-purple-600 text-white px-6 py-3 rounded-win font-semibold hover:bg-purple-700 mb-3 transition-all">{t('btn_continue')}</button>
                        <button onClick={resetToHome} className="w-full bg-gray-100 text-gray-600 px-6 py-3 rounded-win font-semibold hover:bg-gray-200 transition-all">{t('btn_menu')}</button>
                    </div>
                )}

                {gameState === "QUIZ_PLAYING" && currentQuizQuestion && (
                    <div className="w-full max-w-2xl bg-white rounded-win shadow-fluent flex flex-col overflow-hidden animate-slide-up relative">
                        <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex justify-between items-center relative overflow-hidden"><div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-1000 ease-linear" style={{ width: `${(timer / 10) * 100}%` }} /><div className="flex items-center gap-2"><span className="text-emerald-900 font-black text-sm uppercase tracking-widest">{t('score_label')}: {quizScore}</span></div><div className="flex items-center"><span className={`text-2xl font-bold font-mono ${timer <= 3 ? 'text-red-500 animate-pulse' : 'text-emerald-700'}`}>00:{timer < 10 ? `0${timer}` : timer}</span></div></div>
                        <div className="p-10 md:p-14 text-center flex-1 flex flex-col justify-center gap-10"><h2 className="text-2xl md:text-3xl font-bold text-emerald-900 leading-snug">{currentQuizQuestion.question}</h2><div className={`grid gap-4 w-full ${quizOptions.length === 2 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>{quizOptions.map((opt, i) => (<button key={i} onClick={() => handleQuizAnswer(opt)} className="p-5 bg-emerald-50 border-2 border-emerald-100 rounded-win font-semibold text-emerald-800 hover:bg-emerald-500 hover:text-white transition-all shadow-sm transform hover:scale-[1.02] active:scale-95">{opt}</button>))}</div></div>
                        <div className="p-4 bg-gray-50 flex justify-center"><button onClick={resetToHome} className="text-gray-400 hover:text-brand-pink p-2 flex items-center gap-2 font-bold uppercase text-xs tracking-widest"><IconHome size={16} /> INÍCIO</button></div>
                    </div>
                )}

                {gameState === "QUIZ_FEEDBACK" && (
                    <div className="text-center p-12 bg-white rounded-win shadow-fluent animate-slide-up mx-4 max-w-md w-full border-t-8 border-red-500"><div className="text-5xl mb-4">😕</div><h2 className="text-3xl font-bold text-gray-800 mb-2">{t('res_quiz_fail_title')}</h2><div className="text-3xl font-bold text-emerald-600 mb-6">{quizScore} {t('score_label')}</div><p className="text-gray-500 mb-2 font-medium uppercase text-xs tracking-widest">{t('res_quiz_correct_is')}</p><div className="bg-emerald-50 p-6 rounded-win text-emerald-800 font-bold text-xl mb-8 border border-emerald-100">{quizCorrectAnswer}</div><button onClick={resetToHome} className="w-full bg-gray-800 text-white px-6 py-4 rounded-win font-bold hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2"><IconHome size={18} /> INÍCIO ({quizFeedbackTimer}s)</button></div>
                )}

                {gameState === "CUSTOM_BOWL" && ( 
                    <div className="w-full h-full md:h-auto md:max-h-[90vh] max-w-5xl bg-white/80 backdrop-blur-md rounded-win shadow-fluent flex flex-col overflow-hidden relative border border-white">
                        <div className="flex-1 overflow-hidden relative">{renderCustomBowl()}</div>
                        {customPhase >= 4 && customPhase < 9 && ( 
                            <div className="h-24 bg-white/90 border-t border-gray-200 flex items-center justify-between px-8 shrink-0 z-20 relative"><button onClick={handleCustomBack} className="text-gray-500 hover:text-[#29B6F6] p-4 transition-colors transform hover:scale-110"><IconArrowLeft size={28}/></button><button onClick={resetToHome} className="text-gray-500 hover:text-[#E91E63] p-4 transition-colors transform hover:scale-110"><IconHome size={28}/></button><button onClick={() => { if (checkStepComplete()) handleCustomNext(); }} className={`p-4 transition-all duration-300 transform ${checkStepComplete() ? 'text-[#29B6F6] animate-pulse-fast hover:scale-110' : 'text-gray-300'}`}><IconArrowRight size={28}/></button></div> 
                        )}
                    </div> 
                )}

                {(gameState === "PLAYING" || gameState === "RUSH_PLAYING") && selectedRecipe && ( 
                    <div className={`w-full h-full md:h-auto md:max-h-[90vh] max-w-5xl bg-white/60 backdrop-blur-xl rounded-win shadow-fluent flex flex-col overflow-hidden animate-slide-up border ${currentTheme.border}`}>
                        <div className={`p-4 bg-white/40 border-b ${currentTheme.border} flex justify-between items-center ${currentTheme.text} font-black tracking-tight`}><div className="w-1/4 text-left pl-2 text-sm font-bold">{gameState === "RUSH_PLAYING" ? `😰 ${t('score_label')}: ${rushScore}` : ""}</div><div className="flex-1 text-center"><span className="text-3xl md:text-5xl uppercase tracking-tighter block leading-none">{selectedRecipe.name}</span>{selectedSize && <div className="text-xs md:text-sm font-black opacity-60 tracking-widest mt-1 uppercase">{selectedSize}</div>}</div><div className="w-1/4 text-right pr-2 text-xl tracking-tighter">{gameState === "RUSH_PLAYING" && "❤️".repeat(rushLives)}</div></div>
                        <div className="flex justify-between items-center p-6 border-b border-white/40 bg-white/20"><div><h2 className={`text-2xl font-bold ${currentTheme.text}`}>{t('phase_' + getCurrentPhaseData().key)}</h2><p className="text-sm text-gray-600 mt-1">{getInstructionText()}</p></div><div className="flex flex-col items-center bg-white/80 px-4 py-2 rounded-win shadow-sm"><span className={`text-2xl font-bold font-mono ${timer <= 5 ? 'text-red-500' : 'text-gray-700'}`}>00:{timer < 10 ? `0${timer}` : timer}</span></div></div>
                        <div className={`flex-1 overflow-y-auto p-4 md:p-8 custom-scroll ${scrollClass}`}><div className={`grid gap-3 w-full ${phaseOptions.length > 6 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>{phaseOptions.map((ing, idx) => { const count = currentSelections.filter(i => i === ing).length; let btnClass = currentTheme.btn_default; if (phaseOptions.length === 2 && count === 0) btnClass = `${currentTheme.binary[idx]} shadow-sm opacity-90 hover:opacity-100 hover:scale-[1.02]`; else if (count > 0) btnClass = currentTheme.btn_active; return (<button key={idx} onClick={() => handleSelection(ing)} className={`relative p-4 rounded-win font-bold text-sm transition-all flex items-center justify-center text-center h-24 btn-transition ${btnClass}`}>{ing}{count > 0 && <span className={`absolute -top-2 -right-2 ${currentTheme.text === 'text-pastel-yellow-text' ? 'bg-yellow-500' : 'bg-brand-blue'} text-white text-xs w-6 h-6 flex items-center justify-center rounded-none shadow-sm`}>{count}</span>}</button>)})}</div></div>
                        <div className="p-4 border-t border-white/40 bg-white/30 flex justify-between items-center"><button onClick={resetToHome} className="p-3 bg-white/50 hover:bg-white text-gray-600 hover:text-brand-pink rounded-win transition-all shadow-sm"><IconHome size={22} /></button><button onClick={handleUndo} disabled={currentSelections.length === 0} className="flex items-center gap-2 px-6 py-3 bg-white/80 hover:bg-white rounded-win text-gray-700 font-bold shadow-sm disabled:opacity-50 transition-all"><IconArrowLeft size={18}/> {t('btn_undo')}</button></div>
                    </div> 
                )}

                {gameState === "RUSH_ERROR" && ( 
                    <div className="text-center p-10 bg-white rounded-win shadow-fluent animate-slide-up mx-4 max-w-md w-full border-t-8 border-rush-400"><div className="text-xl mb-4 text-rush-900 font-bold">{"❤️".repeat(rushLives)}</div><h2 className="text-2xl font-bold text-gray-800 mb-2">{t('res_fail_title')}</h2><div className={`bg-red-50 p-4 rounded-win text-left text-sm text-red-600 mb-8 border border-red-100 max-h-40 overflow-y-auto custom-scroll ${scrollClass}`}>{errorDetails.map((e, i) => <div key={i} className="mb-1 pb-1 border-b border-red-100 last:border-0">• {e}</div>)}</div><button onClick={consumeRushLife} className="w-full bg-rush-500 text-white px-6 py-4 rounded-win font-bold text-xl hover:bg-rush-900 shadow-lg animate-pulse-fast transition-all">{t('btn_continue')}</button></div> 
                )}

                {gameState === "RESULT_SUCCESS" && ( 
                    <div className="text-center p-12 bg-white rounded-win shadow-fluent animate-slide-up mx-4 max-w-md w-full border-t-8 border-brand-blue"><div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-blue-50 text-brand-blue mb-6"><IconCheck size={32} /></div><h2 className="text-3xl font-bold text-[#234171] mb-2">{t('res_success_title')}</h2><p className="text-gray-600 mb-8">{resultMessage[language]}</p><button onClick={resetToHome} className="w-full bg-[#234171] text-white px-6 py-3 rounded-win font-semibold hover:bg-[#1a3155] transition-colors shadow-lg flex justify-center items-center">{t('btn_menu')}</button></div> 
                )}

                {gameState === "RESULT_FAIL" && ( 
                    <div className="text-center p-10 bg-white rounded-win shadow-fluent animate-slide-up mx-4 max-w-md w-full border-t-8 border-brand-pink"><div className="text-5xl mb-4">😕</div><h2 className="text-2xl font-bold text-gray-800 mb-2">{t('res_fail_title')}</h2><p className="text-gray-600 mb-6">{resultMessage[language]}</p><div className={`bg-red-50 p-4 rounded-win text-left text-sm text-red-600 mb-8 border border-red-100 max-h-40 overflow-y-auto custom-scroll ${scrollClass}`}>{errorDetails.map((e, i) => <div key={i} className="mb-1 pb-1 border-b border-red-100 last:border-0">• {e}</div>)}</div><button onClick={resetToHome} className="w-full bg-gray-800 text-white px-6 py-3 rounded-win font-semibold hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2"><IconRotate size={18} /> {t('btn_retry')}</button></div> 
                )}
                
                {/* Fixed syntax error in RUSH_GAME_OVER conditional block */}
                {gameState === "RUSH_GAME_OVER" && ( 
                    <div className="text-center p-10 bg-white rounded-win shadow-fluent animate-slide-up mx-4 max-w-md w-full border-t-8 border-rush-500">
                        <div className="text-5xl mb-4">😰</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('res_rush_fail_title')}</h2>
                        <div className="text-4xl font-bold text-rush-500 mb-4">{rushScore} {t('score_label')}</div>
                        <p className="text-gray-600 mb-4 font-medium">{resultMessage[language]}</p>
                        <div className={`bg-red-50 p-4 rounded-win text-left text-sm text-red-600 mb-8 border border-red-100 max-h-40 overflow-y-auto custom-scroll ${scrollClass}`}>
                            {errorDetails.map((err, idx) => (
                                <div key={idx} className="mb-1 pb-1 border-b border-red-100 last:border-0">• {err}</div>
                            ))}
                        </div>
                        <button onClick={startRushMode} className="w-full bg-rush-500 text-white px-6 py-3 rounded-win font-semibold hover:bg-rush-900 transition-colors shadow-lg flex items-center justify-center gap-2 mb-3">
                            <IconRotate size={18} /> {t('btn_retry')}
                        </button>
                        <button onClick={resetToHome} className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-win font-semibold hover:bg-gray-300 transition-colors shadow-sm flex justify-center items-center">
                            {t('btn_menu')}
                        </button>
                    </div> 
                )}

                {gameState === "HOME" && ( 
                    <div className="hidden md:flex flex-col items-center justify-center text-center p-12 max-w-lg"><div className="mb-6"><div className="text-6xl drop-shadow-sm animate-bounce">🥗</div></div><h1 className="font-bold text-3xl mb-2 text-[#234171]">{t('app_title')}</h1><p className="text-[#234171]">{t('app_subtitle')}</p></div> 
                )}
            </div>
            
            <div className="fixed bottom-1 right-1 z-50 flex items-center gap-2">
                <button onClick={() => setLanguage(l => l === 'pt' ? 'en' : 'pt')} className="text-[10px] font-bold text-white font-sans bg-[#234171] px-2 py-1 rounded-none border border-[#234171] hover:bg-[#1a3155] transition-colors shadow-sm w-8 uppercase">{language}</button>
                <button onClick={() => setShowChangelog(true)} className="text-[10px] text-gray-400 font-sans hover:text-brand-blue transition-colors bg-white/80 px-2 py-1 rounded-none border border-gray-200 opacity-50 hover:opacity-100">{CHANGELOG[0].version} BETA</button>
            </div>
            {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
        </div>
    );
}

export default App;
