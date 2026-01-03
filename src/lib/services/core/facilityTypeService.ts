import { supabase } from '@/lib/utils/supabase';
import type { RecipeId } from '@/lib/types/types';

export interface FacilityTypeConfig {
  id: string;
  name: string;
  availableRecipeIds: RecipeId[];
  autoStartRecipe: RecipeId;
  inventoryCapacity: number;
  effectivity: number;
  icon: string;
}

// Cache for facility types to avoid repeated database calls
let facilityTypesCache: Record<string, FacilityTypeConfig> | null = null;

/**
 * Fetch all facility types from database with caching
 */
export async function fetchFacilityTypes(): Promise<Record<string, FacilityTypeConfig>> {
  // Return cached data if available
  if (facilityTypesCache) {
    return facilityTypesCache;
  }

  // First, fetch facility types
  const { data: facilityTypesData, error: facilityTypesError } = await supabase
    .from('facility_types')
    .select('*')
    .order('sort_order', { ascending: true });

  if (facilityTypesError) {
    console.error('Error fetching facility types:', facilityTypesError);
    throw facilityTypesError;
  }

  if (!facilityTypesData) {
    throw new Error('No facility types data returned from database');
  }

  // Fetch recipes to determine available recipes for each facility type
  const { data: recipesData, error: recipesError } = await supabase
    .from('recipes')
    .select('id, facility_types');

  if (recipesError) {
    console.error('Error fetching recipes for facility types:', recipesError);
    throw recipesError;
  }

  // Convert database format to frontend format
  facilityTypesCache = facilityTypesData.reduce((acc, facilityType) => {
    // Find all recipes that can be used by this facility type
    const availableRecipes = (recipesData || [])
      .filter(recipe => recipe.facility_types?.includes(facilityType.id))
      .map(recipe => recipe.id as RecipeId);

    acc[facilityType.id] = {
      id: facilityType.id,
      name: facilityType.name,
      availableRecipeIds: availableRecipes,
      autoStartRecipe: facilityType.auto_start_recipe_id as RecipeId,
      inventoryCapacity: facilityType.default_inventory_capacity,
      effectivity: facilityType.default_effectivity,
      icon: facilityType.icon,
    };
    return acc;
  }, {} as Record<string, FacilityTypeConfig>);

  return facilityTypesCache || {};
}

/**
 * Get a single facility type from database by ID
 */
export async function getFacilityTypeFromDB(facilityTypeId: string): Promise<FacilityTypeConfig | null> {
  // Check cache first
  if (facilityTypesCache && facilityTypesCache[facilityTypeId]) {
    return facilityTypesCache[facilityTypeId];
  }

  const { data: facilityTypeData, error: facilityTypeError } = await supabase
    .from('facility_types')
    .select('*')
    .eq('id', facilityTypeId)
    .single();

  if (facilityTypeError) {
    console.error(`Error fetching facility type ${facilityTypeId}:`, facilityTypeError);
    return null;
  }

  if (!facilityTypeData) {
    return null;
  }

  // Fetch available recipes for this facility type
  const { data: recipesData, error: recipesError } = await supabase
    .from('recipes')
    .select('id')
    .contains('facility_types', [facilityTypeId]);

  if (recipesError) {
    console.error(`Error fetching recipes for facility type ${facilityTypeId}:`, recipesError);
  }

  const availableRecipes = (recipesData || []).map(recipe => recipe.id as RecipeId);

  return {
    id: facilityTypeData.id,
    name: facilityTypeData.name,
    availableRecipeIds: availableRecipes,
    autoStartRecipe: facilityTypeData.auto_start_recipe_id as RecipeId,
    inventoryCapacity: facilityTypeData.default_inventory_capacity,
    effectivity: facilityTypeData.default_effectivity,
    icon: facilityTypeData.icon,
  };
}

/**
 * Clear facility types cache (useful for testing or after updates)
 */
export function clearFacilityTypesCache(): void {
  facilityTypesCache = null;
}
