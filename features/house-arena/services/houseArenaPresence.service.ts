import { getSupabaseClient } from '../../../services/supabase/client';

/**
 * House Arena Presence & Heartbeat Service Interface
 * 
 * Coordinates client heartbeat triggers, online player counts, and stale session timeouts.
 */
export class HouseArenaPresenceService {
  
  private getSupabase() {
    const res = getSupabaseClient();
    return res.status === 'available' ? res.client : null;
  }

  /**
   * Dispatches a lightweight heartbeat packet to the database to declare online status.
   */
  async sendHeartbeat(
    participantId: string, 
    roomId: string, 
    roomCode: string | null,
    reconnectToken: string | null,
    status: string
  ): Promise<boolean> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        console.log(`[PresenceService] Mock Heartbeat: Player ${participantId} in Room ${roomId}. Status: ${status}`);
        return true;
      }

      if (!roomCode || !reconnectToken) {
        return false;
      }

      const { data, error } = await supabase.rpc('arena_heartbeat', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken.trim(),
        p_status: status
      });

      if (error) {
        console.error('[PresenceService] Heartbeat RPC error:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('[PresenceService] Unexpected heartbeat error:', err);
      return false;
    }
  }

  /**
   * Computes the total number of connected players in a room.
   */
  async getActiveParticipantCount(roomId: string): Promise<number> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        const savedPartsStr = localStorage.getItem('poke_house_mock_participants');
        if (!savedPartsStr) return 1;
        const participants = JSON.parse(savedPartsStr) as any[];
        return participants.filter(p => p.roomId === roomId && p.isActive).length;
      }

      const { count, error } = await supabase
        .from('arena_participants')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('is_active', true);

      if (error) {
        console.error('[PresenceService] getActiveParticipantCount error:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('[PresenceService] getActiveParticipantCount unexpected error:', err);
      return 0;
    }
  }
}
export const presenceService = new HouseArenaPresenceService();
