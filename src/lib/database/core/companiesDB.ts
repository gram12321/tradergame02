import { supabase } from './supabase';

const COMPANIES_TABLE = 'companies';

/**
 * Companies Database Operations
 * Basic CRUD operations for company data persistence
 * Simplified: Each user has exactly one company (1:1 relationship)
 */

export interface CompanyData {
  id?: string;
  name: string;
  user_id: string; // Required - 1:1 relationship with user
  current_day?: number;
  current_month?: number;
  current_year?: number;
  money?: number;
  starting_country?: string;
}

// Company type (same as CompanyData, using camelCase property names)
export type Company = {
  id: string;
  name: string;
  userId: string;
  currentDay: number;
  currentMonth: number;
  currentYear: number;
  money: number;
  startingCountry?: string;
};

/**
 * Insert a new company
 */
export const insertCompany = async (companyData: CompanyData): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .insert(companyData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error inserting company:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Get company by ID
 */
export const getCompanyById = async (companyId: string): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .select('*')
      .eq('id', companyId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id!,
      name: data.name,
      userId: data.user_id,
      currentDay: data.current_day || 1,
      currentMonth: data.current_month || 1,
      currentYear: data.current_year || 2024,
      money: data.money || 0,
      startingCountry: data.starting_country
    };
  } catch (error) {
    console.error('Error getting company by ID:', error);
    return null;
  }
};

/**
 * Get user's company (1:1 relationship - each user has exactly one company)
 */
export const getUserCompany = async (userId: string): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id!,
      name: data.name,
      userId: data.user_id,
      currentDay: data.current_day || 1,
      currentMonth: data.current_month || 1,
      currentYear: data.current_year || 2024,
      money: data.money || 0,
      startingCountry: data.starting_country
    };
  } catch (error) {
    console.error('Error getting user company:', error);
    return null;
  }
};

/**
 * Check if company name exists
 */
export const checkCompanyNameExists = async (name: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .select('name')
      .eq('name', name);

    if (error) return false;
    return (data && data.length > 0);
  } catch (error) {
    console.error('Error checking company name:', error);
    return false;
  }
};

/**
 * Update company
 */
export const updateCompany = async (companyId: string, updates: Partial<CompanyData>): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = { ...updates };

    const { error } = await supabase
      .from(COMPANIES_TABLE)
      .update(updateData)
      .eq('id', companyId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating company:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Delete company
 */
export const deleteCompany = async (companyId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from(COMPANIES_TABLE)
      .delete()
      .eq('id', companyId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting company:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};
