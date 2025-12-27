import { supabase } from './supabase';

const USER_SETTINGS_TABLE = 'user_settings';

/**
 * User Settings Database Operations
 * Basic CRUD operations for user settings data persistence
 */

export interface UserSettingsData {
  user_id: string;
  company_id: string;
  show_toast_notifications?: boolean;
  allow_resource_substitution?: boolean;
  show_detailed_input_section?: boolean;
  notification_categories?: Record<string, boolean>;
  notification_specific_messages?: Record<string, boolean>;
  view_preferences?: any;
  updated_at?: string;
}

/**
 * Get user settings
 */
export const getUserSettings = async (userId: string, companyId: string): Promise<UserSettingsData | null> => {
  try {
    const { data, error } = await supabase
      .from(USER_SETTINGS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error('Error getting user settings:', error);
    return null;
  }
};

/**
 * Upsert user settings
 */
export const upsertUserSettings = async (settingsData: UserSettingsData): Promise<{ success: boolean; error?: string }> => {
  try {
    const dataToSave: UserSettingsData = {
      ...settingsData,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from(USER_SETTINGS_TABLE)
      .upsert(dataToSave, {
        onConflict: 'user_id,company_id'
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error upserting user settings:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Delete user settings
 */
export const deleteUserSettings = async (userId: string, companyId?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    let query = supabase.from(USER_SETTINGS_TABLE).delete().eq('user_id', userId);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user settings:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};
