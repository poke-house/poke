import React from 'react';
import { Award, Trophy, Users } from 'lucide-react';
import { ArenaParticipantRankSummary } from '../arenaRanking.types';

interface ArenaParticipantRankCardProps {
  summary: ArenaParticipantRankSummary | null;
  translations: any;
  isLoading?: boolean;
}

export const ArenaParticipantRankCard: React.FC<ArenaParticipantRankCardProps> = ({
  summary,
  translations,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm animate-pulse flex flex-col gap-4">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-4 h-4 text-gray-400" />
          {translations.house_arena_current_rank || 'A tua posição'}
        </span>
        {summary.isLateJoiner && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full uppercase tracking-wider animate-pulse">
            {translations.house_arena_late_join || 'Entrada Tardia'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Round Rank Column */}
        <div className="bg-slate-50/50 hover:bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 transition-colors">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
            <Award className="w-4 h-4 text-slate-400" />
            {translations.house_arena_round_rank || 'Posição no Round'}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-2xl font-bold text-slate-800">
              #{summary.roundRank}
            </span>
            <span className="text-xs text-gray-400">
              / {summary.totalParticipantCount}
            </span>
          </div>
          <div className="text-xs text-gray-400 font-mono mt-1">
            {summary.roundScore} {translations.score_label || 'Pontos'}
          </div>
        </div>

        {/* Tournament Rank Column */}
        <div className="bg-emerald-50/20 hover:bg-emerald-50/45 p-3.5 rounded-xl border border-emerald-100/50 transition-colors">
          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium mb-1">
            <Trophy className="w-4 h-4 text-emerald-500" />
            {translations.house_arena_tournament_rank || 'Classificação Geral'}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-2xl font-bold text-emerald-800">
              #{summary.tournamentRank}
            </span>
            <span className="text-xs text-emerald-600/60">
              / {summary.totalParticipantCount}
            </span>
          </div>
          <div className="text-xs text-emerald-600/70 font-mono mt-1">
            {summary.tournamentScore} {translations.score_label || 'Pontos'}
          </div>
        </div>
      </div>
    </div>
  );
};
