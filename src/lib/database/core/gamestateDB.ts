import { supabase } from './supabase';
import { getCurrentCompanyName } from '../../services/core/gameState';

const GAME_STATE_TABLE = 'game_state';

/**
 * Game State Database Operations
 * Basic CRUD operations for game state data persistence
 * TODO: Define game state structure for trader game
 */

export interface GameStateData {
  company_name?: string;
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
    const companyName = getCurrentCompanyName();
    if (!companyName) return;

    const dataToSave: GameStateData = {
      company_name: companyName,
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
    const companyName = getCurrentCompanyName();
    if (!companyName) return null;

    const { data, error } = await supabase
      .from(GAME_STATE_TABLE)
      .select('*')
      .eq('company_name', companyName)
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
