import { useState, useEffect, useCallback } from 'react';
import {
  getGameState,
  processGameTickWithFacilities,
} from '@/lib/services/core';
import type { Facility } from '@/lib/types/types';

interface UseGameTickOptions {
  facilities: Facility[];
  onFacilitiesUpdate?: (facilities: Facility[]) => void;
  autoAdvanceEnabled?: boolean; // Whether to auto-advance every 60 minutes
}

export function useGameTick({
  facilities,
  onFacilitiesUpdate,
  autoAdvanceEnabled = true,
}: UseGameTickOptions) {
  const [gameState, setGameState] = useState(getGameState());
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAdvanceTick = useCallback(() => {
    if (isProcessing || facilities.length === 0) return;

    setIsProcessing(true);
    try {
      const result = processGameTickWithFacilities(facilities);
      setGameState(getGameState());

      if (result.result.success && onFacilitiesUpdate) {
        onFacilitiesUpdate(result.updatedFacilities);
      }
    } catch (error) {
      console.error('Error advancing game tick:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [facilities, isProcessing, onFacilitiesUpdate]);

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

      // If it's time for automatic advancement (60 minutes passed)
      if (now >= nextTick && !state.isProcessing && facilities.length > 0) {
        handleAdvanceTick();
      }
    };

    // Update UI every second
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

