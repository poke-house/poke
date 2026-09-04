import React from 'react';
import { Clock, Trophy, HelpCircle } from 'lucide-react';

interface QuickThinkGameHeaderProps {
  roundNumber: number;
  questionOrder: number | null;
  totalQuestions: number;
  roundScore: number;
  roundTimeLeft: number;
  language: 'pt' | 'en';
}

export const QuickThinkGameHeader: React.FC<QuickThinkGameHeaderProps> = ({
  roundNumber,
  questionOrder,
  totalQuestions,
  roundScore,
  roundTimeLeft,
  language
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-4 border-brand-charcoal rounded-card p-4 md:p-5 shadow-elevated">
      {/* Round & Mode Info */}
      <div className="flex items-center gap-3">
        <div className="bg-brand-tomato text-white text-xs font-display font-black px-3 py-1.5 rounded-full border-2 border-brand-charcoal uppercase tracking-wider">
          {language === 'pt' ? `Ronda ${roundNumber}` : `Round ${roundNumber}`}
        </div>
        <div>
          <h2 className="font-display font-black text-lg md:text-xl text-brand-charcoal leading-none">
            {language === 'pt' ? 'Pensa Rápido' : 'Fast Thinker'}
          </h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
            {language === 'pt' ? 'SOP e Receitas contra o Relógio' : 'SOP & Recipes against the clock'}
          </p>
        </div>
      </div>

      {/* Progress & Live Scoring & Timers */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        {/* Question Counter */}
        {questionOrder !== null && (
          <div className="flex items-center gap-1.5 bg-brand-linen/40 border-2 border-brand-charcoal rounded-button px-3 py-1.5 font-mono text-xs font-bold text-brand-charcoal">
            <HelpCircle size={14} className="text-brand-charcoal" />
            <span>
              {language === 'pt' ? 'Pergunta' : 'Question'} {questionOrder}/{totalQuestions}
            </span>
          </div>
        )}

        {/* Score Display */}
        <div className="flex items-center gap-1.5 bg-brand-butter border-2 border-brand-charcoal rounded-button px-3 py-1.5 font-mono text-xs font-black text-brand-charcoal">
          <Trophy size={14} className="text-brand-charcoal" />
          <span>
            {roundScore} {roundScore === 1 ? 'pt' : 'pts'}
          </span>
        </div>

        {/* Autoritative Round Countdown */}
        <div className="flex items-center gap-2 bg-brand-linen border-2 border-brand-charcoal rounded-button px-3.5 py-1 text-brand-charcoal">
          <Clock size={16} className="text-brand-tomato animate-pulse" />
          <div className="text-right">
            <span className="block text-[8px] font-mono text-gray-400 uppercase tracking-wider leading-none">
              {language === 'pt' ? 'Ronda Fim' : 'Round End'}
            </span>
            <span className="font-mono font-black text-sm md:text-base leading-none tabular-nums text-brand-tomato">
              {formatTime(roundTimeLeft)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QuickThinkGameHeader;
