import React, { useEffect } from 'react';
import { useArenaFinalResults } from './hooks/useArenaFinalResults';
import { ArenaChampionCard } from './components/ArenaChampionCard';
import { ArenaPodium } from './components/ArenaPodium';
import { ArenaFinalRankingList } from './components/ArenaFinalRankingList';
import { ArenaParticipantFinalResult } from './components/ArenaParticipantFinalResult';
import { ArenaRoundSummaryList } from './components/ArenaRoundSummaryList';
import { LogOut, RefreshCw } from 'lucide-react';

export interface ArenaFinalResultsProps {
  roomCode: string;
  reconnectToken: string | null;
  language: 'pt' | 'en';
  onReturnHome: () => void;
  localParticipantId?: string | null;
}

export const ArenaFinalResults: React.FC<ArenaFinalResultsProps> = ({
  roomCode,
  reconnectToken,
  language,
  onReturnHome,
  localParticipantId = null
}) => {
  const { isLoading, error, resultsData, refresh } = useArenaFinalResults({
    roomCode,
    reconnectToken,
    participantId: localParticipantId
  });

  const t = (pt: string, en: string) => (language === 'pt' ? pt : en);

  // Ensure scroll is at top and body/html scroll is enabled
  useEffect(() => {
    document.documentElement.classList.add('arena-results-active');
    document.body.classList.add('arena-results-active');

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior
    });

    return () => {
      document.documentElement.classList.remove('arena-results-active');
      document.body.classList.remove('arena-results-active');
    };
  }, []);

  // 1. Loading State
  if (isLoading && !resultsData) {
    return (
      <div className="arena-results-page" id="arena-results-loading">
        <div className="arena-results-container">
          <div className="arena-result-card w-full max-w-md mx-auto bg-white border-4 border-brand-charcoal rounded-card p-8 shadow-elevated text-center space-y-6 my-12">
            <div className="flex justify-center py-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-12 h-12 rounded-full border-4 border-brand-mochi/30 border-t-brand-mochi animate-spin"></div>
                <span className="text-xl">🏟️</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-black text-xl text-brand-charcoal uppercase">
                {t('A Calcular Resultados...', 'Calculating Results...')}
              </h3>
              <p className="text-xs font-semibold text-brand-burgundy/80">
                {t(
                  'A recolher classificações oficiais e registos de rondas do servidor...',
                  'Retrieving official rankings and round logs from the server...'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error && !resultsData) {
    return (
      <div className="arena-results-page" id="arena-results-error">
        <div className="arena-results-container">
          <div className="arena-result-card w-full max-w-md mx-auto bg-white border-4 border-brand-charcoal rounded-card p-6 shadow-elevated text-center space-y-6 my-12">
            <span className="text-4xl block">⚠️</span>
            <div className="space-y-2">
              <h3 className="font-display font-black text-lg text-brand-charcoal uppercase">
                {t('Falha ao Carregar Resultados', 'Failed to Load Results')}
              </h3>
              <p className="text-xs text-brand-tomato font-semibold">
                {error}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => refresh()}
                className="flex-1 py-3 bg-brand-mochi hover:bg-brand-sorbet text-brand-charcoal border-2 border-brand-charcoal rounded-button shadow-soft font-display font-black text-xs flex items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                <RefreshCw size={14} />
                {t('Tentar Novamente', 'Try Again')}
              </button>
              <button
                onClick={onReturnHome}
                className="flex-1 py-3 bg-brand-charcoal text-white border-2 border-brand-charcoal rounded-button hover:bg-brand-burgundy transition-all text-xs font-display font-black cursor-pointer"
              >
                {t('Voltar', 'Exit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Complete results screen rendered with robust responsive layout
  return (
    <div className="arena-results-page" id="arena-results-screen">
      <div className="arena-results-container">
        
        {/* Header Section */}
        <header className="arena-results-header arena-result-card bg-white border-4 border-brand-charcoal rounded-card shadow-soft">
          <div className="arena-results-header__identity flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-sorbet border-3 border-brand-charcoal rounded-full flex items-center justify-center text-2xl shrink-0 shadow-[2px_2px_0px_0px_#080D09]">
              🏁
            </div>
            <div className="arena-results-header__copy">
              <h2 className="arena-results-header__title font-display font-black text-2xl md:text-3xl leading-none uppercase">
                {t('Torneio Concluído', 'Tournament Finished')}
              </h2>
              <p className="text-xs font-semibold text-brand-burgundy mt-1">
                {t(
                  `Resultados oficiais confirmados pelo servidor. Código: ${roomCode}`,
                  `Official server-confirmed results. Code: ${roomCode}`
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onReturnHome}
            className="arena-results-header__exit py-3 px-6 bg-brand-charcoal hover:bg-brand-burgundy text-white font-display font-black text-xs rounded-button border-2 border-brand-charcoal flex items-center justify-center gap-2 shadow-soft active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
          >
            <LogOut size={14} />
            {t('Sair da Arena', 'Exit Arena')}
          </button>
        </header>

        {/* Dual-column / Responsive Results Layout */}
        {resultsData && (
          <div className="arena-results-layout">
            
            {/* Primary Column (Champion Card + Podium) */}
            <div className="arena-results-primary">
              <ArenaChampionCard champion={resultsData.champion} language={language} />
              <ArenaPodium podium={resultsData.podium} language={language} />
            </div>

            {/* Secondary Column (User Performance + Round Log + Final Ranking) */}
            <div className="arena-results-secondary">
              <ArenaParticipantFinalResult
                currentParticipant={resultsData.currentParticipant}
                totalParticipants={resultsData.participants.length}
                language={language}
              />
              <ArenaRoundSummaryList roundSummaries={resultsData.roundSummaries} language={language} />
              <ArenaFinalRankingList participants={resultsData.participants} language={language} />
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default ArenaFinalResults;
