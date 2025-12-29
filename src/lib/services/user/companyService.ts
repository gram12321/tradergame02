import { getCompanyByName, createCompany, type Company } from '@/lib/database/core/companiesDB';

/**
 * Get or create company by name (simplified login - no password)
 * If company exists, return it. If not, create it.
 */
export async function getOrCreateCompany(companyName: string): Promise<Company> {
  try {
    // Try to get existing company
    const existingCompany = await getCompanyByName(companyName);
    
    if (existingCompany) {
      return existingCompany;
    }

    // Company doesn't exist, create it
    return await createCompany(companyName);
  } catch (error: any) {
    throw new Error(`Failed to login: ${error.message || error}`);
  }
}

