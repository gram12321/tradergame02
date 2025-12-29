import { supabase } from '@/lib/utils/supabase';
import type { GameTime } from '@/lib/types/types';
import { GAME_INITIALIZATION } from '@/lib/constants';
import { getNextHourBoundary } from '@/lib/services/core/gameState';

const GAME_TIME_TABLE = 'game_time';
const GLOBAL_GAME_TIME_ID = 'global';

export async function getGameTimeFromDB(): Promise<GameTime | null> {
  try {
    const { data, error } = await supabase
      .from(GAME_TIME_TABLE)
      .select('*')
      .eq('id', GLOBAL_GAME_TIME_ID)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('Error fetching game time:', error);
      return null;
    }

    return {
      tick: data.tick ?? GAME_INITIALIZATION.STARTING_TICK,
      day: data.day ?? GAME_INITIALIZATION.STARTING_DAY,
      month: data.month ?? GAME_INITIALIZATION.STARTING_MONTH,
      year: data.year ?? GAME_INITIALIZATION.STARTING_YEAR,
      lastTickTime: data.last_tick_time ?? new Date().toISOString(),
      nextTickTime: data.next_tick_time ?? new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting game time from DB:', error);
    return null;
  }
}

export async function saveGameTimeToDB(gameTime: GameTime): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(GAME_TIME_TABLE)
      .upsert({
        id: GLOBAL_GAME_TIME_ID,
        tick: gameTime.tick,
        day: gameTime.day,
        month: gameTime.month,
        year: gameTime.year,
        last_tick_time: gameTime.lastTickTime,
        next_tick_time: gameTime.nextTickTime,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving game time:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving game time to DB:', error);
    return false;
  }
}

export async function resetGameTimeToInitial(): Promise<boolean> {
  try {
    const resetTime: GameTime = {
      tick: GAME_INITIALIZATION.STARTING_TICK,
      day: GAME_INITIALIZATION.STARTING_DAY,
      month: GAME_INITIALIZATION.STARTING_MONTH,
      year: GAME_INITIALIZATION.STARTING_YEAR,
      lastTickTime: new Date().toISOString(),
      nextTickTime: getNextHourBoundary().toISOString(),
    };

    return await saveGameTimeToDB(resetTime);
  } catch (error) {
    console.error('Error resetting game time:', error);
    return false;
  }
}

