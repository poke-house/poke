import React, { useState, useEffect, useRef } from 'react';
import { Recipe, Language } from '../../types';
import { useBowlTraining } from './useBowlTraining';
import { getCurrentPhases, getRequiredIngredients, getSelectionLimit } from './training.utils';
import { 
  IconHome, IconArrowLeft, IconCheck, IconRotate, 
  IconClock, IconInfo, IconFish, IconLeaf, IconCup 
} from '../../components/Icons';

interface BowlTrainingModeProps {
  selectedRecipe: Recipe;
  resetToHome: () => void;
  language: Language;
  t: (key: any, params?: Record<string, string | number>) => string;
}

export function BowlTrainingMode({ 
  selectedRecipe, 
  resetToHome, 
  language, 
  t 
}: BowlTrainingModeProps) {
  const {
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
  } = useBowlTraining(selectedRecipe, language, t, resetToHome);

  const [showExitModal, setShowExitModal] = useState(false);

  // Focus trap ref for exit confirmation modal
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close modal or confirm exit safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showExitModal) {
        setShowExitModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExitModal]);

  // Trap focus when exit modal is open
  useEffect(() => {
    if (showExitModal && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [showExitModal]);

  const activePhases = getCurrentPhases(selectedRecipe);
  const currentPhase = activePhases[currentPhaseIndex];
  const totalPhases = activePhases.length;

  const progressPercentage = ((currentPhaseIndex) / totalPhases) * 100;

  // Check if player has active progress (beyond sizing or first choice)
  const hasProgress = currentPhaseIndex > (selectedRecipe.category === "GREEN" ? 1 : 0) || currentSelections.length > 0;

  const handleBackClick = () => {
    if (hasProgress) {
      setShowExitModal(true);
    } else {
      resetToHome();
    }
  };

  const getCategoryIcon = () => {
    if (selectedRecipe.category === "HOUSE") return <IconFish size={20} className="text-brand-burgundy" />;
    if (selectedRecipe.category === "GREEN") return <IconLeaf size={20} className="text-brand-olives" />;
    return <IconCup size={20} className="text-brand-burgundy" />;
  };

  const getCategoryName = () => {
    if (selectedRecipe.category === "HOUSE") return t('menu_house');
    if (selectedRecipe.category === "GREEN") return t('menu_green');
    return t('menu_smoothie');
  };

  const getCategoryColorClass = () => {
    if (selectedRecipe.category === "HOUSE") return "bg-pastel-blue-50 border-brand-charcoal text-pastel-blue-text";
    if (selectedRecipe.category === "GREEN") return "bg-pastel-pink-50 border-brand-charcoal text-pastel-pink-text";
    return "bg-pastel-yellow-50 border-brand-charcoal text-pastel-yellow-text";
  };

  // Determine actual instruction text
  const getInstructionText = () => {
    if (!currentPhase) return "";
    const limit = getSelectionLimit(selectedRecipe, currentPhase.key, selectedSize);
    if (selectedRecipe.category === 'HOUSE') {
      if (currentPhase.key === 'size') return t('instr_house_size');
      if (currentPhase.key === 'base') return t('instr_house_base');
    }
    if (limit > 1) return t('instr_generic_limit', { limit });
    return t('instr_generic_single');
  };

  // Calculate missing elements for timeout or failure screen
  const getMissingIngredients = () => {
    const selectedSet = new Set(failedSelected);
    return failedRequired.filter(item => !selectedSet.has(item));
  };

  // Detect reduced motion preference
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (gameState === "RESULT_SUCCESS") {
    return (
      <div className="safe-bottom flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 min-h-full w-full max-w-lg mx-auto animate-fade-in text-center overflow-y-auto custom-scroll">
        <div className="bg-white border-2 sm:border-4 border-brand-charcoal rounded-modal p-5 sm:p-8 md:p-10 shadow-elevated w-full">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-olives/20 border-4 border-brand-charcoal text-brand-olives mb-6 shadow-[3px_3px_0px_0px_#080D09]">
            <IconCheck size={40} />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-black text-brand-charcoal mb-3 leading-tight">
            {t('res_success_title')}
          </h2>
          
          <div className="bg-brand-linen/50 p-4 border-2 border-brand-charcoal rounded-button mb-8">
            <p className="text-sm font-condensed font-black text-brand-charcoal/50 uppercase tracking-wider mb-1">
              {selectedRecipe.name}
            </p>
            <p className="font-body text-brand-burgundy font-bold text-lg leading-relaxed">
              {resultMessage[language]}
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={restart} 
              className="w-full bg-brand-mochi hover:bg-brand-mochi/90 text-brand-charcoal py-4 rounded-button font-display font-black text-base border-2 border-brand-charcoal shadow-[3px_3px_0px_0px_#080D09] active:translate-y-0.5 transition-all flex justify-center items-center gap-2 cursor-pointer"
            >
              <IconRotate size={18} /> {t('training_try_again')}
            </button>
            
            <button 
              onClick={resetToHome} 
              className="w-full bg-white hover:bg-brand-linen text-brand-charcoal py-4 rounded-button font-display font-bold text-base border-2 border-brand-charcoal shadow-[3px_3px_0px_0px_#080D09] active:translate-y-0.5 transition-all flex justify-center items-center gap-2 cursor-pointer"
            >
              <IconHome size={18} /> {t('btn_menu')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "RESULT_FAIL") {
    const missing = getMissingIngredients();
    return (
      <div className="safe-bottom flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 min-h-full w-full max-w-xl mx-auto animate-fade-in overflow-y-auto custom-scroll">
        <div className="bg-white border-4 border-brand-charcoal rounded-modal p-6 md:p-8 shadow-elevated w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">😕</div>
            <h2 className="text-2xl md:text-3xl font-display font-black text-brand-charcoal leading-tight">
              {isTimeout ? t('training_time_up') : t('res_fail_title')}
            </h2>
            <p className="font-body text-brand-burgundy mt-2 font-bold leading-relaxed">
              {resultMessage[language]}
            </p>
          </div>

          {/* Learn details card */}
          <div className="bg-brand-linen/40 border-2 border-brand-charcoal rounded-button p-4 md:p-6 mb-8 text-left space-y-4">
            <div className="flex justify-between items-baseline border-b-2 border-brand-charcoal/10 pb-2">
              <span className="text-sm font-condensed font-black text-brand-charcoal/50 uppercase">
                {selectedRecipe.name}
              </span>
              {failedPhaseProgress && (
                <span className="text-xs font-condensed font-black bg-brand-butter border-2 border-brand-charcoal px-2 py-0.5 rounded-full">
                  {t('training_phase')} {failedPhaseProgress}
                </span>
              )}
            </div>

            {failedPhaseKey && (
              <div>
                <h4 className="text-xs font-condensed font-black text-brand-charcoal/50 uppercase mb-1">
                  {t('training_current_phase')}
                </h4>
                <p className="text-base font-display font-black text-brand-charcoal">
                  {t(('phase_' + failedPhaseKey) as any)}
                </p>
              </div>
            )}

            {/* What you selected */}
            <div>
              <h4 className="text-xs font-condensed font-black text-brand-charcoal/50 uppercase mb-1.5">
                {t('training_you_selected')}
              </h4>
              {failedSelected.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {failedSelected.map((item, i) => (
                    <span key={i} className="text-xs font-body font-bold px-2.5 py-1 bg-brand-tomato/10 text-brand-tomato border-2 border-brand-charcoal rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-brand-charcoal/50 italic">
                  {t('training_none_selected')}
                </p>
              )}
            </div>

            {/* What you still needed */}
            <div>
              <h4 className="text-xs font-condensed font-black text-brand-charcoal/50 uppercase mb-1.5">
                {t('training_you_needed')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {missing.length > 0 ? (
                  missing.map((item, i) => (
                    <span key={i} className="text-xs font-body font-bold px-2.5 py-1 bg-brand-olives/20 text-brand-olives border-2 border-brand-charcoal rounded-full training-attention-once">
                      {item}
                    </span>
                  ))
                ) : (
                  failedRequired.map((item, i) => (
                    <span key={i} className="text-xs font-body font-bold px-2.5 py-1 bg-brand-olives/20 text-brand-olives border-2 border-brand-charcoal rounded-full">
                      {item}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={restart} 
              className="w-full bg-brand-mochi hover:bg-brand-mochi/90 text-brand-charcoal py-4 rounded-button font-display font-black border-2 border-brand-charcoal shadow-[3px_3px_0px_0px_#080D09] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <IconRotate size={18} /> {t('btn_retry')}
            </button>
            <button 
              onClick={resetToHome} 
              className="w-full bg-white hover:bg-brand-linen text-brand-charcoal py-4 rounded-button font-display font-bold border-2 border-brand-charcoal shadow-[3px_3px_0px_0px_#080D09] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <IconHome size={18} /> {t('btn_menu')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-bottom w-full h-full min-h-0 max-w-3xl mx-auto flex flex-col overflow-y-auto px-3 sm:px-4 py-3 custom-scroll md:max-h-[92vh]">
      {/* Shell layout */}
      <div className="bg-white border-4 border-brand-charcoal rounded-modal shadow-elevated flex flex-col overflow-hidden animate-slide-up">
        
        {/* Compact Navigation & Title Header */}
        <div className="p-4 md:p-5 bg-brand-linen border-b-4 border-brand-charcoal flex items-center justify-between">
          <button 
            onClick={handleBackClick}
            aria-label={t('btn_back')}
            className="p-2.5 bg-white border-2 border-brand-charcoal hover:bg-brand-linen text-brand-charcoal rounded-button transition-all shadow-[2px_2px_0px_0px_#080D09] active:translate-y-0.5 flex-shrink-0"
          >
            <IconArrowLeft size={18} />
          </button>
          
          <div className="text-center flex-1 px-4">
            <span className="text-2xl md:text-3xl font-display font-black text-brand-charcoal leading-tight block">
              {t('training_title')}
            </span>
            <span className="text-xs font-body font-medium text-brand-charcoal/60 hidden sm:block mt-0.5">
              {t('training_objective')}
            </span>
          </div>

          <div className="w-10 sm:w-12 flex-shrink-0"></div>
        </div>

        {/* Recipe Identity Card */}
        <div className="p-4 border-b-4 border-brand-charcoal bg-brand-linen/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-button border-2 ${getCategoryColorClass()} flex items-center justify-center shadow-sm`}>
              {getCategoryIcon()}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-display font-black text-brand-charcoal leading-none">
                {selectedRecipe.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-condensed font-black text-brand-charcoal/50 uppercase tracking-wide">
                  {getCategoryName()}
                </span>
                {selectedSize && (
                  <>
                    <span className="text-brand-charcoal/30 text-xs">•</span>
                    <span className="text-xs font-condensed font-black text-brand-burgundy uppercase tracking-wide">
                      {selectedSize}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Timer and Status bar */}
          <div className="flex items-center gap-3 justify-between sm:justify-end">
            {/* Warning indicator if <= 5s */}
            {timer <= 5 && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-brand-tomato/10 border-2 border-brand-tomato text-brand-tomato rounded-button text-xs font-bold ${!isReducedMotion ? 'training-attention-once' : ''}`}>
                <IconClock size={14} className="text-brand-tomato" />
                <span>{t('training_time_running_out')}</span>
              </div>
            )}

            <div className={`flex items-center gap-2 bg-white border-2 border-brand-charcoal px-4 py-2 rounded-button shadow-[2px_2px_0px_0px_#080D09] ${timer <= 5 ? 'border-brand-tomato ring-2 ring-brand-tomato/20' : ''}`}>
              <span className={`text-xl md:text-2xl font-mono font-bold tracking-tight leading-none ${timer <= 5 ? 'text-brand-tomato' : 'text-brand-charcoal'}`}>
                00:{timer < 10 ? `0${timer}` : timer}
              </span>
            </div>
          </div>
        </div>

        {/* Segmented / Strong Progress Row */}
        <div className="p-4 bg-brand-linen/10 border-b-2 border-brand-charcoal/10 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-condensed font-black text-brand-charcoal/70 uppercase">
            <span>{t(('phase_' + currentPhase?.key) as any)}</span>
            <span>{t('training_step_of', { current: currentPhaseIndex + 1, total: totalPhases })}</span>
          </div>
          
          {/* Progress Bar Container */}
          <div className="w-full bg-brand-linen h-3 border-2 border-brand-charcoal rounded-full overflow-hidden shadow-inner relative">
            <div 
              style={{ width: `${progressPercentage}%` }}
              className="bg-brand-mochi h-full border-r-2 border-brand-charcoal transition-all duration-300"
            ></div>
          </div>
        </div>

        {/* Current Active Phase Card */}
        {currentPhase && (
          <div className="p-5 md:p-6 bg-brand-linen/25 border-b-4 border-brand-charcoal text-center sm:text-left flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <span className="text-xs font-condensed font-black text-brand-burgundy uppercase tracking-wider block mb-1">
                {t('training_phase')} {currentPhaseIndex + 1}
              </span>
              <h3 className="text-2xl font-display font-black text-brand-charcoal leading-tight">
                {t(('phase_' + currentPhase.key) as any)}
              </h3>
              <p className="text-sm font-body font-medium text-brand-charcoal/70 mt-1">
                {getInstructionText()}
              </p>
            </div>
          </div>
        )}

        {/* Ingredient Selection Area */}
        <div className="flex-1 p-4 md:p-6 bg-white min-h-[16rem] overflow-y-auto custom-scroll pb-6">
          <div className={currentPhase?.key === 'base' ? "base-options" : "grid gap-3 grid-cols-2 sm:grid-cols-3 w-full p-1"}>
            {phaseOptions.map((ing, idx) => {
              const count = currentSelections.filter(i => i === ing).length;
              const isSelected = count > 0;
              
              let cardBgClass = "bg-white hover:bg-brand-linen/50";
              if (phaseOptions.length === 2 && count === 0) {
                // Sizing option card
                cardBgClass = idx === 0 ? "bg-pastel-blue-50/40 hover:bg-pastel-blue-100/60" : "bg-pastel-pink-50/40 hover:bg-pastel-pink-100/60";
              } else if (isSelected) {
                cardBgClass = "bg-brand-mochi";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelection(ing)}
                  className={`relative p-3 sm:p-4 rounded-button border-2 border-brand-charcoal font-body font-bold text-sm text-brand-charcoal transition-all flex flex-col items-center justify-center text-center min-h-[5.5rem] h-auto shadow-[3px_3px_0px_0px_#080D09] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#080D09] active:scale-95 cursor-pointer ${cardBgClass}`}
                >
                  <span className="leading-snug break-words select-none">
                    {ing}
                  </span>
                  
                  {isSelected && (
                    <span className="absolute -top-2 -right-2 bg-brand-burgundy text-white text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-brand-charcoal shadow-sm font-black font-condensed">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Feedback Notification Area */}
        {feedback.message && (
          <div className="px-4 py-3 border-t-2 border-brand-charcoal/10 bg-brand-linen/5 border-b-2">
            <div className={`p-3 rounded-button border-2 flex items-center gap-2 text-sm font-bold ${feedback.type === 'correct' ? 'bg-brand-olives/10 border-brand-olives text-brand-olives' : 'bg-brand-tomato/10 border-brand-tomato text-brand-tomato'}`}>
              {feedback.type === 'correct' ? <IconCheck size={18} /> : <IconInfo size={18} />}
              <span className="font-body">{feedback.message}</span>
            </div>
          </div>
        )}

        {/* Selected Ingredients & Undo Row (Sticky and accessible) */}
        <div className="sticky bottom-0 z-20 bg-brand-linen/95 backdrop-blur-sm border-t-4 border-brand-charcoal p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="w-full sm:flex-1 text-left">
            <h4 className="text-xs font-condensed font-black text-brand-charcoal/50 uppercase mb-2">
              {t('training_selected')}
            </h4>
            
            {currentSelections.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {currentSelections.map((sel, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs font-body font-bold px-2.5 py-1 bg-brand-mochi border-2 border-brand-charcoal text-brand-charcoal rounded-full flex items-center gap-1 animate-fade-in"
                  >
                    {sel}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-brand-charcoal/50 italic py-1">
                {t('training_none_selected')}
              </p>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleUndo}
              disabled={currentSelections.length === 0}
              aria-label={t('btn_undo')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-butter hover:bg-brand-butter/95 rounded-button text-brand-charcoal font-display font-bold border-2 border-brand-charcoal shadow-[2px_2px_0px_0px_#080D09] disabled:opacity-40 disabled:shadow-none disabled:translate-y-0 transition-all active:translate-y-0.5 cursor-pointer text-sm w-full sm:w-auto"
            >
              <IconArrowLeft size={16} /> {t('btn_undo')}
            </button>
          </div>
        </div>

      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-sm animate-fade-in p-4">
          <div 
            ref={modalRef}
            className="bg-white p-6 md:p-8 rounded-modal shadow-elevated border-4 border-brand-charcoal max-w-sm w-full text-center transform scale-100 animate-slide-up"
          >
            <h3 className="text-xl font-display font-black text-brand-charcoal mb-2">
              {t('training_exit_confirm_title')}
            </h3>
            <p className="text-sm font-body text-brand-charcoal/70 mb-6 leading-relaxed">
              {t('training_exit_confirm_description')}
            </p>
            <div className="space-y-2.5">
              <button 
                onClick={() => {
                  setShowExitModal(false);
                  resetToHome();
                }} 
                className="w-full bg-brand-tomato hover:bg-brand-tomato/95 text-white py-3 rounded-button font-display font-bold text-sm border-2 border-brand-charcoal shadow-sm cursor-pointer"
              >
                {t('training_leave_session')}
              </button>
              <button 
                onClick={() => setShowExitModal(false)} 
                className="w-full bg-brand-linen hover:bg-brand-linen/80 text-brand-charcoal py-3 rounded-button font-body font-bold text-xs uppercase border-2 border-brand-charcoal cursor-pointer"
              >
                {t('training_continue_training')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
