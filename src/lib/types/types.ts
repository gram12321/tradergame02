// Core Game Type Definitions
// These types define the fundamental game mechanics and data structures

// ============================================================================
// CITY SYSTEM
// ============================================================================

/**
 * City data structure
 * Cities are the fundamental geographic units with economic characteristics
 */
export interface City {
  id: string;
  name: string;
  wealth: number; // City wealth level (0-1 scale)
  population: number; // Number of residents
  
  // Derived properties (calculated from wealth/population)
  baseWage: number; // Base wage multiplier (based on wealth 0-1)
  purchasePower: number; // Spending capacity of residents
  qualityDemand: number; // Minimum quality expectations (1->inf)
  
}

// ============================================================================
// FACILITY SYSTEM
// ============================================================================

/**
 * Facility type categories
 */
export type FacilityType = 'production' | 'warehouse' | 'retail';

/**
 * Production facility type
 * Specific production facility types (farm, mill, bakery, etc.)
 */
export type ProductionFacilityType = 'farm' | 'mill' | 'bakery';

/**
 * Facility inventory entry
 * Tracks resources stored in facility
 */
export interface FacilityInventoryItem {
  resourceId: string;
  quantity: number;
}

/**
 * Facility inventory structure
 */
export interface FacilityInventory {
  items: FacilityInventoryItem[];
  capacity: number; // Maximum storage capacity
  currentUsage: number; // Current total quantity stored
}


/**
 * Facility interface
 * All facilities (production, warehouse, retail) share these core properties
 */
export interface Facility {
  id: string;
  companyId: string; // Owner company
  
  // Basic properties
  name: string;
  type: FacilityType;
  facilitySubtype?: ProductionFacilityType; // Specific facility type (e.g., 'farm', 'mill', 'bakery')
  cityId: string; // Location
  
  // Production properties
  effectivity: number; // Production efficiency (0-100%)
  
  // Inventory
  inventory: FacilityInventory;
  
  // Recipe system
  availableRecipeIds: RecipeId[]; // Recipes this facility can use

  
  // Financial
  workerCount: number; // Number of workers (future: affects effectivity)

}

// ============================================================================
// GAME TIME SYSTEM
// ============================================================================

/**
 * Game time structure
 * Tracks game progression (hourly real-time or manual advancement)
 * Combines date and tick information
 */
export interface GameTime {
  tick: number; // Current game tick counter
  day: number; // Day of month (1-24)
  month: number; // Month of year (1-7)
  year: number; // Year number
  lastTickTime: string; // ISO timestamp of last real-time tick (for automatic advancement)
  nextTickTime: string; // ISO timestamp of next scheduled real-time tick
}

/**
 * Game state structure
 * Central game state management (separate from time tracking)
 */
export interface GameState {
  time: GameTime;
  isProcessing: boolean; // Whether tick is currently being processed
}

// ============================================================================
// RESOURCE SYSTEM
// ============================================================================

/**
 * Resource ID type
 */
export type ResourceId = 'grain' | 'flour' | 'bread';

/**
 * Resource definition
 * Resources are the items that flow through the game economy
 */
export interface Resource {
  id: ResourceId;
  name: string;
  quality?: number; // Quality value (1->inf scale, higher is better)

}
// ============================================================================
// RECIPE SYSTEM
// ============================================================================


/**
 * Recipe ID type
 */
export type RecipeId = 'produce_grain' | 'mill_grain' | 'bake_bread';

/**
 * Recipe definition for facility production
 * Recipes can be shared across multiple facility types
 */
export interface Recipe {
  id: RecipeId;
  name: string;

 
  // Processing
  processingTicks: number; // Number of game ticks to complete (default: 1)
  
  // Compatibility
  facilityTypes: ProductionFacilityType[]; // Facility types that can use this recipe
  
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

/**
 * Notification category types
 * Used for categorizing and filtering notifications
 */
export type NotificationCategory = 
  | 'system'
  | 'finance'
  | 'time'
  | 'production'
  | 'sales'