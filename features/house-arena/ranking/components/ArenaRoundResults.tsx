import React, { useEffect, useState } from 'react';
import { Award, Timer, ArrowRight, Loader2 } from 'lucide-react';
import { arenaRankingService } from '../services/arenaRanking.service';
import { ArenaRoundResults as RoundResultsType } from '../arenaRanking.types';
import { ArenaRoundLeaderboard } from './ArenaRoundLeaderboard';

interface ArenaRoundResultsProps {
  roomCode: string;
  reconnectToken: string;
  translations: any;
  onNextStep?: () => void;
}

export const ArenaRoundResults: React.FC<ArenaRoundResultsProps> = ({
  roomCode,
  reconnectToken,
  translations,
  onNextStep
}) => {
  const [results, setResults] = useState<RoundResultsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(15); // Auto transition countdown

  useEffect(() => {
    let active = true;
    const fetchResults = async () => {
      try {
        const data = await arenaRankingService.getRoundResults(roomCode, reconnectToken);
        if (active && data) {
          setResults(data);
        }
      } catch (err) {
        console.error('Error fetching round results:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchResults();
    return () => {
      active = false;
    };
  }, [roomCode, reconnectToken]);

  // Handle auto-triggering onNextStep when countdown hits 0
  useEffect(() => {
    if (isLoading || !results) return;
    if (countdown <= 0) {
      if (onNextStep) onNextStep();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isLoading, results, onNextStep]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-medium text-gray-500">
          {translations.house_arena_results_pending || 'A calcular resultados finais...'}
        </span>
      </div>
    );
  }

  const hasNext = results?.hasNextRound;
  const rank = results?.currentParticipantRoundRank || 1;
  const score = results?.currentParticipantRoundScore || 0;
  const total = results?.totalParticipantCount || 1;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner and Performance Summary */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 text-center relative overflow-hidden shadow-md">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
            <Award className="w-8 h-8 text-indigo-300" />
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {translations.house_arena_round_complete || 'Fim do Round!'}
          </h2>

          <p className="text-indigo-200 text-sm max-w-md mx-auto">
            {translations.house_arena_you_scored?.replace('{score}', score.toString()) || 
              `Preparaste ${score} bowl(s) com sucesso.`}
          </p>

          <div className="inline-flex flex-col items-center justify-center bg-white/5 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-sm mt-2">
            <span className="text-xs uppercase tracking-wider text-indigo-300 font-bold font-mono">
              {translations.house_arena_round_rank || 'Posição no Round'}
            </span>
            <span className="text-3xl font-extrabold text-white mt-1">
              #{rank} <span className="text-lg font-normal text-indigo-300">/ {total}</span>
            </span>
          </div>

          {/* Countdown & CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-indigo-200/85">
              <Timer className="w-4 h-4 text-indigo-400" />
              <span>
                {translations.house_arena_preparing_next_round || 'A preparar o próximo round...'} ({countdown}s)
              </span>
            </div>

            {onNextStep && (
              <button
                onClick={onNextStep}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>
                  {hasNext 
                    ? (translations.house_arena_next_challenge || 'Próximo Desafio') 
                    : (translations.btn_continue || 'Continuar')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Round Leaderboard Details */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800 text-base px-1">
          {translations.house_arena_round_results || 'Resultados do Round'}
        </h3>
        <ArenaRoundLeaderboard
          roomCode={roomCode}
          reconnectToken={reconnectToken}
          translations={translations}
          pollIntervalMs={0} // No polling needed inside results screen since snapshot is static
        />
      </div>
    </div>
  );
};
