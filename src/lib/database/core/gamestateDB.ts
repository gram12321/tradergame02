import { supabase } from './supabase';
import { getCurrentCompanyId } from '../../services/core/gameState';

const GAME_STATE_TABLE = 'game_state';

/**
 * Game State Database Operations
 * Basic CRUD operations for game state data persistence
 * TODO: Define game state structure for trader game
 */

export interface GameStateData {
  id?: string;
  day?: number;
  month?: number;
  current_year?: number;
  money?: number;
  updated_at?: string;
}

/**
 * Save game state
 */
export const saveGameState = async (gameState: Partial<GameStateData>): Promise<void> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) return;

    const dataToSave: GameStateData = {
      id: companyId,
      ...gameState,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from(GAME_STATE_TABLE)
      .upsert(dataToSave);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving game state:', error);
    // Silently fail - game state is non-critical
  }
};

/**
 * Load game state
 */
export const loadGameState = async (): Promise<GameStateData | null> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) return null;

    const { data, error } = await supabase
      .from(GAME_STATE_TABLE)
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
};
