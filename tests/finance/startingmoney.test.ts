import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { companyService } from '@/lib/services/company/companyService';
import { applyStartingConditions } from '@/lib/services/core/startingConditionsService';
import { resetGameState } from '@/lib/services/core/gameState';
import { getCompanyByName, deleteCompany } from '@/lib/database/core/companiesDB';
import { GAME_INITIALIZATION } from '@/lib/constants/constants';

/**
 * Company Management Tests
 * 
 * Tests for company creation and management functionality.
 * Companies are identified by their name (name is the unique identifier).
 */

describe('Company Management', () => {
  // Track created companies for cleanup (using company names)
  const createdCompanyNames: string[] = [];

  beforeEach(() => {
    // Clear tracking array before each test
    createdCompanyNames.length = 0;
    // Reset game state to ensure clean test environment
    resetGameState();
  });

  afterEach(async () => {
    // Cleanup: Delete all created companies
    for (const companyName of createdCompanyNames) {
      try {
        await deleteCompany(companyName);
      } catch (error) {
        console.error(`Failed to cleanup company ${companyName}:`, error);
      }
    }

    // Clear array after cleanup
    createdCompanyNames.length = 0;
    
    // Reset game state after cleanup
    resetGameState();
  });

  it('should successfully grant starting condition money to a new company when starting conditions are applied', async () => {
    // Generate unique test company name to avoid conflicts
    const testCompanyName = `TestCompany_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Step 1: Create a company
    const companyResult = await companyService.createCompany({
      name: testCompanyName
    });

    expect(companyResult.success).toBe(true);
    expect(companyResult.company).toBeDefined();
    expect(companyResult.company?.name).toBe(testCompanyName);

    const company = companyResult.company!;
    createdCompanyNames.push(company.name);

    // Step 2: Verify company starts with 0 money
    expect(company.money).toBe(0);

    // Step 3: Apply starting conditions WITHOUT setting company as active
    // This matches the real scenario where starting conditions are applied via modal
    // before the company is fully activated in the game state
    // Note: In the real app, createNewCompany does call setActiveCompany, but we're testing
    // the scenario where the company might not be active (resetGameState was called in beforeEach)
    const startingConditionsResult = await applyStartingConditions(company.name);

    expect(startingConditionsResult.success).toBe(true);
    expect(startingConditionsResult.startingMoney).toBe(GAME_INITIALIZATION.STARTING_MONEY);
    expect(startingConditionsResult.error).toBeUndefined();

    // Step 4: Verify the company has the correct money in the database
    const updatedCompany = await getCompanyByName(company.name);
    
    expect(updatedCompany).not.toBeNull();
    expect(updatedCompany?.money).toBe(GAME_INITIALIZATION.STARTING_MONEY);
    expect(updatedCompany?.name).toBe(testCompanyName);
  });
});

