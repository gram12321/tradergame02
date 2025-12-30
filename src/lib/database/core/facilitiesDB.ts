import { supabase } from '@/lib/utils/supabase';
import type { Facility, FacilityInventory, RecipeId, FacilityType, ProductionFacilityType } from '@/lib/types/types';

/**
 * Generate a facility name in the format: [Company name] [City] [Facilitytype] #X
 * Only adds #X if there are multiple facilities with the same type in the same city
 */
export async function generateFacilityName(
  companyId: string,
  companyName: string,
  cityId: string,
  facilityType: string,
  facilitySubtype?: string
): Promise<string> {
  // Get existing facilities for this company in this city with this type
  const { data: existingFacilities, error } = await supabase
    .from('facilities')
    .select('name')
    .eq('company_id', companyId)
    .eq('city_id', cityId)
    .eq('type', facilityType);

  if (error) {
    console.error('Error checking existing facilities:', error);
  }

  // Use subtype if available, otherwise use type
  const typeLabel = facilitySubtype || facilityType;
  
  // Capitalize first letter of each word
  const formattedType = typeLabel
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const baseName = `${companyName} ${cityId} ${formattedType}`;

  // Count how many facilities already have similar names
  const similarNameCount = existingFacilities?.filter(f => 
    f.name.startsWith(baseName)
  ).length || 0;

  // Only add #X if there's already a facility with the same base name
  if (similarNameCount > 0) {
    return `${baseName} #${similarNameCount + 1}`;
  }

  return baseName;
}

/**
 * Database record interface for facilities
 */
export interface DbFacilityRecord {
  id: string;
  company_id: string;
  name: string;
  type: FacilityType;
  facility_subtype: ProductionFacilityType | null;
  city_id: string;
  effectivity: number;
  inventory: FacilityInventory;
  available_recipe_ids: RecipeId[];
  active_recipe_id: RecipeId | null;
  progress_ticks: number | null;
  worker_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database record to Facility interface
 */
function dbRecordToFacility(record: DbFacilityRecord): Facility {
  return {
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
  };
}

/**
 * Convert Facility interface to database record format
 */
function facilityToDbRecord(facility: Omit<Facility, 'id' | 'created_at' | 'updated_at'>): Omit<DbFacilityRecord, 'id' | 'created_at' | 'updated_at'> {
  return {
    company_id: facility.companyId,
    name: facility.name,
    type: facility.type,
    facility_subtype: facility.facilitySubtype || null,
    city_id: facility.cityId,
    effectivity: facility.effectivity,
    inventory: facility.inventory,
    available_recipe_ids: facility.availableRecipeIds,
    active_recipe_id: facility.activeRecipeId || null,
    progress_ticks: facility.progressTicks ?? null,
    worker_count: facility.workerCount,
  };
}

/**
 * Get all facilities for a company
 */
export async function getFacilitiesByCompanyId(companyId: string): Promise<Facility[]> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map(dbRecordToFacility);
  } catch (error: any) {
    console.error('Error getting facilities:', error);
    throw new Error(`Failed to get facilities: ${error.message || error}`);
  }
}

/**
 * Get facility by ID
 */
export async function getFacilityById(facilityId: string): Promise<Facility | null> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', facilityId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return dbRecordToFacility(data);
  } catch (error: any) {
    console.error('Error getting facility:', error);
    throw new Error(`Failed to get facility: ${error.message || error}`);
  }
}

/**
 * Create a new facility
 */
export async function createFacility(facility: Omit<Facility, 'id' | 'created_at' | 'updated_at'>): Promise<Facility> {
  try {
    const dbRecord = facilityToDbRecord(facility);
    
    const { data, error } = await supabase
      .from('facilities')
      .insert(dbRecord)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase create error:', error);
      throw new Error(`Failed to create facility: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create facility: No data returned');
    }

    return dbRecordToFacility(data);
  } catch (error: any) {
    console.error('Create facility error:', error);
    throw new Error(`Failed to create facility: ${error.message || error}`);
  }
}

/**
 * Update facility
 */
export async function updateFacility(
  facilityId: string,
  updates: Partial<Omit<Facility, 'id' | 'companyId' | 'created_at' | 'updated_at'>>
): Promise<Facility> {
  try {
    const updateData: Partial<DbFacilityRecord> = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.facilitySubtype !== undefined) updateData.facility_subtype = updates.facilitySubtype || null;
    if (updates.cityId !== undefined) updateData.city_id = updates.cityId;
    if (updates.effectivity !== undefined) updateData.effectivity = updates.effectivity;
    if (updates.inventory !== undefined) updateData.inventory = updates.inventory;
    if (updates.availableRecipeIds !== undefined) updateData.available_recipe_ids = updates.availableRecipeIds;
    if (updates.activeRecipeId !== undefined) updateData.active_recipe_id = updates.activeRecipeId || null;
    if (updates.progressTicks !== undefined) updateData.progress_ticks = updates.progressTicks ?? null;
    if (updates.workerCount !== undefined) updateData.worker_count = updates.workerCount;

    const { data, error } = await supabase
      .from('facilities')
      .update(updateData)
      .eq('id', facilityId)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Failed to update facility: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to update facility: No data returned');
    }

    return dbRecordToFacility(data);
  } catch (error: any) {
    console.error('Update facility error:', error);
    throw new Error(`Failed to update facility: ${error.message || error}`);
  }
}

/**
 * Delete facility
 */
export async function deleteFacility(facilityId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', facilityId);

    if (error) {
      throw new Error(`Failed to delete facility: ${error.message}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to delete facility: ${error.message || error}`);
  }
}

