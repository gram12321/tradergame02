import { GAME_INITIALIZATION } from '../../constants/constants';
import { insertCompany, getCompanyByName, updateCompany as updateCompanyInDB, deleteCompany as deleteCompanyFromDB, checkCompanyNameExists, type Company } from '@/lib/database';

/**
 * Company Service
 * Company name serves as the unique identifier
 */

export interface CompanyCreateData {
  name: string;
}

export interface CompanyUpdateData {
  currentDay?: number;
  currentMonth?: number;
  currentYear?: number;
  money?: number;
  name?: string;
  avatar?: string;
  avatarColor?: string;
}

class CompanyService {
  /**
   * Create company
   */
  public async createCompany(data: CompanyCreateData): Promise<{ success: boolean; company?: Company; error?: string }> {
    try {
      const nameExists = await checkCompanyNameExists(data.name);
      if (nameExists) {
        return { success: false, error: 'Company name already exists' };
      }

      const company: Partial<Company> = {
        name: data.name,
        currentDay: GAME_INITIALIZATION.STARTING_DAY,
        currentMonth: GAME_INITIALIZATION.STARTING_MONTH,
        currentYear: GAME_INITIALIZATION.STARTING_YEAR,
        money: 0
      };

      const result = await insertCompany(company);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // After insert, fetch by name to get the complete company object
      const createdCompany = await getCompanyByName(data.name);
      return { success: true, company: createdCompany ?? undefined };
    } catch (error) {
      console.error('Error creating company:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get company by name (name is the unique identifier)
   */
  public async getCompany(companyName: string): Promise<Company | null> {
    return await getCompanyByName(companyName);
  }

  /**
   * Update company
   */
  public async updateCompany(companyName: string, updates: CompanyUpdateData): Promise<{ success: boolean; error?: string }> {
    return await updateCompanyInDB(companyName, updates);
  }

  /**
   * Delete company
   */
  public async deleteCompany(companyName: string): Promise<{ success: boolean; error?: string }> {
    const result = await deleteCompanyFromDB(companyName);
    if (result.success) {
      console.log('Company deleted successfully');
    }
    return result;
  }
}

export const companyService = new CompanyService();
export default companyService;
