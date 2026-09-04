import React, { useState, useEffect } from 'react';
import { ArenaRoomCreateRequest, ArenaRoomJoinRequest, ArenaConnectionStatus, PersistedArenaSession } from '../houseArena.types';
import { arenaSessionStorage } from '../services/houseArenaSession.storage';
import { IconTrophy, IconArrowLeft, IconGlobe } from '../../../components/Icons';
import { Sparkles, Trophy, Users, ShieldAlert, ArrowRight, RotateCw, RefreshCw, Info } from 'lucide-react';

interface ArenaHomeProps {
  onBack: () => void;
  onCreateRoom: (request: ArenaRoomCreateRequest, gameType: string) => Promise<void>;
  onJoinRoom: (request: ArenaRoomJoinRequest) => Promise<void>;
  onReconnect: (roomCode: string, token: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  infoNotice?: string | null;
  connectionStatus?: ArenaConnectionStatus;
  language: 'pt' | 'en';
}

const STORES = [
  { id: 'PT028', name: 'Alegro Sintra' },
  { id: 'PT012', name: 'Alfragide' },
  { id: 'PT030', name: 'Algarve Shopping' },
  { id: 'PT018', name: 'Almada' },
  { id: 'PT009', name: 'Alvalade' },
  { id: 'PT010', name: 'Amoreiras' },
  { id: 'PT013', name: 'Arrábida' },
  { id: 'PT017', name: 'Braga Parque' },
  { id: 'PT005', name: 'Cascais' },
  { id: 'PT020', name: 'Cascais Kiosk' },
  { id: 'PT001', name: 'Chiado' },
  { id: 'PT004', name: 'Colombo' },
  { id: 'PT007', name: 'Comporta' },
  { id: 'PT023', name: 'Douradores' },
  { id: 'PT026', name: 'Forum Algarve' },
  { id: 'PT016', name: 'Guimarães' },
  { id: 'PT008', name: 'Infante Santo' },
  { id: 'PT024', name: 'Mar Shopping' },
  { id: 'PT006', name: 'Miraflores' },
  { id: 'PT014', name: 'Norte Shopping' },
  { id: 'PT022', name: 'Nova' },
  { id: 'PT011', name: 'Oeiras Parque' },
  { id: 'PT019', name: 'Rua das Flores' },
  { id: 'PT002', name: 'Saldanha' },
  { id: 'PT021', name: 'Santa Catarina' },
  { id: 'PT015', name: 'Spacio' },
  { id: 'PT003', name: 'Strada' },
  { id: 'PT031', name: 'UBBO' },
  { id: 'PT029', name: 'Vasco da Gama' }
];

export const ArenaHome: React.FC<ArenaHomeProps> = ({
  onBack,
  onCreateRoom,
  onJoinRoom,
  onReconnect,
  isLoading,
  error,
  infoNotice,
  connectionStatus,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [playerName, setPlayerName] = useState('');
  const [selectedStore, setSelectedStore] = useState(STORES[0].name);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedGame, setSelectedGame] = useState<'slop_clock' | 'quick_think' | 'memory_match'>('slop_clock');
  const [localSession, setLocalSession] = useState<PersistedArenaSession | null>(null);

  // Synchronize local session with centralized storage
  useEffect(() => {
    if (connectionStatus === 'expired') {
      setLocalSession(null);
      return;
    }
    const session = arenaSessionStorage.read();
    if (session) {
      setLocalSession(session);
    } else {
      setLocalSession(null);
    }
  }, [connectionStatus, infoNotice]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    await onCreateRoom({
      displayName: playerName.trim(),
      storeName: selectedStore
    }, selectedGame);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCodeInput.trim()) return;
    await onJoinRoom({
      roomCode: roomCodeInput.trim().toUpperCase(),
      displayName: playerName.trim(),
      storeName: selectedStore
    });
  };

  const handleReconnectClick = async () => {
    if (!localSession) return;
    await onReconnect(localSession.roomCode, localSession.reconnectToken);
  };

  const clearSession = () => {
    arenaSessionStorage.clear();
    setLocalSession(null);
  };

