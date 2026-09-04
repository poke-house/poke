import React from 'react';
import { useArenaFinalResults } from './hooks/useArenaFinalResults';
import { ArenaChampionCard } from './components/ArenaChampionCard';
import { ArenaPodium } from './components/ArenaPodium';
import { ArenaFinalRankingList } from './components/ArenaFinalRankingList';
import { ArenaParticipantFinalResult } from './components/ArenaParticipantFinalResult';
import { ArenaRoundSummaryList } from './components/ArenaRoundSummaryList';
import { LogOut, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface ArenaFinalResultsProps {
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

  // 1. Loading State
  if (isLoading && !resultsData) {
    return (
      <div className="w-full max-w-md mx-auto bg-white border-4 border-brand-charcoal rounded-card p-8 shadow-elevated text-center space-y-6 my-12">
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
    );
  }

  // 2. Error State
  if (error && !resultsData) {
    return (
      <div className="w-full max-w-md mx-auto bg-white border-4 border-brand-charcoal rounded-card p-6 shadow-elevated text-center space-y-6 my-12">
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
            className="flex-1 py-3 bg-brand-mochi hover:bg-brand-sorbet text-brand-charcoal border-2 border-brand-charcoal rounded-button shadow-soft font-display font-black text-xs flex items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <RefreshCw size={14} />
            {t('Tentar Novamente', 'Try Again')}
          </button>
          <button
            onClick={onReturnHome}
            className="flex-1 py-3 bg-brand-charcoal text-white border-2 border-brand-charcoal rounded-button hover:bg-brand-burgundy transition-all text-xs font-display font-black"
          >
            {t('Voltar', 'Exit')}
          </button>
        </div>
      </div>
    );
  }

  // 3. Complete results data rendered in a dual-column layout
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-10 animate-fade-in flex flex-col gap-6 md:gap-8 font-sans">
      
      {/* Header bar */}
      <div className="bg-white border-4 border-brand-charcoal rounded-card p-5 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 bg-brand-sorbet border-3 border-brand-charcoal rounded-full flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#080D09]">
            🏁
          </div>
          <div>
            {/* Final Title in Gothic Expanded */}
            <h2 className="font-display font-black text-2xl leading-none uppercase">
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

        {/* Home Button */}
        <button
          onClick={onReturnHome}
          className="w-full md:w-auto py-3 px-6 bg-brand-charcoal hover:bg-brand-burgundy text-white font-display font-black text-xs rounded-button border-2 border-brand-charcoal flex items-center justify-center gap-2 shadow-soft active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
        >
          <LogOut size={14} />
          {t('Sair da Arena', 'Exit Arena')}
        </button>
      </div>

      {resultsData && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Span 5 on Desktop): Champion Highlight & Podium */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <ArenaChampionCard champion={resultsData.champion} language={language} />
            <ArenaPodium podium={resultsData.podium} language={language} />
          </div>

          {/* Right Column (Span 7 on Desktop): Leaderboard & Personal Performance Logs */}
          <div className="md:col-span-7 flex flex-col gap-6">
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
  );
};
export default ArenaFinalResults;
