import type { Facility, RecipeId } from '@/lib/types/types';
import { getRecipe } from '@/lib/constants';
import { updateFacility } from '@/lib/database/core/facilitiesDB';

/**
 * Result of a production advancement
 */
export interface ProductionAdvancementResult {
  facility: Facility;
  wasCompleted: boolean;
  recipeName?: string;
}

/**
 * Start or change production recipe at a facility
 * Sets the recipe and starts production - inputs will be consumed at completion of current cycle
 * 
 * @param facility - The facility to start/change production at
 * @param recipeId - The recipe ID to produce
 * @returns Updated facility or null if start failed
 */
export async function startProduction(
  facility: Facility,
  recipeId: RecipeId
): Promise<Facility | null> {
  try {
    const recipe = getRecipe(recipeId);
    if (!recipe || !facility.availableRecipeIds.includes(recipeId)) {
      return null;
    }

    // Simply start production - inputs consumed at cycle completion
    return await updateFacility(facility.id, {
      activeRecipeId: recipeId,
      isProducing: true,
      progressTicks: 0,
    });
  } catch (error: any) {
    console.error('Error starting production:', error);
    return null;
  }
}

/**
 * Stop/pause production at a facility (keeps recipe selected)
 * Production can be resumed by calling startProduction with the same recipe
 * 
 * @param facility - The facility to stop production at
 * @returns Updated facility or null if failed
 */
export async function stopProduction(facility: Facility): Promise<Facility | null> {
  try {
    return await updateFacility(facility.id, {
      isProducing: false,
      progressTicks: 0, // Reset progress when stopping
    });
  } catch (error: any) {
    console.error('Error stopping production:', error);
    return null;
  }
}

/**
 * Advance production for ALL facilities with active production
 * This is called from client-side admin button
 * Calls the game-tick edge function which handles:
 * - Time advancement
 * - Progress increment (via PostgreSQL function)
 * - Production completion (applying recipes, updating inventory)
 * 
 * @returns Number of facilities advanced
 */
export async function advanceAllFacilitiesProduction(): Promise<number> {
  try {
    const { supabase } = await import('@/lib/utils/supabase');
    
    // Call edge function with manual flag
    const { data, error } = await supabase.functions.invoke('game-tick', {
      body: { manual: true }
    });

    if (error) {
      console.error('Edge function error:', error);
      return 0;
    }

    console.log('Game tick processed:', data);
    return data?.facilitiesAdvanced || 0;
  } catch (error) {
    console.error('Error advancing production:', error);
    return 0;
  }
}
