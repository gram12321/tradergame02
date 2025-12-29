import { supabase } from './supabase';

const COMPANY_SETTINGS_TABLE = 'company_settings';

/**
 * Company Settings Database Operations
 * Basic CRUD operations for company settings data persistence
 * NOTE: This replaces userSettingsDB - settings are now company-scoped only
 */

export interface CompanySettingsData {
  company_name: string;
  show_toast_notifications?: boolean;
  allow_resource_substitution?: boolean;
  show_detailed_input_section?: boolean;
  notification_categories?: Record<string, boolean>;
  notification_specific_messages?: Record<string, boolean>;
  view_preferences?: any;
  updated_at?: string;
}

/**
 * Get company settings
 */
export const getCompanySettings = async (companyName: string): Promise<CompanySettingsData | null> => {
  try {
    const { data, error } = await supabase
      .from(COMPANY_SETTINGS_TABLE)
      .select('*')
      .eq('company_name', companyName)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error('Error getting company settings:', error);
    return null;
  }
};

/**
 * Upsert company settings
 */
export const upsertCompanySettings = async (settingsData: CompanySettingsData): Promise<{ success: boolean; error?: string }> => {
  try {
    const dataToSave: CompanySettingsData = {
      ...settingsData,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from(COMPANY_SETTINGS_TABLE)
      .upsert(dataToSave, {
        onConflict: 'company_name'
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error upserting company settings:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Delete company settings
 */
export const deleteCompanySettings = async (companyName: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from(COMPANY_SETTINGS_TABLE)
      .delete()
      .eq('company_name', companyName);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting company settings:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

