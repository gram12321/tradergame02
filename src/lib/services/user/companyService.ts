import { GAME_INITIALIZATION } from '../../constants/constants';
import { insertCompany, getCompanyById, getUserCompany, updateCompany as updateCompanyInDB, deleteCompany as deleteCompanyFromDB, checkCompanyNameExists, type Company, type CompanyData } from '@/lib/database';

/**
 * Company Service
 * Simplified: Each user has exactly one company (1:1 relationship)
 * User name = Company name
 */

export interface CompanyCreateData {
  name: string;
  userId: string; // Required - company must be associated with a user
}

export interface CompanyUpdateData {
  currentDay?: number;
  currentMonth?: number;
  currentYear?: number;
  money?: number;
}

class CompanyService {
  /**
   * Create company for a user (1:1 relationship)
   * User name and company name are the same
   */
  public async createCompany(data: CompanyCreateData): Promise<{ success: boolean; company?: Company; error?: string }> {
    try {
      // Check if company name already exists
      const nameExists = await checkCompanyNameExists(data.name);
      if (nameExists) {
        return { success: false, error: 'Company name already exists' };
      }

      // Check if user already has a company (1:1 relationship)
      const existingCompany = await this.getUserCompany(data.userId);
      if (existingCompany) {
        return { success: false, error: 'User already has a company' };
      }

      const companyData: CompanyData = {
        name: data.name,
        user_id: data.userId, // Required - company must be associated with user
        current_day: GAME_INITIALIZATION.STARTING_DAY,
        current_month: GAME_INITIALIZATION.STARTING_MONTH,
        current_year: GAME_INITIALIZATION.STARTING_YEAR,
        money: 0
      };

      const result = await insertCompany(companyData);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Get the created company
      const company = await getCompanyById(result.data.id);
      return { success: true, company: company ?? undefined };
    } catch (error) {
      console.error('Error creating company:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get company by ID
   */
  public async getCompany(companyId: string): Promise<Company | null> {
    return await getCompanyById(companyId);
  }

  /**
   * Get user's company (1:1 relationship - each user has exactly one company)
   */
  public async getUserCompany(userId: string): Promise<Company | null> {
    return await getUserCompany(userId);
  }

  /**
   * Update company
   */
  public async updateCompany(companyId: string, updates: CompanyUpdateData): Promise<{ success: boolean; error?: string }> {
    const companyUpdateData: any = {};
    if (updates.currentDay !== undefined) companyUpdateData.current_day = updates.currentDay;
    if (updates.currentMonth !== undefined) companyUpdateData.current_month = updates.currentMonth;
    if (updates.currentYear !== undefined) companyUpdateData.current_year = updates.currentYear;
    if (updates.money !== undefined) companyUpdateData.money = updates.money;

    return await updateCompanyInDB(companyId, companyUpdateData);
  }

  /**
   * Delete company
   */
  public async deleteCompany(companyId: string): Promise<{ success: boolean; error?: string }> {
    const result = await deleteCompanyFromDB(companyId);
    if (result.success) {
      console.log('Company deleted successfully');
    }
    return result;
  }
}

export const companyService = new CompanyService();
export default companyService;
