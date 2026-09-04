import React, { useEffect, useState } from 'react';
import { Trophy, Home, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { arenaRankingService } from '../services/arenaRanking.service';
import { ArenaTournamentResults as TournamentResultsType } from '../arenaRanking.types';
import { ArenaTournamentLeaderboard } from './ArenaTournamentLeaderboard';

interface ArenaTournamentResultsProps {
  roomCode: string;
  reconnectToken: string;
  translations: any;
  onReturnHome: () => void;
}

export const ArenaTournamentResults: React.FC<ArenaTournamentResultsProps> = ({
  roomCode,
  reconnectToken,
  translations,
  onReturnHome
}) => {
  const [results, setResults] = useState<TournamentResultsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchResults = async () => {
      try {
        const data = await arenaRankingService.getTournamentResults(roomCode, reconnectToken);
        if (active && data) {
          setResults(data);
          
          // Celebrate with confetti!
          const rank = data.currentParticipantRank || 1;
          if (rank <= 3) {
            // Big burst
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 }
            });
            // Multi-burst after brief intervals
            setTimeout(() => {
              confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
            }, 250);
            setTimeout(() => {
              confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
            }, 400);
          } else {
            // Small polite sprinkle
            confetti({
              particleCount: 40,
              spread: 45,
              origin: { y: 0.7 }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching tournament results:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchResults();
    return () => {
      active = false;
    };
  }, [roomCode, reconnectToken]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <span className="text-sm font-medium text-gray-500">
          {translations.house_arena_results_pending || 'A calcular resultados finais...'}
        </span>
      </div>
    );
  }

  const finalRank = results?.currentParticipantRank || 1;
  const finalScore = results?.currentParticipantTotalScore || 0;
  const totalCount = results?.totalParticipantCount || 1;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Champion & Ceremony Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 text-center relative overflow-hidden shadow-md">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
            <Trophy className="w-8 h-8 text-emerald-300" />
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {translations.house_arena_champion || 'Campeão da Arena'}
          </h2>

          <p className="text-emerald-100 text-sm max-w-md mx-auto">
            {translations.house_arena_you_finished
              ?.replace('{rank}', finalRank.toString())
              ?.replace('{total}', totalCount.toString()) || 
              `Ficaste em ${finalRank}º lugar de ${totalCount}.`}
          </p>

          <div className="inline-flex flex-col items-center justify-center bg-white/5 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-sm mt-2">
            <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold font-mono">
              {translations.house_arena_total_score || 'Pontos Totais'}
            </span>
            <span className="text-3xl font-extrabold text-white mt-1">
              {finalScore} <span className="text-lg font-normal text-emerald-300">{translations.score_label || 'Pontos'}</span>
            </span>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-center">
            <button
              onClick={onReturnHome}
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4 text-emerald-800" />
              <span>{translations.btn_menu_main || 'Menu Principal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Final Standings Leaderboard */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800 text-base px-1">
          {translations.house_arena_tournament_results || 'Resultados Finais da Arena'}
        </h3>
        <ArenaTournamentLeaderboard
          roomCode={roomCode}
          reconnectToken={reconnectToken}
          translations={translations}
          pollIntervalMs={0} // Snapshots on the results page are frozen
        />
      </div>
    </div>
  );
};
