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
  
  // Economic characteristics
  wealth: number; // City wealth level (0-1 scale)
  population: number; // Number of residents
  
  // Derived properties (calculated from wealth/population)
  baseWage: number; // Base wage multiplier (based on wealth 0-1)
  purchasePower: number; // Spending capacity of residents
  qualityDemand: number; // Minimum quality expectations (1->inf)
  
}

// ============================================================================
// RECIPE SYSTEM
// ============================================================================

/**
 * Resource input/output definition for recipes
 */
export interface RecipeResource {
  resourceId: ResourceId; // Resource identifier
  quantity: number; // Required/produced quantity
}

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
  description?: string;
  
  // Production requirements
  inputs: RecipeResource[]; // Required input resources
  outputs: RecipeResource[]; // Produced output resources
  
  // Processing
  processingTicks: number; // Number of game ticks to complete (default: 1)
  
  // Compatibility
  facilityTypes: ProductionFacilityType[]; // Facility types that can use this recipe
  
}

/**
 * Recipe registry map for quick lookup
 */
export type RecipeMap = Map<string, Recipe>;

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
 * Facility production state
 */
export interface FacilityProductionState {
  currentRecipeId: RecipeId | null; // Currently assigned recipe
  isProducing: boolean; // Whether facility is actively producing
  productionProgress: number; // Progress within current production cycle (0-1)
  ticksRemaining: number; // Ticks remaining in current production cycle
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
  baseEffectivity: number; // Base effectivity value (before modifiers)
  
  // Inventory
  inventory: FacilityInventory;
  
  // Recipe system
  availableRecipeIds: RecipeId[]; // Recipes this facility can use
  productionState: FacilityProductionState;
  
  // Office control (future feature - Phase 2)
  officeId?: string; // Controlling office (if applicable)
  officeEffectivityCap?: number; // Effectivity cap from office (0-100%)
  
  // Financial
  workerCount: number; // Number of workers (future: affects effectivity)
  wageExpense: number; // Total wage expense per tick

}

// ============================================================================
// OFFICE SYSTEM (Future Feature - Phase 2)
// ============================================================================

/**
 * Office interface (not implemented in Phase 1)
 * Offices control facilities within a city and cap their effectivity
 */
export interface Office {
  id: string;
  companyId: string;
  cityId: string;
  
  name: string;
  effectivity: number; // Office effectivity (0-100%) - caps all facilities in city
  
  // Controlled facilities
  facilityIds: string[]; // All facilities controlled by this office
 
}
// ============================================================================
// GAME TIME SYSTEM
// ============================================================================

/**
 * In-game date structure
 */
export interface GameDate {
  day: number; // Day of month (1-24)
  month: number; // Month of year (1-7)
  year: number; // Year number
}

/**
 * Game time structure
 * Tracks game progression (hourly real-time or manual advancement)
 */
export interface GameTime {
  tick: number; // Current game tick counter
  date: GameDate; // In-game date
  lastTickTime: string; // ISO timestamp of last real-time tick (for automatic advancement)
  nextTickTime: string; // ISO timestamp of next scheduled real-time tick
}

/**
 * Game state structure
 * Central game state management
 */
export interface GameState {
  time: GameTime;
  currentTick: number; // Current processing tick
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
  category?: string; // Resource category (e.g., "raw_material", "processed", "product")

  quality?: number; // Quality value (1->inf scale, higher is better)

}

// ============================================================================
// COMPANY SYSTEM
// ============================================================================

/**
 * Company/Player company structure
 * Each player operates one or more companies
 */
export interface Company {
  id: string;
  userId: string; // Owner user
  
  name: string;
  
  // Financial
  cash: number; // Available cash
  totalAssets: number; // Total asset value
  totalLiabilities: number; // Total liabilities
  
  // Game progression
  prestige: number; // Prestige points
  

}

// ============================================================================
// TRANSACTION SYSTEM
// ============================================================================

/**
 * Transaction categories
 */
export type TransactionCategory = 
  | 'income'
  | 'expense'
  | 'production'
  | 'purchase'
  | 'sale'
  | 'wage'
  | 'prestige';

/**
 * Financial transaction record
 */
export interface Transaction {
  id: string;
  companyId: string;
  
  // Transaction details
  amount: number; // Positive for income, negative for expenses
  category: TransactionCategory;
  description: string;
  
  // Related entities
  facilityId?: string; // Facility involved (if applicable)
  cityId?: string; // City involved (if applicable)
  

}


