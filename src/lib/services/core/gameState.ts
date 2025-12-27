// Enhanced game state service that integrates with the new company system
import { GameState } from '../../types/types';
import { GAME_INITIALIZATION } from '../../constants/constants';
import { companyService } from '../user/companyService';
import { Company } from '@/lib/database';
import { triggerGameUpdate } from '../../../hooks/useGameUpdates';
// Current active company and game state
let currentCompany: Company | null = null;
let gameState: Partial<GameState> = {
  day: GAME_INITIALIZATION.STARTING_DAY,
  month: GAME_INITIALIZATION.STARTING_MONTH,
  year: GAME_INITIALIZATION.STARTING_YEAR,
  companyName: '',
  money: 0
};

// Persistence key
const LAST_COMPANY_ID_KEY = 'lastCompanyId';

function setLastCompanyId(companyId: string): void {
  try {
    localStorage.setItem(LAST_COMPANY_ID_KEY, companyId);
  } catch (error) {
    // no-op
  }
}

function clearLastCompanyId(): void {
  try {
    localStorage.removeItem(LAST_COMPANY_ID_KEY);
  } catch (error) {
    // no-op
  }
}

// Game state management functions
export const getGameState = (): Partial<GameState> => {
  return { ...gameState };
};

export const getCurrentCompany = (): Company | null => {
  return currentCompany;
};

/**
 * Get current company ID - fails fast if no company is active
 * This prevents silent failures when operations run against non-existent companies
 */
export const getCurrentCompanyId = (): string => {
  const company = getCurrentCompany();
  if (!company?.id) {
    throw new Error('No active company found. Please select or create a company before performing this action.');
  }
  return company.id;
};

export const updateGameState = async (updates: Partial<GameState>): Promise<void> => {
  gameState = { ...gameState, ...updates };
  
  // Update company in database if we have an active company
  if (currentCompany) {
    const companyUpdates: any = {};
    
    if (updates.day !== undefined) companyUpdates.currentDay = updates.day;
    if (updates.month !== undefined) companyUpdates.currentMonth = updates.month;
    if (updates.year !== undefined) companyUpdates.currentYear = updates.year;
    if (updates.money !== undefined) companyUpdates.money = updates.money;
    
    if (Object.keys(companyUpdates).length > 0) {
      try {
        await companyService.updateCompany(currentCompany.id, companyUpdates);
        
        // Update our local company object
        currentCompany = { ...currentCompany, ...companyUpdates };
      } catch (error) {
        console.error('Failed to update company in database:', error);
        // Continue with local state even if database update fails
      }
    }
  }

  // Notify subscribers that game state changed (debounced globally)
  try {
    triggerGameUpdate();
  } catch (e) {
    // no-op
  }
};

export const setActiveCompany = async (company: Company): Promise<void> => {
  // Check if this is the same company that's already active
  if (currentCompany && currentCompany.id === company.id) {
    return;
  }
  
  currentCompany = company;
  
  // Persist only the lastCompanyId for autologin
  setLastCompanyId(company.id);
  
  // Update local game state to match company
  gameState = {
    day: company.currentDay,
    month: company.currentMonth,
    year: company.currentYear,
    companyName: company.name,
    money: company.money
  };
  
  // Trigger a final game update to ensure all components are synchronized
  triggerGameUpdate();
};

/**
 * Load user's company (1:1 relationship - each user has exactly one company)
 * Called automatically on login
 */
export const loadUserCompany = async (userId: string): Promise<Company | null> => {
  try {
    const company = await companyService.getUserCompany(userId);
    if (company) {
      await setActiveCompany(company);
      return company;
    }
    return null;
  } catch (error) {
    console.error('Error loading user company:', error);
    return null;
  }
};

/**
 * Create company for user (1:1 relationship)
 * User name and company name are the same
 */
export const createNewCompany = async (userId: string, companyName: string): Promise<Company | null> => {
  try {
    const result = await companyService.createCompany({
      name: companyName,
      userId
    });
    
    if (result.success && result.company) {
      await setActiveCompany(result.company);
      return result.company;
    } else {
      console.error(result.error || 'Failed to create company');
      return null;
    }
  } catch (error) {
    console.error('Error creating company:', error);
    return null;
  }
};

export const resetGameState = (): void => {
  currentCompany = null;

  gameState = {
    day: GAME_INITIALIZATION.STARTING_DAY,
    month: GAME_INITIALIZATION.STARTING_MONTH,
    year: GAME_INITIALIZATION.STARTING_YEAR,
    companyName: '',
    money: 0
  };
  
  // Clear the lastCompanyId to prevent autologin
  clearLastCompanyId();
};

// Export clearLastCompanyId for explicit logout handling
export const clearLastCompanyIdForLogout = (): void => {
  clearLastCompanyId();
};
