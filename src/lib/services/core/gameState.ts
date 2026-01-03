import type { GameState, GameTime } from '@/lib/types/types';
import { GAME_INITIALIZATION } from '@/lib/constants';
import { notificationService } from './notificationService';
import { getGameTimeFromDB } from '@/lib/database/core/gameTimeDB';
import { supabase } from '@/lib/utils/supabase';
import { advanceAllFacilitiesProduction } from '@/lib/services/production';
import { refreshAllActiveFacilities } from './gameData';

export function getNextHourBoundary(): Date {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return now;
}

type GameStateListener = (state: GameState) => void;

let gameState: GameState = {
  time: {
    tick: GAME_INITIALIZATION.STARTING_TICK,
    day: GAME_INITIALIZATION.STARTING_DAY,
    month: GAME_INITIALIZATION.STARTING_MONTH,
    year: GAME_INITIALIZATION.STARTING_YEAR,
    lastTickTime: new Date().toISOString(),
    nextTickTime: getNextHourBoundary().toISOString(),
  },
  isProcessing: false,
};

let currentCompanyForNotifications: string | null = null;
let gameTimeSubscription: ReturnType<typeof supabase.channel> | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let stateListeners: GameStateListener[] = [];

function notifyStateListeners(): void {
  stateListeners.forEach(listener => listener({ ...gameState }));
}

export function addGameStateListener(listener: GameStateListener): () => void {
  stateListeners.push(listener);
  listener({ ...gameState });
  return () => {
    stateListeners = stateListeners.filter(l => l !== listener);
  };
}

export async function initializeGameState(): Promise<void> {
  if (isInitialized || initializationPromise) {
    return initializationPromise || Promise.resolve();
  }

  initializationPromise = (async () => {
    try {
      const dbTime = await getGameTimeFromDB();
      
      if (!dbTime) {
        console.error('Game time not found in database - using fallback');
        const fallbackTime: GameTime = {
          tick: GAME_INITIALIZATION.STARTING_TICK,
          day: GAME_INITIALIZATION.STARTING_DAY,
          month: GAME_INITIALIZATION.STARTING_MONTH,
          year: GAME_INITIALIZATION.STARTING_YEAR,
          lastTickTime: new Date().toISOString(),
          nextTickTime: getNextHourBoundary().toISOString(),
        };
        setGameState({ ...gameState, time: fallbackTime });
      } else {
        setGameState({ ...gameState, time: dbTime });
      }

      setupGameTimeSubscription();
      isInitialized = true;
    } catch (error) {
      console.error('Error initializing game state:', error);
      isInitialized = true;
    }
  })();

  return initializationPromise;
}

function setupGameTimeSubscription(): void {
  if (gameTimeSubscription) return;

  gameTimeSubscription = supabase
    .channel('game_time_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'game_time', filter: 'id=eq.global' },
      (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const newData = payload.new as any;
          if (!newData) return;

          const newTime: GameTime = {
            tick: newData.tick ?? gameState.time.tick,
            day: newData.day ?? gameState.time.day,
            month: newData.month ?? gameState.time.month,
            year: newData.year ?? gameState.time.year,
            lastTickTime: newData.last_tick_time ?? gameState.time.lastTickTime,
            nextTickTime: newData.next_tick_time ?? gameState.time.nextTickTime,
          };

          const hasChanged = newTime.tick !== gameState.time.tick ||
                             newTime.day !== gameState.time.day ||
                             newTime.month !== gameState.time.month ||
                             newTime.year !== gameState.time.year;

          if (hasChanged) {
            setGameState({ ...gameState, time: newTime });
            if (currentCompanyForNotifications) {
              notificationService.addMessage(
                `🔄 Game time synced: Day ${newTime.day}, Month ${newTime.month}, ${newTime.year}`,
                'game_time_sync',
                'Time System',
                'time',
                currentCompanyForNotifications
              );
            }
          }
        }
      }
    )
    .subscribe();
}

export function getGameState(): GameState {
  return { ...gameState };
}

function setGameState(newState: GameState): void {
  gameState = { ...newState };
  notifyStateListeners();
}

export function setCurrentCompanyForNotifications(companyName: string): void {
  currentCompanyForNotifications = companyName;
}

/**
 * Process manual game tick (admin control only)
 * Calls the edge function which handles all game logic
 * Automatic ticks are handled by the Edge Function with cron
 */
export async function processGameTickManual(): Promise<void> {
  if (gameState.isProcessing) return;
  
  gameState.isProcessing = true;
  
  try {
    // Call edge function - it handles time advancement and production
    const facilitiesAdvanced = await advanceAllFacilitiesProduction();

    // Refresh UI data for all active companies
    await refreshAllActiveFacilities();

    // Game time will be updated via real-time subscription
    // But set processing to false
    gameState.isProcessing = false;
    
    if (currentCompanyForNotifications && facilitiesAdvanced > 0) {
      notificationService.addMessage(
        `🎮 Admin manually advanced time - ${facilitiesAdvanced} facilities processed`,
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

export function setProcessingState(isProcessing: boolean): void {
  setGameState({ ...gameState, isProcessing });
}

export function cleanupGameState(): void {
  if (gameTimeSubscription) {
    supabase.removeChannel(gameTimeSubscription);
    gameTimeSubscription = null;
  }
  stateListeners = [];
}

