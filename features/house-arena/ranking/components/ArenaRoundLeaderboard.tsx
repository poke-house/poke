import React from 'react';
import { Award, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useArenaRoundLeaderboard } from '../hooks/useArenaRoundLeaderboard';
import { ArenaLeaderboardRow } from './ArenaLeaderboardRow';

interface ArenaRoundLeaderboardProps {
  roomCode: string;
  reconnectToken: string;
  translations: any;
  pollIntervalMs?: number;
}

export const ArenaRoundLeaderboard: React.FC<ArenaRoundLeaderboardProps> = ({
  roomCode,
  reconnectToken,
  translations,
  pollIntervalMs = 4000
}) => {
  const { data: leaderboard, isLoading, error, refetch } = useArenaRoundLeaderboard(
    roomCode,
    reconnectToken,
    pollIntervalMs
  );

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header section */}
      <div className="flex items-center justify-between p-5 border-b border-gray-50 bg-slate-50/20">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">
              {translations.house_arena_live_ranking || 'Classificação Live'}
            </h3>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase mt-0.5">
              {translations.house_arena_round_rank || 'Posição no Round'}
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
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
        </button>
      </div>

      {/* Leaderboard content */}
      <div className="p-5 flex-1 overflow-y-auto space-y-3 min-h-[250px] max-h-[500px]">
        {isLoading && leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
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
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <Sparkles className="w-6 h-6 text-gray-300" />
            <span className="text-xs">
              {translations.house_arena_ranking_empty || 'Nenhuma classificação disponível.'}
            </span>
          </div>
        ) : (
          leaderboard.map((row) => (
            <ArenaLeaderboardRow
              key={row.rank}
              row={row}
              translations={translations}
              showScoreType="round"
            />
          ))
        )}
      </div>
    </div>
  );
};
