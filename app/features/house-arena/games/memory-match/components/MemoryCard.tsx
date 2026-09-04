import React from 'react';
import { motion } from 'motion/react';
import { MemoryMatchCard } from '../memoryMatch.types';
import { AppLogo } from '../../../../../components/AppLogo';

interface MemoryCardProps {
  card: MemoryMatchCard;
  className?: string;
  onClick: () => void;
  disabled: boolean;
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
  const label = language === 'pt'
    ? (card.labelPt || card.labelEn || '❓')
    : (card.labelEn || card.labelPt || '❓');

  return (
    <button
      type="button"
      className={`mm-card ${className} ${isMatched ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={onClick}
      disabled={disabled || isMatched}
      id={`mm-card-${card.position}`}
      aria-label={`Carta ${card.position + 1}: ${isHidden ? 'Oculta' : label}`}
    >
      <div className="w-full h-full relative" style={{ perspective: '1000px' }}>
        <motion.div
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isHidden ? 0 : 180 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* CARD BACK (Hidden state) */}
          <div
            className="absolute inset-0 w-full h-full rounded-[clamp(8px,1.5vmin,16px)] border-2 border-brand-charcoal bg-white flex flex-col items-center justify-center p-1 shadow-xs hover:shadow-md transition-shadow overflow-hidden select-none"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="w-full h-full rounded-[clamp(6px,1.2vmin,12px)] bg-radial from-rose-50 to-brand-sorbet/40 flex flex-col items-center justify-center gap-0.5 p-0.5 border border-brand-charcoal/10">
              <AppLogo variant="mobile" className="mm-card__logo" />
              <span className="mm-card__question select-none" aria-hidden="true">❓</span>
            </div>
          </div>

          {/* CARD FRONT (Revealed / Matched state) */}
          <div
            className={`absolute inset-0 w-full h-full rounded-[clamp(8px,1.5vmin,16px)] border-2 flex items-center justify-center p-1 text-center shadow-xs overflow-hidden select-none ${
              isMatched
                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-300/80'
                : 'bg-white border-brand-charcoal text-brand-charcoal'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className={`w-full h-full rounded-[clamp(6px,1.2vmin,12px)] flex flex-col items-center justify-center p-1 leading-tight ${
              isMatched ? 'bg-emerald-100/60' : 'bg-brand-linen/60'
            }`}>
              <span
                className="font-display font-black text-brand-charcoal select-none tracking-tight text-center break-words max-w-full"
                style={{ fontSize: 'clamp(0.65rem, 1.6vmin, 0.95rem)', lineHeight: 1.15 }}
              >
                {label}
              </span>
              {isMatched && (
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5 leading-none">
                  ✓
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </button>
  );
};
