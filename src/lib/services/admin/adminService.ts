import { supabase } from '@/lib/utils/supabase';
import { resetGameTimeToInitial } from '@/lib/database/core/gameTimeDB';

/**
 * Admin service - Administrative operations for game management
 */

/**
 * Clear all companies from the database
 * Also resets game time to 1.1.2024
 */
export async function adminClearAllCompanies(): Promise<void> {
  try {
    // Supabase requires a filter for DELETE operations
    // Using created_at filter that will match all companies (all created after 1970)
    const { error } = await supabase
      .from('companies')
      .delete()
      .gte('created_at', '1970-01-01T00:00:00.000Z');

    if (error) {
      throw new Error(`Failed to clear all companies: ${error.message}`);
    }

    // Reset game time to initial values (1.1.2024)
    const timeReset = await resetGameTimeToInitial();
    if (!timeReset) {
      console.warn('Failed to reset game time after clearing companies');
    }
  } catch (error: any) {
    throw new Error(`Failed to clear all companies: ${error.message || error}`);
  }
}

/**
 * Reset game time to initial values (1.1.2024)
 * Does not affect other database data
 */
export async function adminResetGameTime(): Promise<void> {
  try {
    const success = await resetGameTimeToInitial();
    if (!success) {
      throw new Error('Failed to reset game time');
    }
  } catch (error: any) {
    throw new Error(`Failed to reset game time: ${error.message || error}`);
  }
}

