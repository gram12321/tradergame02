import type { Facility } from '@/lib/types/types';
import { createFacility, generateFacilityName } from '@/lib/database';

/**
 * Create a new farm facility with default settings
 * 
 * @param companyId - The company ID that owns the facility
 * @param companyName - The company name for naming
 * @param cityId - The city where the facility is located
 * @returns Created facility
 */
export async function createFarm(
  companyId: string,
  companyName: string,
  cityId: string
): Promise<Facility> {
  const facilityName = await generateFacilityName(
    companyId,
    companyName,
    cityId,
    'production',
    'farm'
  );

  return await createFacility({
    companyId,
    name: facilityName,
    type: 'production',
    facilitySubtype: 'farm',
    cityId,
    effectivity: 100,
    inventory: {
      items: [],
      capacity: 1000,
      currentUsage: 0,
    },
    availableRecipeIds: ['grow_grain'],
    activeRecipeId: 'grow_grain',
    progressTicks: 0,
    workerCount: 0,
  });
}

