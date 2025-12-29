import { 
  getCompanySettings as loadCompanySettingsFromDB, 
  upsertCompanySettings as saveCompanySettingsToDB, 
  deleteCompanySettings as deleteCompanySettingsFromDB,
  type CompanySettingsData
} from '@/lib/database';

// CompanySettings interface (camelCase version for app usage)
export interface CompanySettings {
  id?: string;
  companyName: string;
  showToastNotifications?: boolean;
  allowResourceSubstitution?: boolean;
  showDetailedInputSection?: boolean;
  notificationCategories?: Record<string, boolean>;
  notificationSpecificMessages?: Record<string, boolean>;
  viewPreferences?: Record<string, ViewPreferences>;
  createdAt?: string;
  updatedAt?: string;
}

// Map database format to app format
const mapSettingsFromDB = (data: CompanySettingsData): CompanySettings => {
  return {
    id: data.company_name, // Using company_name as id since it's unique
    companyName: data.company_name,
    showToastNotifications: data.show_toast_notifications,
    allowResourceSubstitution: data.allow_resource_substitution,
    showDetailedInputSection: data.show_detailed_input_section,
    notificationCategories: data.notification_categories,
    notificationSpecificMessages: data.notification_specific_messages,
    viewPreferences: data.view_preferences,
    updatedAt: data.updated_at
  };
};

export interface NotificationSettings {
  categories: Record<string, boolean>;
  specificMessages: Record<string, boolean>;
}

export interface ViewPreferences {
  hideEmpty: boolean;
  selectedTier: string;
  hierarchyView: boolean;
}

// Default settings
const DEFAULT_NOTIFICATION_CATEGORIES = {
  'Production': true,
  'Building': true,
  'Market': true,
  'Population': true,
  'Inventory': true,
  'Admin': true
};

const DEFAULT_NOTIFICATION_SPECIFIC_MESSAGES = {
  'Production:complete': true,
  'Inventory:auto-purchase': false
};

const DEFAULT_VIEW_PREFERENCES: ViewPreferences = {
  hideEmpty: false,
  selectedTier: 'all',
  hierarchyView: false
};

const DEFAULT_COMPANY_SETTINGS: Omit<CompanySettings, 'id' | 'companyName' | 'createdAt' | 'updatedAt'> = {
  showToastNotifications: true,
  allowResourceSubstitution: true,
  showDetailedInputSection: true,
  notificationCategories: DEFAULT_NOTIFICATION_CATEGORIES,
  notificationSpecificMessages: DEFAULT_NOTIFICATION_SPECIFIC_MESSAGES,
  viewPreferences: {
    market: DEFAULT_VIEW_PREFERENCES,
    inventory: DEFAULT_VIEW_PREFERENCES
  }
};

class CompanySettingsService {
  public async getCompanySettings(companyName: string): Promise<CompanySettings> {
    try {
      const settings = await loadCompanySettingsFromDB(companyName);

      if (!settings) {
        // Return default settings if none exist
        return {
          companyName,
          ...DEFAULT_COMPANY_SETTINGS
        };
      }

      return mapSettingsFromDB(settings);
    } catch (error) {
      console.error('Error getting company settings:', error);
      return {
        companyName,
        ...DEFAULT_COMPANY_SETTINGS
      };
    }
  }

  public async saveCompanySettings(settings: Partial<CompanySettings> & { companyName: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const settingsData: CompanySettingsData = {
        company_name: settings.companyName,
        show_toast_notifications: settings.showToastNotifications,
        allow_resource_substitution: settings.allowResourceSubstitution,
        show_detailed_input_section: settings.showDetailedInputSection,
        notification_categories: settings.notificationCategories || DEFAULT_NOTIFICATION_CATEGORIES,
        notification_specific_messages: settings.notificationSpecificMessages || DEFAULT_NOTIFICATION_SPECIFIC_MESSAGES,
        view_preferences: settings.viewPreferences || {
          market: DEFAULT_VIEW_PREFERENCES,
          inventory: DEFAULT_VIEW_PREFERENCES
        }
      };

      return await saveCompanySettingsToDB(settingsData);
    } catch (error) {
      console.error('Error saving company settings:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  public async updateNotificationSetting(
    companyName: string,
    type: 'categories' | 'specificMessages',
    key: string,
    value: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current settings
      const currentSettings = await this.getCompanySettings(companyName);
      
      // Update the specific setting
      if (type === 'categories') {
        if (!currentSettings.notificationCategories) {
          currentSettings.notificationCategories = {};
        }
        currentSettings.notificationCategories[key] = value;
      } else {
        if (!currentSettings.notificationSpecificMessages) {
          currentSettings.notificationSpecificMessages = {};
        }
        currentSettings.notificationSpecificMessages[key] = value;
      }

      // Save updated settings
      return await this.saveCompanySettings(currentSettings);
    } catch (error) {
      console.error('Error updating notification setting:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  public async updateViewPreferences(
    companyName: string,
    viewName: 'market' | 'inventory',
    preferences: Partial<ViewPreferences>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current settings
      const currentSettings = await this.getCompanySettings(companyName);
      
      // Initialize view preferences if missing
      if (!currentSettings.viewPreferences) {
        currentSettings.viewPreferences = {
          market: DEFAULT_VIEW_PREFERENCES,
          inventory: DEFAULT_VIEW_PREFERENCES
        };
      }
      
      // Update view preferences
      if (!currentSettings.viewPreferences[viewName]) {
        currentSettings.viewPreferences[viewName] = DEFAULT_VIEW_PREFERENCES;
      }
      
      currentSettings.viewPreferences[viewName] = {
        ...currentSettings.viewPreferences[viewName]!,
        ...preferences
      };

      // Save updated settings
      return await this.saveCompanySettings(currentSettings);
    } catch (error) {
      console.error('Error updating view preferences:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  public async deleteCompanySettings(companyName: string): Promise<{ success: boolean; error?: string }> {
    return await deleteCompanySettingsFromDB(companyName);
  }

  // Helper methods for localStorage fallback (for anonymous/offline usage)
  public getLocalSettings(companyName: string): CompanySettings {
    try {
      const key = `company_settings_${companyName}`;
      const stored = localStorage.getItem(key);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          companyName,
          ...DEFAULT_COMPANY_SETTINGS,
          ...parsed
        };
      }
    } catch (error) {
      console.error('Error getting local settings:', error);
    }

    return {
      companyName,
      ...DEFAULT_COMPANY_SETTINGS
    };
  }

  public saveLocalSettings(companyName: string, settings: Partial<CompanySettings>): void {
    try {
      const key = `company_settings_${companyName}`;
      const current = this.getLocalSettings(companyName);
      const updated = { ...current, ...settings };
      
      // Remove companyName before storing
      const { companyName: cName, ...settingsToStore } = updated;
      localStorage.setItem(key, JSON.stringify(settingsToStore));
    } catch (error) {
      console.error('Error saving local settings:', error);
    }
  }

  public clearLocalSettings(companyName?: string): void {
    try {
      if (companyName) {
        localStorage.removeItem(`company_settings_${companyName}`);
      } else {
        // Clear all company settings
        Object.keys(localStorage)
          .filter(key => key.startsWith('company_settings_'))
          .forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Error clearing local settings:', error);
    }
  }

}

export const companySettingsService = new CompanySettingsService();
export default companySettingsService;

