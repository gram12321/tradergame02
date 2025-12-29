import { useState, useEffect, useCallback } from 'react';
import {
  getGameState,
  processGameTick,
  processGameTickManual,
} from '@/lib/services/core';
import type { Facility } from '@/lib/types/types';

interface UseGameTickOptions {
  facilities: Facility[];
  onFacilitiesUpdate?: (facilities: Facility[]) => void;
  autoAdvanceEnabled?: boolean; // Whether to auto-advance every 3600 seconds (1 hour)
}

export function useGameTick({
  facilities,
  onFacilitiesUpdate,
  autoAdvanceEnabled = true,
}: UseGameTickOptions) {
  const [gameState, setGameState] = useState(getGameState());
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAdvanceTick = useCallback(() => {
    if (isProcessing || gameState.isProcessing) return;

    setIsProcessing(true);
    try {
      // Use manual tick to preserve the scheduled automatic tick time
      processGameTickManual();
      setGameState(getGameState());
      
      // TODO: Process facilities here when facility system is implemented
      if (onFacilitiesUpdate) {
        onFacilitiesUpdate(facilities);
      }
    } catch (error) {
      console.error('Error advancing game tick:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [facilities, isProcessing, gameState.isProcessing, onFacilitiesUpdate]);

  // Update game state periodically and check for automatic advancement
  useEffect(() => {
    if (!autoAdvanceEnabled) {
      // Just update state periodically if auto-advance is disabled
      const updateInterval = setInterval(() => {
        setGameState(getGameState());
      }, 1000);
      return () => clearInterval(updateInterval);
    }

    const checkAutoAdvance = () => {
      const state = getGameState();
      const now = new Date();
      const nextTick = new Date(state.time.nextTickTime);

      // If it's time for automatic advancement (3600 seconds passed)
      if (now >= nextTick && !state.isProcessing) {
        handleAdvanceTick();
      }
    };

    // Update UI every second and check for auto-advance
    const updateInterval = setInterval(() => {
      setGameState(getGameState());
      checkAutoAdvance();
    }, 1000); // Update every second

    return () => clearInterval(updateInterval);
  }, [facilities, handleAdvanceTick, autoAdvanceEnabled]);

  return {
    gameState,
    isProcessing,
    handleAdvanceTick,
  };
}
