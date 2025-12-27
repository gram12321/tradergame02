
import { supabase } from '../../database/core/supabase';
import { addTransaction, getGameState, highscoreService, updateGameState } from '../index';
import { formatNumber } from '@/lib/utils';
import { GAME_INITIALIZATION } from '@/lib/constants';

// ===== ADMIN BUSINESS LOGIC FUNCTIONS =====


/**
 * Set gold/money for the active company
 */
export async function adminSetGoldToCompany(amount: number): Promise<void> {
  const targetAmount = amount || 10000;

  // Get current money from game state
  const gameState = getGameState();
  const currentMoney = gameState.money || 0;

  // Calculate the difference needed to reach target amount
  const difference = targetAmount - currentMoney;

  // Only add transaction if there's a difference
  if (difference !== 0) {
    await addTransaction(difference, `Admin: Set to ${formatNumber(targetAmount, { currency: true })} (was ${formatNumber(currentMoney, { currency: true })})`, 'admin_cheat');
  }
}

/**
 * Clear all highscores
 */
export async function adminClearAllHighscores(): Promise<{ success: boolean; message?: string }> {
  return await highscoreService.clearHighscores();
}

/**
 * Clear company value highscores
 */
export async function adminClearCompanyValueHighscores(): Promise<{ success: boolean; message?: string }> {
  return await highscoreService.clearHighscores('company_value');
}


/**
 * Clear all companies from database
 */
export async function adminClearAllCompanies(): Promise<void> {
  const { error } = await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

/**
 * Clear all users from database
 */
export async function adminClearAllUsers(): Promise<void> {
  const { error } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

/**
 * Clear all companies and users from database
 */
export async function adminClearAllCompaniesAndUsers(): Promise<void> {
  try {
    // Clear companies first (due to foreign key constraints)
    const { error: companiesError } = await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (companiesError) throw companiesError;

    // Then clear users
    const { error: usersError } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (usersError) throw usersError;
  } catch (error) {
    console.error('Error clearing companies and users:', error);
    throw error;
  }
}



interface AdminGameDatePayload {
  day: number;
  month: number;
  year: number;
}

/**
 * Set the game date (day, month, year) for the active company
 */
export async function adminSetGameDate({ day, month, year }: AdminGameDatePayload): Promise<void> {
  const { DAYS_PER_MONTH, MONTHS_PER_YEAR } = await import('../../constants/timeConstants');
  
  const normalizedDay = Number.isFinite(day)
    ? Math.min(Math.max(Math.floor(day), 1), DAYS_PER_MONTH)
    : GAME_INITIALIZATION.STARTING_DAY;

  const normalizedMonth = Number.isFinite(month)
    ? Math.min(Math.max(Math.floor(month), 1), MONTHS_PER_YEAR)
    : GAME_INITIALIZATION.STARTING_MONTH;

  const normalizedYear = Number.isFinite(year)
    ? Math.max(Math.floor(year), GAME_INITIALIZATION.STARTING_YEAR)
    : GAME_INITIALIZATION.STARTING_YEAR;

  await updateGameState({
    day: normalizedDay,
    month: normalizedMonth,
    year: normalizedYear
  });
}

/**
 * Full database reset - clears all tables
 * Updated for tradergame02 minimal schema
 */
export async function adminFullDatabaseReset(): Promise<void> {
  try {
    // Clear all tables in the correct order to respect foreign key constraints
    // Delete child tables first, then parent tables
    const tables = [
      'notification_filters',  // References companies
      'notifications',         // References companies
      'highscores',            // References companies
      'transactions',          // References companies
      'game_state',            // References companies (id is FK to companies.id)
      'user_settings',         // References users and companies
      'companies',             // References users
      'users'                  // Top-level parent table
    ];

    const errors: string[] = [];

    // Clear all tables - use DELETE with proper ordering for foreign keys
    for (const table of tables) {
      try {
        let deleteQuery;

        // Handle different table structures
        if (table === 'notification_filters' || table === 'notifications') {
          // These tables use text id - use empty string to match all non-empty IDs (all rows)
          deleteQuery = supabase.from(table).delete().neq('id', '');
        } else {
          // All other tables have uuid id columns - use dummy UUID to match all rows
          deleteQuery = supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const { error } = await deleteQuery;
        if (error) {
          const errorMsg = `Error clearing table ${table}: ${error.message}`;
          console.error(errorMsg, error);
          errors.push(errorMsg);
        }
      } catch (err) {
        const errorMsg = `Exception clearing table ${table}: ${err}`;
        console.error(errorMsg, err);
        errors.push(errorMsg);
      }
    }

    // Check if there were any errors
    if (errors.length > 0) {
      console.error('Full database reset errors:', errors);
      throw new Error(`Database reset failed with ${errors.length} errors: ${errors.join(', ')}`);
    }
  } catch (error) {
    const errorMessage = `Critical error during full database reset: ${error}`;
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }
}
