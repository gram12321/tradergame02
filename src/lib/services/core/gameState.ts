import type { GameState, GameTime } from '@/lib/types/types';
import { createDefaultGameDate, advanceGameDate } from './timeService';

/**
 * Default game state
 */
export function createDefaultGameState(): GameState {
  const now = new Date().toISOString();
  const nextTick = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

  return {
    time: {
      tick: 0,
      date: createDefaultGameDate(),
      lastTickTime: now,
      nextTickTime: nextTick,
    },
    currentTick: 0,
    isProcessing: false,
  };
}

/**
 * Get current game state (for now, returns default - will be replaced with real state management)
 */
let currentGameState: GameState = createDefaultGameState();

export function getGameState(): GameState {
  return currentGameState;
}

/**
 * Update game state
 */
export function updateGameState(updates: Partial<GameState>): GameState {
  currentGameState = {
    ...currentGameState,
    ...updates,
  };
  return currentGameState;
}

/**
 * Reset game state
 */
export function resetGameState(): GameState {
  currentGameState = createDefaultGameState();
  return currentGameState;
}

/**
 * Get game time
 */
export function getGameTime(): GameTime {
  return currentGameState.time;
}

/**
 * Update game time
 */
export function updateGameTime(updates: Partial<GameTime>): GameTime {
  currentGameState.time = {
    ...currentGameState.time,
    ...updates,
  };
  return currentGameState.time;
}

/**
 * Increment game tick
 * Advances in-game date by one day
 */
export function incrementTick(): GameState {
  const now = new Date().toISOString();
  const nextTick = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

  // Advance in-game date
  const newDate = advanceGameDate(currentGameState.time.date);

  currentGameState = {
    ...currentGameState,
    time: {
      tick: currentGameState.time.tick + 1,
      date: newDate,
      lastTickTime: now,
      nextTickTime: nextTick,
    },
    currentTick: currentGameState.time.tick + 1,
  };

  return currentGameState;
}

