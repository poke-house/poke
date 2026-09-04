import React, { useEffect, useState, useRef } from 'react';
import { GameState, Language, Recipe, Variant } from '../../types';
import { TranslationKey } from '../../translations';
import { THEMES } from '../../constants';
import { useRushGame } from './useRushGame';
import { RushLeaderboard } from './components/RushLeaderboard';
import { RushEntryModal } from '../../components/Modals';
import { IconHome, IconArrowLeft, IconCheck, IconRotate } from '../../components/Icons';

interface RushModeProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  resetToHome: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  language: Language;
}

export const RushMode: React.FC<RushModeProps> = ({
  setGameState,
  resetToHome,
  t,
  language,
}) => {
  const {
    rushGameState,
    setRushGameState,
    showRushEntry,
    setShowRushEntry,
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
    getCurrentPhaseKey
  } = useRushGame({
    language,
    t,
    onExit: resetToHome
  });

  // Local state for the exit confirmation modal
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const exitModalRef = useRef<HTMLDivElement>(null);

  // Focus trapping and Escape key support for exit modal (Accessibility)
  useEffect(() => {
    if (!showExitConfirm) return;

    const modalElement = exitModalRef.current;
    if (!modalElement) return;

    // Save previous active element to restore later
    const previousActiveElement = document.activeElement as HTMLElement;

    // Query all focusable elements inside the modal
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = modalElement.querySelectorAll(focusableSelector);
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Set initial focus to the first interactive button
    if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseExitModal();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable?.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [showExitConfirm]);

  // Keep parent gameState sync'd with local rushGameState if needed, 
  // though RushMode is fully self-contained now.
  useEffect(() => {
    setGameState(rushGameState);
  }, [rushGameState, setGameState]);

  useEffect(() => {
    if (rushGameState === "RUSH_SELECT") {
      fetchLeaderboard();
    }
  }, [rushGameState]);

  // Style and theme helpers
  const currentTheme = selectedRecipe ? THEMES[selectedRecipe.category] : THEMES.HOUSE;

  const getScrollClass = () => {
    if (selectedRecipe) {
      if (selectedRecipe.category === "HOUSE") return "scroll-blue";
      if (selectedRecipe.category === "GREEN") return "scroll-pink";
      if (selectedRecipe.category === "SMOOTHIE") return "scroll-yellow";
    }
    return "scroll-rush";
  };

  const scrollClass = getScrollClass();

  const getSelectionLimit = (): number => {
    if (!selectedRecipe) return 0;
    const phaseKey = getCurrentPhaseKey();
    if (phaseKey === "size") return 1;
    if (selectedRecipe.category === "SMOOTHIE") {
      const getSmoothieIngredientList = (recipe: Recipe, key: string): string[] => {
        if (key === "smoothie_liquid") return recipe.smoothie_liquid || [];
        if (key === "smoothie_ingredients") return recipe.smoothie_ingredients || [];
        if (key === "smoothie_mode") return recipe.smoothie_mode || [];
        if (key === "smoothie_marbling") return recipe.smoothie_marbling || [];
        return [];
      };
      return getSmoothieIngredientList(selectedRecipe, phaseKey).length;
    } else {
      const sizeToUse = selectedSize || "Regular";
      const phaseKeyVariant = phaseKey as keyof Variant;
      return selectedRecipe.variants && selectedRecipe.variants[sizeToUse]
        ? selectedRecipe.variants[sizeToUse][phaseKeyVariant].length
        : 0;
    }
  };

  const getInstructionText = () => {
    const phaseKey = getCurrentPhaseKey();
    const limit = getSelectionLimit();
    if (selectedRecipe?.category === 'HOUSE') {
      if (phaseKey === 'size') return t('instr_house_size');
      if (phaseKey === 'base') return t('instr_house_base');
    }
    if (limit > 1) return t('instr_generic_limit', { limit: limit });
    return t('instr_generic_single');
  };

  // Hearts visual logic (maximum of 3 possible hearts)
  const renderHeartHUD = () => {
    const hearts = [];
    const maxHearts = rushLives > 3 ? rushLives : 3;
    for (let i = 0; i < maxHearts; i++) {
      if (i < rushLives) {
        // Filled Active Heart
        hearts.push(
          <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-brand-mochi drop-shadow-[2px_2px_0px_#080D09] transition-transform hover:scale-110" aria-label="Vida ativa">
            <path d="m11.645 20.91-.007-.003-.003-.001a15.22 15.22 0 0 1-.38-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.004.001-.006.003-.007.003-.004-.002Z" />
          </svg>
        );
      } else {
        // Lost/Empty Outlined Heart
        hearts.push(
          <svg key={i} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6 text-brand-charcoal/30" aria-label="Vida perdida">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        );
      }
    }
    return hearts;
  };

  const handleOpenExitModal = () => {
    setIsPaused(true);
    setShowExitConfirm(true);
  };

  const handleCloseExitModal = () => {
    setIsPaused(false);
    setShowExitConfirm(false);
  };

  return (
    <div className="safe-bottom w-full h-full overflow-y-auto custom-scroll flex items-center justify-center relative p-2 md:p-6" id="rush-mode-container">
      {/* Entry Name/Store Modal */}
      {showRushEntry && (
        <RushEntryModal 
          onStart={handleRushStart} 
          onClose={() => setShowRushEntry(false)}
          t={t}
        />
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-charcoal/50 backdrop-blur-sm animate-fade-in p-4" 
          role="dialog" 
          aria-modal="true"
          aria-labelledby="exit-modal-title"
          aria-describedby="exit-modal-desc"
        >
          <div ref={exitModalRef} className="bg-white p-6 md:p-8 rounded-modal shadow-elevated border-4 border-brand-charcoal max-w-sm w-full text-center animate-slide-up">
            <h3 id="exit-modal-title" className="text-xl md:text-2xl font-display font-black text-brand-charcoal mb-2 uppercase leading-tight">
              {t('rush_leave_confirm_title') || "Abandonar Jogo?"}
            </h3>
            <p id="exit-modal-desc" className="text-sm font-body text-text-muted mb-6 leading-relaxed">
              {t('rush_leave_confirm_description') || "Se saíres agora, vais perder todo o progresso do teu jogo atual."}
            </p>
            <div className="space-y-2">
              <button 
                onClick={handleCloseExitModal}
                className="w-full bg-brand-tomato hover:bg-brand-tomato/95 text-white py-4 rounded-button font-display font-black border-2 border-brand-charcoal shadow-soft transition-all active:translate-y-0.5 text-sm uppercase tracking-wide"
              >
                {t('rush_continue_playing') || "Continuar a Jogar"}
              </button>
              <button 
                onClick={() => {
                  setShowExitConfirm(false);
                  resetToHomeAndExit();
                }}
                className="w-full bg-brand-linen hover:bg-brand-linen/80 text-brand-charcoal py-3 rounded-button font-body font-bold border-2 border-brand-charcoal transition-all text-xs uppercase"
              >
                {t('rush_leave_game') || "Abandonar Lodo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RUSH SELECT: Landing view with Rules and Leaderboard */}
      {rushGameState === "RUSH_SELECT" && (
        <div className="w-full max-w-4xl bg-brand-linen rounded-card shadow-elevated flex flex-col md:flex-row overflow-hidden animate-slide-up border-4 border-brand-charcoal max-h-[92vh] md:max-h-[85vh]" id="rush-select-screen">
          {/* Left Panel: High Fidelity Leaderboard */}
          <RushLeaderboard
            leaderboardLoading={leaderboardLoading}
            supabaseStatus={supabaseStatus}
            topScores={topScores}
            lastScores={lastScores}
            fetchLeaderboard={fetchLeaderboard}
            t={t}
          />

          {/* Right Panel: Mode Selection and Rules */}
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center overflow-y-auto custom-scroll" id="rush-mode-selection">
            <div className="text-center md:text-left mb-6">
              <h1 className="text-3xl md:text-4xl font-display font-black text-brand-charcoal leading-none uppercase tracking-tight mb-2">
                {t('rush_title') || "Hora do Lodo"}
              </h1>
              <p className="text-sm font-body text-text-muted leading-relaxed">
                {t('rush_objective') || "Prepara as bowls corretas antes que o tempo acabe."}
              </p>
            </div>

            {/* Redesigned Rules Panel */}
            <div className="bg-brand-sorbet/30 border-2 border-brand-charcoal rounded-win p-4 mb-6 shadow-soft space-y-3">
              <h3 className="font-display font-black text-xs text-brand-charcoal uppercase tracking-widest flex items-center gap-1.5">
                <span>📝</span> {t('rush_rules_title') || "Regras do Lodo"}
              </h3>
              <ul className="space-y-2 text-xs font-body text-brand-charcoal/80">
                <li className="flex items-start gap-2">
                  <span className="text-brand-olives shrink-0" aria-hidden="true">✔</span>
                  <span>{t('rush_rule_correct') || "Bowl Correto: a tua pontuação aumenta."}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-tomato shrink-0" aria-hidden="true">✖</span>
                  <span>{t('rush_rule_error') || "Seleção Incorreta ou Tempo Excedido: perdes uma vida."}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-mochi shrink-0" aria-hidden="true">❤</span>
                  <span>{t('rush_rule_lives') || "Vidas: começas com 3 vidas (1 em Colombo)."}</span>
                </li>
              </ul>
            </div>

            {/* Mode Selection Grid */}
            <div className="space-y-3">
              <h4 className="font-display font-black text-[10px] text-brand-charcoal/40 uppercase tracking-widest text-center md:text-left">
                {t('rush_select_title') || "Seleciona uma Loja:"}
              </h4>
              
              <button 
                onClick={() => { setPendingRushLives(3); setShowRushEntry(true); }}
                className="w-full text-left bg-brand-mochi border-2 border-brand-charcoal p-4 rounded-win hover:shadow-fluent transition-all shadow-soft group relative overflow-hidden flex flex-col justify-center"
                id="rush-normal-mode-btn"
                aria-label="Loja Douradores, modo normal de 3 vidas"
              >
                <span className="font-display font-black text-lg text-brand-charcoal uppercase flex items-center justify-between w-full">
                  <span>{t('rush_btn_douradores')}</span>
                  <span className="text-xs font-condensed font-black bg-white/40 border border-brand-charcoal px-2 py-0.5 rounded-full">3 VIDAS</span>
                </span>
                <span className="text-[10px] font-condensed font-black text-brand-charcoal/60 uppercase tracking-widest mt-1">
                  Modo de Estudo • Normal
                </span>
              </button>

              <button 
                onClick={() => { setPendingRushLives(1); setShowRushEntry(true); }}
                className="w-full text-left bg-white border-2 border-brand-charcoal p-4 rounded-win hover:shadow-fluent transition-all shadow-soft group relative overflow-hidden flex flex-col justify-center"
                id="rush-hardcore-mode-btn"
                aria-label="Loja Colombo, modo hardcore de 1 vida"
              >
                <span className="font-display font-black text-lg text-brand-charcoal uppercase flex items-center justify-between w-full">
                  <span className="text-brand-tomato">{t('rush_btn_colombo')}</span>
                  <span className="text-xs font-condensed font-black bg-brand-tomato text-white border border-brand-charcoal px-2 py-0.5 rounded-full">1 VIDA</span>
                </span>
                <span className="text-[10px] font-condensed font-black text-brand-tomato uppercase tracking-widest mt-1">
                  Estresse Total • Hardcore
                </span>
              </button>

              <div className="pt-4 text-center">
                <button 
                  onClick={resetToHomeAndExit}
                  className="font-display font-black text-xs text-brand-charcoal/40 hover:text-brand-tomato transition-colors uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
                  id="rush-back-to-menu-btn"
                  aria-label="Voltar para o menu principal"
                >
                  <IconHome size={14} /> {t('btn_menu_main')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RUSH PLAYING: Redesigned interactive active game HUD and shell */}
      {rushGameState === "RUSH_PLAYING" && selectedRecipe && (
        <div className={`w-full h-full md:h-auto md:max-h-[92vh] max-w-4xl bg-brand-linen rounded-card shadow-elevated flex flex-col overflow-hidden animate-slide-up border-4 border-brand-charcoal`} id="rush-playing-screen">
          
          {/* Active HUD Dashboard Top Bar */}
          <div className="bg-white border-b-4 border-brand-charcoal p-4 grid grid-cols-3 gap-2 items-center">
            {/* Score Block */}
            <div className="flex flex-col items-start" id="rush-score-hud">
              <span className="text-[10px] font-body font-black uppercase text-brand-charcoal/50 tracking-wider">
                {t('rush_score') || "Pontos"}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl md:text-3xl font-condensed font-black text-brand-tomato animate-scale-increase">
                  {rushScore}
                </span>
                <span className="text-xs font-body font-bold text-text-muted">pts</span>
              </div>
            </div>

            {/* Central Timer Block */}
            <div className="flex flex-col items-center">
              <div 
                className={`border-2 border-brand-charcoal rounded-win px-4 py-1.5 text-center shadow-soft flex flex-col items-center min-w-[110px] md:min-w-[130px] transition-all ${
                  timer <= 5 ? 'bg-brand-tomato text-white border-brand-charcoal animate-pulse-fast' : 'bg-brand-butter text-brand-charcoal'
                }`}
                role="timer"
                aria-live="polite"
              >
                <span className="text-2xl md:text-3xl font-condensed font-black tracking-tight leading-none">
                  00:{timer < 10 ? `0${timer}` : timer}
                </span>
                <span className="text-[8px] font-display font-bold uppercase tracking-widest mt-0.5 opacity-80">
                  {timer <= 5 ? (t('rush_time_running_out') || "Tempo quase fim! ⚠️") : (t('rush_time_remaining') || "Tempo")}
                </span>
              </div>
            </div>

            {/* Lives Heart Stack Block */}
            <div className="flex flex-col items-end" id="rush-lives-hud">
              <span className="text-[10px] font-body font-black uppercase text-brand-charcoal/50 tracking-wider mb-0.5">
                {t('rush_lives') || "Vidas"}
              </span>
              <div className="flex items-center gap-1.5" aria-label={`${rushLives} vidas restantes`}>
                {renderHeartHUD()}
              </div>
            </div>
          </div>

          {/* Core Recipe Challenge Area */}
          <div className="p-4 md:p-6 bg-white border-b-4 border-brand-charcoal text-center space-y-3 relative">
            <div className="flex flex-wrap justify-center gap-2 items-center">
              <span className="text-[9px] font-display font-black uppercase tracking-widest bg-brand-charcoal text-white px-2 py-0.5 rounded-full">
                {selectedRecipe.category === "HOUSE" ? "Poke Bowl" : selectedRecipe.category === "GREEN" ? "Salad Bowl" : "Smoothie"}
              </span>
              {selectedSize && (
                <span className="text-[9px] font-display font-black uppercase tracking-widest bg-brand-butter border-2 border-brand-charcoal text-brand-charcoal px-2 py-0.5 rounded-full">
                  {selectedSize}
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-display font-black text-brand-charcoal leading-none uppercase tracking-tight">
              {selectedRecipe.name}
            </h2>

            {/* Sub-instructions */}
            <div className="space-y-1">
              <p className="text-sm font-display font-black text-brand-tomato uppercase tracking-wide">
                {t(('phase_' + getCurrentPhaseKey()) as TranslationKey)}
              </p>
              <p className="text-xs font-body text-text-muted">
                {getInstructionText()}
              </p>
            </div>

            {/* Live Progress Indicators - Selected items in current phase */}
            {currentSelections.length > 0 && (
              <div className="pt-2 flex flex-col items-center space-y-1" aria-label="Ingredientes selecionados nesta fase">
                <span className="text-[9px] font-display font-black text-brand-charcoal/40 uppercase tracking-widest">
                  Selecionado nesta fase:
                </span>
                <div className="flex flex-wrap justify-center gap-1.5 max-w-xl">
                  {currentSelections.map((item, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center gap-1 bg-brand-butter border border-brand-charcoal px-2.5 py-1 rounded-full text-[10px] font-body font-bold text-brand-charcoal shadow-sm"
                    >
                      <IconCheck size={10} className="text-brand-tomato" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Option Selection Grid */}
          <div className={`flex-1 overflow-y-auto p-4 md:p-6 custom-scroll ${scrollClass} bg-brand-linen/40 pb-6`}>
            <div className={getCurrentPhaseKey() === 'base' ? "base-options" : `grid gap-3 w-full p-1 ${phaseOptions.length > 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {phaseOptions.map((ing, idx) => {
                const count = currentSelections.filter(i => i === ing).length;
                let isChosen = count > 0;
                
                // Set dynamic button visuals based on active state and recipe categories
                let activeBtnClass = "";
                if (isChosen) {
                  activeBtnClass = "bg-brand-butter text-brand-charcoal border-brand-charcoal shadow-inner scale-[0.98]";
                } else {
                  activeBtnClass = "bg-white text-brand-charcoal hover:-translate-y-0.5 hover:shadow-fluent hover:border-brand-charcoal border-brand-charcoal shadow-soft";
                }

                return (
                  <button 
                    key={idx} 
                    onClick={() => handleSelection(ing)} 
                    className={`relative p-3 sm:p-4 rounded-win font-body font-bold text-xs md:text-sm border-2 transition-all flex items-center justify-center text-center min-h-[5.5rem] h-auto btn-transition select-none cursor-pointer ${activeBtnClass}`}
                    aria-label={`Selecionar ingrediente ${ing}. Atualmente selecionado ${count} vezes.`}
                  >
                    <span className="leading-snug break-words px-1">{ing}</span>
                    {count > 0 && (
                      <span className="absolute -top-2.5 -right-2.5 bg-brand-tomato text-white border-2 border-brand-charcoal text-[11px] font-display font-black w-6 h-6 flex items-center justify-center rounded-full shadow-soft animate-scale-increase">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Control Action Row (Sticky and accessible) */}
          <div className="sticky bottom-0 z-20 p-4 border-t-4 border-brand-charcoal bg-white/95 backdrop-blur-sm flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
              onClick={handleOpenExitModal} 
              aria-label="Voltar ao início do lodo"
              className="p-3 bg-brand-linen hover:bg-brand-linen/80 text-brand-charcoal rounded-button border-2 border-brand-charcoal shadow-soft hover:-translate-y-0.5 transition-all active:translate-y-0"
            >
              <IconHome size={22} />
            </button>
            
            <button 
              onClick={handleUndo} 
              disabled={currentSelections.length === 0} 
              className="flex items-center gap-2 px-6 py-3.5 bg-brand-butter hover:bg-brand-butter/90 border-2 border-brand-charcoal rounded-button text-brand-charcoal font-display font-black text-xs uppercase tracking-wide shadow-soft disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-soft transition-all hover:-translate-y-0.5 active:translate-y-0"
              aria-label="Desfazer última seleção"
            >
              <IconArrowLeft size={16}/> {t('btn_undo')}
            </button>
          </div>
        </div>
      )}

      {/* RUSH ERROR: Redesigned feedback view on lost life */}
      {rushGameState === "RUSH_ERROR" && (
        <div className="text-center p-6 md:p-8 bg-brand-linen border-4 border-brand-charcoal rounded-card shadow-elevated animate-slide-up mx-4 max-w-md w-full" id="rush-error-screen">
          <div className="w-16 h-16 bg-brand-tomato/10 text-brand-tomato rounded-full flex items-center justify-center border-2 border-brand-charcoal mx-auto mb-4" aria-hidden="true">
            💔
          </div>

          <h2 className="text-2xl font-display font-black text-brand-charcoal uppercase mb-2">
            {t('rush_life_lost') || "Vida Perdida!"}
          </h2>

          <div className="flex justify-center items-center gap-1.5 mb-6" aria-label={`${rushLives} vidas restantes`}>
            {renderHeartHUD()}
          </div>

          {/* Error diagnostic block */}
          <div className="bg-white border-2 border-brand-charcoal rounded-win p-4 text-left space-y-2 mb-6 shadow-soft">
            <p className="text-[10px] font-display font-black text-brand-tomato uppercase tracking-widest border-b border-brand-charcoal/10 pb-1">
              Onde errou:
            </p>
            <div className="max-h-32 overflow-y-auto custom-scroll text-xs font-body text-brand-charcoal/80 space-y-1.5 leading-relaxed">
              {errorDetails.map((e, i) => (
                <div key={i} className="flex items-start gap-1.5">• {e}</div>
              ))}
            </div>
          </div>

          <button 
            onClick={consumeRushLife} 
            className="w-full bg-brand-tomato hover:bg-brand-tomato/90 text-white p-4 rounded-button font-display font-black text-base border-2 border-brand-charcoal shadow-soft transition-all active:translate-y-0.5 uppercase tracking-wide animate-pulse-fast"
          >
            {t('btn_continue') || "Continuar"}
          </button>
        </div>
      )}

      {/* RUSH GAME OVER: Redesigned final result screen with score submitting and leaderboard saving */}
      {rushGameState === "RUSH_GAME_OVER" && (
        <div className="text-center p-6 md:p-8 bg-brand-linen border-4 border-brand-charcoal rounded-card shadow-elevated animate-slide-up mx-4 max-w-md w-full overflow-y-auto max-h-[92vh] custom-scroll" id="rush-gameover-screen">
          <div className="text-5xl mb-3 training-attention-once" aria-hidden="true">😰</div>
          
          <h2 className="text-2xl md:text-3xl font-display font-black text-brand-charcoal uppercase mb-1">
            {t('rush_game_over') || "Fim do Lodo!"}
          </h2>
          
          {/* Main Score Display Box */}
          <div className="bg-white border-2 border-brand-charcoal rounded-win p-4 my-4 shadow-soft">
            <p className="text-[10px] font-display font-black text-brand-charcoal/40 uppercase tracking-widest mb-1">
              {t('rush_final_score') || "Pontuação Final"}
            </p>
            <div className="text-4xl md:text-5xl font-condensed font-black text-brand-tomato leading-none">
              {rushScore} <span className="text-lg md:text-xl font-body text-brand-charcoal">pontos</span>
            </div>
            <p className="text-xs font-body text-text-muted italic mt-2 leading-relaxed">
              "{resultMessage[language]}"
            </p>
          </div>

          {/* Historical errors diagnosis scroll list */}
          {errorDetails.length > 0 && (
            <div className="bg-white/60 border-2 border-brand-charcoal rounded-win p-3.5 text-left mb-6 shadow-soft">
              <p className="text-[9px] font-display font-black text-brand-charcoal/40 uppercase tracking-widest border-b border-brand-charcoal/10 pb-1 mb-1.5">
                Registo de Erros:
              </p>
              <div className="max-h-24 overflow-y-auto custom-scroll text-[11px] font-body text-brand-charcoal/70 space-y-1">
                {errorDetails.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-1">• {err}</div>
                ))}
              </div>
            </div>
          )}

          {/* Highly Polished Score Submission Status Container */}
          <div 
            aria-live="polite" 
            className={`mb-6 p-4 rounded-win text-xs border-2 border-brand-charcoal shadow-soft ${
              scoreSubmitStatus === "success" ? "bg-brand-olives/20 text-brand-charcoal" :
              scoreSubmitStatus === "saving" ? "bg-brand-butter text-brand-charcoal" :
              scoreSubmitStatus === "unconfigured" ? "bg-white/80 text-brand-charcoal/60" :
              "bg-brand-tomato/10 text-brand-tomato"
            }`}
            id="rush-submission-status"
          >
            {scoreSubmitStatus === "saving" && (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-brand-tomato border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <span className="font-display font-black uppercase tracking-widest">
                  {t('rush_saving_score') || t('score_saving')}
                </span>
              </div>
            )}
            {scoreSubmitStatus === "success" && (
              <div className="flex items-center justify-center gap-2 font-display font-black uppercase tracking-wide">
                <IconCheck size={18} aria-hidden="true" className="text-brand-olives" />
                <span>{t('rush_score_saved') || t('score_saved')}</span>
              </div>
            )}
            {scoreSubmitStatus === "unconfigured" && (
              <div className="text-center font-body font-bold uppercase tracking-wider">
                <span>{t('rush_ranking_unavailable') || t('score_unconfigured')}</span>
              </div>
            )}
            {scoreSubmitStatus === "failed" && (
              <div className="flex flex-col items-center justify-center gap-2 text-brand-charcoal">
                <span className="font-display font-black text-brand-tomato uppercase tracking-wide">
                  {t('rush_score_save_failed') || t('score_failed')}
                </span>
                {scoreSubmitError && (
                  <span className="text-[10px] font-body bg-white/50 px-2 py-0.5 rounded border border-brand-charcoal/10">
                    ({t(scoreSubmitError)})
                  </span>
                )}
                <button
                  onClick={handleRetrySubmit}
                  className="mt-1 bg-brand-tomato hover:bg-brand-tomato/90 text-white px-3 py-1.5 rounded-button font-display font-black text-[10px] uppercase border-2 border-brand-charcoal shadow-soft transition-all active:translate-y-0.5 flex items-center gap-1.5"
                  aria-label={t('rush_retry_save')}
                  id="retry-submit-btn"
                >
                  <IconRotate size={12} aria-hidden="true" />
                  {t('rush_retry_save') || t('btn_try_again')}
                </button>
              </div>
            )}
          </div>

          {/* Final Menu Navigation Actions */}
          <div className="space-y-2">
            <button 
              onClick={() => setRushGameState("RUSH_SELECT")} 
              className="w-full bg-brand-mochi hover:bg-brand-mochi/90 text-brand-charcoal p-4 rounded-button font-display font-black text-base border-2 border-brand-charcoal shadow-soft transition-all active:translate-y-0.5 uppercase tracking-wide flex items-center justify-center gap-2"
              id="rush-retry-game-btn"
            >
              <IconRotate size={16} /> {t('rush_play_again') || t('btn_retry')}
            </button>
            <button 
              onClick={resetToHomeAndExit} 
              className="w-full bg-brand-linen hover:bg-brand-linen/85 text-brand-charcoal p-3.5 rounded-button font-body font-bold border-2 border-brand-charcoal transition-all text-xs uppercase"
              id="rush-exit-game-btn"
            >
              {t('btn_menu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
