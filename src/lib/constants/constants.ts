// ===== GAME CORE CONSTANTS =====

// Time system constants for tradergame
// Day-Month-Year system: 24 days per month, 7 months per year
export const DAYS_PER_MONTH = 24;
export const MONTHS_PER_YEAR = 7;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;

// Starting values for new games
export const GAME_INITIALIZATION = {
  // Starting time (Day-Month-Year system)
  STARTING_DAY: 1,
  STARTING_MONTH: 1,
  STARTING_YEAR: 2024,
  STARTING_TICK: 0,
  // Starting capital for new companies
  STARTING_CAPITAL: 1000,
} as const;
