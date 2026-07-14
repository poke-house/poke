import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { ArenaRoom } from '../../houseArena.types';
import { useMemoryMatchGameplay } from './hooks/useMemoryMatchGameplay';
import { MemoryMatchCardGrid } from './components/MemoryMatchCardGrid';

interface MemoryMatchArenaGameProps {
  room: ArenaRoom;
  reconnectToken: string;
  language: 'pt' | 'en';
  onRoundFinished: () => void;
}

export const MemoryMatchArenaGame: React.FC<MemoryMatchArenaGameProps> = ({
  room,
  reconnectToken,
  language,
  onRoundFinished
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
          {language === 'pt' ? 'Carregando conceitos e termos de Poke House.' : 'Loading Poke House concepts and terms.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-3" id="memory-match-arena-game">
      {/* GAME STATUS BAR */}
      <div className="bg-white border-3 border-brand-charcoal rounded-3xl p-4 md:p-6 shadow-fluent mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left panel: Room and Mode Details */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
              <Sparkles size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase font-mono">
                {language === 'pt' ? 'Desafio de Memória' : 'Memory Challenge'}
              </span>
              <h2 className="text-lg md:text-xl font-bold text-brand-charcoal font-display">
                Memory Match (SOP Pairs)
              </h2>
            </div>
          </div>

          {/* Center panel: Clock Countdown */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border-2 border-rose-200 rounded-full text-rose-600 font-mono text-base font-bold shadow-xs">
              <Clock size={16} className="animate-pulse" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="w-32 bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-200">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${timePercent}%` }}
              />
            </div>
          </div>

          {/* Right panel: Scores Display */}
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 font-sans">
                {language === 'pt' ? 'Ronda' : 'Round'}
              </p>
              <p className="text-lg font-black text-emerald-950 font-mono leading-none mt-1">
                +{roundScore}
              </p>
            </div>
            
            <div className="text-center px-4 py-2 bg-slate-50 border-2 border-slate-200 rounded-2xl">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                {language === 'pt' ? 'Acumulado' : 'Total Score'}
              </p>
              <p className="text-lg font-black text-slate-800 font-mono leading-none mt-1">
                {totalScore}
              </p>
            </div>
          </div>

        </div>
      </div>

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
      <div className="bg-radial from-slate-50 to-rose-50/20 border-3 border-brand-charcoal rounded-[32px] p-4 sm:p-6 md:p-8 shadow-fluent relative overflow-hidden">
        
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
          💡 <span className="font-bold text-slate-700">{language === 'pt' ? 'Como jogar:' : 'How to play:'}</span> {language === 'pt' ? 'Encontre os pares correspondentes! Os cartões com etiqueta cor-de-rosa são os termos e os cartões com etiqueta amarela são os seus significados correspondentes.' : 'Find the matching pairs! Cards with pink tags are Terms, and cards with yellow tags are their corresponding Pairs.'}
        </p>
      </div>
    </div>
  );
};
