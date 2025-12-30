import type { ProductionFacilityType, RecipeId, FacilityInventory } from '@/lib/types/types';

/**
 * Default facility configuration values
 */
export const DEFAULT_FACILITY_CONFIG = {
  effectivity: 100,
  inventoryCapacity: 1000,
  workerCount: 0,
  type: 'production' as const,
} as const;

/**
 * Facility type-specific configuration
 */
export interface FacilityTypeConfig {
  availableRecipeIds: RecipeId[];
  autoStartRecipe?: RecipeId; // Recipe to auto-start (undefined means don't auto-start)
  inventoryCapacity?: number; // Override default capacity if needed
  effectivity?: number; // Override default effectivity if needed
}

/**
 * Configuration for each production facility type
 */
export const FACILITY_TYPE_CONFIGS: Record<ProductionFacilityType, FacilityTypeConfig> = {
  farm: {
    availableRecipeIds: ['grow_grain'],
    autoStartRecipe: 'grow_grain', // Farms auto-start production
    inventoryCapacity: DEFAULT_FACILITY_CONFIG.inventoryCapacity,
    effectivity: DEFAULT_FACILITY_CONFIG.effectivity,
  },
  mill: {
    availableRecipeIds: ['mill_grain'],
    autoStartRecipe: undefined, // Don't auto-start (needs grain input)
    inventoryCapacity: DEFAULT_FACILITY_CONFIG.inventoryCapacity,
    effectivity: DEFAULT_FACILITY_CONFIG.effectivity,
  },
  bakery: {
    availableRecipeIds: ['bake_bread'],
    autoStartRecipe: undefined, // Don't auto-start (needs flour input)
    inventoryCapacity: DEFAULT_FACILITY_CONFIG.inventoryCapacity,
    effectivity: DEFAULT_FACILITY_CONFIG.effectivity,
  },
};

/**
 * Get configuration for a facility type
 */
export function getFacilityTypeConfig(facilityType: ProductionFacilityType): FacilityTypeConfig {
  return FACILITY_TYPE_CONFIGS[facilityType];
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
 * Facility subtype icon/emoji mapping
 */
export const FACILITY_SUBTYPE_ICONS: Record<ProductionFacilityType, string> = {
  farm: '🌾',
  mill: '⚙️',
  bakery: '🍞',
};

/**
 * Get facility subtype icon/emoji
 */
export function getFacilitySubtypeIcon(subtype: ProductionFacilityType): string {
  return FACILITY_SUBTYPE_ICONS[subtype] || '🏭';
}

