import { addTransaction } from '../finance/financeService';
import { TRANSACTION_CATEGORIES } from '@/lib/constants';
import { GAME_INITIALIZATION } from '@/lib/constants/constants';

/**
 * Minimal Starting Conditions Service
 * Sets initial company balance
 */

export interface ApplyStartingConditionsResult {
  success: boolean;
  error?: string;
  startingMoney?: number;
}

/**
 * Apply starting conditions to a new company
 * Sets initial company balance using GAME_INITIALIZATION.STARTING_MONEY
 */
export async function applyStartingConditions(
  companyName: string
): Promise<ApplyStartingConditionsResult> {
  try {
    await addTransaction(
      GAME_INITIALIZATION.STARTING_MONEY,
      'Initial Capital: Starting balance',
      TRANSACTION_CATEGORIES.INITIAL_INVESTMENT,
      false,
      companyName
    );
    return { success: true, startingMoney: GAME_INITIALIZATION.STARTING_MONEY };
  } catch (error) {
    console.error('Error applying starting conditions:', error);
    return { success: false, error: 'Failed to apply starting conditions' };
  }
}
