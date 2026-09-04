import React from 'react';
import { ArenaResultsParticipant } from '../arenaResults.types';
import { motion } from 'motion/react';
import { ArenaAvatarBadge } from '../../components/ArenaAvatarBadge';

interface ArenaPodiumProps {
  podium: ArenaResultsParticipant[];
  language: 'pt' | 'en';
}

interface PodiumEntryProps {
  player: ArenaResultsParticipant | undefined;
  place: 1 | 2 | 3;
  className?: string;
  language: 'pt' | 'en';
  delay: number;
}

const PodiumEntry: React.FC<PodiumEntryProps> = ({
  player,
  place,
  className = '',
  language,
  delay
}) => {
  const heightClass =
    place === 1
      ? 'h-32 sm:h-36 border-brand-tomato'
      : place === 2
      ? 'h-24 sm:h-28'
      : 'h-20 sm:h-22';

  const bgClass =
    place === 1
      ? 'bg-brand-butter'
      : place === 2
      ? 'bg-brand-sorbet/50'
      : 'bg-brand-linen/70';

  const positionLabel = place === 1 ? '1st' : place === 2 ? '2nd' : '3rd';

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={`flex flex-col items-center min-w-0 w-full ${className}`}
    >
      {/* Competitor Avatar & Name above the stand */}
      {player ? (
        <div className="flex flex-col items-center mb-2.5 w-full min-w-0">
          <ArenaAvatarBadge 
            assetKey={player.avatarAssetKey} 
            displayName={player.displayName} 
            size="podium" 
          />
          <div className="mt-1.5 text-center px-1 w-full min-w-0">
            <div className="arena-podium-entry__name text-xs font-black text-brand-charcoal">
              {player.displayName}
            </div>
            <div className="arena-podium-entry__name text-[9px] font-mono font-semibold text-brand-burgundy/70 uppercase">
              {player.storeName}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-16 flex items-center justify-center text-xs text-brand-charcoal/40 font-mono italic">
          —
        </div>
      )}

      {/* Podium stand block */}
      <div className={`w-full ${heightClass} ${bgClass} border-4 border-brand-charcoal rounded-card shadow-soft flex flex-col items-center justify-between p-2 sm:p-3 relative box-border min-w-0`}>
        <span className="font-condensed font-black text-3xl sm:text-4xl text-brand-charcoal leading-none">
          {positionLabel}
        </span>
        {player && (
          <div className="text-center min-w-0">
            <span className="block text-[8px] font-mono font-black text-brand-burgundy uppercase tracking-wider">
              {language === 'pt' ? 'PONTOS' : 'SCORE'}
            </span>
            <span className="font-condensed font-black text-base sm:text-lg text-brand-charcoal leading-none">
              {player.totalScore}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const ArenaPodium: React.FC<ArenaPodiumProps> = ({ podium, language }) => {
  const first = podium.find(p => p.rank === 1);
  const second = podium.find(p => p.rank === 2);
  const third = podium.find(p => p.rank === 3);

  return (
    <div className="arena-result-card w-full bg-white border-4 border-brand-charcoal rounded-card p-5 sm:p-6 shadow-soft flex flex-col gap-4 box-border">
      <h4 className="font-display font-black text-sm text-brand-charcoal uppercase tracking-wider text-center border-b-2 border-dashed border-brand-charcoal/20 pb-3">
        {language === 'pt' ? 'Pódio da Arena' : 'Arena Podium'}
      </h4>

      {/* Podium grid layout: Second (Left), First (Center), Third (Right) */}
      <div className="arena-podium pt-2 w-full">
        <PodiumEntry
          place={2}
          player={second}
          className="arena-podium__second"
          language={language}
          delay={0.1}
        />
        <PodiumEntry
          place={1}
          player={first}
          className="arena-podium__first"
          language={language}
          delay={0}
        />
        <PodiumEntry
          place={3}
          player={third}
          className="arena-podium__third"
          language={language}
          delay={0.2}
        />
      </div>
    </div>
  );
};
