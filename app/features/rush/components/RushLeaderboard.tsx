import React from 'react';
import { RushScore, SupabaseAvailability } from '../../../types';
import { TranslationKey } from '../../../translations';
import { IconRotate, IconTrophy, IconClock } from '../../../components/Icons';

interface RushLeaderboardProps {
  leaderboardLoading: boolean;
  supabaseStatus: SupabaseAvailability;
  topScores: RushScore[];
  lastScores: RushScore[];
  fetchLeaderboard: () => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const RushLeaderboard: React.FC<RushLeaderboardProps> = ({
  leaderboardLoading,
  supabaseStatus,
  topScores,
  lastScores,
  fetchLeaderboard,
  t,
}) => {
  return (
    <div 
      className="md:w-1/2 bg-brand-linen p-6 md:p-8 border-b md:border-b-0 md:border-r-4 border-brand-charcoal overflow-y-auto max-h-[350px] md:max-h-none scroll-rush custom-scroll" 
      id="rush-leaderboard"
      aria-label={t('rush_leaderboard_title')}
    >
      {leaderboardLoading ? (
        <div className="h-full min-h-[250px] flex flex-col items-center justify-center p-8 text-center space-y-4" id="leaderboard-loading-view">
          <div className="w-10 h-10 border-4 border-brand-tomato border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
          <p className="text-sm font-body font-bold text-brand-charcoal uppercase tracking-wider animate-pulse">
            {t('rush_ranking_loading') || t('leaderboard_loading')}
          </p>
        </div>
      ) : supabaseStatus === "unconfigured" ? (
        <div className="h-full min-h-[250px] flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white rounded-card border-4 border-brand-charcoal shadow-soft" id="leaderboard-unconfigured-view">
          <div className="w-14 h-14 bg-brand-sorbet rounded-full flex items-center justify-center border-2 border-brand-charcoal text-2xl" aria-hidden="true">
            ⚙️
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-black text-sm text-brand-charcoal uppercase">
              {t('leaderboard_unconfigured')}
            </h4>
            <p className="text-xs font-body text-text-muted">
              {t('rush_ranking_unavailable')}
            </p>
          </div>
        </div>
      ) : supabaseStatus === "unavailable" ? (
        <div className="h-full min-h-[250px] flex flex-col items-center justify-center p-8 text-center space-y-4 bg-brand-sorbet/20 rounded-card border-4 border-brand-charcoal shadow-soft" id="leaderboard-unavailable-view">
          <div className="w-14 h-14 bg-status-error/10 text-status-error rounded-full flex items-center justify-center border-2 border-brand-charcoal text-2xl" aria-hidden="true">
            ⚠️
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-black text-sm text-brand-charcoal uppercase">
              {t('leaderboard_unavailable')}
            </h4>
            <p className="text-xs font-body text-brand-charcoal/70">
              Falha de ligação ao servidor de classificações.
            </p>
          </div>
          <button 
            onClick={fetchLeaderboard}
            aria-label={t('rush_ranking_retry')}
            className="bg-brand-tomato text-white border-2 border-brand-charcoal px-4 py-2 rounded-button font-display font-black text-xs hover:bg-brand-tomato/90 transition-all shadow-soft active:translate-y-0.5 flex items-center gap-2 mx-auto"
            id="retry-leaderboard-btn"
          >
            <IconRotate size={14} className="animate-spin-hover" /> {t('rush_ranking_retry') || t('btn_try_again')}
          </button>
        </div>
      ) : (
        <div className="space-y-8" id="leaderboard-data-view">
          {/* Header */}
          <div className="border-b-4 border-brand-charcoal pb-4">
            <h2 className="text-2xl font-display font-black text-brand-charcoal uppercase tracking-tight flex items-center gap-2">
              <IconTrophy className="text-brand-tomato" size={24} />
              {t('rush_leaderboard_title')}
            </h2>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs font-condensed font-black text-brand-tomato uppercase tracking-widest bg-brand-tomato/10 px-2 py-0.5 rounded-full">
                {t('rush_last_30_days')}
              </span>
              <span className="text-[10px] font-body font-bold text-text-muted">
                Reseta mensalmente
              </span>
            </div>
          </div>

          {/* Top Players - Beautiful Podium */}
          <div>
            <h3 className="font-display font-black text-xs text-brand-charcoal uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>🏆</span> {t('rush_top_players')}
            </h3>

            {topScores.length > 0 ? (
              <div className="space-y-4">
                {/* 3-Column Podium Container on medium+, stacked elegant podium cards on mobile */}
                <div className="grid grid-cols-3 gap-3 pt-6 pb-2 items-end">
                  {/* 2nd Place */}
                  <div className="order-1 flex flex-col items-center">
                    {topScores[1] ? (
                      <div className="w-full text-center space-y-2">
                        <div className="relative mx-auto w-12 h-12 rounded-full border-2 border-brand-charcoal bg-white flex items-center justify-center font-display font-bold text-lg shadow-soft">
                          🥈
                        </div>
                        <div className="bg-white border-2 border-brand-charcoal rounded-win p-2 text-center min-h-[70px] flex flex-col justify-center shadow-soft">
                          <p className="text-[10px] md:text-xs font-display font-black text-brand-charcoal truncate" title={topScores[1].player_name}>
                            {topScores[1].player_name}
                          </p>
                          <p className="text-[8px] font-body text-text-muted truncate uppercase tracking-wider">
                            {topScores[1].store_name}
                          </p>
                          <p className="text-xs md:text-sm font-condensed font-black text-brand-tomato mt-1">
                            {topScores[1].score} pts
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-[100px] border-2 border-dashed border-brand-charcoal/30 rounded-win flex items-center justify-center text-xs text-brand-charcoal/30">
                        -
                      </div>
                    )}
                  </div>

                  {/* 1st Place (Center and Highest) */}
                  <div className="order-2 flex flex-col items-center">
                    <div className="w-full text-center space-y-2 relative -translate-y-2">
                      {/* Floating Crown Accent */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce" style={{ animationDuration: '3s' }} aria-hidden="true">
                        👑
                      </div>
                      <div className="relative mx-auto w-16 h-16 rounded-full border-4 border-brand-charcoal bg-brand-butter flex items-center justify-center font-display font-bold text-2xl shadow-soft">
                        🥇
                      </div>
                      <div className="bg-brand-butter border-4 border-brand-charcoal rounded-card p-2 text-center min-h-[85px] flex flex-col justify-center shadow-elevated">
                        <p className="text-xs md:text-sm font-display font-black text-brand-charcoal truncate" title={topScores[0].player_name}>
                          {topScores[0].player_name}
                        </p>
                        <p className="text-[9px] font-body text-text-muted truncate uppercase tracking-widest">
                          {topScores[0].store_name}
                        </p>
                        <p className="text-sm md:text-base font-condensed font-black text-brand-tomato mt-1">
                          {topScores[0].score} pts
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="order-3 flex flex-col items-center">
                    {topScores[2] ? (
                      <div className="w-full text-center space-y-2">
                        <div className="relative mx-auto w-12 h-12 rounded-full border-2 border-brand-charcoal bg-brand-sorbet flex items-center justify-center font-display font-bold text-lg shadow-soft">
                          🥉
                        </div>
                        <div className="bg-brand-sorbet border-2 border-brand-charcoal rounded-win p-2 text-center min-h-[70px] flex flex-col justify-center shadow-soft">
                          <p className="text-[10px] md:text-xs font-display font-black text-brand-charcoal truncate" title={topScores[2].player_name}>
                            {topScores[2].player_name}
                          </p>
                          <p className="text-[8px] font-body text-text-muted truncate uppercase tracking-wider">
                            {topScores[2].store_name}
                          </p>
                          <p className="text-xs md:text-sm font-condensed font-black text-brand-tomato mt-1">
                            {topScores[2].score} pts
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-[100px] border-2 border-dashed border-brand-charcoal/30 rounded-win flex items-center justify-center text-xs text-brand-charcoal/30">
                        -
                      </div>
                    )}
                  </div>
                </div>

                {/* Rest of the Top Scores (4th to 10th) */}
                {topScores.length > 3 && (
                  <div className="space-y-2 mt-4" role="list">
                    {topScores.slice(3, 10).map((score, idx) => {
                      const position = idx + 4;
                      return (
                        <div 
                          key={idx} 
                          role="listitem"
                          className="flex items-center justify-between p-3 bg-white rounded-win border-2 border-brand-charcoal shadow-soft hover:translate-x-0.5 transition-transform"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-display font-black text-brand-charcoal text-sm w-6 text-center">
                              {position}.
                            </span>
                            <div className="flex flex-col">
                              <span className="text-xs font-display font-black text-brand-charcoal truncate max-w-[120px] md:max-w-[150px]">
                                {score.player_name}
                              </span>
                              <span className="text-[9px] font-body text-text-muted uppercase tracking-wider">
                                {score.store_name}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-condensed font-black text-brand-tomato">
                            {score.score} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-brand-charcoal/30 rounded-card p-6 text-center text-xs font-body text-text-muted">
                {t('rush_no_scores') || t('leaderboard_empty')}
              </div>
            )}
          </div>

          {/* Recent Players Section */}
          <div>
            <h3 className="font-display font-black text-xs text-brand-charcoal uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <IconClock className="text-brand-mochi" size={16} />
              {t('rush_recent_scores')}
            </h3>

            {lastScores.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2" role="list">
                {lastScores.slice(0, 5).map((score, idx) => (
                  <div 
                    key={idx} 
                    role="listitem"
                    className="flex items-center justify-between p-2.5 bg-white/60 rounded-win border-2 border-brand-charcoal shadow-soft"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-body font-bold text-brand-charcoal truncate max-w-[130px]">
                        {score.player_name}
                      </span>
                      <span className="text-[8px] font-body text-text-muted uppercase tracking-wider">
                        {score.store_name}
                      </span>
                    </div>
                    <span className="text-xs font-condensed font-black text-brand-charcoal/60 bg-brand-linen/80 px-2 py-0.5 rounded-full border border-brand-charcoal">
                      {score.score} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/40 border-2 border-dashed border-brand-charcoal/20 rounded-win p-4 text-center text-xs font-body text-text-muted">
                Ninguém jogou recentemente.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
