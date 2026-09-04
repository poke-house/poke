import React from 'react';
import { motion } from 'motion/react';
import { MemoryMatchCard } from '../memoryMatch.types';
import { AppLogo } from '../../../../../components/AppLogo';
import { getCardEmoji } from '../memoryMatch.constants';

interface MemoryCardProps {
  card: MemoryMatchCard;
  className?: string;
  onClick: () => void;
  disabled?: boolean;
  language: 'pt' | 'en';
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  card,
  className = '',
  onClick,
  disabled,
  language
}) => {
  const isHidden = card.status === 'hidden';
  const isMatched = card.status === 'matched';
  const isFlipped = !isHidden;

  const accessibleName =
    language === 'pt'
      ? card.labelPt || card.labelEn || 'Carta do Jogo'
      : card.labelEn || card.labelPt || 'Memory Card';

  const emoji = getCardEmoji(card);

  return (
    <button
      type="button"
      className={`mm-card ${isFlipped ? 'mm-card--flipped' : ''} ${isMatched ? 'mm-card--matched' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || isMatched}
      id={`mm-card-${card.position}`}
      aria-label={`Carta ${card.position + 1}: ${isHidden ? 'Oculta' : accessibleName}`}
    >
      <div className="w-full h-full relative" style={{ perspective: '1000px' }}>
        <motion.div
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isHidden ? 0 : 180 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* CARD BACK (Hidden state) */}
          <span
            className="mm-card__back absolute inset-0 w-full h-full rounded-[clamp(8px,1.5vmin,16px)] border-2 border-brand-charcoal bg-white flex flex-col items-center justify-center p-1 shadow-xs hover:shadow-md transition-shadow overflow-hidden select-none"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            aria-hidden={isFlipped}
          >
            <span className="w-full h-full rounded-[clamp(6px,1.2vmin,12px)] bg-radial from-rose-50 to-brand-sorbet/40 flex flex-col items-center justify-center gap-0.5 p-0.5 border border-brand-charcoal/10">
              <AppLogo variant="mobile" className="mm-card__logo" />
              <span className="mm-card__question select-none" aria-hidden="true">❓</span>
            </span>
          </span>

          {/* CARD FRONT (Revealed / Matched state) */}
          <span
            className={`mm-card__front absolute inset-0 w-full h-full rounded-[clamp(8px,1.5vmin,16px)] border-2 flex items-center justify-center shadow-xs overflow-hidden select-none ${
              isMatched
                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-300/80'
                : 'bg-white border-brand-charcoal text-brand-charcoal'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
            aria-hidden={!isFlipped}
          >
            <span
              className="mm-card__emoji"
              role="img"
              aria-label={accessibleName}
            >
              {emoji}
            </span>
            {isMatched && (
              <span className="absolute bottom-1 right-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 rounded-full px-1 border border-emerald-400 leading-none">
                ✓
              </span>
            )}
          </span>
        </motion.div>
      </div>
    </button>
  );
};
