import type { GameState, GameTime } from '@/lib/types/types';
import { DAYS_PER_MONTH, MONTHS_PER_YEAR, GAME_INITIALIZATION } from '@/lib/constants';
import { notificationService } from './notificationService';

/**
 * Get the next hour boundary (e.g., if it's 2:30 PM, returns 3:00 PM)
 */
function getNextHourBoundary(): Date {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0);
  nextHour.setSeconds(0);
  nextHour.setMilliseconds(0);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour;
}

// Game state singleton
let gameState: GameState = {
  time: {
    tick: GAME_INITIALIZATION.STARTING_TICK,
    day: GAME_INITIALIZATION.STARTING_DAY,
    month: GAME_INITIALIZATION.STARTING_MONTH,
    year: GAME_INITIALIZATION.STARTING_YEAR,
    lastTickTime: new Date().toISOString(),
    nextTickTime: getNextHourBoundary().toISOString(), // Next hour boundary (e.g., 3:00 PM)
  },
  isProcessing: false,
};

// Current company for notifications (set by the app)
let currentCompanyForNotifications: string | null = null;

/**
 * Get current game state
 */
export function getGameState(): GameState {
  return { ...gameState };
}

/**
 * Set game state (internal use)
 */
function setGameState(newState: GameState): void {
  gameState = { ...newState };
}

/**
 * Set the current company name for notifications
 * This should be called when a company logs in
 */
export function setCurrentCompanyForNotifications(companyName: string): void {
  currentCompanyForNotifications = companyName;
}

/**
 * Advance game time by one tick
 * Updates date using constants (DAYS_PER_MONTH, MONTHS_PER_YEAR)
 * @param updateNextTickTime - If true, updates nextTickTime to 1 hour from now (for automatic ticks)
 *                              If false, preserves the existing nextTickTime (for manual ticks)
 */
function advanceGameTime(updateNextTickTime: boolean = true): GameTime {
  const currentTime = gameState.time;
  let { day, month, year, tick, nextTickTime } = currentTime;
  
  tick += 1;
  day += 1;
  
  // Check against DAYS_PER_MONTH constant
  if (day > DAYS_PER_MONTH) {
    day = 1;
    month += 1;
  }
  
  // Check against MONTHS_PER_YEAR constant
  if (month > MONTHS_PER_YEAR) {
    month = 1;
    year += 1;
  }
  
  const now = new Date();
  
  // Only update nextTickTime if this is an automatic tick
  // Manual ticks preserve the scheduled time
  if (updateNextTickTime) {
    // Set to next hour boundary (e.g., if it's 3:00 PM, next tick is 4:00 PM)
    nextTickTime = getNextHourBoundary().toISOString();
  }
  
  return {
    tick,
    day,
    month,
    year,
    lastTickTime: now.toISOString(),
    nextTickTime,
  };
}

/**
 * Process a game tick (automatic - updates nextTickTime)
 * Advances time and updates state
 * Used for automatic hourly ticks
 */
export function processGameTick(): void {
  if (gameState.isProcessing) {
    return; // Prevent concurrent ticks
  }
  
  gameState.isProcessing = true;
  
  try {
    const newTime = advanceGameTime(true); // Update nextTickTime for automatic ticks
    setGameState({
      ...gameState,
      time: newTime,
      isProcessing: false,
    });
    
    // Send notification about automatic time advancement
    if (currentCompanyForNotifications) {
      notificationService.addMessage(
        `⏰ Time automatically advanced to Day ${newTime.day}, Month ${newTime.month}, ${newTime.year}`,
        'game_time_system',
        'Time System',
        'time',
        currentCompanyForNotifications
      );
    }
  } catch (error) {
    console.error('Error processing game tick:', error);
    gameState.isProcessing = false;
  }
}

/**
 * Process a game tick manually (preserves nextTickTime)
 * Advances time but keeps the scheduled automatic tick time unchanged
 * Used for admin manual advancement
 */
export function processGameTickManual(): void {
  if (gameState.isProcessing) {
    return; // Prevent concurrent ticks
  }
  
  gameState.isProcessing = true;
  
  try {
    const newTime = advanceGameTime(false); // Don't update nextTickTime for manual ticks
    setGameState({
      ...gameState,
      time: newTime,
      isProcessing: false,
    });
    
    // Send notification about manual time advancement
    if (currentCompanyForNotifications) {
      notificationService.addMessage(
        `🎮 Admin manually advanced time to Day ${newTime.day}, Month ${newTime.month}, ${newTime.year}`,
        'admin_manual_advance',
        'Admin Control',
        'time',
        currentCompanyForNotifications
      );
    }
  } catch (error) {
    console.error('Error processing manual game tick:', error);
    gameState.isProcessing = false;
  }
}

/**
 * Set processing state (for external control)
 */
export function setProcessingState(isProcessing: boolean): void {
  setGameState({
    ...gameState,
    isProcessing,
  });
}

