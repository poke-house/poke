import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { MemoryMatchArenaGame } from './features/house-arena/games/memory-match/MemoryMatchArenaGame';
import { ArenaFinalResults } from './features/house-arena/results/ArenaFinalResults';
import { arenaSessionStorage, PersistedArenaSession } from './features/house-arena/services/houseArenaSession.storage';
import { HouseArenaRoomService } from './features/house-arena/services/houseArenaRoom.service';
import pokeBowlHero from './src/assets/brand/poke-bowl-hero.png';

function App() {
    const [gameState, setGameState] = useState<GameState>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('game') === 'memory_match' || params.get('mode') === 'memory_match') {
                return 'MEMORY_MATCH';
            }
            if (params.get('game') === 'arena_results' || params.get('mode') === 'arena_results' || params.get('view') === 'arena_results') {
                return 'ARENA_RESULTS';
            }
        }
        return 'HOME';
    });
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
    const [dancingEmoji, setDancingEmoji] = useState<number | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [localSession, setLocalSession] = useState<PersistedArenaSession | null>(null);
    const roomService = useMemo(() => new HouseArenaRoomService(), []);

    // Validate that the persisted session actually points to an open, valid room before displaying active banner
    useEffect(() => {
        if (gameState !== "HOME") {
            setLocalSession(null);
            return;
        }

        const session = arenaSessionStorage.read();
        if (!session) {
            setLocalSession(null);
            return;
        }

        let cancelled = false;
        roomService.validateSession(session).then(result => {
            if (cancelled) return;
            if (result.valid) {
                setLocalSession(session);
            } else {
                // If room is closed or nonexistent, purge storage and clear session
                if (result.reason === 'room_closed' || result.reason === 'room_not_found') {
                    arenaSessionStorage.clear();
                }
                setLocalSession(null);
            }
        }).catch(() => {
            if (!cancelled) setLocalSession(null);
        });

        return () => {
            cancelled = true;
        };
    }, [gameState, roomService]);

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

    if (gameState === "MEMORY_MATCH") {
        const devRoom: any = {
            roomCode: 'DEVMM',
            status: 'round_active',
            currentGameType: 'memory_match',
            currentRoundNumber: 1,
            totalRounds: 1,
            remainingRoundSeconds: 300,
        };
        return (
            <MemoryMatchArenaGame
                room={devRoom}
                reconnectToken="dev_token"
                language={language}
                onRoundFinished={() => {}}
                onHome={resetToHome}
            />
        );
    }

    if (gameState === "HOUSE_ARENA") {
        return (
            <HouseArenaMode
                onBack={resetToHome}
                language={language}
            />
        );
    }

    if (gameState === "ARENA_RESULTS") {
        return (
            <ArenaFinalResults
                roomCode="POKE-FINALS"
                reconnectToken="demo_token"
                language={language}
                onReturnHome={resetToHome}
                localParticipantId="p-user"
            />
        );
    }

    if (gameState.startsWith("RUSH_")) {
        return (
            <div className="safe-screen fixed inset-0 w-full h-[100dvh] font-sans text-brand-charcoal flex flex-col overflow-hidden bg-brand-linen">
                <RushMode
                    gameState={gameState}
                    setGameState={setGameState}
                    resetToHome={resetToHome}
                    t={t}
                    language={language}
                />
            </div>
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-body transition-all text-left group cursor-pointer min-h-[44px] ${
                    isActive
                        ? "bg-brand-butter text-brand-charcoal border-2 border-brand-charcoal shadow-[3px_3px_0px_#080D09] font-black"
                        : "text-brand-burgundy hover:bg-brand-sorbet/90 hover:text-brand-charcoal border-2 border-transparent font-bold"
                }`}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 transition-transform ${
                        isActive ? "bg-white text-brand-charcoal border border-brand-charcoal shadow-xs scale-105" : "bg-white/40 text-brand-burgundy group-hover:scale-105"
                    }`}>
                        {icon}
                    </div>
                    <span className="truncate text-xs md:text-sm">{label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {badgeText && (
                        <span className={`text-[9px] font-functional px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeColor || "bg-brand-butter text-brand-charcoal border border-brand-charcoal/30 font-bold"}`}>
                            {badgeText}
                        </span>
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
                <div className="flex items-center gap-2 cursor-pointer" onClick={resetToHome}>
                    <AppLogo variant="mobile" />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setMobileMenuOpen(prev => !prev)}
                        aria-label="Toggle Navigation Menu"
                        className="px-3.5 py-1.5 rounded-full border-2 border-brand-charcoal bg-brand-butter text-brand-charcoal font-functional text-sm uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#080D09] active:translate-y-0.5 transition-all cursor-pointer"
                    >
                        {mobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
                        <span>Menu</span>
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu Overlay */}
            {mobileMenuOpen && (
                <div className="safe-bottom md:hidden absolute top-[52px] inset-x-0 bottom-0 bg-brand-mochi/98 backdrop-blur-md z-30 flex flex-col p-4 overflow-y-auto custom-scroll gap-4 animate-fade-in border-b-2 border-brand-charcoal">
                    <div className="flex flex-col gap-1">
                        <span className="font-functional font-normal text-xs tracking-wider text-brand-burgundy uppercase px-3 mb-1">
                            {t('nav_section_training')}
                        </span>
                        {renderNavItem(t('btn_create_bowl'), <Sparkles size={16} />, gameState === "CUSTOM_BOWL", () => setGameState("CUSTOM_BOWL"))}
                        {renderNavItem(t('menu_university'), <BookOpen size={16} />, gameState.startsWith("UNIVERSITY_"), startUniversityMode)}
                        {renderNavItem(t('menu_house'), <Fish size={16} />, menuCategory === "HOUSE", () => setMenuCategory("HOUSE"))}
                        {renderNavItem(t('menu_green'), <Leaf size={16} />, menuCategory === "GREEN", () => setMenuCategory("GREEN"))}
                        {renderNavItem(t('menu_smoothie'), <CupSoda size={16} />, menuCategory === "SMOOTHIE", () => setMenuCategory("SMOOTHIE"))}
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="font-functional font-normal text-xs tracking-wider text-brand-burgundy uppercase px-3 mb-1">
                            {t('nav_section_challenges')}
                        </span>
                        {renderNavItem(t('menu_rush'), <Timer size={16} />, gameState.startsWith("RUSH_"), startRushMode)}
                        {renderNavItem(t('menu_quiz'), <Brain size={16} />, gameState.startsWith("QUIZ"), () => setGameState("QUIZ_PLAYING"), "NEW")}
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="font-functional font-normal text-xs tracking-wider text-brand-burgundy uppercase px-3 mb-1">
                            {t('nav_section_arena')}
                        </span>
                        {renderNavItem(t('house_arena_title'), <Trophy size={16} />, (gameState as string) === "HOUSE_ARENA", () => setGameState("HOUSE_ARENA"), "MULTIPLAYER", "bg-brand-mochi text-white")}
                    </div>

                    {/* Mobile Utility Area */}
                    <div className="mt-auto pt-4 border-t border-brand-charcoal/20 flex items-center justify-between gap-3 shrink-0">
                        <button 
                            onClick={() => {
                                setLanguage(l => l === 'pt' ? 'en' : 'pt');
                            }} 
                            aria-label="Toggle language"
                            className="text-xs font-functional text-brand-charcoal bg-brand-butter px-3 py-1.5 rounded-full border-2 border-brand-charcoal hover:bg-brand-butter/90 transition-all shadow-[2px_2px_0px_#080D09] uppercase flex items-center gap-1.5 active:translate-y-0.5 cursor-pointer"
                        >
                            <LucideGlobe size={14} /> {language}
                        </button>
                        <button 
                            onClick={() => {
                                setShowChangelog(true);
                                setMobileMenuOpen(false);
                            }} 
                            className="text-xs font-functional text-brand-burgundy bg-brand-sorbet px-3 py-1.5 rounded-full border-2 border-brand-burgundy hover:bg-brand-sorbet/90 transition-all shadow-[2px_2px_0px_#561621] uppercase active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                        >
                            <History size={14} />
                            <span>{CHANGELOG[0].version} BETA</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar (Pink Mochi Dominant, 264px width) */}
            <div className={`p-4 w-[264px] shrink-0 flex-col gap-4 z-10 border-r-3 border-brand-charcoal bg-brand-mochi hidden md:flex h-full overflow-hidden custom-scroll ${sidebarScrollClass}`}>
                <div className="flex-shrink-0 flex justify-center py-2.5 px-2 cursor-pointer bg-brand-linen/85 rounded-2xl border-2 border-brand-charcoal shadow-[3px_3px_0px_#080D09] hover:bg-white transition-all" onClick={resetToHome}>
                    <AppLogo variant="desktop" />
                </div>
                
                {menuCategory === null && gameState !== "CUSTOM_BOWL" ? ( 
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scroll pr-1">
                        <div className="flex flex-col gap-1">
                            <span className="font-functional font-normal text-xs tracking-wider text-brand-burgundy uppercase px-2 mb-1">
                                {t('nav_section_training')}
                            </span>
                            {renderNavItem(t('btn_create_bowl'), <Sparkles size={16} />, (gameState as string) === "CUSTOM_BOWL", () => setGameState("CUSTOM_BOWL"))}
                            {renderNavItem(t('menu_university'), <BookOpen size={16} />, gameState.startsWith("UNIVERSITY_"), startUniversityMode)}
                            {renderNavItem(t('menu_house'), <Fish size={16} />, menuCategory === "HOUSE", () => setMenuCategory("HOUSE"))}
                            {renderNavItem(t('menu_green'), <Leaf size={16} />, menuCategory === "GREEN", () => setMenuCategory("GREEN"))}
                            {renderNavItem(t('menu_smoothie'), <CupSoda size={16} />, menuCategory === "SMOOTHIE", () => setMenuCategory("SMOOTHIE"))}
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="font-functional font-normal text-xs tracking-wider text-brand-burgundy uppercase px-2 mb-1">
                                {t('nav_section_challenges')}
                            </span>
                            {renderNavItem(t('menu_rush'), <Timer size={16} />, gameState.startsWith("RUSH_"), startRushMode)}
                            {renderNavItem(t('menu_quiz'), <Brain size={16} />, gameState.startsWith("QUIZ"), () => setGameState("QUIZ_PLAYING"), "NEW")}
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="font-functional font-normal text-xs tracking-wider text-brand-burgundy uppercase px-2 mb-1">
                                {t('nav_section_arena')}
                            </span>
                            {renderNavItem(t('house_arena_title'), <Trophy size={16} />, (gameState as string) === "HOUSE_ARENA", () => setGameState("HOUSE_ARENA"), "MULTIPLAYER", "bg-brand-mochi text-white")}
                        </div>
                    </div> 
                ) : gameState !== "CUSTOM_BOWL" && ( 
                    <div className="flex-1 flex flex-col gap-2 animate-fade-in overflow-y-auto custom-scroll pr-1">
                        <button 
                            onClick={() => setMenuCategory(null)} 
                            className="mb-3 font-functional font-normal flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-brand-charcoal bg-brand-butter hover:bg-brand-butter/90 text-brand-charcoal transition-all cursor-pointer text-sm shadow-[2px_2px_0px_#080D09] active:translate-y-0.5 uppercase"
                        >
                            <ChevronLeft size={16}/> {t('btn_back')}
                        </button>
                        <h3 className="font-functional font-normal text-brand-burgundy text-xs uppercase tracking-widest mb-2 px-1">
                            {menuCategory || "MENU"}
                        </h3>
                        <div className="flex flex-col gap-1.5">
                            {menuCategory && RECIPES.filter(r => r.category === menuCategory).map(recipe => ( 
                                <button 
                                    key={recipe.id} 
                                    onClick={() => startGame(recipe)} 
                                    className={`w-full text-left font-body font-bold text-sm px-3.5 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                                        selectedRecipe?.id === recipe.id 
                                            ? "bg-brand-butter border-brand-charcoal text-brand-charcoal shadow-[3px_3px_0px_#080D09]" 
                                            : "bg-white/80 border-transparent text-brand-burgundy hover:bg-white hover:text-brand-charcoal"
                                    }`}
                                >
                                    {recipe.name}
                                </button> 
                            ))}
                        </div>
                    </div> 
                )}

                {/* Desktop Utility Area */}
                <div className="mt-auto pt-3 border-t border-brand-burgundy/20 flex items-center justify-between gap-2 shrink-0">
                    <button 
                        onClick={() => setLanguage(l => l === 'pt' ? 'en' : 'pt')} 
                        aria-label="Toggle language"
                        className="text-xs font-functional text-brand-charcoal bg-brand-butter px-3 py-1.5 rounded-full border-2 border-brand-charcoal hover:bg-brand-butter/90 transition-all shadow-[2px_2px_0px_#080D09] uppercase flex items-center gap-1.5 active:translate-y-0.5 cursor-pointer shrink-0"
                    >
                        <LucideGlobe size={13} /> {language}
                    </button>
                    <button 
                        onClick={() => setShowChangelog(true)} 
                        className="text-xs font-functional text-brand-burgundy bg-brand-sorbet px-3 py-1.5 rounded-full border-2 border-brand-burgundy hover:bg-brand-sorbet/90 transition-all shadow-[2px_2px_0px_#561621] uppercase active:translate-y-0.5 cursor-pointer flex items-center gap-1.5 shrink-0"
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
                    <div className="safe-bottom w-full h-full overflow-y-auto custom-scroll px-4 py-6 sm:px-6 md:py-8 lg:py-10">
                        <div className="max-w-6xl mx-auto flex flex-col gap-8 md:gap-10 animate-fade-in">
                            
                            {/* Active Session Reconnect Notice */}
                            {localSession && (
                                <div className="bg-brand-sorbet text-brand-burgundy border-3 border-brand-burgundy rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_#561621] animate-fade-in">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-brand-butter text-brand-charcoal border-2 border-brand-burgundy shadow-xs">
                                            <Trophy size={18} />
                                        </div>
                                        <p className="text-sm font-body font-bold text-brand-burgundy">
                                            {t('home_active_session', { code: localSession.roomCode })}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setGameState("HOUSE_ARENA")}
                                        className="brand-button--primary text-sm py-2 px-4 shadow-[3px_3px_0px_#080D09]"
                                    >
                                        {t('home_reconnect')}
                                    </button>
                                </div>
                            )}

                            {/* Home Hero Component */}
                            <section className="home-hero">
                                <div className="home-hero__copy">
                                    <span className="eyebrow text-sm text-brand-burgundy font-black mb-2 tracking-widest">
                                        {t('home_hero_eyebrow')}
                                    </span>
                                    <h1 className="hero-title text-brand-charcoal font-black">
                                        {t('home_hero_title')}
                                    </h1>
                                    <p className="body-copy text-brand-charcoal/90 mt-3 font-medium max-w-lg">
                                        {t('home_hero_desc')}
                                    </p>

                                    <div className="home-hero__actions">
                                        <button 
                                            onClick={startUniversityMode}
                                            className="brand-button--primary"
                                        >
                                            <span>{t('home_hero_cta_primary')}</span>
                                            <ArrowRight size={18} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const el = document.getElementById('modes-section');
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="brand-button--secondary"
                                        >
                                            <span>{t('home_hero_cta_secondary')}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="home-hero__visual">
                                    <img 
                                        src={pokeBowlHero} 
                                        alt="Poke House Bowl Oficial" 
                                        className="home-hero__bowl"
                                    />
                                    <div className="pointer-events-none absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-brand-butter/30 -z-10" />
                                    <div className="pointer-events-none absolute top-4 left-4 w-20 h-20 rounded-full bg-brand-sorbet/40 -z-10" />
                                </div>
                            </section>

                            {/* Modes Section */}
                            <div id="modes-section" className="flex flex-col gap-6 text-left">
                                <div className="flex items-baseline justify-between border-b-2 border-brand-charcoal/15 pb-2">
                                    <h2 className="section-title text-brand-charcoal font-black">
                                        {t('home_modes_overview')}
                                    </h2>
                                    <span className="font-functional text-sm text-brand-burgundy uppercase tracking-wider font-normal">
                                        5 Modos de Treino
                                    </span>
                                </div>

                                <div className="mode-grid">
                                    {/* 1. University Bowl Card (Featured span 7) */}
                                    <div className="mode-card--featured bg-brand-sorbet text-brand-burgundy border-3 border-brand-burgundy rounded-[28px] p-6 md:p-8 shadow-[6px_6px_0px_#561621] flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_#561621]">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-13 h-13 rounded-2xl bg-brand-butter text-brand-charcoal border-2 border-brand-burgundy shadow-[2px_2px_0px_#561621] flex items-center justify-center">
                                                    <BookOpen size={26} className="text-brand-burgundy" />
                                                </div>
                                                <span className="font-functional text-xs uppercase px-3 py-1 rounded-full bg-brand-tomato text-white border border-brand-burgundy tracking-wider">
                                                    Percurso Recomendado
                                                </span>
                                            </div>
                                            <h3 className="font-display font-black text-2xl md:text-3xl text-brand-burgundy">
                                                {t('home_featured_title')}
                                            </h3>
                                            <p className="font-body text-sm text-brand-burgundy/85 mt-2.5 leading-relaxed max-w-lg">
                                                {t('home_featured_desc')}
                                            </p>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-brand-burgundy/20 flex items-center justify-between">
                                            <span className="font-functional text-xs text-brand-burgundy/75 uppercase tracking-wider">Estudo Passo a Passo</span>
                                            <button 
                                                onClick={startUniversityMode}
                                                className="brand-button--primary text-sm py-2 px-5 shadow-[3px_3px_0px_#080D09]"
                                            >
                                                <span>{t('home_btn_enter')}</span>
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. Custom Bowl Card (Secondary span 5) */}
                                    <div className="mode-card--secondary bg-brand-butter text-brand-charcoal border-3 border-brand-charcoal rounded-[28px] p-6 md:p-8 shadow-[6px_6px_0px_#080D09] flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_#080D09]">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-13 h-13 rounded-2xl bg-white text-brand-charcoal border-2 border-brand-charcoal shadow-[2px_2px_0px_#080D09] flex items-center justify-center">
                                                    <Sparkles size={26} className="text-brand-mochi" />
                                                </div>
                                                <span className="font-functional text-xs uppercase px-3 py-1 rounded-full bg-brand-mochi text-white border border-brand-charcoal tracking-wider">
                                                    Modo Livre
                                                </span>
                                            </div>
                                            <h3 className="font-display font-black text-2xl md:text-3xl text-brand-charcoal">
                                                {t('btn_create_bowl')}
                                            </h3>
                                            <p className="font-body text-sm text-brand-charcoal/85 mt-2.5 leading-relaxed">
                                                {t('nav_desc_custom_bowl')}
                                            </p>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-brand-charcoal/15 flex items-center justify-between">
                                            <span className="font-functional text-xs text-brand-charcoal/70 uppercase tracking-wider">Criação Guiada</span>
                                            <button 
                                                onClick={() => setGameState("CUSTOM_BOWL")}
                                                className="px-5 py-2.5 rounded-full bg-brand-mochi hover:bg-brand-mochi/90 text-white font-functional text-base tracking-wider uppercase border-2 border-brand-charcoal shadow-[3px_3px_0px_#080D09] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
                                            >
                                                <span>{t('home_btn_enter')}</span>
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 3. Hora do Lodo (Rush) Card */}
                                    <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-brand-tomato text-brand-linen border-3 border-brand-charcoal rounded-[24px] p-5 md:p-6 shadow-[5px_5px_0px_#080D09] flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0px_#080D09]">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-11 h-11 rounded-xl bg-brand-butter text-brand-charcoal border-2 border-brand-charcoal shadow-[2px_2px_0px_#080D09] flex items-center justify-center">
                                                    <Timer size={22} className="text-brand-charcoal" />
                                                </div>
                                                <span className="font-functional text-xs uppercase px-2.5 py-0.5 rounded-full bg-brand-butter text-brand-charcoal border border-brand-charcoal tracking-wider">
                                                    Velocidade
                                                </span>
                                            </div>
                                            <h3 className="font-display font-black text-xl md:text-2xl text-brand-linen">
                                                {t('menu_rush')}
                                            </h3>
                                            <p className="font-body text-xs text-brand-linen/90 mt-2 leading-relaxed">
                                                {t('nav_desc_rush')}
                                            </p>
                                        </div>
                                        <div className="mt-5 pt-3 border-t border-brand-linen/25 flex items-center justify-between">
                                            <span className="font-functional text-xs text-brand-linen/75 uppercase tracking-wider">Fila de Pedidos</span>
                                            <button 
                                                onClick={startRushMode}
                                                className="px-4 py-2 rounded-full bg-brand-butter hover:bg-brand-butter/90 text-brand-charcoal font-functional text-sm tracking-wider uppercase border-2 border-brand-charcoal shadow-[2px_2px_0px_#080D09] active:translate-y-0.5 transition-all cursor-pointer"
                                            >
                                                {t('home_btn_enter')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 4. Pensa Rápido (Quiz) Card */}
                                    <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-brand-icy text-brand-charcoal border-3 border-brand-charcoal rounded-[24px] p-5 md:p-6 shadow-[5px_5px_0px_#080D09] flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0px_#080D09]">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-11 h-11 rounded-xl bg-white text-brand-charcoal border-2 border-brand-charcoal shadow-[2px_2px_0px_#080D09] flex items-center justify-center">
                                                    <Brain size={22} className="text-brand-charcoal" />
                                                </div>
                                                <span className="font-functional text-xs uppercase px-2.5 py-0.5 rounded-full bg-brand-butter text-brand-charcoal border border-brand-charcoal tracking-wider">
                                                    Regras & SOP
                                                </span>
                                            </div>
                                            <h3 className="font-display font-black text-xl md:text-2xl text-brand-charcoal">
                                                {t('menu_quiz')}
                                            </h3>
                                            <p className="font-body text-xs text-brand-charcoal/80 mt-2 leading-relaxed">
                                                {t('nav_desc_quiz')}
                                            </p>
                                        </div>
                                        <div className="mt-5 pt-3 border-t border-brand-charcoal/15 flex items-center justify-between">
                                            <span className="font-functional text-xs text-brand-charcoal/70 uppercase tracking-wider">Desafio Teórico</span>
                                            <button 
                                                onClick={() => setGameState("QUIZ_PLAYING")}
                                                className="px-4 py-2 rounded-full bg-brand-butter hover:bg-brand-butter/90 text-brand-charcoal font-functional text-sm tracking-wider uppercase border-2 border-brand-charcoal shadow-[2px_2px_0px_#080D09] active:translate-y-0.5 transition-all cursor-pointer"
                                            >
                                                {t('home_btn_enter')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 5. House Arena Card */}
                                    <div className="col-span-12 lg:col-span-4 bg-brand-olives text-brand-charcoal border-3 border-brand-charcoal rounded-[24px] p-5 md:p-6 shadow-[5px_5px_0px_#080D09] flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0px_#080D09]">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-11 h-11 rounded-xl bg-white text-brand-charcoal border-2 border-brand-charcoal shadow-[2px_2px_0px_#080D09] flex items-center justify-center">
                                                    <Trophy size={22} className="text-brand-charcoal" />
                                                </div>
                                                <span className="font-functional text-xs uppercase px-2.5 py-0.5 rounded-full bg-brand-mochi text-white border border-brand-charcoal tracking-wider">
                                                    Multijogador
                                                </span>
                                            </div>
                                            <h3 className="font-display font-black text-xl md:text-2xl text-brand-charcoal">
                                                {t('house_arena_title')}
                                            </h3>
                                            <p className="font-body text-xs text-brand-charcoal/80 mt-2 leading-relaxed">
                                                {t('nav_desc_arena')}
                                            </p>
                                        </div>
                                        <div className="mt-5 pt-3 border-t border-brand-charcoal/15 flex items-center justify-between">
                                            <span className="font-functional text-xs text-brand-charcoal/70 uppercase tracking-wider">Salas em Direto</span>
                                            <button 
                                                onClick={() => setGameState("HOUSE_ARENA")}
                                                className="px-4 py-2 rounded-full bg-brand-mochi hover:bg-brand-mochi/90 text-white font-functional text-sm tracking-wider uppercase border-2 border-brand-charcoal shadow-[2px_2px_0px_#080D09] active:translate-y-0.5 transition-all cursor-pointer"
                                            >
                                                {t('home_btn_enter')}
                                            </button>
                                        </div>
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
