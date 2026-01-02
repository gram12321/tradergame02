import { getCompanyByName, createCompany, type Company } from '@/lib/database/core/companiesDB';
import { createStartingCapitalTransaction } from '../finance/transactionService';

/**
 * Get or create company by name (simplified login - no password)
 * If company exists, return it. If not, create it with starting capital transaction.
 */
export async function getOrCreateCompany(companyName: string): Promise<Company> {
  try {
    // Try to get existing company
    const existingCompany = await getCompanyByName(companyName);
    
    if (existingCompany) {
      return existingCompany;
    }

    // Company doesn't exist, create it
    const newCompany = await createCompany(companyName);
    
    // Create starting capital transaction
    try {
      await createStartingCapitalTransaction(companyName);
    } catch (transactionError) {
      console.error('Failed to create starting capital transaction:', transactionError);
      // Don't fail company creation if transaction fails - it can be added manually
    }
    
    return newCompany;
  } catch (error: any) {
    throw new Error(`Failed to login: ${error.message || error}`);
  }
}

