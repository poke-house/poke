import React, { useState, useEffect, useRef } from 'react';
import { GameState, Recipe, PaPersona, Language, BilingualMessage, RecipePhaseKey, Variant } from './types';
import { 
    RECIPES, INGREDIENTS_DB, THEMES, SUCCESS_MESSAGES, FAIL_MESSAGES, 
    PHASES_BOWL, PHASES_SMOOTHIE, CHANGELOG
} from './constants';
import { TRANSLATIONS, TranslationKey } from './translations';
import { playSound } from './utils/sound';
import { shuffleArray } from './utils/helpers';
import { 
    IconHome, IconArrowLeft, IconArrowRight, IconCheck, IconRotate,
    IconBowl, IconUniversity, IconFish, IconLeaf, IconCup, IconBolt, IconBrain, IconInfo, IconGlobe, IconSparkles, IconTrophy 
} from './components/Icons';
import { 
    Sparkles, BookOpen, Fish, Leaf, CupSoda, Timer, Brain, Trophy, ChevronLeft, ChevronRight, Menu, X, ArrowRight, ShieldCheck, HelpCircle, Activity, Globe as LucideGlobe, History
} from 'lucide-react';
import { FoodRain } from './components/FoodRain';
import { PopupModal, ChangelogModal } from './components/Modals';
import { AppLogo } from './components/AppLogo';
import { QuizMode } from './features/quiz/QuizMode';
import { UniversityMode } from './features/university/UniversityMode';
import { CustomBowlMode } from './features/custom-bowl/CustomBowlMode';
import { RushMode } from './features/rush/RushMode';
import { BowlTrainingMode } from './features/training/BowlTrainingMode';
import { HouseArenaMode } from './features/house-arena/HouseArenaMode';
import { houseArenaSessionStorage } from './features/house-arena/services/houseArenaSession.storage';
import pokeBowlHero from './src/assets/brand/poke-bowl-hero-900.png';

