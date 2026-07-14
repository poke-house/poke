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
  language: 'pt' | 'en';
}

export const ArenaLobby: React.FC<ArenaLobbyProps> = ({
  room,
  localPlayer,
  participants,
  onLeave,
  language
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

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

  const t = (pt: string, en: string) => {
    return language === 'pt' ? pt : en;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 animate-fade-in font-sans text-brand-charcoal flex flex-col gap-6">
      {/* Lobby Header bar */}
      <div className="bg-white border-4 border-brand-charcoal rounded-card p-5 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-14 h-14 bg-brand-sorbet border-3 border-brand-charcoal rounded-full flex items-center justify-center text-3xl shadow-[2px_2px_0px_0px_#080D09]">
            🏟️
          </div>
          <div>
            <h2 className="font-display font-black text-2xl leading-none">
              {t('Lobby da Arena', 'Arena Lobby')}
            </h2>
            <p className="text-xs font-semibold text-brand-burgundy mt-1">
              {t(
                `Competição individual. Prepara-te para começar!`,
                `Individual competition. Get ready to start!`
              )}
            </p>
          </div>
        </div>

        {/* Room Code copying */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[10px] font-black uppercase tracking-wider text-brand-burgundy">
              {t('CÓDIGO DA SALA', 'ROOM CODE')}
            </span>
            <span className="font-display font-black text-2xl text-brand-charcoal tracking-wide">
              {room.roomCode}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className={`p-3 rounded-button border-2 border-brand-charcoal transition-all cursor-pointer ${
              copied
                ? 'bg-brand-olives text-white shadow-[1px_1px_0px_0px_#080D09]'
                : 'bg-brand-butter hover:bg-brand-butter/90 text-brand-charcoal shadow-[3px_3px_0px_0px_#080D09] active:translate-y-0.5'
            }`}
            title={t('Copiar Código', 'Copy Code')}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {/* Main Grid: Info card + Active Players Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Server Status / Countdown / Rules */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Server countdown widget */}
          <div className="bg-brand-sorbet border-4 border-brand-charcoal rounded-card p-5 shadow-soft flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-2 left-2 bg-brand-charcoal text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {t('Servidor', 'Server')}
            </div>
            <Clock className="text-brand-tomato animate-pulse-fast mt-2 mb-1" size={32} />
            <span className="text-[10px] font-black tracking-widest uppercase text-brand-burgundy">
              {t('O JOGO INICIA EM', 'GAME STARTS IN')}
            </span>
            <span className="font-display font-black text-4xl text-brand-charcoal tracking-wider my-1">
              {timeLeft || '00:00'}
            </span>
            <span className="text-[11px] font-semibold text-brand-charcoal/80">
              {t(
                'Início automático controlado pelo servidor',
                'Automatic start managed by server authority'
              )}
            </span>
          </div>

          {/* Secured Connection Info */}
          <div className="bg-white border-3 border-brand-charcoal rounded-card p-4 shadow-soft">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand-burgundy mb-2 flex items-center gap-1.5">
              <ShieldCheck className="text-brand-olives" size={16} />
              {t('Ligação Segura', 'Secure Session')}
            </h4>
            <p className="text-xs font-medium text-brand-charcoal leading-relaxed">
              {t(
                'O teu token de reconexão está guardado de forma segura localmente. Se fechares a janela acidentalmente, podes reentrar com um clique!',
                'Your reconnection token is securely kept in local storage. If you refresh or drop, join again with a single tap.'
              )}
            </p>
          </div>

          {/* Exit Button */}
          <button
            onClick={onLeave}
            className="w-full py-4 rounded-button border-3 border-brand-charcoal bg-white hover:bg-brand-tomato/10 text-brand-charcoal hover:text-brand-tomato font-display font-black text-base flex items-center justify-center gap-2 shadow-soft hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer"
          >
            <LogOut size={18} />
            {t('Sair da Arena', 'Leave Arena')}
          </button>
        </div>

        {/* Right column: Active Players list */}
        <div className="lg:col-span-2 bg-white border-4 border-brand-charcoal rounded-card p-6 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-black text-xl flex items-center gap-2">
              <Users size={20} className="text-brand-mochi" />
              {t('Lutadores na Arena', 'Arena Challengers')}
            </h3>
            <span className="bg-brand-linen border-2 border-brand-charcoal px-3 py-1 rounded-full text-xs font-black">
              {participants.length} / 8 {t('Ligados', 'Connected')}
            </span>
          </div>

          {/* Player Cards list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[360px] custom-scroll pr-1 py-1">
            {participants.map((player) => {
              const isMe = localPlayer?.id === player.id;

              return (
                <div
                  key={player.id}
                  className={`p-3.5 rounded-button border-3 transition-all flex items-center gap-3.5 relative ${
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
                      <span className="font-display font-black text-sm text-brand-charcoal truncate block">
                        {player.displayName}
                      </span>
                      {isMe && (
                        <span className="bg-brand-mochi text-white text-[8px] font-black px-1.5 py-0.5 border border-brand-charcoal rounded uppercase">
                          {t('Tu', 'You')}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-brand-burgundy uppercase block">
                      🏬 {player.storeName}
                    </span>
                    
                    <div className="flex gap-1 items-center mt-1">
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
          <div className="mt-auto pt-6 text-center border-t border-dashed border-brand-charcoal/20">
            <p className="text-[10px] font-bold text-brand-burgundy/60 uppercase tracking-widest">
              ⚡ {t('COMPETIÇÃO INDIVIDUAL • RESPEITA O SOP', 'INDIVIDUAL FIGHT • RESPECT THE SOP')} ⚡
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
