import React, { useEffect, useState } from 'react';
import { useSlopClockGameplay } from './hooks/useSlopClockGameplay';
import { ArenaRoom, ArenaParticipant } from '../../houseArena.types';
import { TRANSLATIONS } from '../../../../translations';
import { getFullIngredientList } from '../../../training/training.utils';
import { ShieldAlert, CheckCircle, AlertTriangle, ChevronRight, ChevronLeft, RotateCcw, Award, Trophy, Users, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useArenaRoundLeaderboard } from '../../ranking/hooks/useArenaRoundLeaderboard';
import { ArenaRoundLeaderboard } from '../../ranking/components/ArenaRoundLeaderboard';
import { ArenaTournamentLeaderboard } from '../../ranking/components/ArenaTournamentLeaderboard';

interface SlopClockArenaGameProps {
  room: ArenaRoom;
  reconnectToken: string;
  language: 'pt' | 'en';
  participants: ArenaParticipant[];
  localPlayer: ArenaParticipant | null;
}

export const SlopClockArenaGame: React.FC<SlopClockArenaGameProps> = ({
  room,
  reconnectToken,
  language,
  participants,
  localPlayer
}) => {
  const t = (key: string) => {
    const dict = TRANSLATIONS[language] as Record<string, string>;
    return dict[key] || key;
  };

  const {
    challenge,
    loading,
    submitting,
    timeLeft,
    selections,
    currentPhaseIndex,
    setCurrentPhaseIndex,
    currentPhases,
    currentPhase,
    phaseLimit,
    feedback,
    clearFeedback,
    handleSelectItem,
    handleRemoveOneItem,
    handleNextPhase,
    handlePrevPhase,
    handleClearSelections,
    submitBowl
  } = useSlopClockGameplay({
    room,
    reconnectToken
  });

  const [showFeedback, setShowFeedback] = useState(false);
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [activeStandingsTab, setActiveStandingsTab] = useState<'round' | 'tournament'>('round');
  const [mobileRecipeExpanded, setMobileRecipeExpanded] = useState(false);
  const [mobileRankingsExpanded, setMobileRankingsExpanded] = useState(false);

  // Live round rankings fetched directly and securely from the database
  const { data: liveLeaderboard } = useArenaRoundLeaderboard(
    room.roomCode,
    reconnectToken,
    4000 // Poll every 4 seconds for live updates
  );


  // Trigger feedback banner and auto-clear after 3 seconds
  useEffect(() => {
    if (feedback.status) {
      setShowFeedback(true);
      if (feedback.status === 'success') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      const timer = setTimeout(() => {
        setShowFeedback(false);
        clearFeedback();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (loading) {
    return (
      <div className="bg-brand-linen min-h-screen w-full flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-tomato mx-auto"></div>
          <p className="text-brand-charcoal font-semibold">
            {language === 'pt' ? 'A carregar estação de trabalho...' : 'Loading workstation...'}
          </p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="bg-brand-linen min-h-screen w-full flex items-center justify-center font-sans p-4">
        <div className="bg-white border-4 border-brand-charcoal rounded-card p-6 shadow-elevated max-w-sm text-center">
          <ShieldAlert className="text-brand-tomato mx-auto mb-4" size={48} />
          <h3 className="font-display font-black text-xl mb-2">
            {language === 'pt' ? 'Erro do Desafio' : 'Challenge Error'}
          </h3>
          <p className="text-xs font-semibold text-brand-burgundy mb-4">
            {language === 'pt'
              ? 'Não foi possível carregar o desafio ativo. Volte a ligar ou contacte o administrador.'
              : 'Could not load the active challenge. Please reconnect or contact the admin.'}
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLastPhase = currentPhaseIndex === currentPhases.length - 1;
  const currentPhaseSelections = selections[currentPhase?.key] || [];
  const options = currentPhase ? getFullIngredientList(currentPhase.key as any) : [];

  // Sort participants by score
  const sortedParticipants = [...participants].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="bg-brand-linen min-h-screen w-full flex flex-col justify-start font-sans">
      {/* 1. Header & Live Hud bar */}
      <div className="bg-white border-b-4 border-brand-charcoal py-2 sm:py-4 px-3 sm:px-6 md:px-8 sticky top-0 z-40 shadow-soft">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2 md:gap-4">
          {/* Room Title */}
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <div className="bg-brand-charcoal text-white font-display font-black text-[9px] sm:text-xs px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded uppercase tracking-wider shrink-0">
              {t('slop_clock_title')}
            </div>
            <div className="truncate">
              <h1 className="font-display font-black text-sm sm:text-lg md:text-xl text-brand-charcoal leading-none truncate">
                {room.roomCode}
              </h1>
              <p className="text-[10px] sm:text-xs text-text-muted font-medium mt-0.5 sm:mt-1 hidden sm:block">
                {t('slop_clock_objective')}
              </p>
            </div>
          </div>

          {/* Hud Stats */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            {/* Round score */}
            <div className="text-right">
              <span className="text-[8px] sm:text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                {t('slop_clock_score')}
              </span>
              <span className="font-mono text-base sm:text-2xl font-black text-brand-green leading-none">
                {challenge.roundScore}
              </span>
            </div>

            {/* Total score */}
            <div className="text-right border-l border-brand-charcoal/10 pl-3 sm:pl-6">
              <span className="text-[8px] sm:text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                {language === 'pt' ? 'Total' : 'Total'}
              </span>
              <span className="font-mono text-base sm:text-2xl font-black text-brand-charcoal leading-none">
                {challenge.totalScore}
              </span>
            </div>

            {/* Countdown timer */}
            <div className="text-right border-l border-brand-charcoal/10 pl-3 sm:pl-6">
              <span className="text-[8px] sm:text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                {t('slop_clock_time')}
              </span>
              <span className={`font-mono text-base sm:text-2xl font-black leading-none tabular-nums ${timeLeft < 60 ? 'text-brand-tomato animate-pulse' : 'text-brand-charcoal'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Late Joiner Banner */}
      {localPlayer?.isLateJoiner && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-center">
          <p className="text-xs text-amber-800 font-bold flex items-center justify-center gap-2">
            <AlertTriangle size={14} />
            {t('slop_clock_late_joiner_banner')}
          </p>
        </div>
      )}

      {/* 2. Main Gameplay Layout Container */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 py-3 sm:py-6 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 flex-1">
        
        {/* Left Column: Challenge Objective details & Live Standings */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          {/* Challenge Recipe details card */}
          <div className="bg-white border-4 border-brand-charcoal rounded-card p-5 shadow-elevated relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-charcoal text-white text-[10px] font-mono px-3 py-1 uppercase font-black tracking-widest rounded-bl">
              {challenge.recipeSize}
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  {language === 'pt' ? 'RECEITA A MONTAR' : 'RECIPE TO ASSEMBLE'}
                </span>
                <h2 className="font-display font-black text-xl md:text-2xl text-brand-charcoal mt-1">
                  {challenge.recipeName}
                </h2>
                <div className="flex gap-2 mt-2">
                  <span className="bg-brand-linen text-brand-charcoal text-[10px] font-mono px-2 py-0.5 rounded border border-brand-charcoal/10 font-bold uppercase">
                    {challenge.recipeCategory}
                  </span>
                  <span className="bg-brand-tomato/10 text-brand-tomato text-[10px] font-mono px-2 py-0.5 rounded border border-brand-tomato/10 font-bold uppercase">
                    {challenge.recipeSize === 'Large' ? (language === 'pt' ? 'Grande' : 'Large') : 'Regular'}
                  </span>
                </div>
              </div>

              {/* Step indicator summarizing progress */}
              <div className="border-t-2 border-dashed border-brand-charcoal/10 pt-4 space-y-2">
                <h3 className="font-display font-bold text-xs text-brand-charcoal uppercase tracking-wider">
                  {language === 'pt' ? 'Ingredientes Necessários' : 'Required Ingredients'}
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {currentPhases.map((phase) => {
                    const reqList = challenge.requiredIngredients[phase.key] || [];
                    const selList = selections[phase.key] || [];
                    const isDone = selList.length === reqList.length;
                    const isActive = phase.key === currentPhase?.key;

                    return (
                      <div 
                        key={phase.key} 
                        onClick={() => {
                          const idx = currentPhases.findIndex(p => p.key === phase.key);
                          if (idx !== -1) {
                            setCurrentPhaseIndex(idx);
                          }
                        }}
                        className={`flex items-center justify-between text-xs p-1.5 rounded cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-brand-tomato/5 border-l-4 border-brand-tomato pl-2 font-bold' 
                            : 'hover:bg-brand-linen/40'
                        }`}
                      >
                        <span className={isDone ? 'text-gray-400 line-through' : 'text-brand-charcoal'}>
                          {phase.title}
                        </span>
                        <span className="font-mono text-[10px] font-black text-gray-500">
                          {selList.length}/{reqList.length}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Secure Live Rankings Sidebar */}
          <div className="bg-white border-4 border-brand-charcoal rounded-card p-5 shadow-elevated space-y-4">
            <div className="flex items-center justify-between border-b-2 border-brand-charcoal/5 pb-2">
              <h3 className="font-display font-black text-xs text-brand-charcoal uppercase tracking-widest flex items-center gap-1.5">
                <Award size={14} className="text-brand-tomato" />
                {t('house_arena_live_ranking')}
              </h3>
              <button
                onClick={() => setShowStandingsModal(true)}
                className="text-[10px] font-bold text-brand-tomato hover:underline focus:outline-none cursor-pointer"
              >
                {t('house_arena_view_ranking')}
              </button>
            </div>
            
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {liveLeaderboard && liveLeaderboard.length > 0 ? (
                liveLeaderboard.map((row) => {
                  const isMe = row.isCurrentParticipant;
                  return (
                    <div 
                      key={row.rank}
                      className={`flex items-center justify-between text-xs p-2.5 rounded border-2 transition-all ${
                        isMe 
                          ? 'border-brand-tomato bg-brand-tomato/5 font-bold ring-1 ring-brand-tomato/20' 
                          : 'border-transparent bg-brand-linen/10 hover:bg-brand-linen/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] text-gray-400 font-bold">#{row.rank}</span>
                        <div className="truncate flex flex-col">
                          <span className="text-brand-charcoal truncate">{row.displayName}</span>
                          {row.isLateJoiner && (
                            <span className="text-[8px] text-indigo-500 font-semibold leading-none">
                              {t('house_arena_late_join')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-black text-brand-tomato">
                        {row.score} pts
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs">
                  {t('house_arena_ranking_loading')}
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Center / Right Column: Assembly Line Canvas & Ingredient Grid Selector */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6 flex flex-col justify-start">
          
          {/* Mobile-only Recipe Checklist block */}
          <div className="bg-white border-2 border-brand-charcoal rounded-card p-3 shadow-soft block lg:hidden">
            <button
              type="button"
              onClick={() => setMobileRecipeExpanded(!mobileRecipeExpanded)}
              className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer"
            >
              <div className="flex flex-col truncate flex-1 pr-2">
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">
                  {language === 'pt' ? 'RECEITA A MONTAR' : 'RECIPE TO ASSEMBLE'}
                </span>
                <div className="flex items-center gap-2 truncate">
                  <h2 className="font-display font-black text-sm text-brand-charcoal truncate">
                    {challenge.recipeName}
                  </h2>
                  <span className="bg-brand-tomato/10 text-brand-tomato text-[9px] font-mono px-1.5 py-0.5 rounded border border-brand-tomato/10 font-bold uppercase shrink-0">
                    {challenge.recipeSize === 'Large' ? (language === 'pt' ? 'Grande' : 'Large') : 'Regular'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-brand-tomato shrink-0">
                <span>
                  {language === 'pt' ? 'Checklist' : 'Checklist'} ({currentPhases.filter(p => (selections[p.key] || []).length === (challenge.requiredIngredients[p.key] || []).length).length}/{currentPhases.length})
                </span>
                <ChevronRight size={14} className={`transform transition-transform duration-200 ${mobileRecipeExpanded ? 'rotate-90' : ''}`} />
              </div>
            </button>
            
            {mobileRecipeExpanded && (
              <div className="border-t-2 border-dashed border-brand-charcoal/10 mt-2.5 pt-2.5 space-y-1.5 max-h-48 overflow-y-auto">
                {currentPhases.map((phase) => {
                  const reqList = challenge.requiredIngredients[phase.key] || [];
                  const selList = selections[phase.key] || [];
                  const isDone = selList.length === reqList.length;
                  const isActive = phase.key === currentPhase?.key;

                  return (
                    <div 
                      key={phase.key}
                      onClick={() => {
                        const idx = currentPhases.findIndex(p => p.key === phase.key);
                        if (idx !== -1) {
                          setCurrentPhaseIndex(idx);
                        }
                      }}
                      className={`flex items-center justify-between text-xs p-1.5 rounded cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-brand-tomato/5 border-l-2 border-brand-tomato pl-2 font-bold' 
                          : 'hover:bg-brand-linen/40'
                      }`}
                    >
                      <span className={isDone ? 'text-gray-400 line-through' : 'text-brand-charcoal'}>
                        {phase.title}
                      </span>
                      <span className="font-mono text-[10px] font-black text-gray-500">
                        {selList.length}/{reqList.length}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Active Phase instructions panel */}
          <div className="bg-white border-2 sm:border-4 border-brand-charcoal rounded-card p-3 sm:p-5 shadow-soft sm:shadow-elevated">
            <div className="flex items-center justify-between border-b-2 border-brand-charcoal/10 pb-2 sm:pb-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="bg-brand-tomato text-white text-[9px] sm:text-[10px] font-mono font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded uppercase tracking-wider">
                  {language === 'pt' ? 'Fase Ativa' : 'Active Phase'}
                </span>
                <h3 className="font-display font-black text-xs sm:text-base text-brand-charcoal">
                  {currentPhase?.title}
                </h3>
              </div>
              <div className="font-mono text-[10px] sm:text-xs font-bold text-text-muted bg-brand-linen px-2 sm:px-2.5 py-0.5 sm:py-1 rounded">
                <span className="hidden xs:inline">{language === 'pt' ? 'Selecionado' : 'Selected'}:</span> {currentPhaseSelections.length} / {phaseLimit}
              </div>
            </div>

            {/* Stepper Progress indicators */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-2 sm:pb-4 mb-3 sm:mb-4 border-b border-brand-charcoal/5 pr-2 flex-nowrap scrollbar-none">
              {currentPhases.map((phase, idx) => {
                const sel = selections[phase.key] || [];
                const req = challenge.requiredIngredients[phase.key] || [];
                const isCompleted = sel.length === req.length;
                const isActive = idx === currentPhaseIndex;

                return (
                  <button
                    key={phase.key}
                    onClick={() => setCurrentPhaseIndex(idx)}
                    className={`h-6 sm:h-7 px-2 sm:px-3 text-[9px] sm:text-[10px] font-mono font-bold rounded-full border transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 shrink-0 ${
                      isActive
                        ? 'border-brand-tomato bg-brand-tomato text-white'
                        : isCompleted
                        ? 'border-brand-green/40 bg-brand-green/10 text-brand-green'
                        : 'border-brand-charcoal/20 bg-brand-linen/10 text-brand-charcoal'
                    }`}
                  >
                    {isCompleted && <span className="text-[9px]">✓</span>}
                    {phase.title}
                  </button>
                );
              })}
            </div>

            {/* Selection instructions */}
            <p className="text-[11px] sm:text-xs font-semibold text-brand-burgundy mb-3 sm:mb-4">
              {phaseLimit > 0 
                ? (language === 'pt' 
                    ? `Selecione exatamente ${phaseLimit} ingrediente(s) para esta fase.` 
                    : `Select exactly ${phaseLimit} ingredient(s) for this phase.`)
                : (language === 'pt'
                    ? 'Esta fase não requer ingredientes nesta receita. Avance para a próxima.'
                    : 'This phase does not require ingredients for this recipe. Proceed to next.')}
            </p>

            {/* Ingredients Selection Grid */}
            {options.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {options.map((item) => {
                  const count = currentPhaseSelections.filter((i) => i === item).length;
                  const isSelected = count > 0;
                  return (
                    <button
                      key={item}
                      onClick={() => handleSelectItem(item)}
                      className={`h-16 sm:h-20 p-2 sm:p-2.5 rounded-button border-2 text-left font-sans text-[11px] sm:text-xs flex flex-col justify-between transition-all relative cursor-pointer select-none ${
                        isSelected
                          ? 'border-brand-green bg-brand-green/10 text-brand-charcoal font-black shadow-inner ring-2 ring-brand-green/20'
                          : 'border-brand-charcoal/15 bg-brand-linen/10 hover:bg-brand-linen/30 text-brand-charcoal'
                      }`}
                    >
                      {count > 0 && (
                        <span className="absolute -top-1 sm:-top-1.5 -right-1 sm:-right-1.5 bg-brand-tomato text-white text-[9px] sm:text-[10px] font-mono font-black px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full border border-brand-charcoal shadow-soft z-10 animate-fade-in">
                          x{count}
                        </span>
                      )}
                      <span className="line-clamp-2 leading-tight pr-1.5 sm:pr-2">{item}</span>
                      <div className="flex items-center justify-between w-full mt-1">
                        {count > 0 ? (
                          <button
                            type="button"
                            aria-label={language === 'pt' ? `Remover uma unidade de ${item}` : `Remove one unit of ${item}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveOneItem(item);
                            }}
                            className="bg-brand-tomato hover:bg-brand-tomato/90 text-white text-xs font-black h-7 w-7 sm:h-5 sm:w-5 rounded flex items-center justify-center border border-brand-charcoal/20 transition-all cursor-pointer shadow-sm shrink-0"
                          >
                            -
                          </button>
                        ) : (
                          <div />
                        )}
                        {isSelected && (
                          <span className="bg-brand-green text-white p-0.5 rounded-full">
                            <CheckCircle size={10} fill="currentColor" className="text-white" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-brand-linen/20 border-2 border-dashed border-brand-charcoal/10 rounded-card">
                <p className="text-xs text-text-muted font-bold">
                  {language === 'pt' ? 'Nenhum ingrediente disponível' : 'No ingredients available'}
                </p>
              </div>
            )}
          </div>

          {/* Mobile Live Rankings (only shown on mobile/tablet) */}
          <div className="bg-white border-2 border-brand-charcoal rounded-card p-3 shadow-soft block lg:hidden">
            <button
              type="button"
              onClick={() => setMobileRankingsExpanded(!mobileRankingsExpanded)}
              className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Award size={14} className="text-brand-tomato shrink-0" />
                <h3 className="font-display font-black text-xs text-brand-charcoal uppercase tracking-widest">
                  {t('house_arena_live_ranking')}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-brand-tomato shrink-0">
                <span>{language === 'pt' ? 'Ver Classificação' : 'View Standings'}</span>
                <ChevronRight size={14} className={`transform transition-transform duration-200 ${mobileRankingsExpanded ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {mobileRankingsExpanded && (
              <div className="border-t-2 border-dashed border-brand-charcoal/10 mt-2.5 pt-2.5 space-y-1.5 max-h-40 overflow-y-auto">
                {liveLeaderboard && liveLeaderboard.length > 0 ? (
                  liveLeaderboard.map((row) => {
                    const isMe = row.isCurrentParticipant;
                    return (
                      <div 
                        key={row.rank}
                        className={`flex items-center justify-between text-xs p-2 rounded border transition-all ${
                          isMe 
                            ? 'border-brand-tomato bg-brand-tomato/5 font-bold' 
                            : 'border-transparent bg-brand-linen/10 hover:bg-brand-linen/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-gray-400 font-bold">#{row.rank}</span>
                          <span className="text-brand-charcoal truncate">{row.displayName}</span>
                        </div>
                        <span className="font-mono font-black text-brand-tomato shrink-0">
                          {row.score} pts
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    {t('house_arena_ranking_loading')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stepper controls & Bowl delivery actions */}
          <div className="sticky bottom-0 sm:relative -mx-4 sm:mx-0 bg-white border-t-4 sm:border-4 border-brand-charcoal rounded-none sm:rounded-card p-3 sm:p-5 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] sm:shadow-elevated flex flex-row items-center justify-between gap-2 sm:gap-4 z-30">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-none">
              {/* Back step */}
              <button
                disabled={currentPhaseIndex === 0}
                onClick={handlePrevPhase}
                className="flex-1 sm:flex-none py-2.5 sm:py-3 px-2 sm:px-4 rounded-button border-2 border-brand-charcoal bg-white text-brand-charcoal hover:bg-brand-linen disabled:opacity-50 font-display font-black text-[10px] sm:text-xs uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft size={14} className="shrink-0" />
                <span>{language === 'pt' ? 'Anterior' : 'Back'}</span>
              </button>

              {/* Clear phase selections */}
              <button
                disabled={currentPhaseSelections.length === 0}
                onClick={handleClearSelections}
                className="flex-1 sm:flex-none py-2.5 sm:py-3 px-2 sm:px-4 rounded-button border-2 border-brand-charcoal bg-white text-brand-tomato hover:bg-brand-tomato/5 disabled:opacity-50 font-display font-black text-[10px] sm:text-xs uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw size={14} className="shrink-0" />
                <span>{language === 'pt' ? 'Limpar' : 'Clear'}</span>
              </button>
            </div>

            <div className="flex-1 sm:flex-none">
              {/* Next step / Submit */}
              {!isLastPhase ? (
                <button
                  onClick={handleNextPhase}
                  className="w-full py-2.5 sm:py-3.5 px-3 sm:px-6 rounded-button border-2 border-brand-charcoal bg-brand-charcoal hover:bg-brand-burgundy text-white font-display font-black text-[10px] sm:text-xs uppercase flex items-center justify-center gap-1 transition-all shadow-soft cursor-pointer"
                >
                  <span>{language === 'pt' ? 'Seguinte' : 'Next'}</span>
                  <ChevronRight size={14} className="shrink-0" />
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={submitBowl}
                  className="w-full py-2.5 sm:py-4 px-3 sm:px-8 rounded-button border-2 border-brand-charcoal bg-brand-green hover:bg-brand-green/95 text-white font-display font-black text-[10px] sm:text-xs uppercase flex items-center justify-center gap-1.5 transition-all shadow-soft hover:translate-y-[1px] disabled:opacity-75 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>✓</span>
                  )}
                  <span>{language === 'pt' ? 'Entregar' : 'Submit'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Global Floating Feedbacks/Toasts */}
      {showFeedback && feedback.status && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`p-4 rounded-card border-4 border-brand-charcoal shadow-elevated flex items-center gap-3 ${
            feedback.status === 'success' ? 'bg-brand-green text-white' : 'bg-brand-tomato text-white'
          }`}>
            <span className="font-display font-black text-sm">
              {t(feedback.message)}
            </span>
          </div>
        </div>
      )}

      {/* 4. Standings Modal Overlay */}
      {showStandingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-4 border-brand-charcoal rounded-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-elevated overflow-hidden">
            {/* Modal Header */}
            <div className="bg-brand-linen border-b-4 border-brand-charcoal p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-tomato" />
                <h3 className="font-display font-black text-base text-brand-charcoal">
                  {t('house_arena_live_ranking')}
                </h3>
              </div>
              <button
                onClick={() => setShowStandingsModal(false)}
                className="p-1 text-brand-charcoal hover:bg-brand-charcoal/5 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b-2 border-brand-charcoal/10 bg-gray-50/50 p-2 gap-2">
              <button
                onClick={() => setActiveStandingsTab('round')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeStandingsTab === 'round'
                    ? 'border-brand-charcoal bg-brand-charcoal text-white'
                    : 'border-transparent text-gray-500 hover:text-brand-charcoal hover:bg-brand-linen/45'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>{t('house_arena_round_rank')}</span>
              </button>
              <button
                onClick={() => setActiveStandingsTab('tournament')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeStandingsTab === 'tournament'
                    ? 'border-brand-charcoal bg-brand-charcoal text-white'
                    : 'border-transparent text-gray-500 hover:text-brand-charcoal hover:bg-brand-linen/45'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>{t('house_arena_tournament_leaderboard')}</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1 max-h-[60vh] bg-brand-linen/10">
              {activeStandingsTab === 'round' ? (
                <ArenaRoundLeaderboard
                  roomCode={room.roomCode}
                  reconnectToken={reconnectToken}
                  translations={TRANSLATIONS[language]}
                  pollIntervalMs={0} // Freeze polling inside modal, since it's user interactive
                />
              ) : (
                <ArenaTournamentLeaderboard
                  roomCode={room.roomCode}
                  reconnectToken={reconnectToken}
                  translations={TRANSLATIONS[language]}
                  pollIntervalMs={0}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-brand-linen border-t-2 border-brand-charcoal/10 p-4 flex justify-end">
              <button
                onClick={() => setShowStandingsModal(false)}
                className="py-2 px-5 rounded-button border-2 border-brand-charcoal bg-white text-brand-charcoal hover:bg-brand-linen font-display font-black text-xs uppercase transition-all cursor-pointer"
              >
                {t('btn_back')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default SlopClockArenaGame;
