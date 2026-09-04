import React from 'react';
import { ArenaResultsParticipant } from '../arenaResults.types';
import { motion } from 'motion/react';
import { ArenaAvatarBadge } from '../../components/ArenaAvatarBadge';

interface ArenaFinalRankingListProps {
  participants: ArenaResultsParticipant[];
  language: 'pt' | 'en';
}

export const ArenaFinalRankingList: React.FC<ArenaFinalRankingListProps> = ({ participants, language }) => {
  return (
    <div className="arena-final-ranking arena-result-card w-full bg-white border-4 border-brand-charcoal rounded-card p-5 shadow-soft flex flex-col gap-4 box-border">
      <h4 className="font-display font-black text-sm text-brand-charcoal uppercase tracking-wider">
        {language === 'pt' ? 'Tabela Classificativa Final' : 'Final Tournament Standings'}
      </h4>

      <div className="space-y-2.5 w-full min-w-0">
        {participants.map((p, index) => {
          return (
            <motion.div
              key={p.displayName + p.storeName}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`arena-ranking-row p-3 border-2 rounded-card transition-all ${
                p.isCurrentParticipant
                  ? 'bg-brand-mochi/10 border-brand-mochi shadow-[2px_2px_0px_0px_#FF83AF]'
                  : 'bg-brand-linen/10 border-brand-charcoal/30'
              }`}
            >
              {/* 1. Rank */}
              <span className="font-condensed font-black text-base text-brand-charcoal w-6 text-center shrink-0">
                #{p.rank}
              </span>

              {/* 2. Avatar */}
              <div className="shrink-0">
                <ArenaAvatarBadge 
                  assetKey={p.avatarAssetKey} 
                  displayName={p.displayName} 
                  size="sm" 
                  isCurrentParticipant={p.isCurrentParticipant} 
                  isActive={p.isActive} 
                />
              </div>

              {/* 3. Identity */}
              <div className="arena-ranking-row__name min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-sans font-black text-xs text-brand-charcoal">
                    {p.displayName}
                  </span>
                  {p.isCurrentParticipant && (
                    <span className="bg-brand-mochi text-[8px] font-mono font-black text-brand-burgundy px-1.5 py-0.5 rounded-full border border-brand-charcoal uppercase shrink-0">
                      {language === 'pt' ? 'TU' : 'YOU'}
                    </span>
                  )}
                  {!p.isActive && (
                    <span className="bg-brand-tomato/10 text-[8px] font-mono font-bold text-brand-tomato px-1.5 py-0.5 rounded-full border border-brand-tomato/20 uppercase shrink-0">
                      OFFLINE
                    </span>
                  )}
                </div>
                <span className="block text-[9px] font-mono text-gray-500 uppercase tracking-wide">
                  {p.storeName}
                </span>
              </div>

              {/* 4. Points */}
              <div className="arena-ranking-row__points shrink-0">
                <div className="font-condensed font-black text-sm text-brand-charcoal bg-brand-linen/40 px-2.5 py-1 rounded-button border border-brand-charcoal/20 inline-block">
                  {p.totalScore} <span className="font-sans text-[10px] font-medium text-brand-burgundy uppercase">pts</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {participants.length === 0 && (
          <div className="py-8 text-center text-xs text-gray-500 font-mono italic">
            {language === 'pt' ? 'Nenhum concorrente registado.' : 'No competitors registered.'}
          </div>
        )}
      </div>
    </div>
  );
};
