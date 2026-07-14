import React, { useEffect, useState } from 'react';
import { useQuickThinkGameplay } from './hooks/useQuickThinkGameplay';
import { ArenaRoom, ArenaParticipant } from '../../houseArena.types';
import { TRANSLATIONS } from '../../../../translations';
import {
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Award,
  Trophy,
  Users,
  X,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useArenaRoundLeaderboard } from '../../ranking/hooks/useArenaRoundLeaderboard';
import { ArenaRoundLeaderboard } from '../../ranking/components/ArenaRoundLeaderboard';
import { ArenaTournamentLeaderboard } from '../../ranking/components/ArenaTournamentLeaderboard';

// Sub-components
import { QuickThinkGameHeader } from './components/QuickThinkGameHeader';
import { QuickThinkQuestionCard } from './components/QuickThinkQuestionCard';
import { QuickThinkAnswerOptions } from './components/QuickThinkAnswerOptions';
import { QuickThinkFeedback } from './components/QuickThinkFeedback';
import { QuickThinkProgress } from './components/QuickThinkProgress';
import { QuickThinkLateJoinNotice } from './components/QuickThinkLateJoinNotice';

interface QuickThinkArenaGameProps {
  room: ArenaRoom;
  reconnectToken: string;
  language: 'pt' | 'en';
  participants: ArenaParticipant[];
  localPlayer: ArenaParticipant | null;
}

