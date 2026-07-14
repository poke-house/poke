import React from 'react';
import { ArenaParticipantRoundSummary } from '../arenaResults.types';
import { getGameName, formatOrdinalRank } from '../arenaResults.utils';
import { motion } from 'motion/react';

interface ArenaRoundSummaryListProps {
  roundSummaries: ArenaParticipantRoundSummary[];
  language: 'pt' | 'en';
}

export const ArenaRoundSummaryList: React.FC<ArenaRoundSummaryListProps> = ({ roundSummaries, language }) => {
  return (
    <div className="w-full bg-white border-4 border-brand-charcoal rounded-card p-5 shadow-soft flex flex-col gap-4">
      <h4 className="font-display font-black text-sm text-brand-charcoal uppercase tracking-wider">
        {language === 'pt' ? 'Resumo de Rondas' : 'Round-by-Round Log'}
      </h4>

      <div className="space-y-3">
        {roundSummaries.map((summary, index) => {
          const gameTitle = getGameName(summary.gameType, language);
          const ordinalRank = formatOrdinalRank(summary.rank, language);

          return (
            <motion.div
              key={summary.roundNumber}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3.5 bg-brand-linen/10 border-2 border-brand-charcoal/20 rounded-card"
            >
              {/* Left Group: Round + Game Info */}
              <div className="min-w-0">
                <span className="bg-brand-tomato/10 text-brand-tomato text-[9px] font-mono font-black px-2 py-0.5 rounded-full border border-brand-tomato/20 uppercase">
                  {language === 'pt' ? `Ronda ${summary.roundNumber}` : `Round ${summary.roundNumber}`}
                </span>
                <h5 className="font-sans font-black text-xs text-brand-charcoal mt-1.5 truncate">
                  {gameTitle}
                </h5>
              </div>

              {/* Right Group: Score & Rank */}
              <div className="flex items-center gap-4 shrink-0 text-right">
                <div>
                  <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-wider">
                    {language === 'pt' ? 'PONTOS' : 'SCORE'}
                  </span>
                  <span className="font-condensed font-black text-sm text-brand-charcoal">
                    {summary.score} pts
                  </span>
                </div>

                <div className="border-l border-brand-charcoal/10 pl-4">
                  <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-wider">
                    {language === 'pt' ? 'CLASSIFICAÇÃO' : 'RANK'}
                  </span>
                  <span className="font-condensed font-black text-sm text-brand-tomato">
                    {ordinalRank}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {roundSummaries.length === 0 && (
          <div className="py-6 text-center text-xs text-gray-500 font-mono italic">
            {language === 'pt' ? 'Nenhum registo de ronda disponível.' : 'No round logs available.'}
          </div>
        )}
      </div>
    </div>
  );
};
