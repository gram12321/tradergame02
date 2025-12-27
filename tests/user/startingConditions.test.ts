import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { companyService } from '@/lib/services/user/companyService';
import { applyStartingConditions } from '@/lib/services/core/startingConditionsService';
import { setActiveCompany, resetGameState } from '@/lib/services/core/gameState';
import { getCompanyById, deleteCompany } from '@/lib/database/core/companiesDB';
import { insertUser, deleteUser } from '@/lib/database/core/usersDB';

/**
 * Starting Conditions Test
 * 
 * Validates that when starting conditions are applied to a new company,
 * the company receives the correct starting money (€10,000).
 * 
 * This is an integration test that actually uses the database to ensure
 * the money is persisted correctly.
 */

describe('Starting Conditions - Company Initialization', () => {
  // Track created entities for cleanup
  const createdCompanyIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeEach(() => {
    // Clear tracking arrays before each test
    createdCompanyIds.length = 0;
    createdUserIds.length = 0;
    // Reset game state to ensure clean test environment
    resetGameState();
  });

  afterEach(async () => {
    // Cleanup: Delete all created companies and users
    for (const companyId of createdCompanyIds) {
      try {
        await deleteCompany(companyId);
      } catch (error) {
        console.error(`Failed to cleanup company ${companyId}:`, error);
      }
    }

    for (const userId of createdUserIds) {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error(`Failed to cleanup user ${userId}:`, error);
      }
    }

    // Clear arrays after cleanup
    createdCompanyIds.length = 0;
    createdUserIds.length = 0;
    
    // Reset game state after cleanup
    resetGameState();
  });

  it('should grant €10,000 starting money to a new company when starting conditions are applied', async () => {
    // Generate unique test user name
    const testUserName = `TestUser_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const testCompanyName = testUserName; // 1:1 relationship - company name = user name

    // Step 1: Create a user
    const userResult = await insertUser({
      name: testUserName,
      created_at: new Date().toISOString()
    });

    expect(userResult.success).toBe(true);
    expect(userResult.data).toBeDefined();
    expect(userResult.data?.id).toBeDefined();

    const userId = userResult.data!.id;
    createdUserIds.push(userId);

    // Step 2: Create a company for the user
    const companyResult = await companyService.createCompany({
      name: testCompanyName,
      userId: userId
    });

    expect(companyResult.success).toBe(true);
    expect(companyResult.company).toBeDefined();
    expect(companyResult.company?.id).toBeDefined();

    const company = companyResult.company!;
    createdCompanyIds.push(company.id);

    // Verify company starts with 0 money
    expect(company.money).toBe(0);

    // Step 3: Set the company as active so updateGameState can update it
    await setActiveCompany(company);

    // Step 4: Apply starting conditions
    const startingConditionsResult = await applyStartingConditions(company.id);

    expect(startingConditionsResult.success).toBe(true);
    expect(startingConditionsResult.startingMoney).toBe(10000);
    expect(startingConditionsResult.error).toBeUndefined();

    // Step 5: Verify the company has the correct money in the database
    const updatedCompany = await getCompanyById(company.id);
    
    expect(updatedCompany).not.toBeNull();
    expect(updatedCompany?.money).toBe(10000);
    expect(updatedCompany?.id).toBe(company.id);
    expect(updatedCompany?.name).toBe(testCompanyName);
  });

  it('should return error if company does not exist when applying starting conditions', async () => {
    // Try to apply starting conditions to a non-existent company
    const fakeCompanyId = '00000000-0000-0000-0000-000000000000';
    
    const result = await applyStartingConditions(fakeCompanyId);
    
    // The function should handle this gracefully and return an error
    // (Transaction insert will fail due to foreign key constraint)
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

