import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import { MemoryMatchCard } from '../memoryMatch.types';

interface MemoryMatchCardGridProps {
  cards: MemoryMatchCard[];
  onCardClick: (card: MemoryMatchCard) => void;
  disabled: boolean;
  language: 'pt' | 'en';
}

export const MemoryMatchCardGrid: React.FC<MemoryMatchCardGridProps> = ({
  cards,
  onCardClick,
  disabled,
  language
}) => {
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto p-2" id="memory-match-card-grid">
      <AnimatePresence mode="popLayout">
        {cards.map((card) => {
          const isHidden = card.status === 'hidden';
          const isRevealed = card.status === 'revealed';
          const isMatched = card.status === 'matched';

          return (
            <div
              key={card.id}
              className="relative aspect-square w-full cursor-pointer perspective-1000 select-none"
              onClick={() => !disabled && onCardClick(card)}
              id={`card-wrapper-${card.position}`}
            >
              <motion.div
                className="w-full h-full relative duration-500 transform-style-3d"
                animate={{ rotateY: isHidden ? 0 : 180 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                {/* CARD BACK (Hidden state) */}
                <div
                  className="absolute inset-0 w-full h-full rounded-2xl border border-rose-100/50 bg-radial from-rose-50 to-rose-100 flex flex-col items-center justify-center shadow-sm backface-hidden hover:shadow-md transition-shadow"
                  id={`card-back-${card.position}`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-rose-500 shadow-xs">
                      <HelpCircle size={18} />
                    </div>
                    <span className="text-[10px] font-semibold text-rose-400 mt-1.5 tracking-wider uppercase font-sans">
                      Poke House
                    </span>
                  </motion.div>
                </div>

                {/* CARD FRONT (Revealed / Matched state) */}
                <div
                  className={`absolute inset-0 w-full h-full rounded-2xl flex flex-col items-center justify-center p-2 text-center shadow-inner rotateY-180 backface-hidden ${
                    isMatched
                      ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-900'
                      : 'bg-white border-2 border-rose-300 text-slate-800'
                  }`}
                  id={`card-front-${card.position}`}
                >
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="text-xs sm:text-sm font-bold leading-tight tracking-tight px-1 font-sans break-words max-w-full">
                      {language === 'pt' ? (card.labelPt || card.labelEn || '---') : (card.labelEn || card.labelPt || '---')}
                    </p>
                    {card.labelPt && card.labelEn && card.labelPt !== card.labelEn && (
                      <p className="text-[10px] text-slate-400 mt-1 italic font-sans max-w-full truncate px-1">
                        {language === 'pt' ? card.labelEn : card.labelPt}
                      </p>
                    )}
                  </div>

                  {/* Accessible Label Indicator */}
                  <div className="w-full flex items-center justify-between border-t border-slate-100/80 pt-1 mt-1">
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm tracking-wider font-mono ${
                        card.cardSide === 'left'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {card.cardSide === 'left' 
                        ? (language === 'pt' ? 'Termo' : 'Term') 
                        : (language === 'pt' ? 'Par' : 'Pair')}
                    </span>

                    {isMatched && (
                      <span className="text-emerald-500">
                        <CheckCircle2 size={12} className="stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
