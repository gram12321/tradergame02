/**
 * Centralized game data management
 * All database-loaded game configuration in one place
 */

import type { Recipe, RecipeId, Resource, ResourceId, ProductionFacilityType, FacilityInventory } from '@/lib/types/types';
import { fetchRecipes } from '@/lib/services/core/recipeService';
import { fetchResources } from '@/lib/services/core/resourceService';
import { fetchFacilityTypes } from '@/lib/services/core/facilityTypeService';

// ============================================================================
// TYPES
// ============================================================================

export interface FacilityTypeConfig {
  id: string;
  name: string;
  availableRecipeIds: RecipeId[];
  autoStartRecipe: RecipeId;
  inventoryCapacity: number;
  effectivity: number;
  icon: string;
}

export const DEFAULT_FACILITY_CONFIG = {
  effectivity: 100,
  inventoryCapacity: 1000,
  workerCount: 0,
  type: 'production' as const,
} as const;

// ============================================================================
// CACHE STATE
// ============================================================================

let recipes: Record<RecipeId, Recipe> = {};
let resources: Record<string, Resource> = {};
let facilityTypes: Record<string, FacilityTypeConfig> = {};
let isLoaded = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Load all game data from database
 * Call this once on app initialization
 */
export async function loadGameData(): Promise<void> {
  if (isLoaded) return;

  try {
    const [recipesData, resourcesData, facilityTypesData] = await Promise.all([
      fetchRecipes(),
      fetchResources(),
      fetchFacilityTypes(),
    ]);

    recipes = recipesData as Record<RecipeId, Recipe>;
    resources = resourcesData;
    facilityTypes = facilityTypesData;
    isLoaded = true;

    console.log('✅ Game data loaded:', {
      recipes: Object.keys(recipes).length,
      resources: Object.keys(resources).length,
      facilityTypes: Object.keys(facilityTypes).length,
    });
  } catch (error) {
    console.error('Failed to load game data:', error);
    throw error;
  }
}

/**
 * Check if game data is loaded
 */
export function isGameDataLoaded(): boolean {
  return isLoaded;
}

// ============================================================================
// RECIPES
// ============================================================================

/**
 * Get all recipes
 */
export function getAllRecipes(): Record<RecipeId, Recipe> {
  return recipes;
}

/**
 * Get recipe by ID (with validation warning)
 */
export function getRecipe(recipeId: RecipeId): Recipe | undefined {
  if (!isLoaded) {
    console.warn('Game data not loaded yet');
  }
  return recipes[recipeId];
}

/**
 * Get recipes for a specific facility type
 */
export function getRecipesForFacilityType(facilityType: ProductionFacilityType): Recipe[] {
  return Object.values(recipes).filter((recipe) =>
    recipe.facilityTypes?.includes(facilityType)
  );
}

// ============================================================================
// RESOURCES
// ============================================================================

/**
 * Get all resources
 */
export function getAllResources(): Record<string, Resource> {
  return resources;
}

/**
 * Get resource name by ID
 */
export function getResourceName(resourceId: ResourceId | string): string {
  return resources[resourceId]?.name || resourceId;
}

/**
 * Get resource icon by ID  
 */
export function getResourceIcon(resourceId: ResourceId | string): string {
  return resources[resourceId]?.icon || '📦';
}

// ============================================================================
// FACILITY TYPES
// ============================================================================

/**
 * Get all facility type configurations
 */
export function getAllFacilityTypeConfigs(): Record<string, FacilityTypeConfig> {
  return facilityTypes;
}

/**
 * Create initial inventory for a facility
 */
export function createInitialInventory(capacity: number = DEFAULT_FACILITY_CONFIG.inventoryCapacity): FacilityInventory {
  return {
    items: [],
    capacity,
    currentUsage: 0,
  };
}

/**
 * Facility subtype icon mapping
 */
export const FACILITY_SUBTYPE_ICONS: Record<ProductionFacilityType, string> = {
  farm: '🌾',
  mill: '⚙️',
  bakery: '🍞',
};

/**
 * Get facility subtype icon
 */
export function getFacilitySubtypeIcon(subtype: ProductionFacilityType): string {
  return FACILITY_SUBTYPE_ICONS[subtype] || '🏭';
}
