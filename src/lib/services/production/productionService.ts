import type { Facility, RecipeItem, RecipeId } from '@/lib/types/types';
import { getRecipe } from '@/lib/constants';
import { updateFacility } from '@/lib/database/core/facilitiesDB';
import { supabase } from '@/lib/utils/supabase';

/**
 * Result of a production advancement
 */
export interface ProductionAdvancementResult {
  facility: Facility;
  wasCompleted: boolean;
  recipeName?: string;
}

/**
 * Start production of a recipe at a facility
 * 
 * @param facility - The facility to start production at
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

    // Can't start if already producing
    if (facility.activeRecipeId) {
      return null;
    }

    // Check for required inputs
    if (!checkFacilityHasInputs(facility, recipe.inputs)) {
      return null;
    }

    // Initialize production
    return await updateFacility(facility.id, {
      activeRecipeId: recipeId,
      progressTicks: 0,
    });
  } catch (error: any) {
    console.error('Error starting production:', error);
    return null;
  }
}

/**
 * Advance production progress by one tick
 * Called on each game tick for facilities with active production
 * 
 * @param facility - The facility with active production
 * @returns Updated facility or null if failed
 */
export async function advanceProductionProgress(
  facility: Facility
): Promise<Facility | null> {
  try {
    if (!facility.activeRecipeId) return null;

    const recipe = getRecipe(facility.activeRecipeId);
    if (!recipe) return null;

    const newProgress = (facility.progressTicks ?? 0) + 1;

    // Complete production if done, otherwise just increment progress
    if (newProgress >= recipe.processingTicks) {
      return await completeProduction(facility);
    }

    return await updateFacility(facility.id, {
      progressTicks: newProgress,
    });
  } catch (error: any) {
    console.error('Error advancing production:', error);
    return null;
  }
}

/**
 * Complete production cycle: apply recipe, auto-restart if inputs available
 * 
 * @param facility - The facility completing production
 * @returns Updated facility or null if failed
 */
async function completeProduction(facility: Facility): Promise<Facility | null> {
  try {
    if (!facility.activeRecipeId) return null;

    const recipe = getRecipe(facility.activeRecipeId);
    if (!recipe) return null;

    // Apply effectivity to outputs
    const effectivityMultiplier = facility.effectivity / 100;
    const outputs = recipe.outputs.map(output => ({
      resourceId: output.resourceId,
      quantity: Math.floor(output.quantity * effectivityMultiplier),
    }));

    // Update inventory with recipe inputs/outputs
    const newInventory = applyRecipeToInventory(
      facility.inventory,
      recipe.inputs,
      outputs
    );

    // Auto-restart production if inputs still available
    const canRestart = checkFacilityHasInputs(
      { ...facility, inventory: newInventory },
      recipe.inputs
    );

    return await updateFacility(facility.id, {
      inventory: newInventory,
      activeRecipeId: canRestart ? facility.activeRecipeId : undefined,
      progressTicks: canRestart ? 0 : undefined,
    });
  } catch (error: any) {
    console.error('Error completing production:', error);
    return null;
  }
}

/**
 * Stop production at a facility (cancels without completing)
 * 
 * @param facility - The facility to stop production at
 * @returns Updated facility or null if failed
 */
export async function stopProduction(facility: Facility): Promise<Facility | null> {
  try {
    if (!facility.activeRecipeId) return null;

    return await updateFacility(facility.id, {
      activeRecipeId: undefined,
      progressTicks: undefined,
    });
  } catch (error: any) {
    console.error('Error stopping production:', error);
    return null;
  }
}

/**
 * Orchestrate production advancement for a facility on a game tick
 * 
 * @param facility - The facility to advance production for
 * @returns Advancement result or null if advancement failed
 */
export async function advanceFacilityProduction(
  facility: Facility
): Promise<ProductionAdvancementResult | null> {
  if (!facility.activeRecipeId) return null;

  const previousRecipeId = facility.activeRecipeId;
  const updatedFacility = await advanceProductionProgress(facility);
  
  if (!updatedFacility) {
    console.warn('Failed to advance production for facility:', facility.id);
    return null;
  }

  // Check if production cycle completed
  const wasCompleted = !updatedFacility.activeRecipeId && !!previousRecipeId;
  const recipeName = wasCompleted ? getRecipe(previousRecipeId).name : undefined;

  return {
    facility: updatedFacility,
    wasCompleted,
    recipeName,
  };
}

/**
 * Advance production for ALL facilities with active production
 * This is called automatically on each game tick
 * 
 * @returns Number of facilities advanced
 */
export async function advanceAllFacilitiesProduction(): Promise<number> {
  try {
    // Fetch all facilities with active production from database
    const { data: activeFacilities, error } = await supabase
      .from('facilities')
      .select('*')
      .not('active_recipe_id', 'is', null);

    if (error) {
      console.error('Error fetching active facilities:', error);
      return 0;
    }

    if (!activeFacilities || activeFacilities.length === 0) {
      return 0;
    }

    // Convert DB records to Facility objects
    const facilities: Facility[] = activeFacilities.map((record: any) => ({
      id: record.id,
      companyId: record.company_id,
      name: record.name,
      type: record.type,
      facilitySubtype: record.facility_subtype || undefined,
      cityId: record.city_id,
      effectivity: record.effectivity,
      inventory: record.inventory,
      availableRecipeIds: record.available_recipe_ids,
      activeRecipeId: record.active_recipe_id || undefined,
      progressTicks: record.progress_ticks ?? undefined,
      workerCount: record.worker_count,
    }));

    // Advance production for each facility
    let advancedCount = 0;
    const results = await Promise.allSettled(
      facilities.map(facility => advanceFacilityProduction(facility))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        advancedCount++;
      } else if (result.status === 'rejected') {
        console.error('Error advancing facility:', result.reason);
      }
    }

    return advancedCount;
  } catch (error: any) {
    console.error('Error in advanceAllFacilitiesProduction:', error);
    return 0;
  }
}

// Helper: Check if facility has required inputs in inventory
function checkFacilityHasInputs(facility: Facility, requiredInputs: RecipeItem[]): boolean {
  if (requiredInputs.length === 0) return true;

  return requiredInputs.every(input => {
    const inventoryItem = facility.inventory.items.find(
      item => item.resourceId === input.resourceId
    );
    return inventoryItem && inventoryItem.quantity >= input.quantity;
  });
}

// Helper: Apply recipe to inventory (remove inputs, add outputs)
function applyRecipeToInventory(
  currentInventory: Facility['inventory'],
  inputs: RecipeItem[],
  outputs: RecipeItem[]
): Facility['inventory'] {
  const newItems = [...currentInventory.items];

  // Remove inputs from inventory
  for (const input of inputs) {
    const itemIndex = newItems.findIndex(item => item.resourceId === input.resourceId);
    if (itemIndex >= 0) {
      newItems[itemIndex].quantity -= input.quantity;
      if (newItems[itemIndex].quantity <= 0) {
        newItems.splice(itemIndex, 1);
      }
    }
  }

  // Add outputs to inventory
  for (const output of outputs) {
    const itemIndex = newItems.findIndex(item => item.resourceId === output.resourceId);
    if (itemIndex >= 0) {
      newItems[itemIndex].quantity += output.quantity;
    } else {
      newItems.push({
        resourceId: output.resourceId,
        quantity: output.quantity,
      });
    }
  }

  return {
    items: newItems,
    capacity: currentInventory.capacity,
    currentUsage: newItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}
