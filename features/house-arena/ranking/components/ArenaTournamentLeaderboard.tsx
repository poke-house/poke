import React from 'react';
import { Trophy, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useArenaTournamentLeaderboard } from '../hooks/useArenaTournamentLeaderboard';
import { ArenaLeaderboardRow } from './ArenaLeaderboardRow';

interface ArenaTournamentLeaderboardProps {
  roomCode: string;
  reconnectToken: string;
  translations: any;
  pollIntervalMs?: number;
}

export const ArenaTournamentLeaderboard: React.FC<ArenaTournamentLeaderboardProps> = ({
  roomCode,
  reconnectToken,
  translations,
  pollIntervalMs = 5000
}) => {
  const { data: leaderboard, isLoading, error, refetch } = useArenaTournamentLeaderboard(
    roomCode,
    reconnectToken,
    pollIntervalMs
  );

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header section */}
      <div className="flex items-center justify-between p-5 border-b border-gray-50 bg-emerald-50/10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">
              {translations.house_arena_tournament_leaderboard || 'Classificação Geral da Arena'}
            </h3>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase mt-0.5">
              {translations.house_arena_tournament_rank || 'Classificação Geral'}
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100/80 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          title={translations.house_arena_ranking_retry || 'Tentar Novamente'}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
        </button>
      </div>

      {/* Leaderboard content */}
      <div className="p-5 flex-1 overflow-y-auto space-y-3 min-h-[250px] max-h-[500px]">
        {isLoading && leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs font-medium">
              {translations.house_arena_ranking_loading || 'A carregar classificação...'}
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-red-500 text-center px-4">
            <AlertCircle className="w-7 h-7" />
            <span className="text-xs font-semibold">
              {translations.house_arena_ranking_unavailable || 'Classificação temporariamente indisponível.'}
            </span>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all"
            >
              {translations.house_arena_ranking_retry || 'Tentar Novamente'}
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            {/* Podium Placeholder */}
            <div className="flex items-end justify-center gap-2.5 mb-5 w-full max-w-[240px] h-28">
              {/* 2nd place */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-400 mb-1.5 font-mono">
                  {translations?.language === 'en' || translations?.house_arena_ranking_retry === 'Try Again' ? '2nd' : '2º'}
                </div>
                <div className="w-full h-14 rounded-t-lg border-2 border-b-0 border-dashed border-gray-300 bg-gray-50/60 flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-gray-300">#2</span>
                </div>
              </div>

              {/* 1st place */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-amber-400/80 bg-amber-50/50 flex items-center justify-center text-xs font-bold text-amber-600 mb-1.5 font-mono">
                  {translations?.language === 'en' || translations?.house_arena_ranking_retry === 'Try Again' ? '1st' : '1º'}
                </div>
                <div className="w-full h-20 rounded-t-lg border-2 border-b-0 border-dashed border-amber-400/60 bg-amber-50/30 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-400/60" />
                </div>
              </div>

              {/* 3rd place */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-400 mb-1.5 font-mono">
                  {translations?.language === 'en' || translations?.house_arena_ranking_retry === 'Try Again' ? '3rd' : '3º'}
                </div>
                <div className="w-full h-10 rounded-t-lg border-2 border-b-0 border-dashed border-gray-300 bg-gray-50/60 flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-gray-300">#3</span>
                </div>
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-500 max-w-[260px] leading-relaxed">
              {translations?.language === 'en' || translations?.house_arena_ranking_retry === 'Try Again'
                ? 'The ranking is just starting — be the first to score!'
                : 'A classificação está a começar — sê o primeiro a marcar pontos!'}
            </p>
          </div>
        ) : (
          leaderboard.map((row) => (
            <ArenaLeaderboardRow
              key={row.rank}
              row={row}
              translations={translations}
              showScoreType="total"
            />
          ))
        )}
      </div>
    </div>
  );
};
