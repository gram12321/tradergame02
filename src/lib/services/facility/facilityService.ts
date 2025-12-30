import type { Facility, ProductionFacilityType } from '@/lib/types/types';
import { createFacilityDB, generateFacilityName } from '@/lib/database';
import { getFacilityTypeConfig, createInitialInventory, DEFAULT_FACILITY_CONFIG } from '@/lib/constants';

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
  const config = getFacilityTypeConfig(facilityType);
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

