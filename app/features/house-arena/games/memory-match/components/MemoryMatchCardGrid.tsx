import React from 'react';
import { MemoryMatchCard } from '../memoryMatch.types';
import { MemoryCard } from './MemoryCard';

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
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const columnCount = isMobile ? 4 : 5;
  const rowCount = Math.ceil((cards.length || 20) / columnCount);

  const boardStyle = {
    '--mm-columns': columnCount,
    '--mm-rows': rowCount,
  } as React.CSSProperties;

  return (
    <div className="mm-board" style={boardStyle} id="memory-match-board">
      {cards.map((card) => (
        <MemoryCard
          key={card.id}
          card={card}
          className="mm-card"
          onClick={() => !disabled && onCardClick(card)}
          disabled={disabled}
          language={language}
        />
      ))}
    </div>
  );
};
