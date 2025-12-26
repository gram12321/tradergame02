import type { Facility } from '@/lib/types/types';
import { processFacilitiesProduction } from '@/lib/services/production';
import { getGameState, updateGameState, incrementTick } from './gameState';

/**
 * Game tick processing result
 */
export interface GameTickResult {
  success: boolean;
  tick: number;
  facilitiesProcessed: number;
  error?: string;
}

/**
 * Process a single game tick
 * This processes all facilities and updates game state
 */
export function processGameTick(
  facilities: Facility[]
): GameTickResult {
  const gameState = getGameState();

  // Prevent concurrent processing
  if (gameState.isProcessing) {
    return {
      success: false,
      tick: gameState.time.tick,
      facilitiesProcessed: 0,
      error: 'Game tick is already being processed',
    };
  }

  try {
    // Mark as processing
    updateGameState({ isProcessing: true });

    // 1. Production Phase: Process all production facilities
    const productionFacilities = facilities.filter(
      (f) => f.type === 'production'
    );
    const productionResults = processFacilitiesProduction(productionFacilities);

    // 2. Sales Phase: Process retail facilities (future implementation)
    // const retailFacilities = facilities.filter((f) => f.type === 'retail');
    // const salesResults = processFacilitiesSales(retailFacilities);

    // 3. Economic Updates: Update city wealth, population, etc. (future implementation)
    // updateEconomicConditions();

    // 4. Financial Reconciliation: Record transactions (future implementation)
    // recordTransactions(productionResults, salesResults);

    // Increment game tick
    const newState = incrementTick();

    // Mark as not processing
    updateGameState({ isProcessing: false });

    return {
      success: true,
      tick: newState.time.tick,
      facilitiesProcessed: productionResults.length,
    };
  } catch (error) {
    // Mark as not processing on error
    updateGameState({ isProcessing: false });

    return {
      success: false,
      tick: gameState.time.tick,
      facilitiesProcessed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get updated facilities after processing a game tick
 */
export function processGameTickWithFacilities(
  facilities: Facility[]
): {
  result: GameTickResult;
  updatedFacilities: Facility[];
} {
  const gameState = getGameState();

  if (gameState.isProcessing) {
    return {
      result: {
        success: false,
        tick: gameState.time.tick,
        facilitiesProcessed: 0,
        error: 'Game tick is already being processed',
      },
      updatedFacilities: facilities,
    };
  }

  try {
    updateGameState({ isProcessing: true });

    // Process production facilities
    const productionFacilities = facilities.filter(
      (f) => f.type === 'production'
    );
    const productionResults = processFacilitiesProduction(productionFacilities);

    // Update facilities array with processed results
    const facilityMap = new Map(
      productionResults.map((r) => [r.facility.id, r.facility])
    );
    const updatedFacilities = facilities.map(
      (f) => facilityMap.get(f.id) || f
    );

    // Increment tick
    const newState = incrementTick();
    updateGameState({ isProcessing: false });

    return {
      result: {
        success: true,
        tick: newState.time.tick,
        facilitiesProcessed: productionResults.length,
      },
      updatedFacilities,
    };
  } catch (error) {
    updateGameState({ isProcessing: false });
    return {
      result: {
        success: false,
        tick: gameState.time.tick,
        facilitiesProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      updatedFacilities: facilities,
    };
  }
}

