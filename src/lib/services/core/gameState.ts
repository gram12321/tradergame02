import type { GameState, GameTime } from '@/lib/types/types';
import { DAYS_PER_MONTH, MONTHS_PER_YEAR, GAME_INITIALIZATION } from '@/lib/constants';
import { notificationService } from './notificationService';
import { saveGameTimeToDB, getGameTimeFromDB } from '@/lib/database/core/gameTimeDB';
import { supabase } from '@/lib/utils/supabase';

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
      console.log('Game state initialized:', dbTime ? 'from DB' : 'fallback');
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

  console.log('Game time subscription established');
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

function advanceGameTime(updateNextTickTime: boolean = true): GameTime {
  let { day, month, year, tick, nextTickTime } = gameState.time;
  
  tick += 1;
  day += 1;
  
  if (day > DAYS_PER_MONTH) {
    day = 1;
    month += 1;
  }
  
  if (month > MONTHS_PER_YEAR) {
    month = 1;
    year += 1;
  }
  
  if (updateNextTickTime) {
    nextTickTime = getNextHourBoundary().toISOString();
  }
  
  return {
    tick,
    day,
    month,
    year,
    lastTickTime: new Date().toISOString(),
    nextTickTime,
  };
}

async function processTickInternal(isManual: boolean): Promise<void> {
  if (gameState.isProcessing) return;
  
  gameState.isProcessing = true;
  
  try {
    const newTime = advanceGameTime(!isManual);
    
    const saved = await saveGameTimeToDB(newTime);
    if (!saved) {
      console.error('Failed to save game time to database');
    }

    setGameState({ ...gameState, time: newTime, isProcessing: false });
    
    if (currentCompanyForNotifications) {
      const icon = isManual ? '🎮' : '⏰';
      const source = isManual ? 'Admin manually' : 'Time automatically';
      notificationService.addMessage(
        `${icon} ${source} advanced time to Day ${newTime.day}, Month ${newTime.month}, ${newTime.year}`,
        isManual ? 'admin_manual_advance' : 'game_time_system',
        isManual ? 'Admin Control' : 'Time System',
        'time',
        currentCompanyForNotifications
      );
    }
  } catch (error) {
    console.error('Error processing game tick:', error);
    gameState.isProcessing = false;
  }
}

export async function processGameTick(): Promise<void> {
  return processTickInternal(false);
}

export async function processGameTickManual(): Promise<void> {
  return processTickInternal(true);
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

