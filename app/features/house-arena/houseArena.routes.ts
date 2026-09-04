/**
 * House Arena Navigation Routing Configurations
 * 
 * Defines standard sub-routes and step-views inside the future multiplayer House Arena.
 * Prevents bloating App.tsx with navigation parameters or layout branches.
 */

export type ArenaRouteView =
  | 'home'          // Base screen where players choose to create or join a room
  | 'join_form'     // Join form requesting Name + Store + Room Code
  | 'create_form'   // Create form requesting Name + Store
  | 'lobby'         // Active 5-minute pre-match staging area with avatar assignment
  | 'game_active'   // Synchronized active round challenge
  | 'round_results' // Interim standings showing round leaderboard and scoring
  | 'final_results' // Final tournament champion crown and podium display
  | 'room_closed_screen'; // Graceful terminal screen explanation if room is dismissed

export interface ArenaRouteState {
  currentView: ArenaRouteView;
  roomCode: string | null;
  participantId: string | null;
  reconnectToken: string | null;
}

export const INITIAL_ARENA_ROUTE: ArenaRouteState = {
  currentView: 'home',
  roomCode: null,
  participantId: null,
  reconnectToken: null
};

/**
 * Validates view navigation requests from UI triggers.
 */
export function canNavigateTo(current: ArenaRouteView, target: ArenaRouteView): boolean {
  const ROUTE_TRANSITIONS: Record<ArenaRouteView, ArenaRouteView[]> = {
    home: ['join_form', 'create_form'],
    join_form: ['home', 'lobby'],
    create_form: ['home', 'lobby'],
    lobby: ['home', 'game_active', 'room_closed_screen'],
    game_active: ['round_results', 'room_closed_screen'],
    round_results: ['game_active', 'final_results', 'room_closed_screen'],
    final_results: ['home', 'room_closed_screen'],
    room_closed_screen: ['home']
  };

  return ROUTE_TRANSITIONS[current].includes(target);
}
