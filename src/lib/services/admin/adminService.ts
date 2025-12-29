import { supabase } from '@/lib/utils/supabase';

/**
 * Admin service - Administrative operations for game management
 */

/**
 * Clear all companies from the database
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
  } catch (error: any) {
    throw new Error(`Failed to clear all companies: ${error.message || error}`);
  }
}

