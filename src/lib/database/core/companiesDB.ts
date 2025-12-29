import { supabase } from './supabase';

const COMPANIES_TABLE = 'companies';

/**
 * Companies Database Operations
 * Basic CRUD operations for company data persistence
 * Company name serves as the unique identifier
 */

export type Company = {
  name: string;
  currentDay: number;
  currentMonth: number;
  currentYear: number;
  money: number;
  avatar?: string;
  avatarColor?: string;
};

/**
 * Insert a new company
 */
export const insertCompany = async (company: Partial<Company>): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const companyData: any = {
      name: company.name,
      current_day: company.currentDay ?? 1,
      current_month: company.currentMonth ?? 1,
      current_year: company.currentYear ?? 2024,
      money: company.money ?? 0,
      avatar: company.avatar ?? 'default',
      avatar_color: company.avatarColor ?? 'blue'
    };
    
    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .insert(companyData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Map database response to Company type (no id field)
    const mappedData = {
      name: data.name,
      currentDay: data.current_day || 1,
      currentMonth: data.current_month || 1,
      currentYear: data.current_year || 2024,
      money: data.money || 0,
      avatar: data.avatar || 'default',
      avatarColor: data.avatar_color || 'blue'
    };

    return { success: true, data: mappedData };
  } catch (error: any) {
    console.error('Error inserting company:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Get company by name (replaces getCompanyById - name is now the unique identifier)
 */
export const getCompanyByName = async (name: string): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (error || !data) return null;

    return {
      name: data.name,
      currentDay: data.current_day || 1,
      currentMonth: data.current_month || 1,
      currentYear: data.current_year || 2024,
      money: data.money || 0,
      avatar: data.avatar || 'default',
      avatarColor: data.avatar_color || 'blue'
    };
  } catch (error) {
    console.error('Error getting company by name:', error);
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
export const updateCompany = async (companyName: string, updates: Partial<Company>): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = {};
    if (updates.currentDay !== undefined) updateData.current_day = updates.currentDay;
    if (updates.currentMonth !== undefined) updateData.current_month = updates.currentMonth;
    if (updates.currentYear !== undefined) updateData.current_year = updates.currentYear;
    if (updates.money !== undefined) updateData.money = updates.money;
    if (updates.name !== undefined && updates.name !== companyName) {
      // If name is being changed, we need special handling - but name is the PK so this is complex
      // For now, we'll prevent name changes (or require a separate rename function)
      return { success: false, error: 'Cannot change company name - name is the primary identifier' };
    }
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
    if (updates.avatarColor !== undefined) updateData.avatar_color = updates.avatarColor;

    const { error } = await supabase
      .from(COMPANIES_TABLE)
      .update(updateData)
      .eq('name', companyName);

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
export const deleteCompany = async (companyName: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from(COMPANIES_TABLE)
      .delete()
      .eq('name', companyName);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting company:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};