function App() {
    const [gameState, setGameState] = useState<GameState>("HOME");
    const [language, setLanguage] = useState<Language>('pt');
    const [menuCategory, setMenuCategory] = useState<string | null>(null); 
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null); 
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [currentSelections, setCurrentSelections] = useState<string[]>([]);
    const [allSelections, setAllSelections] = useState<Record<string, string[]>>({});
    const [phaseOptions, setPhaseOptions] = useState<string[]>([]);
    const [timer, setTimer] = useState(20);
    const [errorDetails, setErrorDetails] = useState<string[]>([]);
    const [showChangelog, setShowChangelog] = useState(false);
    const [resultMessage, setResultMessage] = useState<BilingualMessage>({pt: "", en: ""});
    const [showPopup, setShowPopup] = useState<{ msg: string; callback: () => void } | null>(null);
    const [easterEggTrigger, setEasterEggTrigger] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [localSession, setLocalSession] = useState<{ roomCode: string; reconnectToken: string } | null>(null);

    // Read through the central store so malformed and expired sessions are removed.
    useEffect(() => {
        setLocalSession(houseArenaSessionStorage.getSession());
    }, [gameState]);

    const handleEasterEggClick = () => { if (window.innerWidth < 768) { setEasterEggTrigger(prev => prev + 1); } };
    
    const t = (key: TranslationKey, params: {[key: string]: string | number} = {}) => {
        const langDict = TRANSLATIONS[language];
        const text = langDict[key] || key;
        return Object.keys(params).reduce((acc, param) => {
            return acc.replace(`{${param}}`, String(params[param]));
        }, text);
    };

    const getSmoothieIngredientList = (recipe: Recipe, key: RecipePhaseKey): string[] => {
        if (key === "smoothie_liquid") return recipe.smoothie_liquid || [];
        if (key === "smoothie_ingredients") return recipe.smoothie_ingredients || [];
        if (key === "smoothie_mode") return recipe.smoothie_mode || [];
        if (key === "smoothie_marbling") return recipe.smoothie_marbling || [];
        return [];
    };

    useEffect(() => {
        const titleStr = t('app_title');
        document.title = titleStr;
        document.documentElement.lang = language === 'pt' ? 'pt-PT' : 'en';
    }, [language]);

    const getCurrentPhases = () => { if (selectedRecipe?.category === "SMOOTHIE") return PHASES_SMOOTHIE; return PHASES_BOWL; };
    const getFullIngredientList = (key: RecipePhaseKey): string[] => { 
        if(key === 'base') return INGREDIENTS_DB.bases; 
        if(key === 'sauce_base') return INGREDIENTS_DB.sauces_base; 
        if(key === 'greens') return INGREDIENTS_DB.greens; 
        if(key === 'protein') return INGREDIENTS_DB.proteins; 
        if(key === 'sauce_final') return INGREDIENTS_DB.sauces_final; 
        if(key === 'crispy') return INGREDIENTS_DB.crispies; 
        if(key === 'sesame') return INGREDIENTS_DB.sesame; 
        if(key === 'smoothie_liquid') return INGREDIENTS_DB.smoothie_liquid; 
        if(key === 'smoothie_ingredients') return INGREDIENTS_DB.smoothie_ingredients; 
        if(key === 'smoothie_mode') return INGREDIENTS_DB.smoothie_mode; 
        if(key === 'smoothie_marbling') return INGREDIENTS_DB.smoothie_marbling; 
        return []; 
    };
    const getCurrentPhaseData = () => { if(!selectedRecipe) return { key: 'size' as RecipePhaseKey, title: '' }; const phases = getCurrentPhases(); return phases[currentPhaseIndex]; };
    
    const getSelectionLimit = () => { 
        if (!selectedRecipe) return 0; 
        const phaseKey = getCurrentPhases()[currentPhaseIndex].key; 
        if (phaseKey === "size") return 1; 
        if (selectedRecipe.category === "SMOOTHIE") { 
            return getSmoothieIngredientList(selectedRecipe, phaseKey).length; 
        } else { 
            const sizeToUse = selectedSize || "Regular"; 
            const phaseKeyVariant = phaseKey as keyof Variant;
            return selectedRecipe.variants && selectedRecipe.variants[sizeToUse] ? selectedRecipe.variants[sizeToUse][phaseKeyVariant].length : 0; 
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
        if ((gameState === "PLAYING" || gameState === "UNIVERSITY_PLAYING") && selectedRecipe) {
            if (selectedRecipe.category === "HOUSE") return "scroll-blue";
            if (selectedRecipe.category === "GREEN") return "scroll-pink";
            if (selectedRecipe.category === "SMOOTHIE") return "scroll-yellow";
        }
        if (gameState === "RESULT_FAIL") return "scroll-red";
        if (gameState.startsWith("QUIZ")) return "scroll-blue";
        return "scroll-blue";
    };

    const scrollClass = getScrollClass();
    const sidebarScrollClass = menuCategory === "HOUSE" ? "scroll-blue" : menuCategory === "GREEN" ? "scroll-pink" : menuCategory === "SMOOTHIE" ? "scroll-yellow" : "";

    const gameStateRef = useRef(gameState);
    const tRef = useRef(t);
    const handleGameOverRef = useRef<((success: boolean, errors: string[]) => void) | null>(null);
    const hasTriggeredTimeoutRef = useRef(false);

    // Keep refs synchronized on every single render to prevent stale closures
    gameStateRef.current = gameState;
    tRef.current = t;

    useEffect(() => {
        if (timer > 1) {
            hasTriggeredTimeoutRef.current = false;
        }
    }, [timer]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (gameState === "PLAYING") {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        if (interval) {
                            clearInterval(interval);
                        }
                        
                        // Prevent duplicate timeout execution
                        if (hasTriggeredTimeoutRef.current) {
                            return 0;
                        }
                        hasTriggeredTimeoutRef.current = true;

                        const currentT = tRef.current;
                        handleGameOverRef.current(false, [currentT('timer_ended')]);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setTimer(20);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [gameState]);
    
    useEffect(() => {
        if (gameState === "PLAYING" && selectedRecipe) {
            const activePhases = getCurrentPhases();
            const phaseKey = activePhases[currentPhaseIndex].key;
            if (phaseKey === "size") { setPhaseOptions(INGREDIENTS_DB.sizes); return; }
            let fullList = getFullIngredientList(phaseKey);
            let requiredIngs: string[] = [];
            if (selectedRecipe.category === "SMOOTHIE") { 
                requiredIngs = getSmoothieIngredientList(selectedRecipe, phaseKey); 
            } else { 
                const sizeToUse = selectedSize || "Regular"; 
                const phaseKeyVariant = phaseKey as keyof Variant;
                requiredIngs = selectedRecipe.variants && selectedRecipe.variants[sizeToUse] ? selectedRecipe.variants[sizeToUse][phaseKeyVariant] : []; 
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

    const startGame = (recipe: Recipe) => { setSelectedRecipe(recipe); setGameState("PLAYING"); setupRecipeStart(recipe); };
    const startRushMode = () => setGameState("RUSH_SELECT");

    const startUniversityMode = () => setGameState("UNIVERSITY_SELECT");

    const setupRecipeStart = (recipe: Recipe) => {
        if (recipe.category === "GREEN") { 
            setSelectedSize("Regular"); 
            setCurrentPhaseIndex(1); 
        } else if (recipe.category === "SMOOTHIE") { 
            setSelectedSize(null); 
            setCurrentPhaseIndex(0); 
        } else { // HOUSE
            setSelectedSize(null); 
            setCurrentPhaseIndex(0); 
        } 
        setCurrentSelections([]); 
        setAllSelections({}); 
        setTimer(20);
    };

    const resetToHome = () => { setGameState("HOME"); setMenuCategory(null); setSelectedRecipe(null); setSelectedSize(null); setTimer(20); };
    
    const handleSelection = (ingredient: string) => {
        const activePhases = getCurrentPhases(); 
        const phaseKey = activePhases[currentPhaseIndex].key;
        if (phaseKey === "size") { setSelectedSize(ingredient); setCurrentPhaseIndex(prev => prev + 1); setTimer(20); return; }
        let requiredList: string[] = []; 
        if (selectedRecipe?.category === "SMOOTHIE") {
            requiredList = getSmoothieIngredientList(selectedRecipe, phaseKey); 
        } else {
            const phaseKeyVariant = phaseKey as keyof Variant;
            requiredList = selectedRecipe?.variants ? selectedRecipe.variants[selectedSize || "Regular"][phaseKeyVariant] : [];
        }
        
        const isCorrect = requiredList.includes(ingredient); 
        playSound(isCorrect ? "happy" : "sad");
        if (currentSelections.length >= requiredList.length && !requiredList.includes(ingredient)) return;
        const newSelections = [...currentSelections, ingredient]; 
        setCurrentSelections(newSelections);

        let shouldAdvance = newSelections.length === requiredList.length;
        if (selectedRecipe?.name.includes("Nutty Fit") && phaseKey === "smoothie_ingredients") {
            const hasGotas = newSelections.includes("Gotas de Chocolate 1 TBSP 15 ml");
            if (!hasGotas && newSelections.length === requiredList.length - 1) {
                shouldAdvance = true;
            }
        }

        if (shouldAdvance) {
            const updatedAll = { ...allSelections, [phaseKey]: newSelections }; 
            setAllSelections(updatedAll);
            if (currentPhaseIndex < activePhases.length - 1) { 
                setTimeout(() => { setCurrentPhaseIndex(prev => prev + 1); setCurrentSelections([]); setTimer(20); }, 250); 
            } else validateGame(updatedAll); 
        }
    };

    const handleUndo = () => { if (currentSelections.length > 0) setCurrentSelections(prev => prev.slice(0, -1)); };

    const validateGame = (finalSelections: Record<string, string[]>) => { 
        let errors: string[] = []; 
        const activePhases = getCurrentPhases(); 
        const phasesToValidate = activePhases.filter(p => p.key !== "size"); 
        phasesToValidate.forEach(phase => { 
            let required: string[] = []; 
            if (selectedRecipe?.category === "SMOOTHIE") {
                required = getSmoothieIngredientList(selectedRecipe, phase.key); 
            } else {
                const phaseKeyVariant = phase.key as keyof Variant;
                required = selectedRecipe?.variants ? selectedRecipe.variants[selectedSize || "Regular"][phaseKeyVariant] : []; 
            }
            
            const actualStr = JSON.stringify([...(finalSelections[phase.key] || [])].sort());
            const reqStr = JSON.stringify([...required].sort());
            
            let isValid = actualStr === reqStr;
            
            if (!isValid && selectedRecipe?.name.includes("Nutty Fit") && phase.key === "smoothie_ingredients") {
                const reqWithoutGotas = required.filter(i => i !== "Gotas de Chocolate 1 TBSP 15 ml");
                if (actualStr === JSON.stringify([...reqWithoutGotas].sort())) {
                    isValid = true;
                }
            }

            if (!isValid) { 
                errors.push(t('instr_error_prefix', {phase: t(('phase_' + phase.key) as TranslationKey), required: required.join(", ")})); 
            } 
        }); 
        handleGameOver(errors.length === 0, errors);
    };

    const handleGameOver = (success: boolean, errors: string[]) => { 
        if (success) { 
            setGameState("RESULT_SUCCESS"); playSound("happy"); 
            if (window.confetti) window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            setResultMessage(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]); 
        } else { setErrorDetails(errors); setGameState("RESULT_FAIL"); playSound("sad"); setResultMessage(FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]); } 
    };

    handleGameOverRef.current = handleGameOver;

    if (gameState === "HOUSE_ARENA") {
        return (
            <HouseArenaMode
                onBack={resetToHome}
                language={language}
            />
        );
    }

    if (gameState.startsWith("RUSH_")) {
        return (
            <RushMode
                gameState={gameState}
                setGameState={setGameState}
                resetToHome={resetToHome}
                t={t}
                language={language}
            />
        );
    }

    if (gameState.startsWith("UNIVERSITY_")) {
        return (
            <UniversityMode
                gameState={gameState}
                setGameState={setGameState}
                resetToHome={resetToHome}
                t={t}
                language={language}
            />
        );
    }

    const renderNavItem = (
        label: string,
        icon: React.ReactNode,
        isActive: boolean,
        onClick: () => void,
        badgeText?: string,
        badgeColor?: string
    ) => {
        return (
            <button
                onClick={() => {
                    onClick();
                    setMobileMenuOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                    isActive
                        ? "bg-brand-butter border-brand-charcoal text-brand-charcoal font-extrabold shadow-soft"
                        : "bg-transparent border-transparent text-brand-charcoal/80 hover:text-brand-charcoal hover:bg-brand-sorbet/55 font-semibold"
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-all ${isActive ? "bg-brand-mochi text-brand-charcoal border border-brand-charcoal scale-105" : "bg-brand-linen/35 text-brand-charcoal/60 group-hover:text-brand-charcoal group-hover:bg-brand-butter"}`}>
                        {icon}
                    </div>
                    <span className="font-body tracking-tight text-xs md:text-sm">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {badgeText && (
                        <span className={`text-[8px] font-condensed font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${badgeColor || "bg-brand-butter text-brand-charcoal"}`}>
                            {badgeText}
                        </span>
                    )}
                    {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-tomato" />
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className="safe-screen fixed inset-0 w-full h-[100dvh] font-sans text-brand-charcoal flex flex-col md:flex-row overflow-hidden bg-brand-linen">
            <FoodRain trigger={easterEggTrigger} quantity={1} />
            {showPopup && <PopupModal message={showPopup.msg} onConfirm={showPopup.callback} t={t} />}

            {/* Mobile Navigation Header */}
            <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b-2 border-brand-charcoal bg-brand-mochi z-40 shrink-0">
                <div className="flex items-center gap-2 cursor-pointer bg-brand-linen px-2 py-1 rounded-lg" onClick={resetToHome}>
                    <AppLogo variant="mobile" />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setMobileMenuOpen(prev => !prev)}
                        aria-label="Toggle Navigation Menu"
                        className="brand-action px-3 py-1.5 rounded-lg border-2 border-brand-charcoal bg-brand-butter text-brand-charcoal text-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-[2px_2px_0_#080D09]"
                    >
                        {mobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
                        <span>Menu</span>
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu Overlay */}
            {mobileMenuOpen && (
                <div className="safe-bottom md:hidden absolute top-[58px] inset-x-0 bottom-0 bg-brand-linen/95 backdrop-blur-md z-30 flex flex-col p-4 overflow-y-auto custom-scroll gap-4 animate-fade-in">
                    <div className="flex flex-col gap-1">
                        <span className="font-condensed font-black text-[10px] tracking-wider text-brand-burgundy/55 uppercase px-3 mb-1">
                            {t('nav_section_training')}
                        </span>
                        {renderNavItem(t('btn_create_bowl'), <Sparkles size={16} />, gameState === "CUSTOM_BOWL", () => setGameState("CUSTOM_BOWL"))}
                        {renderNavItem(t('menu_university'), <BookOpen size={16} />, gameState.startsWith("UNIVERSITY_"), startUniversityMode)}
                        {renderNavItem(t('menu_house'), <Fish size={16} />, menuCategory === "HOUSE", () => setMenuCategory("HOUSE"))}
                        {renderNavItem(t('menu_green'), <Leaf size={16} />, menuCategory === "GREEN", () => setMenuCategory("GREEN"))}
                        {renderNavItem(t('menu_smoothie'), <CupSoda size={16} />, menuCategory === "SMOOTHIE", () => setMenuCategory("SMOOTHIE"))}
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="font-condensed font-black text-[10px] tracking-wider text-brand-burgundy/55 uppercase px-3 mb-1">
                            {t('nav_section_challenges')}
                        </span>
                        {renderNavItem(t('menu_rush'), <Timer size={16} />, gameState.startsWith("RUSH_"), startRushMode)}
                        {renderNavItem(t('menu_quiz'), <Brain size={16} />, gameState.startsWith("QUIZ"), () => setGameState("QUIZ_PLAYING"), "NEW")}
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="font-condensed font-black text-[10px] tracking-wider text-brand-burgundy/55 uppercase px-3 mb-1">
                            {t('nav_section_arena')}
                        </span>
                        {renderNavItem(t('house_arena_title'), <Trophy size={16} />, (gameState as string) === "HOUSE_ARENA", () => setGameState("HOUSE_ARENA"), "MULTIPLAYER", "bg-brand-mochi text-white")}
                    </div>

                    {/* Mobile Utility Area */}
                    <div className="mt-auto pt-4 border-t border-brand-charcoal/10 flex items-center justify-between gap-3 shrink-0">
                        <button 
                            onClick={() => {
                                setLanguage(l => l === 'pt' ? 'en' : 'pt');
                            }} 
                            aria-label="Toggle language"
                            className="text-xs font-condensed font-black text-brand-charcoal bg-brand-butter px-3 py-1.5 rounded-lg border border-brand-charcoal/10 hover:bg-brand-butter/80 transition-all shadow-sm uppercase flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                            <LucideGlobe size={14} /> {language}
                        </button>
                        <button 
                            onClick={() => {
                                setShowChangelog(true);
                                setMobileMenuOpen(false);
                            }} 
                            className="text-xs font-condensed font-black text-brand-charcoal bg-white px-3 py-1.5 rounded-lg border border-brand-charcoal/10 hover:bg-brand-linen transition-all shadow-sm opacity-90 hover:opacity-100 active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                            <History size={14} />
                            <span>{CHANGELOG[0].version} BETA</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <div className={`p-6 w-80 shrink-0 flex-col gap-5 z-10 border-r-2 border-brand-charcoal bg-brand-mochi hidden md:flex h-full overflow-hidden custom-scroll ${sidebarScrollClass}`}>
                <div className="flex-shrink-0 flex justify-center py-3 cursor-pointer bg-brand-linen rounded-card border-2 border-brand-charcoal shadow-soft" onClick={resetToHome}>
                    <AppLogo variant="desktop" />
                </div>
                
                {menuCategory === null && gameState !== "CUSTOM_BOWL" ? ( 
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scroll pr-1">
                        
                        <div className="flex flex-col gap-1">
                            <span className="font-condensed font-black text-[10px] tracking-wider text-brand-burgundy/55 uppercase px-3 mb-1">
                                {t('nav_section_training')}
                            </span>
                            {renderNavItem(t('btn_create_bowl'), <Sparkles size={16} />, (gameState as string) === "CUSTOM_BOWL", () => setGameState("CUSTOM_BOWL"))}
                            {renderNavItem(t('menu_university'), <BookOpen size={16} />, gameState.startsWith("UNIVERSITY_"), startUniversityMode)}
                            {renderNavItem(t('menu_house'), <Fish size={16} />, menuCategory === "HOUSE", () => setMenuCategory("HOUSE"))}
                            {renderNavItem(t('menu_green'), <Leaf size={16} />, menuCategory === "GREEN", () => setMenuCategory("GREEN"))}
                            {renderNavItem(t('menu_smoothie'), <CupSoda size={16} />, menuCategory === "SMOOTHIE", () => setMenuCategory("SMOOTHIE"))}
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="font-condensed font-black text-[10px] tracking-wider text-brand-burgundy/55 uppercase px-3 mb-1">
                                {t('nav_section_challenges')}
                            </span>
                            {renderNavItem(t('menu_rush'), <Timer size={16} />, gameState.startsWith("RUSH_"), startRushMode)}
                            {renderNavItem(t('menu_quiz'), <Brain size={16} />, gameState.startsWith("QUIZ"), () => setGameState("QUIZ_PLAYING"), "NEW")}
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="font-condensed font-black text-[10px] tracking-wider text-brand-burgundy/55 uppercase px-3 mb-1">
                                {t('nav_section_arena')}
                            </span>
                            {renderNavItem(t('house_arena_title'), <Trophy size={16} />, (gameState as string) === "HOUSE_ARENA", () => setGameState("HOUSE_ARENA"), "MULTIPLAYER", "bg-brand-mochi text-white")}
                        </div>
                    </div> 
                ) : gameState !== "CUSTOM_BOWL" && ( 
                    <div className="flex-1 flex flex-col gap-2 animate-fade-in overflow-y-auto custom-scroll pr-1">
                        <button 
                            onClick={() => setMenuCategory(null)} 
                            className="mb-4 font-bold flex items-center gap-2 px-3.5 py-2 rounded-xl border border-brand-charcoal/10 bg-brand-linen/30 hover:bg-brand-linen/65 text-brand-charcoal transition-all cursor-pointer text-xs"
                        >
                            <ChevronLeft size={16}/> {t('btn_back')}
                        </button>
                        <h3 className="font-condensed font-black text-brand-burgundy/60 text-xs uppercase tracking-widest mb-3 px-1.5">
                            {menuCategory || "MENU"}
                        </h3>
                        <div className="flex flex-col gap-1.5">
                            {menuCategory && RECIPES.filter(r => r.category === menuCategory).map(recipe => ( 
                                <button 
                                    key={recipe.id} 
                                    onClick={() => startGame(recipe)} 
                                    className={`w-full text-left font-body font-bold text-sm px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                                        selectedRecipe?.id === recipe.id 
                                            ? "bg-brand-linen/50 border-brand-charcoal/20 text-brand-charcoal font-extrabold shadow-xs" 
                                            : "bg-white border-transparent text-brand-charcoal/80 hover:bg-brand-linen/15 hover:text-brand-charcoal font-semibold"
                                    }`}
                                >
                                    {recipe.name}
                                </button> 
                            ))}
                        </div>
                    </div> 
                )}

                {/* Desktop Utility Area */}
                <div className="mt-auto pt-4 border-t border-brand-charcoal/10 flex items-center justify-between gap-2 shrink-0">
                    <button 
                        onClick={() => setLanguage(l => l === 'pt' ? 'en' : 'pt')} 
                        aria-label="Toggle language"
                        className="text-[11px] font-condensed font-black text-brand-charcoal bg-brand-butter px-2.5 py-1.5 rounded-lg border border-brand-charcoal/10 hover:bg-brand-butter/80 transition-all shadow-sm uppercase flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
                    >
                        <LucideGlobe size={13} /> {language}
                    </button>
                    <button 
                        onClick={() => setShowChangelog(true)} 
                        className="text-[11px] font-condensed font-black text-brand-charcoal bg-brand-linen/40 px-2.5 py-1.5 rounded-lg border border-brand-charcoal/10 hover:bg-brand-linen transition-all shadow-sm opacity-90 hover:opacity-100 active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                        <History size={13} />
                        <span>{CHANGELOG[0].version} BETA</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 relative z-10 flex flex-col items-center justify-center overflow-hidden bg-brand-linen h-full w-full`}>
                
                {gameState.startsWith("QUIZ") && (
                    <QuizMode
                        gameState={gameState}
                        setGameState={setGameState}
                        resetToHome={resetToHome}
                        t={t}
                    />
                )}

                {gameState === "CUSTOM_BOWL" && ( 
                    <CustomBowlMode
                        gameState={gameState}
                        setGameState={setGameState}
                        resetToHome={resetToHome}
                        t={t}
                        language={language}
                    />
                )}

                {(gameState === "PLAYING" || gameState === "RESULT_SUCCESS" || gameState === "RESULT_FAIL") && selectedRecipe && (
                    <BowlTrainingMode
                        selectedRecipe={selectedRecipe}
                        resetToHome={resetToHome}
                        language={language}
                        t={t}
                    />
                )}

                {gameState === "HOME" && ( 
                    <div className="home-canvas safe-bottom w-full h-full overflow-y-auto custom-scroll px-4 py-6 sm:px-6 md:px-10 md:py-10">
                        <div className="max-w-6xl mx-auto flex flex-col gap-6 md:gap-8 animate-fade-in">
                            
                            {/* Welcome Banner / Header */}
                            <div className="flex flex-col gap-2 md:gap-3">
                                <span className="brand-action text-brand-burgundy text-sm md:text-base">Bora treinar?</span>
                                <h1 className="font-display font-black text-3xl md:text-6xl text-brand-charcoal leading-[0.94] tracking-tight max-w-4xl">
                                    {t('home_welcome_title')}
                                </h1>
                                <p className="font-body font-medium text-brand-burgundy text-sm md:text-lg max-w-3xl leading-relaxed">
                                    {t('home_welcome_desc')}
                                </p>

                                {/* Active Session Reconnect Notice */}
                                {localSession && (
                                    <div className="mt-4 bg-brand-sorbet/25 border border-brand-mochi/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-fade-in">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-white text-brand-mochi shadow-xs">
                                                <Trophy size={16} />
                                            </div>
                                            <p className="text-xs font-semibold text-brand-burgundy">
                                                {t('home_active_session', { code: localSession.roomCode })}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => setGameState("HOUSE_ARENA")}
                                            className="px-4 py-2 rounded-xl bg-brand-mochi hover:bg-brand-mochi/90 text-white font-display font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                                        >
                                            {t('home_reconnect')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Main Learning Pathway Feature Card (University Bowl) */}
                            <div className="brand-feature-card border-3 border-brand-charcoal rounded-card p-5 md:p-8 flex flex-col sm:flex-row items-center gap-4 md:gap-8 transition-all shadow-elevated relative overflow-hidden">
                                <div className="flex-1 flex flex-col gap-3 z-10 text-left">
                                    <span className="brand-action text-xs text-brand-burgundy bg-brand-butter px-3 py-1.5 rounded-full border-2 border-brand-charcoal self-start">
                                        Percurso Recomendado • Recommended Path
                                    </span>
                                    <h2 className="font-display font-black text-3xl md:text-5xl text-brand-charcoal leading-none">
                                        {t('home_featured_title')}
                                    </h2>
                                    <p className="font-body font-semibold text-brand-burgundy text-sm md:text-base leading-relaxed max-w-xl">
                                        {t('home_featured_desc')}
                                    </p>
                                    <button 
                                        onClick={startUniversityMode}
                                        className="brand-action mt-2 px-6 py-3 rounded-button bg-brand-charcoal hover:bg-brand-burgundy text-brand-butter text-base md:text-lg transition-all cursor-pointer shadow-soft active:scale-95 self-start flex items-center gap-2 group border-2 border-brand-charcoal"
                                    >
                                        <span>{t('home_primary_cta')}</span>
                                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                                <div className="shrink-0 flex items-center justify-center w-44 h-32 sm:w-64 sm:h-44 md:w-[380px] md:h-[250px]">
                                    <img src={pokeBowlHero} alt="Bowl Poke House com salmão, abacate, arroz, edamame e pepino" className="w-full h-full object-contain select-none drop-shadow-[0_18px_20px_rgba(86,22,33,0.16)]" />
                                </div>
                            </div>

                            {/* Interactive Modes Overview Grid */}
                            <div className="flex flex-col gap-5 text-left">
                                <h3 className="font-display font-black text-xl md:text-3xl text-brand-charcoal tracking-tight">
                                    {t('home_modes_overview')}
                                </h3>
                                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 md:gap-4">
                                    
                                    {/* Custom Bowl Card */}
                                    <div className="bg-brand-butter border-2 border-brand-charcoal rounded-card p-4 md:p-5 flex flex-col justify-between hover:-translate-y-1 transition-all shadow-soft min-h-[148px] md:min-h-[180px]">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="p-2 rounded-lg bg-brand-sorbet/20 text-brand-mochi">
                                                    <Sparkles size={18} />
                                                </div>
                                            </div>
                                            <h4 className="font-display font-bold text-sm text-brand-charcoal">
                                                {t('btn_create_bowl')}
                                            </h4>
                                            <p className="font-body font-medium text-brand-burgundy/65 text-xs mt-1.5 leading-relaxed">
                                                {t('nav_desc_custom_bowl')}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => setGameState("CUSTOM_BOWL")}
                                            className="brand-action mt-4 px-4 py-2 rounded-lg bg-brand-charcoal hover:bg-brand-burgundy text-brand-butter text-sm transition-all cursor-pointer border-2 border-brand-charcoal self-start active:scale-95"
                                        >
                                            {t('home_btn_enter')}
                                        </button>
                                    </div>

                                    {/* Rush Hour Card */}
                                    <div className="bg-brand-mochi border-2 border-brand-charcoal rounded-card p-4 md:p-5 flex flex-col justify-between hover:-translate-y-1 transition-all shadow-soft min-h-[148px] md:min-h-[180px]">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="p-2 rounded-lg bg-brand-tomato/10 text-brand-tomato">
                                                    <Timer size={18} />
                                                </div>
                                            </div>
                                            <h4 className="font-display font-bold text-sm text-brand-charcoal">
                                                {t('menu_rush')}
                                            </h4>
                                            <p className="font-body font-medium text-brand-burgundy/65 text-xs mt-1.5 leading-relaxed">
                                                {t('nav_desc_rush')}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={startRushMode}
                                            className="brand-action mt-4 px-4 py-2 rounded-lg bg-brand-butter hover:bg-brand-linen text-brand-burgundy text-sm transition-all cursor-pointer border-2 border-brand-charcoal self-start active:scale-95"
                                        >
                                            {t('home_btn_enter')}
                                        </button>
                                    </div>

                                    {/* Fast Thinker (Quiz) Card */}
                                    <div className="bg-brand-sorbet border-2 border-brand-charcoal rounded-card p-4 md:p-5 flex flex-col justify-between hover:-translate-y-1 transition-all shadow-soft min-h-[148px] md:min-h-[180px]">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="p-2 rounded-lg bg-brand-olives/10 text-brand-olives">
                                                    <Brain size={18} />
                                                </div>
                                                <span className="text-[8px] font-condensed font-black px-1.5 py-0.5 rounded-full bg-brand-butter text-brand-charcoal uppercase tracking-wider">
                                                    Novo • New
                                                </span>
                                            </div>
                                            <h4 className="font-display font-bold text-sm text-brand-charcoal">
                                                {t('menu_quiz')}
                                            </h4>
                                            <p className="font-body font-medium text-brand-burgundy/65 text-xs mt-1.5 leading-relaxed">
                                                {t('nav_desc_quiz')}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => setGameState("QUIZ_PLAYING")}
                                            className="brand-action mt-4 px-4 py-2 rounded-lg bg-brand-burgundy hover:bg-brand-charcoal text-brand-sorbet text-sm transition-all cursor-pointer border-2 border-brand-charcoal self-start active:scale-95"
                                        >
                                            {t('home_btn_enter')}
                                        </button>
                                    </div>

                                    {/* House Arena Card */}
                                    <div className="bg-brand-charcoal border-2 border-brand-charcoal rounded-card p-4 md:p-5 flex flex-col justify-between hover:-translate-y-1 transition-all shadow-[4px_4px_0_#FF83AF] min-h-[148px] md:min-h-[180px] [&_h4]:text-brand-mochi [&_p]:text-brand-sorbet">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="p-2 rounded-lg bg-brand-mochi/10 text-brand-mochi">
                                                    <Trophy size={18} />
                                                </div>
                                                <span className="text-[8px] font-condensed font-black px-1.5 py-0.5 rounded-full bg-brand-mochi text-white uppercase tracking-wider">
                                                    MULTIPLAYER
                                                </span>
                                            </div>
                                            <h4 className="font-display font-bold text-sm text-brand-charcoal">
                                                {t('house_arena_title')}
                                            </h4>
                                            <p className="font-body font-medium text-brand-burgundy/65 text-xs mt-1.5 leading-relaxed">
                                                {t('nav_desc_arena')}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => setGameState("HOUSE_ARENA")}
                                            className="brand-action mt-4 px-4 py-2 rounded-lg bg-brand-mochi hover:bg-brand-butter text-brand-charcoal text-sm transition-all cursor-pointer border-2 border-brand-mochi self-start active:scale-95"
                                        >
                                            {t('home_btn_enter')}
                                        </button>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
            
            {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} t={t} />}
        </div>
    );
}

export default App;
