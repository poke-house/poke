import React from 'react';
import { ArenaResultsParticipant } from '../arenaResults.types';
import { motion } from 'motion/react';
import { ArenaAvatarBadge } from '../../components/ArenaAvatarBadge';

interface ArenaChampionCardProps {
  champion: ArenaResultsParticipant | null;
  language: 'pt' | 'en';
}

export const ArenaChampionCard: React.FC<ArenaChampionCardProps> = ({ champion, language }) => {
  if (!champion) return null;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full bg-brand-butter border-4 border-brand-charcoal rounded-card p-6 shadow-elevated flex flex-col items-center text-center relative overflow-hidden"
    >
      {/* Decorative Brand Top Banner Line */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-brand-tomato" />

      <span className="text-[10px] font-mono tracking-widest text-brand-burgundy uppercase font-black mt-2">
        {language === 'pt' ? 'RESPEITO OPERACIONAL' : 'OPERATIONAL EXCELLENCE'}
      </span>

      {/* Champion Title in Gothic Expanded */}
      <h3 className="font-display font-black text-2xl md:text-3xl text-brand-charcoal tracking-tight mt-1 mb-4 uppercase">
        {language === 'pt' ? 'CAMPEÃO DA ARENA' : 'ARENA CHAMPION'}
      </h3>

      {/* Large Avatar Circle */}
      <div className="mb-4">
        <ArenaAvatarBadge 
          assetKey={champion.avatarAssetKey} 
          displayName={champion.displayName} 
          size="champion" 
        />
      </div>

      {/* Champion Name */}
      <h4 className="font-sans font-black text-xl text-brand-charcoal leading-none">
        {champion.displayName}
      </h4>
      <span className="text-xs font-semibold text-brand-burgundy/80 uppercase mt-1">
        {champion.storeName}
      </span>

      {/* Champion Score and Rank Stats Panel */}
      <div className="mt-5 grid grid-cols-2 gap-4 w-full bg-white/60 border-2 border-brand-charcoal/30 rounded-card p-4">
        <div>
          <span className="block text-[10px] font-mono font-black text-brand-burgundy uppercase tracking-wider">
            {language === 'pt' ? 'POSIÇÃO' : 'RANK'}
          </span>
          <span className="font-condensed text-3xl font-black text-brand-charcoal leading-tight">
            #1
          </span>
        </div>
        <div className="border-l border-brand-charcoal/20">
          <span className="block text-[10px] font-mono font-black text-brand-burgundy uppercase tracking-wider">
            {language === 'pt' ? 'PONTOS TOTAIS' : 'TOTAL SCORE'}
          </span>
          <span className="font-condensed text-3xl font-black text-brand-tomato leading-tight">
            {champion.totalScore}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
