// ===== GAME CORE CONSTANTS =====

// Starting values for new games
export const GAME_INITIALIZATION = {
  // Starting financial capital (amount added as transaction)
  STARTING_MONEY: 100000, // €100k starting capital transaction
  
  // Starting time (Day-Month-Year system)
  STARTING_DAY: 1,
  STARTING_MONTH: 1,
  STARTING_YEAR: 2024,
  
  // Starting prestige
  STARTING_PRESTIGE: 1,
} as const;

// Note: Prestige and customer-related constants have been removed as those systems were deleted
