import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameState, Recipe } from '../../types';
import { TranslationKey } from '../../translations';
import { RECIPES, THEMES, PHASES_BOWL, PHASES_SMOOTHIE, INGREDIENTS_DB } from '../../constants';
import { 
    IconCheck, 
    IconHome, 
    IconArrowLeft, 
    IconArrowRight,
    IconX, 
    IconBowl, 
    IconUniversity, 
    IconFish, 
    IconLeaf, 
    IconCup, 
    IconInfo, 
    IconRotate 
} from '../../components/Icons';
import UniversityBowl from '../../components/UniversityBowl';
import { useUniversityBowl } from './useUniversityBowl';
import { playSound } from '../../utils/sound';

interface UniversityModeProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    resetToHome: () => void;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
    language: string;
}

type SubState = "ENTRY" | "SELECT_PRODUCT" | "SIZE_SELECT" | "RECIPE_OVERVIEW";

export function UniversityMode({
    gameState,
    setGameState,
    resetToHome,
    t
}: UniversityModeProps) {
    const [menuCategory, setMenuCategory] = useState<string | null>(null);
    const [subState, setSubState] = useState<SubState>("ENTRY");
    const [tempRecipe, setTempRecipe] = useState<Recipe | null>(null);
    const [selectedSize, setSelectedSize] = useState<"R" | "L">("R");
    
    // Active step local states
    const [stepSelections, setStepSelections] = useState<string[]>([]);
    const [stepStatus, setStepStatus] = useState<"WAITING" | "CORRECT" | "INCORRECT">("WAITING");
    const [wrongSelection, setWrongSelection] = useState<string | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const exitModalRef = useRef<HTMLDivElement>(null);

    // Escape key listener for exit confirmation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showExitConfirm) {
                setShowExitConfirm(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showExitConfirm]);

    // Focus trap inside exit modal
    useEffect(() => {
        if (showExitConfirm && exitModalRef.current) {
            const focusable = exitModalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length > 0) {
                (focusable[0] as HTMLElement).focus();
            }
        }
    }, [showExitConfirm]);

    const {
        selectedRecipe,
        uniCurrentStep,
        bowl,
        stepsR,
        stepsL,
        startUniversityLevel,
        handleUniNext,
        handleUniPrev,
        resetUniversity
    } = useUniversityBowl();

    const currentSteps = useMemo(() => {
        if (!selectedRecipe) return [];
        return selectedSize === "R" ? stepsR : stepsL;
    }, [selectedRecipe, selectedSize, stepsR, stepsL]);

    const currentStep = useMemo(() => {
        if (!currentSteps || currentSteps.length === 0) return null;
        return currentSteps[uniCurrentStep];
    }, [currentSteps, uniCurrentStep]);

    // Format text with parameter interpolation helper
    const formatText = (text: string, params: Record<string, string | number>) => {
        let result = text;
        for (const [key, value] of Object.entries(params)) {
            result = result.replace(`{${key}}`, String(value));
        }
        return result;
    };

    // Initialize/Reset step options when step index or recipe changes
    useEffect(() => {
        if (!currentStep) return;
        
        // 1. If it's a "Não leva" step, no options needed
        if (currentStep.item === "Não leva" || currentStep.count === 0) {
            setOptions([]);
            setStepSelections([]);
            setStepStatus("WAITING");
            setWrongSelection(null);
            return;
        }

        // 2. If it's sesame phase, options are simple Yes/No
        if (currentStep.phase === "sesame") {
            setOptions(["Sim", "Não"]);
            setStepSelections([]);
            setStepStatus("WAITING");
            setWrongSelection(null);
            return;
        }

        // 3. General ingredient options
        const correct = currentStep.item;
        const dbKey = currentStep.phase as keyof typeof INGREDIENTS_DB;
        const fullList = INGREDIENTS_DB[dbKey] || [];
        
        // Exclude correct item and empty options to get distractors
        const distractors = fullList.filter(item => 
            item !== correct && 
            item !== "Não leva" && 
            item !== "Não"
        );
        
        // Shuffle distractors and take up to 5
        const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random());
        const pickedDistractors = shuffledDistractors.slice(0, 5);
        
        // Combine with correct and shuffle
        const finalOptions = [...pickedDistractors, correct]
            .sort(() => 0.5 - Math.random());
            
        setOptions(finalOptions);
        setStepSelections([]);
        setStepStatus("WAITING");
        setWrongSelection(null);
    }, [uniCurrentStep, selectedRecipe, selectedSize, currentStep]);

    const handleLevelStart = (recipe: Recipe) => {
        setTempRecipe(recipe);
        const hasMultipleSizes = recipe.category === "HOUSE";
        
        if (hasMultipleSizes) {
            setSelectedSize("R");
            setSubState("SIZE_SELECT");
        } else {
            setSelectedSize("R");
            setSubState("RECIPE_OVERVIEW");
        }
    };

    const handleConfirmSize = (size: "R" | "L") => {
        setSelectedSize(size);
        setSubState("RECIPE_OVERVIEW");
    };

    const handleStartTraining = () => {
        if (tempRecipe) {
            startUniversityLevel(tempRecipe);
            setGameState("UNIVERSITY_PLAYING");
            setStepSelections([]);
            setStepStatus("WAITING");
            setWrongSelection(null);
        }
    };

    const handleExit = () => {
        resetUniversity();
        setTempRecipe(null);
        setMenuCategory(null);
        setSubState("ENTRY");
        setShowExitConfirm(false);
        resetToHome();
    };

    const handleOptionSelect = (option: string) => {
        if (!currentStep || stepStatus !== "WAITING") return;

        const correctItem = currentStep.item;
        const requiredCount = currentStep.count;

        if (option === correctItem) {
            const nextSelections = [...stepSelections, option];
            setStepSelections(nextSelections);
            playSound("happy");

            // If required count is met, mark step as completed/correct
            if (nextSelections.length === requiredCount) {
                setStepStatus("CORRECT");
            }
        } else {
            setStepStatus("INCORRECT");
            setWrongSelection(option);
            playSound("sad");
        }
    };

    const handleUndoLastSelection = () => {
        if (stepSelections.length > 0 && stepStatus === "WAITING") {
            setStepSelections(prev => prev.slice(0, -1));
        }
    };

    const handleTryAgain = () => {
        setStepSelections([]);
        setStepStatus("WAITING");
        setWrongSelection(null);
    };

    const handleNextStep = () => {
        handleUniNext(() => {
            setGameState("UNIVERSITY_SUCCESS");
        });
    };

    const currentTheme = selectedRecipe 
        ? THEMES[selectedRecipe.category] 
        : THEMES.HOUSE;

    const getPhaseTitle = (phaseKey: string) => {
        const phasesList = selectedRecipe?.category === "SMOOTHIE" ? PHASES_SMOOTHIE : PHASES_BOWL;
        return phasesList.find(p => p.key === phaseKey)?.title || phaseKey;
    };

    // Get a friendly name for translated item displays
    const getTranslatedItemName = (itemName: string) => {
        if (itemName === "Não leva") return t('uni_no_item');
        if (itemName === "Não") return t('cb_btn_no');
        if (itemName === "Sim") return t('cb_btn_yes');
        return itemName;
    };

    const getRecipeTakeaway = (recipe: Recipe) => {
        if (recipe.category === "SMOOTHIE") {
            return "Takeaway: Os smoothies devem ser batidos exatamente no Programa E para garantir a consistência correta do gelo e das frutas de pack.";
        }
        if (recipe.name.includes("Sunny Salmon")) {
            return "Takeaway: O salmão Juicy deve ser colocado em 2 scoops bem nivelados para garantir o peso padrão de 90g de proteína por bowl.";
        }
        if (recipe.name.includes("Fire Salmon")) {
            return "Takeaway: A Sriracha Mayo vai na base por cima do arroz e também no topo como molho final. Siga os ziguezagues recomendados.";
        }
        return "Takeaway: A sequência de montagem (Bases -> Greens -> Proteínas -> Molhos -> Toppings) garante que a bowl mantenha sua estrutura visual e térmica.";
    };

    return (
        <div className="safe-screen fixed inset-0 w-full h-[100dvh] font-sans text-brand-charcoal flex flex-col overflow-hidden bg-brand-linen px-3 py-3 sm:p-4 md:p-8 select-none">
            
            {/* Header / Brand Bar */}
            <div className="max-w-4xl w-full mx-auto flex items-center justify-between gap-2 mb-3 md:mb-6 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="bg-brand-mochi text-white p-2.5 rounded-2xl border-2 border-brand-charcoal shadow-[2px_2px_0px_#080D09] shrink-0">
                        <IconUniversity size={24} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base min-[375px]:text-lg md:text-2xl font-display font-black leading-tight text-brand-charcoal">
                            {t('university_title')}
                        </h1>
                        <p className="hidden min-[390px]:block text-[11px] md:text-xs font-body text-brand-burgundy font-medium leading-tight">
                            {t('university_objective')}
                        </p>
                    </div>
                </div>
                
                {gameState !== "UNIVERSITY_PLAYING" && (
                    <button 
                        onClick={resetToHome}
                        className="bg-brand-butter hover:bg-brand-butter/90 text-brand-charcoal p-2.5 min-[390px]:px-4 rounded-full font-functional text-sm uppercase tracking-wider border-2 border-brand-charcoal transition-all shadow-[2px_2px_0px_#080D09] flex items-center gap-1.5 active:translate-y-0.5 shrink-0 cursor-pointer"
                        aria-label={t('btn_menu_main')}
                    >
                        <IconHome size={18} />
                        <span className="hidden min-[390px]:inline">{t('btn_menu')}</span>
                    </button>
                )}
            </div>

            {/* Main view router */}
            <div className="safe-bottom max-w-4xl w-full mx-auto flex-1 min-h-0 flex flex-col justify-start md:justify-center items-center overflow-y-auto custom-scroll">
                
                {/* 1. ENTRY VIEW */}
                {gameState === "UNIVERSITY_SELECT" && subState === "ENTRY" && (
                    <div className="bg-brand-linen border-3 border-brand-charcoal rounded-[28px] shadow-[6px_6px_0px_#080D09] p-6 md:p-10 w-full animate-slide-up text-center max-w-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-brand-butter border-2 border-brand-charcoal shadow-[3px_3px_0px_#080D09] flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🎓</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-display font-black text-brand-charcoal mb-2">
                            {t('university_title')}
                        </h2>
                        <p className="text-brand-burgundy font-body text-sm md:text-base leading-relaxed mb-8 max-w-md mx-auto font-medium">
                            {t('uni_intro_sub')}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <button 
                                onClick={() => { setMenuCategory("HOUSE"); setSubState("SELECT_PRODUCT"); }}
                                className="bg-brand-sorbet text-brand-burgundy hover:bg-brand-sorbet/90 border-3 border-brand-burgundy rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1 active:translate-y-0 shadow-[4px_4px_0px_#561621] cursor-pointer group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-brand-butter border-2 border-brand-burgundy flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    🐟
                                </div>
                                <span className="font-functional text-sm uppercase tracking-wider text-brand-burgundy font-black">
                                    {t('menu_house')}
                                </span>
                            </button>
                            
                            <button 
                                onClick={() => { setMenuCategory("GREEN"); setSubState("SELECT_PRODUCT"); }}
                                className="bg-brand-butter text-brand-charcoal hover:bg-brand-butter/90 border-3 border-brand-charcoal rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1 active:translate-y-0 shadow-[4px_4px_0px_#080D09] cursor-pointer group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white border-2 border-brand-charcoal flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    🥗
                                </div>
                                <span className="font-functional text-sm uppercase tracking-wider text-brand-charcoal font-black">
                                    {t('menu_green')}
                                </span>
                            </button>

                            <button 
                                onClick={() => { setMenuCategory("SMOOTHIE"); setSubState("SELECT_PRODUCT"); }}
                                className="bg-brand-icy text-brand-charcoal hover:bg-brand-icy/90 border-3 border-brand-charcoal rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1 active:translate-y-0 shadow-[4px_4px_0px_#080D09] cursor-pointer group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white border-2 border-brand-charcoal flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    🥤
                                </div>
                                <span className="font-functional text-sm uppercase tracking-wider text-brand-charcoal font-black">
                                    {t('menu_smoothie')}
                                </span>
                            </button>
                        </div>

                        <p className="text-xs font-functional text-brand-charcoal bg-brand-butter py-2 px-4 rounded-full inline-block border-2 border-brand-charcoal shadow-[2px_2px_0px_#080D09] uppercase tracking-wider">
                            {t('uni_recommended_order')}
                        </p>
                    </div>
                )}

                {/* 2. PRODUCT SELECTION GRID */}
                {gameState === "UNIVERSITY_SELECT" && subState === "SELECT_PRODUCT" && menuCategory && (
                    <div className="w-full bg-brand-linen border-3 border-brand-charcoal rounded-[28px] shadow-[6px_6px_0px_#080D09] p-4 md:p-8 animate-slide-up flex flex-col max-w-4xl min-h-0">
                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 mb-4 md:mb-6 border-b-2 border-brand-charcoal/15 pb-3 md:pb-4">
                            <button 
                                onClick={() => setSubState("ENTRY")}
                                className="flex items-center gap-1.5 text-brand-charcoal font-functional text-sm bg-brand-butter hover:bg-brand-butter/90 py-2 px-3.5 rounded-full border-2 border-brand-charcoal shadow-[2px_2px_0px_#080D09] active:translate-y-0.5 transition-all cursor-pointer uppercase"
                            >
                                <IconArrowLeft size={16} />
                                <span>{t('btn_back')}</span>
                            </button>
                            <h2 className="text-lg md:text-2xl text-center font-display font-black text-brand-charcoal min-w-0">
                                {menuCategory === "HOUSE" ? t('menu_house') : menuCategory === "GREEN" ? t('menu_green') : t('menu_smoothie')}
                            </h2>
                            <div className="w-8 md:w-[84px] invisible" /> {/* Spacer */}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 overflow-y-auto max-h-none md:max-h-[55vh] pr-1 custom-scroll">
                            {RECIPES
                                .filter(r => r.category === menuCategory)
                                .map(recipe => {
                                    const isHouse = recipe.category === "HOUSE";

                                    return (
                                        <button 
                                            key={recipe.id} 
                                            onClick={() => handleLevelStart(recipe)}
                                            className="bg-white hover:bg-brand-sorbet/25 border-3 border-brand-charcoal rounded-2xl p-4 md:p-5 text-left flex flex-col justify-between min-h-[140px] transition-all hover:-translate-y-1 shadow-[4px_4px_0px_#080D09] active:translate-y-0 group min-w-0 cursor-pointer"
                                        >
                                            <div>
                                                <h3 className="font-display text-sm md:text-base font-black text-brand-charcoal leading-tight group-hover:text-brand-burgundy transition-colors break-words">
                                                    {recipe.name}
                                                </h3>
                                                <p className="text-xs font-functional text-brand-burgundy/80 uppercase tracking-widest mt-1">
                                                    {recipe.category === "SMOOTHIE" ? "Smoothie" : recipe.category === "HOUSE" ? "Poke Bowl" : "Salad Bowl"}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-end justify-between gap-1 mt-4 pt-3 border-t border-brand-charcoal/10">
                                                <span className="text-[11px] font-functional text-brand-charcoal bg-brand-butter px-2.5 py-0.5 rounded-full border border-brand-charcoal uppercase">
                                                    {isHouse ? "R & L Sizes" : "Regular"}
                                                </span>
                                                <span className="text-xs font-functional font-black text-brand-burgundy group-hover:translate-x-0.5 transition-transform flex items-center gap-1 uppercase">
                                                    Treinar →
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* 3. SIZE SELECTION SCREEN */}
                {gameState === "UNIVERSITY_SELECT" && subState === "SIZE_SELECT" && tempRecipe && (
                    <div className="w-full bg-brand-linen border-3 border-brand-charcoal rounded-[28px] shadow-[6px_6px_0px_#080D09] p-6 md:p-8 animate-slide-up flex flex-col max-w-2xl text-center">
                        <h2 className="text-2xl font-display font-black text-brand-charcoal mb-2">
                            {t('university_select_size')}
                        </h2>
                        <p className="text-xs md:text-sm font-body text-brand-burgundy mb-8 font-medium">
                            Escolha o tamanho para treinar as proporções corretas de ingredientes da {tempRecipe.name}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <button 
                                onClick={() => setSelectedSize("R")}
                                className={`border-3 rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3 relative cursor-pointer ${
                                    selectedSize === "R" 
                                        ? "border-brand-charcoal bg-brand-butter text-brand-charcoal shadow-[5px_5px_0px_#080D09]" 
                                        : "border-brand-charcoal/40 bg-white text-brand-charcoal hover:border-brand-charcoal"
                                }`}
                            >
                                {selectedSize === "R" && (
                                    <div className="absolute top-4 right-4 bg-brand-mochi text-white p-1 rounded-full border-2 border-brand-charcoal">
                                        <IconCheck size={14} />
                                    </div>
                                )}
                                <span className="text-4xl">Bowl</span>
                                <span className="font-display text-lg font-black uppercase">
                                    Regular (R)
                                </span>
                                <span className="text-xs font-functional uppercase tracking-wider text-brand-charcoal/80">
                                    Base: 180g Arroz Sushi • 2x Protein
                                </span>
                            </button>

                            <button 
                                onClick={() => setSelectedSize("L")}
                                className={`border-3 rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3 relative cursor-pointer ${
                                    selectedSize === "L" 
                                        ? "border-brand-charcoal bg-brand-butter text-brand-charcoal shadow-[5px_5px_0px_#080D09]" 
                                        : "border-brand-charcoal/40 bg-white text-brand-charcoal hover:border-brand-charcoal"
                                }`}
                            >
                                {selectedSize === "L" && (
                                    <div className="absolute top-4 right-4 bg-brand-mochi text-white p-1 rounded-full border-2 border-brand-charcoal">
                                        <IconCheck size={14} />
                                    </div>
                                )}
                                <span className="text-4xl">Big Bowl</span>
                                <span className="font-display text-lg font-black uppercase">
                                    Large (L)
                                </span>
                                <span className="text-xs font-functional uppercase tracking-wider text-brand-charcoal/80">
                                    Base: 270g Arroz Sushi • 3x Protein
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-4 mt-4">
                            <button 
                                onClick={() => setSubState("SELECT_PRODUCT")}
                                className="flex-1 brand-button--secondary"
                            >
                                {t('btn_back')}
                            </button>
                            <button 
                                onClick={() => setSubState("RECIPE_OVERVIEW")}
                                className="flex-1 brand-button--primary"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. RECIPE OVERVIEW CARD */}
                {gameState === "UNIVERSITY_SELECT" && subState === "RECIPE_OVERVIEW" && tempRecipe && (
                    <div className="w-full bg-brand-linen border-3 border-brand-charcoal rounded-[28px] shadow-[6px_6px_0px_#080D09] p-6 md:p-8 animate-slide-up flex flex-col max-w-md text-center">
                        <div className="w-16 h-16 rounded-2xl bg-brand-butter border-2 border-brand-charcoal shadow-[3px_3px_0px_#080D09] flex items-center justify-center mx-auto mb-3 text-3xl">
                            📋
                        </div>
                        <h2 className="text-xl font-display font-black text-brand-charcoal mb-1">
                            {t('university_recipe_overview')}
                        </h2>
                        <h3 className="text-2xl font-display font-black text-brand-burgundy mb-2">
                            {tempRecipe.name}
                        </h3>
                        <p className="text-xs font-functional bg-brand-butter py-1.5 px-4 rounded-full border border-brand-charcoal uppercase tracking-wider inline-block mx-auto mb-6 text-brand-charcoal font-black">
                            Tamanho: {tempRecipe.category === "SMOOTHIE" ? "Padrão" : selectedSize === "R" ? "Regular" : "Large"}
                        </p>

                        <div className="bg-brand-sorbet text-brand-burgundy border-2 border-brand-burgundy rounded-2xl p-4 text-left space-y-2 mb-8 shadow-xs">
                            <h4 className="font-functional font-black uppercase text-xs tracking-wider text-brand-burgundy">
                                Notas de Preparação Importantes:
                            </h4>
                            <p className="font-body text-xs text-brand-burgundy/90 leading-relaxed font-medium">
                                {tempRecipe.category === "SMOOTHIE" 
                                    ? "Os smoothies são preparados batendo os packs de frutas congeladas com líquidos e ingredientes adicionais no copo de servir. Atente-se à marmorização do copo com iogurte ou pastas antes de servir."
                                    : "A montagem segue o padrão de camadas estritas para garantir estética impecável. Meça o peso da base com rigor e distribua os greens uniformemente antes das proteínas."}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={handleStartTraining}
                                className="w-full brand-button--primary text-center justify-center"
                            >
                                {t('university_start_training')}
                            </button>
                            <button 
                                onClick={() => {
                                    if (tempRecipe.category === "HOUSE") {
                                        setSubState("SIZE_SELECT");
                                    } else {
                                        setSubState("SELECT_PRODUCT");
                                    }
                                }}
                                className="w-full brand-button--secondary text-center justify-center"
                            >
                                {t('btn_back')}
                            </button>
                        </div>
                    </div>
                )}


                {/* 5. ACTIVE LEARNING SHELL */}
                {gameState === "UNIVERSITY_PLAYING" && selectedRecipe && currentStep && (
                    <div className="w-full bg-white border-4 border-brand-charcoal rounded-modal shadow-elevated flex flex-col overflow-hidden animate-slide-up max-w-4xl">
                        
                        {/* Compact Top Row */}
                        <div className="bg-brand-linen border-b-4 border-brand-charcoal p-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-display text-sm font-black text-brand-charcoal">
                                    {selectedRecipe.name}
                                </span>
                                <span className="text-[10px] font-condensed font-black bg-white border border-brand-charcoal px-2 py-0.5 rounded uppercase tracking-wider">
                                    {selectedRecipe.category === "SMOOTHIE" ? "Smoothie" : selectedSize === "R" ? "Regular" : "Large"}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className="font-condensed font-black uppercase text-xs tracking-wider text-brand-charcoal bg-brand-butter py-1 px-3 rounded-full border border-brand-charcoal">
                                    Passo {uniCurrentStep + 1} de {currentSteps.length}
                                </span>
                                <button 
                                    onClick={() => setShowExitConfirm(true)}
                                    className="text-brand-charcoal hover:text-brand-tomato transition-colors p-1"
                                    aria-label="Sair do treino"
                                >
                                    <IconX size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Custom Segmented Progress Bar */}
                        <div className="bg-brand-linen/40 border-b-2 border-brand-charcoal px-4 py-2.5 flex gap-1 justify-between items-center overflow-x-auto">
                            {currentSteps.map((step, idx) => {
                                const isCompleted = idx < uniCurrentStep;
                                const isActive = idx === uniCurrentStep;
                                return (
                                    <div 
                                        key={idx} 
                                        className={`flex-1 min-w-[12px] h-3 rounded transition-all border-2 border-brand-charcoal ${
                                            isCompleted 
                                                ? "bg-brand-olives" 
                                                : isActive 
                                                    ? "bg-brand-mochi scale-y-110" 
                                                    : "bg-white"
                                        }`}
                                    />
                                );
                            })}
                        </div>

                        {/* Interactive Area split into Visualizer and Action Columns */}
                        <div className="flex flex-col md:flex-row divide-y-4 md:divide-y-0 md:divide-x-4 divide-brand-charcoal flex-1 min-h-[420px]">
                            
                            {/* Left/Top Column: Visualizer */}
                            <div className="flex-1 bg-brand-linen/20 p-6 flex flex-col items-center justify-center relative min-h-[220px] md:min-h-0">
                                {selectedRecipe.category !== "SMOOTHIE" ? (
                                    <div className="relative w-44 h-44 md:w-64 md:h-64 transition-all transform hover:scale-105 duration-300">
                                        <UniversityBowl 
                                            steps={currentSteps} 
                                            step={stepStatus === "CORRECT" ? uniCurrentStep + 1 : uniCurrentStep} 
                                            isSalad={selectedRecipe.category === "GREEN"} 
                                            scale={1} 
                                            zigLines={selectedSize === "R" ? 15 : 20}
                                        />
                                    </div>
                                ) : (
                                    // Custom Interactive Smoothie cup visual
                                    <div className="flex flex-col items-center justify-center p-2">
                                        <div className="relative w-36 h-56 border-4 border-brand-charcoal rounded-b-3xl rounded-t-lg bg-white overflow-hidden shadow-md">
                                            {/* Straw */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-8 bg-brand-mochi -mt-6 rounded-t-full border-2 border-brand-charcoal"></div>
                                            
                                            {/* Filling fluid based on completed step index */}
                                            <div 
                                                className="absolute bottom-0 left-0 w-full bg-brand-butter transition-all duration-700" 
                                                style={{ 
                                                    height: `${Math.min(100, ((stepStatus === "CORRECT" ? uniCurrentStep + 1 : uniCurrentStep) / currentSteps.length) * 100)}%`,
                                                    backgroundColor: selectedRecipe.name.includes("Green") ? "#99CA5C" : selectedRecipe.name.includes("Nutty") ? "#F3E39F" : selectedRecipe.name.includes("Pink") ? "#FF83AF" : "#819EC5" 
                                                }}
                                            >
                                                {/* Bubbles effect */}
                                                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle,_#fff_10%,_transparent_11%)] bg-[length:16px_16px] animate-pulse"></div>
                                            </div>
                                            
                                            {/* Label */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="bg-white/95 border-2 border-brand-charcoal rounded px-2.5 py-1 text-[10px] font-condensed font-black tracking-wider uppercase text-brand-charcoal shadow-sm">
                                                    {selectedRecipe.name.split(" ")[0]}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Overlay current state */}
                                <div className="absolute bottom-3 left-4 text-[10px] font-condensed font-black text-brand-charcoal/40 uppercase tracking-widest">
                                    {selectedRecipe.category === "SMOOTHIE" ? "Smoothie Cup" : "Poke Bowl 2D"}
                                </div>
                            </div>

                            {/* Right/Bottom Column: Action controls & step instructions */}
                            <div className="flex-1 p-5 md:p-6 flex flex-col justify-between gap-6 bg-white">
                                
                                {/* Step Card Detail */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-condensed font-black bg-brand-icy text-white py-1 px-3.5 rounded border border-brand-charcoal uppercase tracking-widest">
                                            {getPhaseTitle(currentStep.phase)}
                                        </span>
                                        {currentStep.item !== "Não leva" && currentStep.count > 0 && (
                                            <span className="text-[10px] font-condensed font-black bg-brand-butter text-brand-charcoal py-1 px-2 rounded border border-brand-charcoal uppercase tracking-widest">
                                                {t('uni_interactive')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Operational instruction styling */}
                                    {currentStep.item === "Não leva" || currentStep.count === 0 ? (
                                        // "Não Leva" informational state
                                        <div className="bg-brand-sorbet/25 border-2 border-brand-charcoal rounded-win p-4 space-y-3">
                                            <div className="flex items-center gap-2.5 text-brand-charcoal">
                                                <IconInfo size={20} className="text-brand-mochi" />
                                                <h4 className="font-display text-sm font-black uppercase">
                                                    {t('uni_exclusion_step')}
                                                </h4>
                                            </div>
                                            <p className="font-body text-xs md:text-sm font-bold text-brand-charcoal/90 leading-snug">
                                                {formatText(t('university_does_not_include'), { phase: getPhaseTitle(currentStep.phase) })}
                                            </p>
                                        </div>
                                    ) : (
                                        // Standard interactive step instruction
                                        <div className="space-y-1">
                                            <h3 className="font-display text-base md:text-lg font-black text-brand-charcoal leading-tight">
                                                {currentStep.phase === "sesame" 
                                                    ? formatText(t('uni_does_recipe_include'), { phase: getPhaseTitle(currentStep.phase) })
                                                    : formatText(t('uni_add_correct_phase'), { phase: getPhaseTitle(currentStep.phase) })
                                                }
                                            </h3>
                                            <p className="text-xs font-body font-bold text-brand-charcoal/60">
                                                {t('uni_choose_exact')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Selection Area (Option Grid vs Info Button) */}
                                <div className="flex-1 flex flex-col justify-center">
                                    {currentStep.item === "Não leva" || currentStep.count === 0 ? (
                                        // Passive step simple continue action
                                        <div className="space-y-3">
                                            <button 
                                                onClick={handleNextStep}
                                                className="w-full bg-brand-mochi hover:bg-brand-mochi/90 text-brand-charcoal py-4 rounded-button font-display font-black border-2 border-brand-charcoal transition-all uppercase text-sm shadow-sm active:translate-y-0.5 flex items-center justify-center gap-2"
                                            >
                                                <span>{t('university_continue')}</span>
                                                <IconArrowRight size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        // Interactive selection cards grid
                                        <div className="space-y-4">
                                            {stepStatus === "WAITING" && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {options.map((option, idx) => {
                                                        const isSelected = stepSelections.includes(option);
                                                        const countSelected = stepSelections.filter(x => x === option).length;
                                                        return (
                                                            <button 
                                                                key={idx}
                                                                onClick={() => handleOptionSelect(option)}
                                                                className={`p-3.5 rounded-win text-left border-2 border-brand-charcoal font-body font-bold text-xs md:text-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-between min-h-[50px] ${
                                                                    isSelected 
                                                                        ? "bg-brand-sorbet text-brand-charcoal shadow-sm" 
                                                                        : "bg-brand-linen/10 hover:bg-brand-linen/40 text-brand-charcoal"
                                                                }`}
                                                            >
                                                                <span className="truncate pr-1">
                                                                    {getTranslatedItemName(option)}
                                                                </span>
                                                                {isSelected && (
                                                                    <span className="bg-brand-mochi text-white p-0.5 rounded-full border border-brand-charcoal flex items-center justify-center shrink-0">
                                                                        <IconCheck size={10} />
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Edge cases support: Nutty Fit optional chocolate drops skip */}
                                            {selectedRecipe.name.includes("Nutty Fit") && currentStep.item.includes("Gotas de Chocolate") && stepStatus === "WAITING" && (
                                                <button 
                                                    onClick={() => {
                                                        playSound("happy");
                                                        setStepStatus("CORRECT");
                                                    }}
                                                    className="w-full py-2.5 bg-brand-butter hover:bg-brand-butter/80 text-brand-charcoal border-2 border-brand-charcoal rounded-button font-display text-[10px] font-black uppercase tracking-wider shadow-sm transition-all text-center"
                                                >
                                                    {formatText(t('uni_skip_optional'), { item: getTranslatedItemName(currentStep.item) })}
                                                </button>
                                            )}

                                            {/* Contextual Feedback Displays */}
                                            {stepStatus === "CORRECT" && (
                                                <div className="bg-brand-olives/20 border-2 border-brand-charcoal rounded-win p-4 animate-fade-in text-center space-y-3">
                                                    <div className="inline-flex bg-brand-olives text-white p-1.5 rounded-full border-2 border-brand-charcoal mb-1">
                                                        <IconCheck size={20} />
                                                    </div>
                                                    <h4 className="font-display text-sm font-black uppercase text-brand-charcoal">
                                                        {t('university_correct')}
                                                    </h4>
                                                    <p className="font-body text-xs font-semibold text-brand-charcoal/80">
                                                        {formatText(t('uni_added_item'), { item: getTranslatedItemName(currentStep.item), count: currentStep.count })}
                                                    </p>
                                                    <button 
                                                        onClick={handleNextStep}
                                                        className="w-full bg-brand-olives hover:bg-brand-olives/90 text-white py-3 rounded-button font-display font-black border-2 border-brand-charcoal transition-all uppercase text-xs shadow-sm active:translate-y-0.5"
                                                    >
                                                        {t('uni_advance_step')}
                                                    </button>
                                                </div>
                                            )}

                                            {stepStatus === "INCORRECT" && wrongSelection && (
                                                <div className="bg-brand-tomato/10 border-2 border-brand-charcoal rounded-win p-4 animate-fade-in space-y-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-xl">❌</span>
                                                        <h4 className="font-display text-sm font-black uppercase text-brand-charcoal">
                                                            {t('university_not_correct')}
                                                        </h4>
                                                    </div>
                                                    
                                                    <div className="text-xs space-y-2.5 font-body font-semibold">
                                                        <p className="text-brand-charcoal/80">
                                                            {t('uni_incorrectly_selected')} <span className="font-bold text-brand-tomato bg-brand-tomato/5 px-2 py-0.5 rounded border border-brand-tomato/20">{getTranslatedItemName(wrongSelection)}</span>
                                                        </p>
                                                        <p className="text-brand-charcoal/80">
                                                            {t('uni_expected_item')} <span className="font-bold text-brand-olives bg-brand-olives/5 px-2 py-0.5 rounded border border-brand-olives/20">{getTranslatedItemName(currentStep.item)}</span> ({currentStep.count}x)
                                                        </p>
                                                    </div>

                                                    <button 
                                                        onClick={handleTryAgain}
                                                        className="w-full bg-brand-tomato hover:bg-brand-tomato/90 text-white py-3 rounded-button font-display font-black border-2 border-brand-charcoal transition-all uppercase text-xs shadow-sm active:translate-y-0.5 flex items-center justify-center gap-2"
                                                    >
                                                        <IconRotate size={14} />
                                                        <span>{t('uni_try_again')}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Items Area (for multiple counts or review) */}
                                {currentStep.item !== "Não leva" && currentStep.count > 0 && stepStatus === "WAITING" && (
                                    <div className="border-t-2 border-brand-linen pt-4 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-condensed font-black uppercase tracking-wider text-brand-charcoal/60">
                                                {t('university_selected_items')}:
                                            </h4>
                                            <p className="font-body text-xs font-bold text-brand-charcoal">
                                                {stepSelections.length > 0 ? (
                                                    <span className="text-brand-olives">
                                                        {getTranslatedItemName(currentStep.item)} ({stepSelections.length} / {currentStep.count})
                                                    </span>
                                                ) : (
                                                    <span className="text-brand-charcoal/40 font-medium italic">{t('uni_no_item_added')}</span>
                                                )}
                                            </p>
                                        </div>
                                        
                                        {stepSelections.length > 0 && (
                                            <button 
                                                onClick={handleUndoLastSelection}
                                                className="bg-brand-linen hover:bg-brand-sorbet text-brand-charcoal px-3 py-1.5 rounded-button font-body font-bold border border-brand-charcoal/40 transition-all text-[10px] uppercase shadow-sm active:translate-y-0.5"
                                            >
                                                {t('uni_undo')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {/* 6. COMPLETION SCREEN */}
                {gameState === "UNIVERSITY_SUCCESS" && selectedRecipe && (
                    <div className="w-full bg-white border-4 border-brand-charcoal rounded-modal shadow-elevated p-8 md:p-10 text-center animate-slide-up max-w-xl">
                        <span className="text-6xl mb-6 block training-attention-once">🎓</span>
                        <h2 className="text-2xl md:text-3xl font-display font-black text-brand-olives mb-2 uppercase leading-none">
                            {t('res_uni_success_title')}
                        </h2>
                        <h3 className="text-xl md:text-2xl font-display font-black text-brand-charcoal mb-4">
                            {selectedRecipe.name}
                        </h3>
                        
                        <p className="text-brand-charcoal/70 font-body text-sm leading-relaxed mb-6 max-w-md mx-auto font-medium">
                            {t('uni_success_desc')}
                        </p>

                        <div className="bg-brand-linen border-2 border-brand-charcoal rounded-win p-5 text-left mb-8 space-y-2">
                            <span className="font-condensed font-black uppercase text-[10px] tracking-wider text-brand-tomato block">
                                {t('uni_operational_learning')}
                            </span>
                            <p className="font-body text-xs text-brand-charcoal/90 leading-relaxed font-semibold">
                                {getRecipeTakeaway(selectedRecipe)}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button 
                                onClick={() => {
                                    setStepSelections([]);
                                    setStepStatus("WAITING");
                                    setWrongSelection(null);
                                    setGameState("UNIVERSITY_SELECT");
                                    setSubState("SELECT_PRODUCT");
                                }}
                                className="bg-brand-mochi hover:bg-brand-mochi/90 text-brand-charcoal py-3.5 rounded-button font-display text-[10px] font-black uppercase border-2 border-brand-charcoal transition-all shadow-sm active:translate-y-0.5"
                            >
                                {t('university_train_another')}
                            </button>
                            <button 
                                onClick={() => {
                                    setStepSelections([]);
                                    setStepStatus("WAITING");
                                    setWrongSelection(null);
                                    startUniversityLevel(selectedRecipe);
                                    setGameState("UNIVERSITY_PLAYING");
                                }}
                                className="bg-brand-butter hover:bg-brand-butter/90 text-brand-charcoal py-3.5 rounded-button font-display text-[10px] font-black uppercase border-2 border-brand-charcoal transition-all shadow-sm active:translate-y-0.5"
                            >
                                {t('university_repeat_recipe')}
                            </button>
                            <button 
                                onClick={handleExit}
                                className="bg-brand-linen hover:bg-brand-linen/80 text-brand-charcoal py-3.5 rounded-button font-display text-[10px] font-black uppercase border-2 border-brand-charcoal transition-all shadow-sm active:translate-y-0.5"
                            >
                                {t('btn_menu_main')}
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* EXIT CONFIRMATION MODAL (ONLY DURING ACTIVE RECIPE PROGRESS) */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-sm animate-fade-in p-4" role="dialog" aria-modal="true">
                    <div ref={exitModalRef} className="bg-white p-6 md:p-8 rounded-modal shadow-elevated border-4 border-brand-charcoal max-w-sm w-full text-center animate-slide-up">
                        <span className="text-4xl mb-4 block">🚪</span>
                        <h3 className="text-xl font-display font-black text-brand-charcoal mb-2">
                            {t('university_exit_confirm_title')}
                        </h3>
                        <p className="text-xs font-body text-brand-charcoal/70 mb-8 font-semibold leading-relaxed">
                            {t('university_exit_confirm_description')}
                        </p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => setShowExitConfirm(false)}
                                className="w-full bg-brand-mochi hover:bg-brand-mochi/90 text-brand-charcoal py-3.5 rounded-button font-display font-black text-xs border-2 border-brand-charcoal shadow-sm transition-all active:translate-y-0.5 uppercase"
                            >
                                {t('university_continue_training')}
                            </button>
                            <button 
                                onClick={handleExit}
                                className="w-full bg-brand-linen hover:bg-brand-linen/85 text-brand-charcoal py-3 rounded-button font-body font-bold text-xs border-2 border-brand-charcoal transition-all uppercase"
                            >
                                {t('university_leave_recipe')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
