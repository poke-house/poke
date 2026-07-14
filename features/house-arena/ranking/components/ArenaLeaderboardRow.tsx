import React from 'react';
import { Medal, User, Clock } from 'lucide-react';
import { ArenaRankingRow } from '../arenaRanking.types';
import { ArenaAvatarBadge } from '../../components/ArenaAvatarBadge';

interface ArenaLeaderboardRowProps {
  row: ArenaRankingRow;
  translations: any;
  showScoreType?: 'round' | 'total';
}

export const ArenaLeaderboardRow: React.FC<ArenaLeaderboardRowProps> = ({
  row,
  translations,
  showScoreType = 'round'
}) => {
  const isTopThree = row.rank <= 3;
  
  // Custom colors for medal/rank positions
  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 2:
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 3:
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-400 fill-slate-400/20" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-400 fill-orange-400/20" />;
      default:
        return <span className="font-mono text-sm font-semibold">{rank}</span>;
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
        row.isCurrentParticipant
          ? 'bg-emerald-50/75 border-emerald-300 shadow-sm ring-1 ring-emerald-300'
          : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
      } ${!row.isActive ? 'opacity-60 grayscale' : ''}`}
    >
      {/* Left section: Rank + Avatar + Name */}
      <div className="flex items-center gap-4">
        {/* Rank indicator */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${getRankBadgeClass(row.rank)}`}>
          {getRankIcon(row.rank)}
        </div>

        {/* Avatar badge */}
        <ArenaAvatarBadge
          assetKey={row.avatarAssetKey}
          displayName={row.displayName}
          size="sm"
          isCurrentParticipant={row.isCurrentParticipant}
          isActive={row.isActive}
        />

        {/* Participant Name & Store info */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold ${row.isCurrentParticipant ? 'text-emerald-900' : 'text-gray-800'}`}>
              {row.displayName}
            </span>
            {row.isCurrentParticipant && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full uppercase tracking-wider">
                {translations.house_arena_current_participant || 'Tu'}
              </span>
            )}
            {row.isLateJoiner && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                <Clock className="w-3 h-3 text-indigo-500" />
                {translations.house_arena_joined_round_in_progress || 'Entrada Tardia'}
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-gray-500 block mt-0.5">
            Loja: {row.storeName}
          </span>
        </div>
      </div>

      {/* Right section: Score */}
      <div className="text-right">
        <span className={`font-mono text-lg font-bold block ${row.isCurrentParticipant ? 'text-emerald-700' : 'text-gray-900'}`}>
          {row.score}
        </span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
          {showScoreType === 'round'
            ? (translations.house_arena_round_score || 'Pontos do Round')
            : (translations.house_arena_total_score || 'Pontos Totais')}
        </span>
      </div>
    </div>
  );
};