  const t = (pt: string, en: string) => {
    return language === 'pt' ? pt : en;
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 md:p-6 animate-fade-in font-sans text-brand-charcoal">
      {/* Informational Notification Banner */}
      {infoNotice && (
        <div className="mb-6 bg-brand-butter/30 border-2 border-brand-charcoal rounded-card p-4 shadow-soft flex items-start gap-3 animate-fade-in">
          <Info className="text-brand-burgundy shrink-0 mt-0.5" size={18} />
          <div className="text-xs font-semibold text-brand-charcoal leading-relaxed">
            {infoNotice}
          </div>
        </div>
      )}

      {/* Reconnect Banner */}
      {localSession && !infoNotice && (
        <div className="mb-6 bg-brand-butter border-3 border-brand-charcoal rounded-card p-5 shadow-soft relative overflow-hidden animate-slide-up">
          <div className="absolute right-2 top-2 text-brand-charcoal/10">
            <Trophy size={80} />
          </div>
          <h4 className="font-display font-black text-lg mb-1 flex items-center gap-2">
            <RefreshCw className="animate-spin text-brand-tomato" size={18} />
            {t('Sessão Ativa Encontrada', 'Active Session Found')}
          </h4>
          <p className="text-xs font-semibold text-brand-burgundy mb-4">
            {t(
              `Tens uma arena em progresso no código: ${localSession.roomCode}. Gostarias de voltar a ligar?`,
              `You have an active arena session on room: ${localSession.roomCode}. Would you like to reconnect?`
            )}
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={handleReconnectClick}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-button border-2 border-brand-charcoal bg-brand-mochi text-brand-charcoal font-display font-black text-sm flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#080D09] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer"
            >
              {isLoading ? (
                <RotateCw className="animate-spin" size={16} />
              ) : (
                <Users size={16} />
              )}
              {t('Reconectar', 'Reconnect')}
            </button>
            <button
              onClick={clearSession}
              disabled={isLoading}
              className="py-3 px-4 rounded-button border-2 border-brand-charcoal bg-white text-brand-charcoal font-body font-bold text-sm hover:bg-brand-linen transition-all cursor-pointer"
            >
              {t('Limpar', 'Dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white border-4 border-brand-charcoal rounded-card shadow-elevated p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="p-2.5 rounded-button border-2 border-brand-charcoal bg-white hover:bg-brand-linen text-brand-charcoal shadow-[2px_2px_0px_0px_#080D09] active:translate-y-0.5 transition-all cursor-pointer"
            aria-label="Back to home"
          >
            <IconArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 bg-brand-sorbet px-4 py-1.5 border-2 border-brand-charcoal rounded-full shadow-[2px_2px_0px_0px_#080D09]">
            <Trophy size={16} className="text-brand-tomato" />
            <span className="font-display font-black text-xs uppercase tracking-wider">
              {t('Arena', 'Arena')}
            </span>
          </div>
        </div>

        {/* Branding header */}
        <div className="text-center mb-6">
          <h2 className="font-display font-black text-3xl text-brand-charcoal leading-none mb-1 flex items-center justify-center gap-2">
            House Arena
          </h2>
          <p className="text-xs font-semibold text-brand-burgundy max-w-xs mx-auto">
            {t(
              'Desafia os teus colegas em tempo real! Treina rapidez de montagem e domina as receitas da Poke House.',
              'Challenge your colleagues in real-time! Train your assembly speed and master the Poke House standard.'
            )}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-5 bg-brand-tomato/10 border-2 border-brand-tomato rounded-button p-3.5 flex gap-2.5 items-start text-brand-tomato">
            <ShieldAlert size={20} className="flex-shrink-0" />
            <div className="text-xs font-bold leading-tight">
              {error === 'room_not_found'
                ? t('Arena não encontrada. Confirma o código!', 'Room not found. Check your code!')
                : error === 'room_closed'
                ? t('Esta arena já foi encerrada.', 'This arena has already been closed.')
                : error === 'avatar_taken'
                ? t('Não foi possível obter um avatar único na arena.', 'Could not join. No unique avatars available.')
                : t(`Falha ao ligar: ${error}`, `Connection failed: ${error}`)}
            </div>
          </div>
        )}

        {/* Tabs switcher */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-brand-linen p-1 border-2 border-brand-charcoal rounded-button">
          <button
            onClick={() => setActiveTab('join')}
            className={`py-2.5 rounded-button font-display font-black text-sm cursor-pointer transition-all ${
              activeTab === 'join'
                ? 'bg-brand-mochi text-brand-charcoal border-2 border-brand-charcoal shadow-[2px_2px_0px_0px_#080D09]'
                : 'text-brand-charcoal/60 hover:text-brand-charcoal'
            }`}
          >
            {t('Entrar na Arena', 'Join Arena')}
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2.5 rounded-button font-display font-black text-sm cursor-pointer transition-all ${
              activeTab === 'create'
                ? 'bg-brand-butter text-brand-charcoal border-2 border-brand-charcoal shadow-[2px_2px_0px_0px_#080D09]'
                : 'text-brand-charcoal/60 hover:text-brand-charcoal'
            }`}
          >
            {t('Criar Arena', 'Create Arena')}
          </button>
        </div>

        {/* Forms */}
        <form onSubmit={activeTab === 'join' ? handleJoin : handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-brand-burgundy">
              {t('Teu Nome / Apelido', 'Your Display Name')}
            </label>
            <input
              type="text"
              required
              maxLength={15}
              placeholder="Ex: Marcelo"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3.5 border-2 border-brand-charcoal rounded-button bg-white text-brand-charcoal font-body font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-mochi transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-brand-burgundy">
              {t('A Tua Loja Poke House', 'Your Poke House Store')}
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full p-3.5 border-2 border-brand-charcoal rounded-button bg-white text-brand-charcoal font-body font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-mochi transition-all appearance-none cursor-pointer"
            >
              {STORES.map((st) => (
                <option key={st.id} value={st.name}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'create' && (
            <div className="space-y-2 animate-fade-in">
              <label className="block text-xs font-black uppercase tracking-wider text-brand-burgundy">
                {t('Jogo da Arena', 'Arena Game')}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'slop_clock', pt: 'Hora do Lodo', en: 'Slop Clock' },
                  { value: 'quick_think', pt: 'Pensa Rápido', en: 'Quick Think' },
                  { value: 'memory_match', pt: 'Memory Match', en: 'Memory Match' }
                ].map((g) => {
                  const isSelected = selectedGame === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setSelectedGame(g.value as any)}
                      className={`w-full p-3.5 rounded-button border-2 border-brand-charcoal text-left transition-all font-display font-black text-sm cursor-pointer ${
                        isSelected
                          ? 'bg-brand-mochi text-brand-charcoal shadow-[2px_2px_0px_0px_#080D09]'
                          : 'bg-white text-brand-charcoal/75 hover:bg-brand-linen/40'
                      }`}
                    >
                      {t(g.pt, g.en)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'join' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-brand-burgundy">
                {t('Código da Arena (5 Letras)', 'Room Code (5 Letters)')}
              </label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="ABCDE"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="w-full p-3.5 border-2 border-brand-charcoal rounded-button bg-white text-brand-charcoal font-display font-black text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-mochi transition-all uppercase"
              />
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={isLoading || !playerName.trim() || (activeTab === 'join' && !roomCodeInput.trim())}
            className="w-full mt-6 py-4 px-6 rounded-button border-2 border-brand-charcoal bg-brand-charcoal text-white hover:bg-brand-burgundy font-display font-black text-base flex items-center justify-center gap-2 shadow-soft hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {isLoading ? (
              <RotateCw className="animate-spin text-brand-butter" size={18} />
            ) : activeTab === 'join' ? (
              <Users size={18} />
            ) : (
              <Sparkles size={18} />
            )}
            {isLoading
              ? t('A processar...', 'Processing...')
              : activeTab === 'join'
              ? t('Entrar na Arena', 'Join Arena')
              : t('Criar Nova Arena', 'Create New Arena')}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
