import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, RefreshCw, AlertCircle, Sparkles, Home } from 'lucide-react';
import { ArenaRoom } from '../../houseArena.types';
import { useMemoryMatchGameplay } from './hooks/useMemoryMatchGameplay';
import { MemoryMatchCardGrid } from './components/MemoryMatchCardGrid';

interface MemoryMatchArenaGameProps {
  room: ArenaRoom;
  reconnectToken: string;
  language: 'pt' | 'en';
  onRoundFinished: () => void;
  onHome?: () => void;
}

export const MemoryMatchArenaGame: React.FC<MemoryMatchArenaGameProps> = ({
  room,
  reconnectToken,
  language,
  onRoundFinished,
  onHome
}) => {
  const {
    cards,
    loading,
    submitting,
    timeLeft,
    roundScore,
    totalScore,
    feedback,
    handleCardClick
  } = useMemoryMatchGameplay({
    room,
    reconnectToken,
    language,
    onRoundFinished
  });

  const lastScoreRef = useRef(roundScore);

  // Trigger confetti on positive score increases
  useEffect(() => {
    if (roundScore > lastScoreRef.current) {
      if (window.confetti) {
        window.confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#FF83AF', '#F3E39F', '#99CA5C']
        });
      }
      lastScoreRef.current = roundScore;
    }
  }, [roundScore]);

  // Format time (e.g. 300s -> 05:00)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timePercent = (timeLeft / 300) * 100;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-6 text-center" id="memory-match-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="text-rose-500 mb-4"
        >
          <RefreshCw size={40} className="stroke-[2.5]" />
        </motion.div>
        <h3 className="text-xl font-bold text-slate-800 font-display">
          {language === 'pt' ? 'A preparar o tabuleiro...' : 'Preparing the board...'}
        </h3>
        <p className="text-sm text-slate-500 mt-2 font-sans">
          {language === 'pt' ? 'Carregando o jogo de memória.' : 'Loading the memory match game.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-linen min-h-[100dvh] w-full flex flex-col font-sans" id="memory-match-arena-game">
      {/* STICKY HEADER */}
      <div className="bg-white border-b-4 border-brand-charcoal py-3 sm:py-4 px-3 sm:px-6 md:px-8 sticky top-0 z-40 shadow-soft">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4">
          
          {/* Left panel: Room and Mode Details */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
              <Sparkles size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase font-mono">
                Memory Match
              </span>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-brand-charcoal font-display">
                {language === 'pt' ? 'Encontra os pares iguais!' : 'Find the matching pairs!'}
              </h2>
            </div>
          </div>

          {/* Center panel: Clock Countdown */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-rose-50 border-2 border-rose-200 rounded-full text-rose-600 font-mono text-xs sm:text-base font-bold shadow-xs">
              <Clock size={14} className="animate-pulse" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="w-28 sm:w-32 bg-slate-100 h-1.5 rounded-full mt-1.5 sm:mt-2 overflow-hidden border border-slate-200">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${timePercent}%` }}
              />
            </div>
          </div>

          {/* Right panel: Scores Display */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-center px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
              <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-600 font-sans">
                {language === 'pt' ? 'Ronda' : 'Round'}
              </p>
              <p className="text-sm sm:text-lg font-black text-emerald-950 font-mono leading-none mt-0.5 sm:mt-1">
                +{roundScore}
              </p>
            </div>
            
            <div className="text-center px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50 border-2 border-slate-200 rounded-2xl">
              <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                {language === 'pt' ? 'Acumulado' : 'Total Score'}
              </p>
              <p className="text-sm sm:text-lg font-black text-slate-800 font-mono leading-none mt-0.5 sm:mt-1">
                {totalScore}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Scrolling Middle Section */}
      <div className="max-w-4xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-6 flex-1 overflow-y-auto pb-24 sm:pb-8">
        {/* FLOATING ACTION NOTIFIER */}
        <div className="relative min-h-[40px] flex items-center justify-center mb-4">
          <AnimatePresence mode="wait">
            {feedback.status && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute px-4 py-2 rounded-full text-xs font-bold font-sans shadow-sm border flex items-center gap-1.5 z-10 ${
                  feedback.status === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-rose-50 border-rose-300 text-rose-700'
                }`}
              >
                <AlertCircle size={14} />
                <span>{feedback.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CORE CARD BOARD */}
        <div className="bg-radial from-slate-50 to-rose-50/20 border-3 border-brand-charcoal rounded-[24px] sm:rounded-[32px] p-3 sm:p-6 md:p-8 shadow-fluent relative overflow-visible">
          
          {/* Subtle decorative background grids */}
          <div className="absolute inset-0 opacity-2.5 pointer-events-none bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px]" />

          <MemoryMatchCardGrid
            cards={cards}
            onCardClick={handleCardClick}
            disabled={submitting}
            language={language}
          />
        </div>

        {/* TUTORIAL / INSTRUCTIONS COMPASS */}
        <div className="mt-6 text-center text-slate-500 max-w-md mx-auto">
          <p className="text-[11px] leading-relaxed font-sans font-medium px-4 py-2 bg-white/60 border border-slate-200 rounded-xl">
            💡 <span className="font-bold text-slate-700">{language === 'pt' ? 'Como jogar:' : 'How to play:'}</span> {language === 'pt' ? 'Encontra os pares correspondentes! Viras dois cartões de cada vez para encontrar os emojis iguais.' : 'Find the matching pairs! Flip two cards at a time to find identical emojis.'}
          </p>
        </div>
      </div>

      {/* STICKY ACTION BAR */}
      <div className="sticky bottom-0 bg-white border-t-4 border-brand-charcoal p-3 sm:p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] flex flex-row items-center justify-between gap-2 sm:gap-4 z-30 min-h-[56px]">
        <div className="flex items-center gap-2">
          {onHome && (
            <button
              type="button"
              onClick={onHome}
              title={language === 'pt' ? 'Sair para o Início' : 'Exit to Home'}
              className="min-h-[44px] min-w-[44px] py-2.5 sm:py-3 px-3 rounded-button border-2 border-brand-charcoal bg-white text-brand-charcoal hover:bg-brand-linen font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Home size={16} />
              <span className="hidden sm:inline">{language === 'pt' ? 'Início' : 'Home'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="font-mono text-xs font-black text-brand-charcoal bg-emerald-50 px-3 py-2 rounded-button border border-emerald-200">
            +{roundScore} pts
          </div>
        </div>
      </div>
    </div>
  );
};
