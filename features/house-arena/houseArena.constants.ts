import { ArenaAvatar } from './houseArena.types';

/**
 * House Arena Default Configurations & Constants
 */

// Timing Contracts
export const LOBBY_DURATION_SECONDS = 300; // 5 minutes lobby countdown
export const ROOM_INACTIVITY_CLOSE_SECONDS = 600; // 10 minutes inactive room auto-close
export const HEARTBEAT_INTERVAL_SECONDS = 25; // Client heartbeat triggers every 25 seconds while active
export const HEARTBEAT_STALE_TIMEOUT_SECONDS = 60; // Mark participant disconnected if silent for 60 seconds

// Standard Room Rules
export const MIN_PLAYERS_TO_START = 2; // Rooms with < 2 players are closed when lobby timer ends

// Standard Avatars Pool
// Note: Unique assetKeys are defined here to decouple frontend layouts from image CDN URLs
export const ARENA_AVATARS_POOL: ArenaAvatar[] = [
  { id: '1', label: 'Pink Mochi Ninja', assetKey: 'avatar_mochi_ninja', isActive: true },
  { id: '2', label: 'Salmon Shogun', assetKey: 'avatar_salmon_shogun', isActive: true },
  { id: '3', label: 'Mango Samurai', assetKey: 'avatar_mango_samurai', isActive: true },
  { id: '4', label: 'Avocado Alchemist', assetKey: 'avatar_avocado_alchemist', isActive: true },
  { id: '5', label: 'Wasabi Warrior', assetKey: 'avatar_wasabi_warrior', isActive: true },
  { id: '6', label: 'Wakame Wizard', assetKey: 'avatar_wakame_wizard', isActive: true },
  { id: '7', label: 'Ginger Gladiator', assetKey: 'avatar_ginger_gladiator', isActive: true },
  { id: '8', label: 'Açai Archer', assetKey: 'avatar_acai_archer', isActive: true }
];
