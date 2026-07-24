import React from 'react';
import { useHouseArenaRoom } from './hooks/useHouseArenaRoom';
import { useHouseArenaPresence } from './hooks/useHouseArenaPresence';
import { useHouseArenaTournament } from './hooks/useHouseArenaTournament';
import { ArenaHome } from './components/ArenaHome';
import { ArenaLobby } from './components/ArenaLobby';
import { AppLogo } from '../../components/AppLogo';
import { ShieldAlert, LogOut } from 'lucide-react';
import { ArenaRoom, ArenaParticipant } from './houseArena.types';
import { SlopClockArenaGame } from './games/slop-clock/SlopClockArenaGame';
import { QuickThinkArenaGame } from './games/quick-think/QuickThinkArenaGame';
import { MemoryMatchArenaGame } from './games/memory-match/MemoryMatchArenaGame';
import { ArenaRoundResults } from './ranking/components/ArenaRoundResults';
import { ArenaFinalResults } from './results/ArenaFinalResults';
import { TRANSLATIONS } from '../../translations';

// ==========================================
// Sub-state screen: Starting (Anticipation)
// ==========================================
const StartingScreen: React.FC<{ language: 'pt' | 'en' }> = ({ language }) => {
  return (
    <div className="bg-brand-linen min-h-screen w-full flex items-center justify-center font-sans px-4">
      <div className="bg-white border-4 border-brand-charcoal rounded-card p-8 shadow-elevated max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <AppLogo variant="desktop" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display font-black text-2xl text-brand-charcoal">
            {language === 'pt' ? 'House Arena a Começar!' : 'House Arena Starting!'}
          </h3>
          <p className="text-sm font-semibold text-brand-burgundy">
            {language === 'pt' 
              ? 'Prepara a tua estação de trabalho. O torneio está prestes a começar...' 
              : 'Prepare your workstation. The tournament is about to start...'}
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-16 h-16 rounded-full border-4 border-brand-green/30 animate-ping"></div>
            <div className="relative w-12 h-12 rounded-full bg-brand-green flex items-center justify-center border-2 border-brand-charcoal text-white font-display font-black">
              PH
            </div>
          </div>
          <span className="text-xs font-mono text-gray-500 mt-6 tracking-wider animate-pulse uppercase">
            {language === 'pt' ? 'A iniciar torneio...' : 'Starting tournament...'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Sub-state screen: Active Round Game Room
// ==========================================
const ActiveRoundScreen: React.FC<{
  room: ArenaRoom;
  participants: ArenaParticipant[];
  language: 'pt' | 'en';
}> = ({ room, participants, language }) => {
  const serverSeconds = room.remainingRoundSeconds ?? 0;
  const [localSecs, setLocalSecs] = React.useState(serverSeconds);

  React.useEffect(() => {
    setLocalSecs(serverSeconds);
  }, [serverSeconds]);

  React.useEffect(() => {
    if (localSecs <= 0) return;
    const t = setInterval(() => {
      setLocalSecs(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [localSecs]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const gameName = room.currentGameType === 'slop_clock'
    ? (language === 'pt' ? 'Hora do Lodo' : 'Rush Hour')
    : (language === 'pt' ? 'Pensa Rápido' : 'Fast Thinker');

  const gameDesc = room.currentGameType === 'slop_clock'
    ? (language === 'pt' ? 'Montagem rápida de Poke Bowls contra o tempo.' : 'Fast-paced Poke Bowl assembly under pressure.')
    : (language === 'pt' ? 'Teste rápido de conhecimentos operacionais e de receitas.' : 'Rapid-fire test on operations and recipe SOP.');

  return (
    <div className="bg-brand-linen min-h-screen w-full flex items-center justify-center font-sans px-4 py-8">
      <div className="bg-white border-4 border-brand-charcoal rounded-card p-6 shadow-elevated max-w-lg w-full space-y-6">
        {/* Header with Round Information */}
        <div className="flex justify-between items-center border-b-2 border-dashed border-brand-charcoal pb-4">
          <div>
            <span className="bg-brand-tomato text-white text-xs font-display font-black px-3 py-1 rounded-full border border-brand-charcoal uppercase tracking-wider">
              {language === 'pt' ? `Ronda ${room.currentRoundNumber}` : `Round ${room.currentRoundNumber}`}
            </span>
            <h3 className="font-display font-black text-xl text-brand-charcoal mt-2">
              {gameName}
            </h3>
          </div>
          
          <div className="text-right">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">
              {language === 'pt' ? 'Tempo Restante' : 'Time Remaining'}
            </div>
            <div className="font-mono text-3xl font-black text-brand-tomato tracking-tight tabular-nums">
              {formatTime(localSecs)}
            </div>
          </div>
        </div>

        {/* Preparation Message Panel */}
        <div className="bg-brand-linen/50 border-2 border-brand-charcoal/30 rounded-card p-6 text-center space-y-4">
          <div className="relative flex justify-center py-2">
            <div className="w-10 h-10 rounded-full border-4 border-brand-tomato/20 border-t-brand-tomato animate-spin"></div>
          </div>
          <h4 className="font-display font-bold text-lg text-brand-charcoal">
            {language === 'pt' ? 'O desafio está a ser preparado...' : 'The challenge is being prepared...'}
          </h4>
          <p className="text-xs text-brand-burgundy font-medium">
            {gameDesc}
          </p>
        </div>

        {/* List of active participants inside the match */}
        <div className="space-y-3">
          <h5 className="font-display font-black text-xs text-brand-charcoal uppercase tracking-wider">
            {language === 'pt' ? 'Competidores em Jogo' : 'Competitors in Play'}
          </h5>
          <div className="grid grid-cols-2 gap-2">
            {participants.map(p => (
              <div 
                key={p.id}
                className="flex items-center gap-2 bg-brand-linen/20 border border-brand-charcoal/20 p-2.5 rounded-card"
              >
                <div className="w-6 h-6 rounded-full bg-brand-green/20 border border-brand-charcoal/30 flex items-center justify-center text-[10px] font-bold">
                  {p.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-xs font-black text-brand-charcoal truncate">{p.displayName}</div>
                  <div className="text-[9px] font-mono text-gray-500 truncate">{p.storeName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Sub-state screen: Round Transition (Leaderboard review)
// ==========================================
const RoundTransitionScreen: React.FC<{
  room: ArenaRoom;
  participants: ArenaParticipant[];
  language: 'pt' | 'en';
}> = ({ room, participants, language }) => {
  // Sort participants by total score to show the live leading player during transition
  const sortedParticipants = [...participants].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="bg-brand-linen min-h-screen w-full flex items-center justify-center font-sans px-4 py-8">
      <div className="bg-white border-4 border-brand-charcoal rounded-card p-6 shadow-elevated max-w-md w-full space-y-6">
        <div className="text-center space-y-2 border-b-2 border-dashed border-brand-charcoal pb-4">
          <span className="bg-brand-green text-white text-xs font-display font-black px-3 py-1 rounded-full border border-brand-charcoal uppercase tracking-wider">
            {language === 'pt' ? 'Ronda Concluída' : 'Round Completed'}
          </span>
          <h3 className="font-display font-black text-2xl text-brand-charcoal pt-2">
            {language === 'pt' ? 'Intervalo da Arena' : 'Arena Interval'}
          </h3>
          <p className="text-xs font-semibold text-brand-burgundy animate-pulse">
            {language === 'pt' 
              ? 'A preparar o próximo desafio...' 
              : 'Preparing the next challenge...'}
          </p>
        </div>

        {/* Real-time, server-driven Leaderboard Snapshot during interval */}
        <div className="space-y-3">
          <h4 className="font-display font-black text-xs text-brand-charcoal uppercase tracking-wider">
            {language === 'pt' ? 'Classificação Atual' : 'Current Standings'}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {sortedParticipants.map((p, idx) => (
              <div 
                key={p.id}
                className="flex items-center justify-between bg-brand-linen/10 border-2 border-brand-charcoal/30 p-3 rounded-card"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display font-black text-sm text-brand-charcoal w-4">
                    #{idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-brand-tomato/10 border-2 border-brand-charcoal flex items-center justify-center text-xs font-black">
                    {p.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-black text-brand-charcoal truncate">{p.displayName}</div>
                    <div className="text-[10px] font-mono text-gray-500 truncate">{p.storeName}</div>
                  </div>
                </div>
                
                <div className="font-mono text-xs font-black text-brand-tomato bg-brand-tomato/5 px-2.5 py-1.5 rounded-button border border-brand-tomato/20">
                  {p.totalScore} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Sub-state screen: Results Page
// ==========================================
const ResultsScreen: React.FC<{
  language: 'pt' | 'en';
  onExit: () => void;
}> = ({ language, onExit }) => {
  return (
    <div className="bg-brand-linen min-h-screen w-full flex items-center justify-center font-sans px-4">
      <div className="bg-white border-4 border-brand-charcoal rounded-card p-8 shadow-elevated max-w-sm text-center space-y-6">
        <div className="flex justify-center">
          <AppLogo variant="desktop" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display font-black text-2xl text-brand-charcoal">
            {language === 'pt' ? 'Torneio Concluído!' : 'Tournament Finished!'}
          </h3>
          <p className="text-sm font-semibold text-brand-burgundy">
            {language === 'pt'
              ? 'O torneio terminou. Os resultados vão aparecer aqui.'
              : 'The tournament has finished. Results will appear here.'}
          </p>
        </div>
        
        <button
          onClick={onExit}
          className="w-full py-3.5 rounded-button border-2 border-brand-charcoal bg-brand-charcoal hover:bg-brand-burgundy text-white font-display font-black text-sm flex items-center justify-center gap-2 shadow-soft hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#080D09] cursor-pointer transition-all"
        >
          <LogOut size={16} />
          {language === 'pt' ? 'Sair da Arena' : 'Exit Arena'}
        </button>
      </div>
    </div>
  );
};

interface HouseArenaModeProps {
  onBack: () => void;
  language: 'pt' | 'en';
}

/**
 * House Arena Mode Master Container
 * 
 * Orchestrates sub-hooks and visual components under the isolated feature boundary.
 * Completely decoupled from other modes and hidden from standard user routing.
 */
export const HouseArenaMode: React.FC<HouseArenaModeProps> = ({
  onBack,
  language
}) => {
  const {
    activeRoom,
    localPlayer,
    participants,
    reconnectToken,
    isLoading,
    error,
    createRoom,
    joinRoom,
    reconnect,
    leaveRoom,
    resetRoomState
  } = useHouseArenaRoom();

  // Active presence heartbeat registration (paused automatically when inactive/visibility hidden)
  useHouseArenaPresence(
    localPlayer?.id || null,
    activeRoom?.id || null,
    activeRoom?.roomCode || null,
    reconnectToken || null,
    localPlayer?.status || 'lobby',
    !!activeRoom
  );

  const {
    currentRound,
    scoreSum,
    isSubmitting,
    advanceNextRound,
    submitRoundScore
  } = useHouseArenaTournament(activeRoom?.id || null);

  const handleExit = () => {
    resetRoomState();
    onBack();
  };

  // Safe developer-only mock loader if needed
  if (isLoading && !activeRoom) {
    return (
      <div className="bg-brand-linen min-h-screen w-full flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-tomato mx-auto"></div>
          <p className="text-brand-charcoal font-semibold">
            {language === 'pt' ? 'A carregar Arena...' : 'Loading Arena...'}
          </p>
        </div>
      </div>
    );
  }

  // 1. If arena has been closed, render a beautiful closure screen
  if (activeRoom && activeRoom.status === 'closed') {
    return (
      <div className="bg-brand-linen min-h-screen w-full flex items-center justify-center font-sans px-4">
        <div className="bg-white border-4 border-brand-charcoal rounded-card p-6 shadow-elevated max-w-sm text-center">
          <ShieldAlert className="text-brand-tomato mx-auto mb-4" size={48} />
          <h3 className="font-display font-black text-2xl mb-2">
            {language === 'pt' ? 'Arena Encerrada' : 'Arena Closed'}
          </h3>
          <p className="text-xs font-semibold text-brand-burgundy mb-6">
            {language === 'pt'
              ? 'Esta arena foi encerrada pela autoridade do servidor.'
              : 'This arena room has been closed by server authority.'}
          </p>
          <button
            onClick={handleExit}
            className="w-full py-3.5 rounded-button border-2 border-brand-charcoal bg-brand-charcoal hover:bg-brand-burgundy text-white font-display font-black text-sm flex items-center justify-center gap-2 shadow-soft hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#080D09] cursor-pointer transition-all"
          >
            <LogOut size={16} />
            {language === 'pt' ? 'Voltar ao Treino' : 'Back to Training'}
          </button>
        </div>
      </div>
    );
  }

  // 2. Active Room states conditional router
  if (activeRoom) {
    if (activeRoom.status === 'lobby') {
      return (
        <div className="bg-brand-linen min-h-screen w-full flex flex-col justify-start py-8">
          <ArenaLobby
            room={activeRoom}
            localPlayer={localPlayer}
            participants={participants}
            onLeave={leaveRoom}
            language={language}
          />
        </div>
      );
    }
    
    if (activeRoom.status === 'starting') {
      return <StartingScreen language={language} />;
    }
    
    if (activeRoom.status === 'active') {
      if (activeRoom.currentGameType === 'slop_clock') {
        return (
          <SlopClockArenaGame
            room={activeRoom}
            reconnectToken={reconnectToken}
            language={language}
            participants={participants}
            localPlayer={localPlayer}
          />
        );
      } else if (activeRoom.currentGameType === 'quick_think') {
        return (
          <QuickThinkArenaGame
            room={activeRoom}
            reconnectToken={reconnectToken}
            language={language}
            participants={participants}
            localPlayer={localPlayer}
          />
        );
      } else if (activeRoom.currentGameType === 'memory_match') {
        return (
          <MemoryMatchArenaGame
            room={activeRoom}
            reconnectToken={reconnectToken}
            language={language}
            onRoundFinished={() => {}}
          />
        );
      } else if (activeRoom.currentGameType) {
        return (
          <ActiveRoundScreen 
            room={activeRoom} 
            participants={participants} 
            language={language} 
          />
        );
      } else {
        return (
          <div className="bg-brand-linen min-h-screen w-full flex flex-col justify-start py-12 px-4 md:px-8">
            <ArenaRoundResults 
              roomCode={activeRoom.roomCode} 
              reconnectToken={reconnectToken} 
              translations={TRANSLATIONS[language]}
            />
          </div>
        );
      }
    }
    
    if (activeRoom.status === 'results') {
      return (
        <div className="bg-brand-linen min-h-screen w-full flex flex-col justify-start py-4 px-2 md:px-4">
          <ArenaFinalResults 
            roomCode={activeRoom.roomCode} 
            reconnectToken={reconnectToken} 
            language={language}
            onReturnHome={handleExit}
            localParticipantId={localPlayer?.id || null}
          />
        </div>
      );
    }

  }

  // 3. No active room: render Home (Create/Join/Reconnect) screen
  return (
    <div className="bg-brand-linen min-h-screen w-full flex flex-col justify-center py-8">
      <ArenaHome
        onBack={onBack}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onReconnect={reconnect}
        isLoading={isLoading}
        error={error}
        language={language}
      />
    </div>
  );
};
export default HouseArenaMode;
