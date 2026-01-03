import { useState, useEffect, useCallback } from 'react';
import {
  getGameState,
  processGameTickManual,
  addGameStateListener,
} from '@/lib/services/core';

/**
 * Hook for managing game tick system
 * Manual ticks for admin control
 * Automatic ticks handled by Edge Function cron
 */
export function useGameTick() {
  const [gameState, setGameState] = useState(getGameState());
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAdvanceTick = useCallback(async () => {
    if (isProcessing || gameState.isProcessing) return;

    setIsProcessing(true);
    try {
      // Manual tick for admin control (server-side edge function handles everything)
      await processGameTickManual();
      
      // Facilities are updated automatically via:
      // 1. Edge function handles production completion
      // 2. Real-time subscriptions keep UI in sync
    } catch (error) {
      console.error('Error advancing game tick:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, gameState.isProcessing]);

  // Subscribe to game state changes via listener (more efficient than polling)
  useEffect(() => {
    const unsubscribe = addGameStateListener((newState) => {
      setGameState(newState);
    });

    return unsubscribe;
  }, []);

  return {
    gameState,
    isProcessing,
    handleAdvanceTick,
  };
}
