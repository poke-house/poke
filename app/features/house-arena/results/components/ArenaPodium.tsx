import React from 'react';
import { ArenaResultsParticipant } from '../arenaResults.types';
import { motion } from 'motion/react';
import { ArenaAvatarBadge } from '../../components/ArenaAvatarBadge';

interface ArenaPodiumProps {
  podium: ArenaResultsParticipant[];
  language: 'pt' | 'en';
}

export const ArenaPodium: React.FC<ArenaPodiumProps> = ({ podium, language }) => {
  const first = podium.find(p => p.rank === 1);
  const second = podium.find(p => p.rank === 2);
  const third = podium.find(p => p.rank === 3);

  const renderPodiumStand = (
    player: ArenaResultsParticipant | undefined,
    heightClass: string,
    positionLabel: string,
    bgClass: string,
    rankNum: number,
    delay: number
  ) => {
    return (
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay, ease: 'easeOut' }}
        className="flex flex-col items-center flex-1 min-w-[90px]"
      >
        {/* Competitor Avatar & Name above the stand */}
        {player ? (
          <div className="flex flex-col items-center mb-3 w-full">
            <ArenaAvatarBadge 
              assetKey={player.avatarAssetKey} 
              displayName={player.displayName} 
              size="podium" 
            />
            <div className="mt-2 text-center px-1 w-full">
              <div className="text-xs font-black text-brand-charcoal truncate">
                {player.displayName}
              </div>
              <div className="text-[9px] font-mono font-semibold text-brand-burgundy/70 truncate uppercase">
                {player.storeName}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center text-xs text-brand-charcoal/40 font-mono italic">
            —
          </div>
        )}

        {/* Podium stand block */}
        <div className={`w-full ${heightClass} ${bgClass} border-4 border-brand-charcoal rounded-card shadow-soft flex flex-col items-center justify-between p-3 relative`}>
          <span className="font-condensed font-black text-4xl text-brand-charcoal leading-none">
            {positionLabel}
          </span>
          {player && (
            <div className="text-center">
              <span className="block text-[8px] font-mono font-black text-brand-burgundy uppercase tracking-wider">
                {language === 'pt' ? 'PONTOS' : 'SCORE'}
              </span>
              <span className="font-condensed font-black text-lg text-brand-charcoal leading-none">
                {player.totalScore}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full bg-white border-4 border-brand-charcoal rounded-card p-6 shadow-soft flex flex-col gap-4">
      <h4 className="font-display font-black text-sm text-brand-charcoal uppercase tracking-wider text-center border-b-2 border-dashed border-brand-charcoal/20 pb-3">
        {language === 'pt' ? 'Pódio da Arena' : 'Arena Podium'}
      </h4>

      {/* Podium grid layout: Second (Left), First (Center), Third (Right) */}
      <div className="flex items-end justify-center gap-3 pt-4 w-full max-w-sm mx-auto">
        {/* 2nd Place */}
        {renderPodiumStand(
          second,
          'h-28',
          '2nd',
          'bg-brand-sorbet/50',
          2,
          0.1
        )}

        {/* 1st Place (Tallest and highlighted) */}
        {renderPodiumStand(
          first,
          'h-36 border-brand-tomato',
          '1st',
          'bg-brand-butter',
          1,
          0
        )}

        {/* 3rd Place */}
        {renderPodiumStand(
          third,
          'h-20',
          '3rd',
          'bg-brand-linen/70',
          3,
          0.2
        )}
      </div>
    </div>
  );
};
