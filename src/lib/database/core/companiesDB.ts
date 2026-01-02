import { supabase } from '@/lib/utils/supabase';
import { GAME_INITIALIZATION } from '@/lib/constants';

/**
 * Company interface - only required fields, no optionals
 */
export interface Company {
  id: string;
  name: string;
  money: number;
  current_day: number;
  current_month: number;
  current_year: number;
  created_at: string;
  avatar: string;
  avatar_color: string;
}

/**
 * Get company by name
 */
export async function getCompanyByName(companyName: string): Promise<Company | null> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('name', companyName)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no result

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    // Ensure all required fields are present
    return {
      id: data.id,
      name: data.name,
      money: data.money ?? 0,
      current_day: data.current_day ?? 1,
      current_month: data.current_month ?? 1,
      current_year: data.current_year ?? 2024,
      created_at: data.created_at ?? new Date().toISOString(),
      avatar: data.avatar ?? 'default',
      avatar_color: data.avatar_color ?? 'blue',
    };
  } catch (error: any) {
    console.error('Error getting company:', error);
    return null;
  }
}

/**
 * Create a new company
 */
export async function createCompany(companyName: string): Promise<Company> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        money: GAME_INITIALIZATION.STARTING_CAPITAL, // Starting capital from constants
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create company: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create company: No data returned');
    }

    // Return with all required fields
    return {
      id: data.id,
      name: data.name,
      money: data.money ?? 0,
      current_day: data.current_day ?? 1,
      current_month: data.current_month ?? 1,
      current_year: data.current_year ?? 2024,
      created_at: data.created_at ?? new Date().toISOString(),
      avatar: data.avatar ?? 'default',
      avatar_color: data.avatar_color ?? 'blue',
    };
  } catch (error: any) {
    throw new Error(`Failed to create company: ${error.message || error}`);
  }
}

/**
 * Get company by ID
 */
export async function getCompanyById(companyId: string): Promise<Company | null> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    // Ensure all required fields are present
    return {
      id: data.id,
      name: data.name,
      money: data.money ?? 0,
      current_day: data.current_day ?? 1,
      current_month: data.current_month ?? 1,
      current_year: data.current_year ?? 2024,
      created_at: data.created_at ?? new Date().toISOString(),
      avatar: data.avatar ?? 'default',
      avatar_color: data.avatar_color ?? 'blue',
    };
  } catch (error: any) {
    console.error('Error getting company by ID:', error);
    return null;
  }
}

/**
 * Update company
 */
export async function updateCompany(companyId: string, updates: Partial<Omit<Company, 'id' | 'name' | 'created_at'>>): Promise<Company> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update company: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to update company: No data returned');
    }

    // Return with all required fields
    return {
      id: data.id,
      name: data.name,
      money: data.money ?? 0,
      current_day: data.current_day ?? 1,
      current_month: data.current_month ?? 1,
      current_year: data.current_year ?? 2024,
      created_at: data.created_at ?? new Date().toISOString(),
      avatar: data.avatar ?? 'default',
      avatar_color: data.avatar_color ?? 'blue',
    };
  } catch (error: any) {
    throw new Error(`Failed to update company: ${error.message || error}`);
  }
}

/**
 * Delete company
 */
export async function deleteCompany(companyId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      throw new Error(`Failed to delete company: ${error.message}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to delete company: ${error.message || error}`);
  }
}

