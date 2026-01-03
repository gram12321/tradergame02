import type { Facility, ProductionFacilityType, RecipeId } from '@/lib/types/types';
import { createFacilityDB, generateFacilityName } from '@/lib/database';
import { getAllFacilityTypeConfigs, createInitialInventory, DEFAULT_FACILITY_CONFIG, getRecipe } from '@/lib/constants';

/**
 * Create a new facility of the specified type with default settings
 * 
 * @param facilityType - The type of facility to create (farm, mill, bakery, etc.)
 * @param companyId - The company ID that owns the facility
 * @param companyName - The company name for naming
 * @param cityId - The city where the facility is located
 * @returns Created facility
 */
export async function createFacility(
  facilityType: ProductionFacilityType,
  companyId: string,
  companyName: string,
  cityId: string
): Promise<Facility> {
  const config = getAllFacilityTypeConfigs()[facilityType];
  if (!config) {
    throw new Error(`Unknown facility type: ${facilityType}`);
  }
  
  const facilityName = await generateFacilityName(
    companyId,
    companyName,
    cityId,
    DEFAULT_FACILITY_CONFIG.type,
    facilityType
  );

  const inventoryCapacity = config.inventoryCapacity ?? DEFAULT_FACILITY_CONFIG.inventoryCapacity;
  const effectivity = config.effectivity ?? DEFAULT_FACILITY_CONFIG.effectivity;

  return await createFacilityDB({
    companyId,
    name: facilityName,
    type: DEFAULT_FACILITY_CONFIG.type,
    facilitySubtype: facilityType,
    cityId,
    effectivity,
    inventory: createInitialInventory(inventoryCapacity),
    availableRecipeIds: config.availableRecipeIds,
    activeRecipeId: config.autoStartRecipe,
    progressTicks: config.autoStartRecipe ? 0 : undefined,
    workerCount: DEFAULT_FACILITY_CONFIG.workerCount,
  });
}

/**
 * Recipe availability result
 */
export interface RecipeAvailabilityResult {
  available: boolean;
  missingResources: Array<{
    resourceId: string;
    required: number;
    available: number;
  }>;
}

/**
 * Check if a facility has the required inputs for a recipe
 * Returns availability status and list of missing resources
 * 
 * @param facility - The facility to check
 * @param recipeId - The recipe ID to check availability for
 * @returns Availability result with missing resources details
 */
export function checkRecipeAvailability(
  facility: Facility,
  recipeId: RecipeId
): RecipeAvailabilityResult {
  const recipe = getRecipe(recipeId);
  if (!recipe) {
    return { available: false, missingResources: [] };
  }

  if (recipe.inputs.length === 0) {
    return { available: true, missingResources: [] };
  }

  const missingResources: Array<{
    resourceId: string;
    required: number;
    available: number;
  }> = [];

  for (const input of recipe.inputs) {
    const inventoryItem = facility.inventory.items.find(
      item => item.resourceId === input.resourceId
    );
    const available = inventoryItem?.quantity || 0;
    
    if (available < input.quantity) {
      missingResources.push({
        resourceId: input.resourceId,
        required: input.quantity,
        available: available,
      });
    }
  }

  return {
    available: missingResources.length === 0,
    missingResources,
  };
}

