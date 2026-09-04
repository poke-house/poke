import React from 'react';
import { ArenaResultsParticipant } from '../arenaResults.types';
import { formatOrdinalRank } from '../arenaResults.utils';
import { motion } from 'motion/react';

interface ArenaParticipantFinalResultProps {
  currentParticipant: ArenaResultsParticipant | null;
  totalParticipants: number;
  language: 'pt' | 'en';
}

export const ArenaParticipantFinalResult: React.FC<ArenaParticipantFinalResultProps> = ({
  currentParticipant,
  totalParticipants,
  language
}) => {
  if (!currentParticipant) return null;

  const ordinalRank = formatOrdinalRank(currentParticipant.rank, language);

  const getFeedbackMessage = () => {
    const rank = currentParticipant.rank;
    if (rank === 1) {
      return language === 'pt'
        ? 'Desempenho lendário! Dominaste o balcão com velocidade e precisão SOP perfeitas.'
        : 'Legendary performance! You mastered the counter with absolute speed and perfect SOP precision.';
    }
    if (rank <= 3) {
      return language === 'pt'
        ? 'Excelente velocidade operacional! O pódio é teu por mérito próprio.'
        : 'Superb operational speed! The podium is yours by your own merit.';
    }
    return language === 'pt'
      ? 'Bom esforço operacional! Pratica no modo individual para otimizares os teus tempos de montagem.'
      : 'Great operational effort! Train in individual modes to optimize your assembly times.';
  };

  return (
    <motion.div
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="arena-result-card w-full bg-brand-sorbet/20 border-4 border-brand-charcoal rounded-card p-5 sm:p-6 shadow-soft flex flex-col gap-4 relative overflow-hidden box-border"
    >
      <h4 className="font-display font-black text-xs text-brand-charcoal uppercase tracking-wider">
        {language === 'pt' ? 'O Teu Desempenho' : 'Your Performance'}
      </h4>

      <div className="flex items-center justify-between gap-4 border-b border-dashed border-brand-charcoal/20 pb-4">
        <div>
          <div className="text-[10px] font-mono font-black text-brand-burgundy uppercase tracking-wider">
            {language === 'pt' ? 'CLASSIFICAÇÃO FINAL' : 'FINAL POSITION'}
          </div>
          <div className="font-condensed font-black text-3xl sm:text-4xl text-brand-charcoal leading-none mt-1">
            {ordinalRank} <span className="font-sans text-xs font-semibold text-brand-burgundy/80">/ {totalParticipants}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-mono font-black text-brand-burgundy uppercase tracking-wider">
            {language === 'pt' ? 'PONTUAÇÃO OBTIDA' : 'SCORE ACHIEVED'}
          </div>
          <div className="font-condensed font-black text-3xl sm:text-4xl text-brand-tomato leading-none mt-1">
            {currentParticipant.totalScore} <span className="font-sans text-xs font-semibold text-brand-burgundy/80">pts</span>
          </div>
        </div>
      </div>

      <p className="text-xs font-semibold text-brand-burgundy leading-relaxed">
        {getFeedbackMessage()}
      </p>
    </motion.div>
  );
};
