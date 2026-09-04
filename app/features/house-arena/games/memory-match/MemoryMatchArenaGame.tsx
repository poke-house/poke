import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, RefreshCw, AlertCircle, Sparkles, Home } from 'lucide-react';
import { ArenaRoom } from '../../houseArena.types';
import { useMemoryMatchGameplay } from './hooks/useMemoryMatchGameplay';
import { MemoryCard } from './components/MemoryCard';

interface MemoryMatchArenaGameProps {
  room: ArenaRoom;
  reconnectToken: string;
  language: 'pt' | 'en';
  onRoundFinished: () => void;
  onHome?: () => void;
}

export const MemoryMatchArenaGame: React.FC<MemoryMatchArenaGameProps> = ({
  room,
  reconnectToken,
  language,
  onRoundFinished,
  onHome
}) => {
  const {
    cards,
    loading,
    submitting,
    timeLeft,
    roundScore,
    totalScore,
    feedback,
    handleCardClick
  } = useMemoryMatchGameplay({
    room,
    reconnectToken,
    language,
    onRoundFinished
  });

  const lastScoreRef = useRef(roundScore);

  // Responsive state for dynamic columns & rows computation
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute explicit columns and rows dynamically (4 cols on mobile, 5 cols on desktop)
  const columnCount = isMobile ? 4 : 5;
  const rowCount = Math.ceil((cards.length || 20) / columnCount);

  const boardStyle = {
    '--mm-columns': columnCount,
    '--mm-rows': rowCount,
  } as React.CSSProperties;

  // Geometric validation runner per user specifications
  useEffect(() => {
    const runVerification = () => {
      const page = document.querySelector('.mm-page');
      const header = document.querySelector('.mm-header');
      const main = document.querySelector('.mm-main');
      const board = document.querySelector('.mm-board');
      const footer = document.querySelector('.mm-footer');
      const cardEls = Array.from(document.querySelectorAll('.mm-card'));

      if (!page || !header || !main || !board || !footer || cardEls.length === 0) {
        return;
      }

      const pageRect = page.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();

      const failures: string[] = [];

      if (Math.abs(pageRect.height - window.innerHeight) > 1) {
        failures.push(`Page height (${pageRect.height}) !== window.innerHeight (${window.innerHeight})`);
      }

      if (boardRect.bottom > mainRect.bottom + 1) {
        failures.push(`Board bottom (${boardRect.bottom}) overlaps outside main (${mainRect.bottom})`);
      }

      if (boardRect.bottom > footerRect.top + 1) {
        failures.push(`Board bottom (${boardRect.bottom}) overlaps footer top (${footerRect.top})`);
      }

      cardEls.forEach((card, index) => {
        const r = card.getBoundingClientRect();
        if (r.bottom > boardRect.bottom + 1) {
          failures.push(`Card ${index} bottom (${r.bottom}) exceeds board (${boardRect.bottom})`);
        }
        if (r.bottom > footerRect.top + 1) {
          failures.push(`Card ${index} bottom (${r.bottom}) overlaps footer (${footerRect.top})`);
        }
        if (r.height <= 0 || r.width <= 0) {
          failures.push(`Card ${index} collapsed: ${r.width}x${r.height}`);
        }
      });

      const metrics = {
        windowHeight: window.innerHeight,
        pageHeight: pageRect.height,
        headerHeight: headerRect.height,
        mainHeight: mainRect.height,
        boardHeight: boardRect.height,
        footerHeight: footerRect.height,
        cardsCount: cardEls.length,
        failuresCount: failures.length
      };

      console.table(metrics);
      if (failures.length > 0) {
        console.warn('Memory Match Geometric Failures:', failures);
      } else {
        console.log('✅ Memory Match Geometric Validation: 0 failures, all cards visible!');
      }

      (window as any).__MM_VERIFICATION__ = {
        metrics,
        failures,
        pageRect,
        headerRect,
        mainRect,
        boardRect,
        footerRect,
        cardsCount: cardEls.length
      };
    };

    const timer = setTimeout(runVerification, 100);
    (window as any).runMemoryMatchVerification = runVerification;

    return () => clearTimeout(timer);
  }, [cards.length, isMobile, loading]);

  // Trigger confetti on positive score increases
  useEffect(() => {
    if (roundScore > lastScoreRef.current) {
      if (window.confetti) {
        window.confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#FF83AF', '#F3E39F', '#99CA5C']
        });
      }
      lastScoreRef.current = roundScore;
    }
  }, [roundScore]);

  // Format time (e.g. 300s -> 05:00)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timePercent = Math.min(100, Math.max(0, (timeLeft / 300) * 100));

  if (loading) {
    return (
      <div className="mm-page items-center justify-center p-6 text-center" id="memory-match-loading">
        <div className="flex flex-col items-center justify-center m-auto">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="text-rose-500 mb-4"
          >
            <RefreshCw size={40} className="stroke-[2.5]" />
          </motion.div>
          <h3 className="text-xl font-bold text-slate-800 font-display">
            {language === 'pt' ? 'A preparar o tabuleiro...' : 'Preparing the board...'}
          </h3>
          <p className="text-sm text-slate-500 mt-2 font-sans">
            {language === 'pt' ? 'Carregando o jogo de memória.' : 'Loading the memory match game.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mm-page" id="memory-match-arena-game">
      {/* HEADER: Direct sibling 1 */}
      <header className="mm-header">
        <div className="mm-header__identity">
          <div className="mm-header__icon rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 border-2 border-brand-charcoal shrink-0">
            <Sparkles size={22} className="stroke-[2.5]" />
          </div>
          <div className="mm-header__copy">
            <span className="mm-header__eyebrow">
              Memory Match
            </span>
            <h2 className="mm-header__title">
              {language === 'pt' ? 'Encontra os pares iguais!' : 'Find the matching pairs!'}
            </h2>
          </div>
        </div>

        <div className="mm-header__timer">
          <div className="mm-header__timer-badge">
            <Clock size={14} className="animate-pulse" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <div className="mm-header__progress">
            <div
              className="mm-header__progress-fill"
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>

        <div className="mm-header__scores">
          <div className="mm-score mm-score--round">
            <p className="mm-score__label">
              {language === 'pt' ? 'Ronda' : 'Round'}
            </p>
            <p className="mm-score__value">
              +{roundScore}
            </p>
          </div>

          <div className="mm-score mm-score--total">
            <p className="mm-score__label">
              {language === 'pt' ? 'Total' : 'Total Score'}
            </p>
            <p className="mm-score__value">
              {totalScore}
            </p>
          </div>
        </div>
      </header>

      {/* MAIN: Direct sibling 2 */}
      <main className="mm-main relative">
        <AnimatePresence mode="wait">
          {feedback.status && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className={`pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold font-sans shadow-md border flex items-center gap-1.5 z-30 ${
                feedback.status === 'success'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-rose-600 text-white border-rose-700'
              }`}
            >
              <AlertCircle size={14} />
              <span>{feedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mm-board" style={boardStyle} id="memory-match-board">
          {cards.map((card) => (
            <MemoryCard
              key={card.id}
              card={card}
              className="mm-card"
              onClick={() => !submitting && handleCardClick(card)}
              disabled={submitting}
              language={language}
            />
          ))}
        </div>
      </main>

      {/* FOOTER: Direct sibling 3 */}
      <footer className="mm-footer">
        <div className="flex items-center gap-2">
          {onHome && (
            <button
              type="button"
              onClick={onHome}
              title={language === 'pt' ? 'Sair para o Início' : 'Exit to Home'}
              className="min-h-[40px] px-3 sm:px-4 py-2 rounded-button border-2 border-brand-charcoal bg-white text-brand-charcoal hover:bg-brand-linen font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-soft"
            >
              <Home size={15} />
              <span>{language === 'pt' ? 'Início' : 'Home'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="font-mono text-xs font-black text-brand-charcoal bg-emerald-50 px-3 py-1.5 rounded-button border border-emerald-300">
            +{roundScore} pts
          </div>
        </div>
      </footer>
    </div>
  );
};
