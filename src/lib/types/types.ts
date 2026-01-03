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
 * Facility types are now loaded from database, so this is a string
 */
export type ProductionFacilityType = string;

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
  
  // Active production (always set for production facilities)
  activeRecipeId: RecipeId; // Currently selected recipe
  isProducing: boolean; // Whether production is actively running
  progressTicks: number; // Number of ticks completed for current production (0 to processingTicks)

  
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
 * Resources are now loaded from database, so this is a string
 */
export type ResourceId = string;

/**
 * Resource definition
 * Resources are the items that flow through the game economy
 */
export interface Resource {
  id: string;
  name: string;
  icon: string; // Emoji/icon for display
}
// ============================================================================
// RECIPE SYSTEM
// ============================================================================

/**
 * Recipe ID type
 * Recipes are now loaded from database, so this is a string
 */
export type RecipeId = string;

/**
 * Recipe input/output item
 */
export interface RecipeItem {
  resourceId: ResourceId;
  quantity: number;
}

/**
 * Recipe definition for facility production
 * Recipes can be shared across multiple facility types
 */
export interface Recipe {
  id: RecipeId;
  name: string;
  
  // Input/Output
  inputs: RecipeItem[]; // Required input resources (empty array if no inputs)
  outputs: RecipeItem[]; // Output resources produced
  
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