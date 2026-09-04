import React, { useState, useEffect } from 'react';
import { ArenaRoom, ArenaParticipant } from '../houseArena.types';
import { Trophy, Users, ShieldAlert, Copy, Check, Clock, LogOut, ShieldCheck, Crown } from 'lucide-react';
import { playSound } from '../../../utils/sound';
import { ArenaAvatarBadge } from './ArenaAvatarBadge';

interface ArenaLobbyProps {
  room: ArenaRoom;
  localPlayer: ArenaParticipant | null;
  participants: ArenaParticipant[];
  onLeave: () => void;
  onHostStart?: () => Promise<{ success: boolean; message: string }>;
  language: 'pt' | 'en';
}

export const ArenaLobby: React.FC<ArenaLobbyProps> = ({
  room,
  localPlayer,
  participants,
  onLeave,
  onHostStart,
  language
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Real-time ticking countdown strictly calculated from server-controlled endsAt timestamp
  useEffect(() => {
    if (!room.lobbyEndsAt) return;

    const interval = setInterval(() => {
      const endsAt = new Date(room.lobbyEndsAt).getTime();
      const now = new Date().getTime();
      const diffSecs = Math.max(0, Math.floor((endsAt - now) / 1000));

      if (diffSecs <= 0) {
        setTimeLeft('00:00');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        const minsStr = String(mins).padStart(2, '0');
        const secsStr = String(secs).padStart(2, '0');
        setTimeLeft(`${minsStr}:${secsStr}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room.lobbyEndsAt]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    playSound('happy');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHostStart = async () => {
    if (!onHostStart || participants.length < 2 || isStarting) return;
    setIsStarting(true);
    setStartError(null);
    try {
      const res = await onHostStart();
      if (!res.success) {
        setStartError(res.message || t('Erro ao iniciar partida.', 'Error starting match.'));
      }
    } catch (err: any) {
      setStartError(err?.message || t('Erro inesperado.', 'Unexpected error.'));
    } finally {
      setIsStarting(false);
    }
  };

  const t = (pt: string, en: string) => {
    return language === 'pt' ? pt : en;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-6 animate-fade-in font-sans text-brand-charcoal min-h-[100dvh] flex flex-col gap-3 sm:gap-6">
      {/* Lobby Header bar */}
      <div className="bg-white border-3 sm:border-4 border-brand-charcoal rounded-card p-3 sm:p-5 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-brand-sorbet border-2 sm:border-3 border-brand-charcoal rounded-full flex items-center justify-center text-xl sm:text-3xl shadow-[2px_2px_0px_0px_#080D09] shrink-0">
            🏟️
          </div>
          <div>
            <h2 className="font-display font-black text-lg sm:text-2xl leading-none">
              {t('Lobby da Arena', 'Arena Lobby')}
            </h2>
            <p className="text-[11px] sm:text-xs font-semibold text-brand-burgundy mt-0.5 sm:mt-1">
              {t(
                `Competição individual. Prepara-te para começar!`,
                `Individual competition. Get ready to start!`
              )}
            </p>
          </div>
        </div>

        {/* Room Code copying */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="text-right">
            <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-brand-burgundy">
              {t('CÓDIGO DA SALA', 'ROOM CODE')}
            </span>
            <span className="font-display font-black text-xl sm:text-2xl text-brand-charcoal tracking-wide">
              {room.roomCode}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className={`p-2.5 sm:p-3 rounded-button border-2 border-brand-charcoal transition-all cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              copied
                ? 'bg-brand-olives text-white shadow-[1px_1px_0px_0px_#080D09]'
                : 'bg-brand-butter hover:bg-brand-butter/90 text-brand-charcoal shadow-[2px_2px_0px_0px_#080D09] sm:shadow-[3px_3px_0px_0px_#080D09] active:translate-y-0.5'
            }`}
            title={t('Copiar Código', 'Copy Code')}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {/* Main Grid: Info card + Active Players Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 flex-1 min-h-0">
        
        {/* Left column: Server Status / Countdown / Rules */}
        <div className="lg:col-span-1 flex flex-col gap-3 sm:gap-6 shrink-0">
          {/* Server countdown widget */}
          <div className="bg-brand-sorbet border-3 sm:border-4 border-brand-charcoal rounded-card p-3 sm:p-5 shadow-soft flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-2 left-2 bg-brand-charcoal text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {t('Servidor', 'Server')}
            </div>
            <Clock className="text-brand-tomato animate-pulse-fast mt-2 sm:mt-2 mb-0.5 sm:mb-1" size={24} />
            <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-brand-burgundy">
              {t('O JOGO INICIA EM', 'GAME STARTS IN')}
            </span>
            <span className="font-display font-black text-2xl sm:text-4xl text-brand-charcoal tracking-wider my-0.5 sm:my-1">
              {timeLeft || '00:00'}
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-brand-charcoal/80">
              {t(
                'Início automático pelo servidor',
                'Automatic start managed by server authority'
              )}
            </span>
          </div>

          {/* Secured Connection Info */}
          <div className="bg-white border-2 sm:border-3 border-brand-charcoal rounded-card p-2.5 sm:p-4 shadow-soft">
            <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-brand-burgundy flex items-center gap-1.5">
              <ShieldCheck className="text-brand-olives shrink-0" size={16} />
              <span>{t('Ligação Segura', 'Secure Session')}</span>
            </h4>
            <p className="hidden sm:block text-xs font-medium text-brand-charcoal leading-relaxed mt-2">
              {t(
                'O teu token de reconexão está guardado de forma segura localmente. Se fechares a janela acidentalmente, podes reentrar com um clique!',
                'Your reconnection token is securely kept in local storage. If you refresh or drop, join again with a single tap.'
              )}
            </p>
          </div>

          {/* Host Start Button (Host only) */}
          {localPlayer?.isHost && (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleHostStart}
                disabled={participants.length < 2 || isStarting}
                className={`w-full min-h-[44px] py-2.5 sm:py-3.5 rounded-button border-2 sm:border-3 border-brand-charcoal font-display font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  participants.length < 2 || isStarting
                    ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-brand-tomato hover:bg-brand-tomato/90 text-white shadow-soft hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95'
                }`}
              >
                {isStarting
                  ? t('A iniciar...', 'Starting...')
                  : t('Iniciar Partida', 'Start Match')}
              </button>
              {participants.length < 2 && (
                <p className="text-[10px] sm:text-xs font-semibold text-center text-brand-burgundy">
                  {t('São precisos pelo menos 2 lutadores', 'At least 2 challengers needed')}
                </p>
              )}
              {startError && (
                <p className="text-[10px] sm:text-xs font-bold text-center text-brand-tomato bg-brand-tomato/10 border border-brand-tomato/30 p-1.5 rounded">
                  {startError}
                </p>
              )}
            </div>
          )}

          {/* Exit Button */}
          <button
            onClick={onLeave}
            className="w-full min-h-[44px] py-2.5 sm:py-4 rounded-button border-2 sm:border-3 border-brand-charcoal bg-white hover:bg-brand-tomato/10 text-brand-charcoal hover:text-brand-tomato font-display font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-soft hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            {t('Sair da Arena', 'Leave Arena')}
          </button>
        </div>

        {/* Right column: Active Players list */}
        <div className="lg:col-span-2 bg-white border-3 sm:border-4 border-brand-charcoal rounded-card p-3 sm:p-6 shadow-soft flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3 sm:mb-5 shrink-0">
            <h3 className="font-display font-black text-lg sm:text-xl flex items-center gap-2">
              <Users size={18} className="text-brand-mochi shrink-0" />
              <span>{t('Lutadores na Arena', 'Arena Challengers')}</span>
            </h3>
            <span className="bg-brand-linen border-2 border-brand-charcoal px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-black shrink-0">
              {participants.length} / 8 {t('Ligados', 'Connected')}
            </span>
          </div>

          {/* Player Cards list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 overflow-y-auto max-h-[300px] sm:max-h-[380px] custom-scroll pr-1 py-1 flex-1">
            {participants.map((player) => {
              const isMe = localPlayer?.id === player.id;

              return (
                <div
                  key={player.id}
                  className={`p-3 sm:p-3.5 rounded-button border-2 sm:border-3 transition-all flex items-center gap-3 relative ${
                    isMe
                      ? 'border-brand-mochi bg-brand-sorbet/10 shadow-[2px_2px_0px_0px_#FF83AF]'
                      : 'border-brand-charcoal bg-white shadow-[2px_2px_0px_0px_#080D09]'
                  }`}
                >
                  {/* Left avatar visual */}
                  <div className="relative shrink-0">
                    <ArenaAvatarBadge
                      assetKey={player.avatarId}
                      displayName={player.displayName}
                      size="md"
                      isCurrentParticipant={isMe}
                      isActive={player.isActive}
                    />
                    {player.isHost && (
                      <span className="absolute -top-1 -right-1 bg-brand-butter border border-brand-charcoal rounded-full p-0.5 text-yellow-600 shadow-sm z-10" title="Lobby Host">
                        <Crown size={10} className="fill-current" />
                      </span>
                    )}
                  </div>

                  {/* Right Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-black text-xs sm:text-sm text-brand-charcoal truncate block">
                        {player.displayName}
                      </span>
                      {isMe && (
                        <span className="bg-brand-mochi text-white text-[8px] font-black px-1.5 py-0.5 border border-brand-charcoal rounded uppercase shrink-0">
                          {t('Tu', 'You')}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-brand-burgundy uppercase block truncate">
                      🏬 {player.storeName}
                    </span>
                    
                    <div className="flex gap-1 items-center mt-0.5">
                      {player.isLateJoiner && (
                        <span className="bg-brand-butter text-brand-charcoal text-[8px] font-bold px-1.5 py-0.5 border border-brand-charcoal rounded uppercase">
                          {t('Atrasado', 'Late')}
                        </span>
                      )}
                      {!player.isActive ? (
                        <span className="bg-brand-tomato/25 text-brand-tomato text-[8px] font-black px-1.5 py-0.5 border border-brand-charcoal rounded uppercase">
                          Offline
                        </span>
                      ) : (
                        <span className="bg-brand-olives/25 text-brand-olives text-[8px] font-black px-1.5 py-0.5 border border-brand-charcoal rounded uppercase">
                          Online
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Notice footer */}
          <div className="mt-auto pt-3 sm:pt-6 text-center border-t border-dashed border-brand-charcoal/20 shrink-0">
            <p className="text-[9px] sm:text-[10px] font-bold text-brand-burgundy/60 uppercase tracking-widest truncate">
              ⚡ {t('COMPETIÇÃO INDIVIDUAL • RESPEITA O SOP', 'INDIVIDUAL FIGHT • RESPECT THE SOP')} ⚡
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
