import { addTransaction } from '../finance/financeService';
import { TRANSACTION_CATEGORIES } from '@/lib/constants';

/**
 * Minimal Starting Conditions Service
 * Sets initial company balance
 */

export interface ApplyStartingConditionsResult {
  success: boolean;
  error?: string;
  startingMoney?: number;
}

const STARTING_MONEY = 10000;

/**
 * Apply starting conditions to a new company
 * Sets initial company balance to 10000
 */
export async function applyStartingConditions(
  companyId: string
): Promise<ApplyStartingConditionsResult> {
  try {
    // Add starting capital transaction
    try {
      await addTransaction(
        STARTING_MONEY,
        'Initial Capital: Starting balance',
        TRANSACTION_CATEGORIES.INITIAL_INVESTMENT,
        false,
        companyId
      );
    } catch (transactionError) {
      console.error('Error adding starting capital:', transactionError);
      return { success: false, error: 'Failed to record starting capital' };
    }

    return {
      success: true,
      startingMoney: STARTING_MONEY
    };
  } catch (error) {
    console.error('Error applying starting conditions:', error);
    return { success: false, error: 'Failed to apply starting conditions' };
  }
}