export const QuickThinkArenaGame: React.FC<QuickThinkArenaGameProps> = ({
  room,
  reconnectToken,
  language,
  participants,
  localPlayer
}) => {
  const t = (key: string) => {
    const dict = TRANSLATIONS[language] as Record<string, string>;
    return dict[key] || key;
  };

  const {
    currentQuestion,
    loading,
    isTransitioning,
    submitting,
    selectedOptionId,
    submissionResult,
    questionTimeLeft,
    roundTimeLeft,
    submitAnswer
  } = useQuickThinkGameplay({
    room,
    reconnectToken
  });

  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [activeStandingsTab, setActiveStandingsTab] = useState<'round' | 'tournament'>('round');

  // Fetch real-time tournament standings securely from database
  const { data: liveLeaderboard } = useArenaRoundLeaderboard(
    room.roomCode,
    reconnectToken,
    4000 // Poll every 4 seconds for live score updates
  );

  // Trigger celebration on correct answer submission
  useEffect(() => {
    if (submissionResult?.isAccepted && submissionResult.isCorrect) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }, [submissionResult]);

  if (loading) {
    return (
      <div className="bg-brand-linen min-h-screen w-full flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-tomato mx-auto"></div>
          <p className="text-brand-charcoal font-semibold">
            {language === 'pt' ? 'A carregar estação de trabalho...' : 'Loading workstation...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-linen min-h-screen w-full flex flex-col justify-start font-sans">
      
      {/* 1. HUD / Navigation Header */}
      <div className="bg-white border-b-4 border-brand-charcoal py-4 px-4 md:px-8 sticky top-0 z-40 shadow-soft">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Room Title */}
          <div className="flex items-center gap-3">
            <div className="bg-brand-charcoal text-white font-display font-black text-xs px-2.5 py-1.5 rounded uppercase tracking-wider">
              {language === 'pt' ? 'Pensa Rápido' : 'Fast Thinker'}
            </div>
            <div>
              <h1 className="font-display font-black text-lg md:text-xl text-brand-charcoal leading-none">
                {room.roomCode}
              </h1>
              <p className="text-xs text-text-muted font-medium mt-1">
                {language === 'pt' ? 'Responde rápido às questões de serviço e receitas' : 'Answer rapid fire questions on SOP & recipes'}
              </p>
            </div>
          </div>

          {/* HUD Stats */}
          <div className="flex items-center gap-6 self-end md:self-auto">
            {/* Live round score */}
            <div className="text-right">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
                {language === 'pt' ? 'Pontos na Ronda' : 'Round Score'}
              </span>
              <span className="font-mono text-2xl font-black text-brand-green leading-none">
                {currentQuestion?.roundScore ?? 0}
              </span>
            </div>

            {/* Total score */}
            <div className="text-right border-l-2 border-brand-charcoal/10 pl-6">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
                {language === 'pt' ? 'Pontos Totais' : 'Total Score'}
              </span>
              <span className="font-mono text-2xl font-black text-brand-charcoal leading-none">
                {currentQuestion?.totalScore ?? localPlayer?.totalScore ?? 0}
              </span>
            </div>

            {/* Overall Round Clock */}
            <div className="text-right border-l-2 border-brand-charcoal/10 pl-6">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
                {language === 'pt' ? 'Tempo Ronda' : 'Round Time'}
              </span>
              <span className={`font-mono text-2xl font-black leading-none tabular-nums ${roundTimeLeft < 45 ? 'text-brand-tomato animate-pulse' : 'text-brand-charcoal'}`}>
                {Math.floor(roundTimeLeft / 60)}:{(roundTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Late Joiner Notice Banner */}
      {localPlayer?.isLateJoiner && (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-4">
          <QuickThinkLateJoinNotice language={language} />
        </div>
      )}

      {/* 2. Main Game Layout */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        
        {/* Left Column: Live standings sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border-4 border-brand-charcoal rounded-card p-5 shadow-elevated space-y-4">
            <div className="flex items-center justify-between border-b-2 border-brand-charcoal/5 pb-2">
              <h3 className="font-display font-black text-xs text-brand-charcoal uppercase tracking-widest flex items-center gap-1.5">
                <Award size={14} className="text-brand-tomato" />
                {t('house_arena_live_ranking')}
              </h3>
              <button
                onClick={() => setShowStandingsModal(true)}
                className="text-[10px] font-bold text-brand-tomato hover:underline focus:outline-none cursor-pointer"
              >
                {t('house_arena_view_ranking')}
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {liveLeaderboard && liveLeaderboard.length > 0 ? (
                liveLeaderboard.map((row) => {
                  const isMe = row.isCurrentParticipant;
                  return (
                    <div 
                      key={row.rank}
                      className={`flex items-center justify-between text-xs p-2.5 rounded border-2 transition-all ${
                        isMe 
                          ? 'border-brand-tomato bg-brand-tomato/5 font-bold ring-1 ring-brand-tomato/20' 
                          : 'border-transparent bg-brand-linen/10 hover:bg-brand-linen/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] text-gray-400 font-bold">#{row.rank}</span>
                        <div className="truncate flex flex-col">
                          <span className="text-brand-charcoal truncate font-semibold">{row.displayName}</span>
                          <span className="text-[9px] text-gray-400 font-mono leading-none truncate">{row.storeName}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-brand-tomato">
                        {row.score} pts
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs">
                  {t('house_arena_ranking_loading')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right Column: Active Question Canvas */}
        <div className="lg:col-span-3 space-y-6 flex flex-col justify-start">
          
          {isTransitioning ? (
            /* Anticipation Transition state */
            <div className="bg-white border-4 border-brand-charcoal rounded-card p-12 text-center space-y-4 shadow-elevated flex flex-col items-center justify-center min-h-[350px]">
              <div className="relative flex justify-center py-2">
                <div className="w-12 h-12 rounded-full border-4 border-brand-tomato/20 border-t-brand-tomato animate-spin"></div>
              </div>
              <h4 className="font-display font-black text-xl text-brand-charcoal">
                {language === 'pt' ? 'Sincronizando com o servidor...' : 'Synchronizing with server...'}
              </h4>
              <p className="text-xs text-brand-burgundy font-semibold max-w-sm">
                {language === 'pt' 
                  ? 'A preparar a próxima questão oficial do catálogo.' 
                  : 'Preparing the next official question from the catalogue.'}
              </p>
            </div>
          ) : currentQuestion && currentQuestion.questionPt ? (
            /* Active Question State */
            <>
              {/* Question Header & Timing */}
              <QuickThinkGameHeader
                roundNumber={room.currentRoundNumber}
                questionOrder={currentQuestion.questionOrder}
                totalQuestions={15}
                roundScore={currentQuestion.roundScore}
                roundTimeLeft={roundTimeLeft}
                language={language}
              />

              {/* Progress Bar */}
              <QuickThinkProgress
                timeLeft={questionTimeLeft}
                totalTime={20}
                language={language}
              />

              {/* Question text card */}
              <QuickThinkQuestionCard
                questionPt={currentQuestion.questionPt}
                questionEn={currentQuestion.questionEn}
                category={currentQuestion.category}
                difficulty={currentQuestion.difficulty}
                language={language}
              />

              {/* Interactive answers selection grid */}
              {currentQuestion.options && (
                <QuickThinkAnswerOptions
                  options={currentQuestion.options}
                  selectedOptionId={selectedOptionId}
                  correctOptionId={currentQuestion.correctOptionId}
                  isAnswered={currentQuestion.isAnswered}
                  submitting={submitting}
                  language={language}
                  onSelectOption={submitAnswer}
                />
              )}

              {/* Explanatory training feedback once answered or time up */}
              <QuickThinkFeedback
                isAnswered={currentQuestion.isAnswered}
                selectedOptionId={selectedOptionId}
                correctOptionId={currentQuestion.correctOptionId}
                explanationPt={currentQuestion.explanationPt}
                explanationEn={currentQuestion.explanationEn}
                timeLeft={questionTimeLeft}
                language={language}
              />
            </>
          ) : (
            /* Sync Interval Gaps / Prep state */
            <div className="bg-white border-4 border-brand-charcoal rounded-card p-12 text-center space-y-4 shadow-elevated flex flex-col items-center justify-center min-h-[350px]">
              <div className="relative flex justify-center py-2">
                <div className="w-12 h-12 rounded-full border-4 border-brand-tomato/20 border-t-brand-tomato animate-spin"></div>
              </div>
              <h4 className="font-display font-black text-xl text-brand-charcoal">
                {language === 'pt' ? 'O desafio está prestes a começar...' : 'The challenge is about to begin...'}
              </h4>
              <p className="text-xs text-brand-burgundy font-semibold">
                {language === 'pt'
                  ? 'Entrando na sequência de perguntas e respostas.'
                  : 'Entering the question-and-answer sequence.'}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* 3. Standings Modal */}
      {showStandingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-4 border-brand-charcoal rounded-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-elevated overflow-hidden">
            {/* Modal Header */}
            <div className="bg-brand-linen border-b-4 border-brand-charcoal p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-tomato" />
                <h3 className="font-display font-black text-base text-brand-charcoal">
                  {t('house_arena_live_ranking')}
                </h3>
              </div>
              <button
                onClick={() => setShowStandingsModal(false)}
                className="p-1 text-brand-charcoal hover:bg-brand-charcoal/5 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b-2 border-brand-charcoal/10 bg-gray-50/50 p-2 gap-2">
              <button
                onClick={() => setActiveStandingsTab('round')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeStandingsTab === 'round'
                    ? 'border-brand-charcoal bg-brand-charcoal text-white'
                    : 'border-transparent text-gray-500 hover:text-brand-charcoal hover:bg-brand-linen/45'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>{t('house_arena_round_rank')}</span>
              </button>
              <button
                onClick={() => setActiveStandingsTab('tournament')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeStandingsTab === 'tournament'
                    ? 'border-brand-charcoal bg-brand-charcoal text-white'
                    : 'border-transparent text-gray-500 hover:text-brand-charcoal hover:bg-brand-linen/45'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>{t('house_arena_tournament_leaderboard')}</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1 max-h-[60vh] bg-brand-linen/10">
              {activeStandingsTab === 'round' ? (
                <ArenaRoundLeaderboard
                  roomCode={room.roomCode}
                  reconnectToken={reconnectToken}
                  translations={TRANSLATIONS[language]}
                  pollIntervalMs={0}
                />
              ) : (
                <ArenaTournamentLeaderboard
                  roomCode={room.roomCode}
                  reconnectToken={reconnectToken}
                  translations={TRANSLATIONS[language]}
                  pollIntervalMs={0}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-brand-linen border-t-2 border-brand-charcoal/10 p-4 flex justify-end">
              <button
                onClick={() => setShowStandingsModal(false)}
                className="py-2 px-5 rounded-button border-2 border-brand-charcoal bg-white text-brand-charcoal hover:bg-brand-linen font-display font-black text-xs uppercase transition-all cursor-pointer"
              >
                {t('btn_back')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default QuickThinkArenaGame;
