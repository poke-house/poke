import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryMatchCard } from '../memoryMatch.types';
import { AppLogo } from '../../../../../components/AppLogo';

interface MemoryMatchCardGridProps {
  cards: MemoryMatchCard[];
  onCardClick: (card: MemoryMatchCard) => void;
  disabled: boolean;
  language: 'pt' | 'en';
}

export const MemoryMatchCardGrid: React.FC<MemoryMatchCardGridProps> = ({
  cards,
  onCardClick,
  disabled
}) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 max-w-3xl mx-auto p-2" id="memory-match-card-grid">
      <AnimatePresence mode="popLayout">
        {cards.map((card) => {
          const isHidden = card.status === 'hidden';
          const isMatched = card.status === 'matched';

          return (
            <div
              key={card.id}
              className="relative aspect-square w-full cursor-pointer perspective-1000 select-none"
              onClick={() => !disabled && onCardClick(card)}
              id={`card-wrapper-${card.position}`}
            >
              <motion.div
                className="w-full h-full relative transform-style-3d"
                animate={{ rotateY: isHidden ? 0 : 180 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {/* CARD BACK (Hidden state) */}
                <div
                  className="absolute inset-0 w-full h-full rounded-2xl border border-rose-100/50 bg-radial from-rose-50 to-rose-100 flex flex-col items-center justify-center p-1 shadow-sm backface-hidden hover:shadow-md transition-shadow overflow-hidden"
                  id={`card-back-${card.position}`}
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <AppLogo variant="mobile" className="max-h-6 sm:max-h-7 w-auto opacity-90 object-contain" />
                    <span className="text-xs sm:text-sm select-none" aria-hidden="true">❓</span>
                  </div>
                </div>

                {/* CARD FRONT (Revealed / Matched state) */}
                <div
                  className={`absolute inset-0 w-full h-full rounded-2xl flex items-center justify-center p-2 text-center shadow-inner rotateY-180 backface-hidden ${
                    isMatched
                      ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-900 ring-2 ring-emerald-200/60'
                      : 'bg-white border-2 border-rose-300 text-slate-800'
                  }`}
                  id={`card-front-${card.position}`}
                >
                  <span className="text-4xl sm:text-5xl select-none" role="img" aria-label="carta">
                    {card.labelPt || card.labelEn || '❓'}
                  </span>
                </div>
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
