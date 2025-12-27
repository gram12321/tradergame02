import { getGameState, updateGameState } from '../core/gameState';
import type { Transaction } from '@/lib/types/types';
import { GAME_INITIALIZATION } from '@/lib/constants';
import { DAYS_PER_MONTH, MONTHS_PER_YEAR } from '@/lib/constants/timeConstants';
import { CAPITAL_FLOW_TRANSACTION_CATEGORIES } from '@/lib/constants/financeConstants';
import { getCurrentCompanyId } from '../core/gameState';
import { triggerGameUpdate } from '../../../hooks/useGameUpdates';
import { companyService } from '../user/companyService';
import { insertTransaction as insertTransactionDB, loadTransactions as loadTransactionsDB, type TransactionData } from '@/lib/database';
import { calculateAbsoluteDays } from '@/lib/utils/utils';

interface FinancialData {
  income: number;
  expenses: number;
  netIncome: number;
  incomeDetails: { description: string; amount: number }[];
  expenseDetails: { description: string; amount: number }[];
  cashMoney: number;
  totalAssets: number;
  fixedAssets: number;
  currentAssets: number;
  buildingsValue: number;

}

let transactionsCache: Transaction[] = [];
let transactionsLoadPromise: Promise<Transaction[]> | null = null; // Promise-based cache for parallel calls

// Add a new transaction to the system
export const addTransaction = async (
  amount: number,
  description: string,
  category: string,
  recurring = false,
  companyId?: string
): Promise<string> => {
  try {
    if (!companyId) {
      companyId = getCurrentCompanyId();
    }
    
    let currentMoney = 0;
    if (companyId) {
      const company = await companyService.getCompany(companyId);
      if (company) {
        currentMoney = company.money;
      }
    } else {
      const gameState = getGameState();
      currentMoney = gameState.money || 0;
    }
    
    const newMoney = currentMoney + amount;
    
    const gameState = getGameState();
    
    const transactionData: TransactionData = {
      company_id: companyId,
      amount,
      description,
      category,
      recurring,
      money: newMoney,
      day: gameState.day || GAME_INITIALIZATION.STARTING_DAY,
      month: gameState.month || GAME_INITIALIZATION.STARTING_MONTH,
      year: gameState.year || GAME_INITIALIZATION.STARTING_YEAR
    };
    
    await updateGameState({ money: newMoney });
    
    triggerGameUpdate();
    
    const result = await insertTransactionDB(transactionData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to insert transaction');
    }
    
    const newTransaction: Transaction = {
      id: result.data.id,
      date: {
        day: result.data.day,
        month: result.data.month,
        year: result.data.year
      },
      amount: result.data.amount,
      description: result.data.description,
      category: result.data.category,
      recurring: result.data.recurring,
      money: result.data.money
    };
    
    transactionsCache.push(newTransaction);
    transactionsLoadPromise = null; // Invalidate promise cache when new transaction is added
    
    transactionsCache.sort((a, b) => {
      if (a.date.year !== b.date.year) return b.date.year - a.date.year;
      if (a.date.month !== b.date.month) return b.date.month - a.date.month;
      if (a.date.day !== b.date.day) return b.date.day - a.date.day;
      // For same day transactions, sort by ID (newer transactions have higher IDs)
      return b.id.localeCompare(a.id);
    });
    
    return result.data.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Load transactions from database
// OPTIMIZATION: Uses promise-based caching to prevent parallel database calls
export const loadTransactions = async (): Promise<Transaction[]> => {
  // If there's already a load in progress, return that promise
  if (transactionsLoadPromise) {
    return transactionsLoadPromise;
  }
  
  // If cache is populated, return it immediately
  if (transactionsCache.length > 0) {
    return transactionsCache;
  }
  
  // Start loading and cache the promise
  transactionsLoadPromise = (async () => {
    try {
      const transactions = await loadTransactionsDB();
      transactionsCache = transactions;
      transactionsLoadPromise = null; // Clear promise cache after completion
      return transactions;
    } catch (error) {
      console.error('Error loading transactions:', error);
      transactionsLoadPromise = null; // Clear promise cache on error
      return [];
    }
  })();
  
  return transactionsLoadPromise;
};

// Get transactions from cache or load from Supabase if cache is empty
export const getTransactions = (): Transaction[] => {
  if (transactionsCache.length === 0) {
    loadTransactions().catch(console.error);
    return [];
  }
  
  return transactionsCache;
};

// Clear transactions cache (useful when transactions are modified externally)
export const clearTransactionsCache = (): void => {
  transactionsCache = [];
  transactionsLoadPromise = null;
};

// Calculate company value (total assets - total liabilities)
export const calculateCompanyValue = async (): Promise<number> => {
  try {
    const financialData = await calculateFinancialData('yearly');
    // Loan system removed - no outstanding loans to subtract
    return financialData.totalAssets;
  } catch (error) {
    console.error('Error calculating company value:', error);
    return 0;
  }
};

// Legacy export for backwards compatibility (deprecated - use calculateCompanyValue)
export const calculateNetWorth = calculateCompanyValue;

export const calculateTotalAssets = async (): Promise<number> => {
  try {
    const financialData = await calculateFinancialData('yearly');
    return financialData.totalAssets;
  } catch (error) {
    console.error('Error calculating total assets:', error);
    return 0;
  }
};

// Calculate financial data for income statement and balance sheet
export const calculateFinancialData = async (
  period: 'daily' | 'monthly' | 'yearly' | 'all',
  options: { day?: number; month?: number; year?: number } = {}
): Promise<FinancialData> => {
  const gameState = getGameState();
  
  const transactions = await loadTransactions();
  
  const currentDate = {
    day: gameState.day || GAME_INITIALIZATION.STARTING_DAY,
    month: gameState.month || GAME_INITIALIZATION.STARTING_MONTH,
    year: gameState.year || GAME_INITIALIZATION.STARTING_YEAR
  };
  
  const filterDate = {
    day: options.day ?? currentDate.day,
    month: options.month ?? currentDate.month,
    year: options.year ?? currentDate.year
  };
  
  const filteredTransactions = transactions.filter(transaction =>
    filterTransactionByPeriod(transaction, period, filterDate, options)
  );
  
  let income = 0;
  let expenses = 0;
  const incomeDetails: { description: string; amount: number }[] = [];
  const expenseDetails: { description: string; amount: number }[] = [];
  
  const categorizedTransactions: Record<string, { total: number; transactions: Transaction[] }> = {};
  
  filteredTransactions.forEach(transaction => {
    const isCapitalFlow = CAPITAL_FLOW_TRANSACTION_CATEGORIES.has(transaction.category);

    if (!isCapitalFlow) {
      if (!categorizedTransactions[transaction.category]) {
        categorizedTransactions[transaction.category] = { total: 0, transactions: [] };
      }
      
      categorizedTransactions[transaction.category].total += transaction.amount;
      categorizedTransactions[transaction.category].transactions.push(transaction);
    }
    
    if (!isCapitalFlow) {
      if (transaction.amount >= 0) {
        income += transaction.amount;
      } else {
        expenses += Math.abs(transaction.amount);
      }
    }
  });
  
  Object.entries(categorizedTransactions).forEach(([category, data]) => {
    if (data.total >= 0) {
      incomeDetails.push({
        description: category,
        amount: data.total
      });
    } else {
      expenseDetails.push({
        description: category,
        amount: Math.abs(data.total)
      });
    }
  });
  
  incomeDetails.sort((a, b) => b.amount - a.amount);
  expenseDetails.sort((a, b) => b.amount - a.amount);
  
  const buildingsValue = 0;
  
  // Wine/vineyard asset calculations removed
  const cashMoney = gameState.money || 0;
  const fixedAssets = buildingsValue;
  const currentAssets = 0;
  const totalAssets = cashMoney + fixedAssets + currentAssets;
  
  return {
    income,
    expenses,
    netIncome: income - expenses,
    incomeDetails,
    expenseDetails,
    cashMoney,
    totalAssets,
    fixedAssets,
    currentAssets,
    buildingsValue
  };
};

/**
 * Subtract days from a GameDate, returning the resulting date
 */
function subtractDaysFromGameDate(
  date: { day: number; month: number; year: number },
  daysToSubtract: number
): { day: number; month: number; year: number } {
  // Convert to absolute days from game start
  const currentAbsoluteDays = calculateAbsoluteDays(
    date.day,
    date.month,
    date.year,
    GAME_INITIALIZATION.STARTING_DAY,
    GAME_INITIALIZATION.STARTING_MONTH,
    GAME_INITIALIZATION.STARTING_YEAR
  );
  
  // Subtract days
  const targetAbsoluteDays = Math.max(1, currentAbsoluteDays - daysToSubtract);
  
  // Convert back to GameDate
  const targetYear = GAME_INITIALIZATION.STARTING_YEAR + Math.floor((targetAbsoluteDays - 1) / (DAYS_PER_MONTH * MONTHS_PER_YEAR));
  const daysIntoYear = ((targetAbsoluteDays - 1) % (DAYS_PER_MONTH * MONTHS_PER_YEAR));
  const targetMonth = Math.floor(daysIntoYear / DAYS_PER_MONTH) + 1;
  const targetDay = (daysIntoYear % DAYS_PER_MONTH) + 1;
  
  return {
    day: targetDay,
    month: targetMonth,
    year: targetYear
  };
}

/**
 * Check if a transaction date is within a date range (inclusive)
 */
function isTransactionInDateRange(
  transaction: Transaction,
  startDate: { day: number; month: number; year: number },
  endDate: { day: number; month: number; year: number }
): boolean {
  const transAbsoluteDays = calculateAbsoluteDays(
    transaction.date.day,
    transaction.date.month,
    transaction.date.year,
    GAME_INITIALIZATION.STARTING_DAY,
    GAME_INITIALIZATION.STARTING_MONTH,
    GAME_INITIALIZATION.STARTING_YEAR
  );
  
  const startAbsoluteDays = calculateAbsoluteDays(
    startDate.day,
    startDate.month,
    startDate.year,
    GAME_INITIALIZATION.STARTING_DAY,
    GAME_INITIALIZATION.STARTING_MONTH,
    GAME_INITIALIZATION.STARTING_YEAR
  );
  
  const endAbsoluteDays = calculateAbsoluteDays(
    endDate.day,
    endDate.month,
    endDate.year,
    GAME_INITIALIZATION.STARTING_DAY,
    GAME_INITIALIZATION.STARTING_MONTH,
    GAME_INITIALIZATION.STARTING_YEAR
  );
  
  return transAbsoluteDays >= startAbsoluteDays && transAbsoluteDays <= endAbsoluteDays;
}

/**
 * Filter transactions for the last N days (rolling window)
 */
function filterTransactionsLastNDays(
  transactions: Transaction[],
  currentDate: { day: number; month: number; year: number },
  daysBack: number
): Transaction[] {
  const startDate = subtractDaysFromGameDate(currentDate, daysBack);
  return transactions.filter(transaction => 
    isTransactionInDateRange(transaction, startDate, currentDate)
  );
}

/**
 * Calculate financial data for the last N days (rolling window)
 * More efficient than calling calculateFinancialData multiple times
 */
export async function calculateFinancialDataRollingNDays(
  daysBack: number = 168 // Default: ~7 months (approximately equivalent to 48 weeks)
): Promise<FinancialData> {
  const gameState = getGameState();
  const currentDate = {
    day: gameState.day || GAME_INITIALIZATION.STARTING_DAY,
    month: gameState.month || GAME_INITIALIZATION.STARTING_MONTH,
    year: gameState.year || GAME_INITIALIZATION.STARTING_YEAR
  };
  
  const transactions = await loadTransactions();
  
  // Filter transactions for the rolling window
  const filteredTransactions = filterTransactionsLastNDays(transactions, currentDate, daysBack);
  
  let income = 0;
  let expenses = 0;
  const incomeDetails: { description: string; amount: number }[] = [];
  const expenseDetails: { description: string; amount: number }[] = [];
  
  const categorizedTransactions: Record<string, { total: number; transactions: Transaction[] }> = {};
  
  filteredTransactions.forEach(transaction => {
    const isCapitalFlow = CAPITAL_FLOW_TRANSACTION_CATEGORIES.has(transaction.category);

    if (!isCapitalFlow) {
      if (!categorizedTransactions[transaction.category]) {
        categorizedTransactions[transaction.category] = { total: 0, transactions: [] };
      }
      
      categorizedTransactions[transaction.category].total += transaction.amount;
      categorizedTransactions[transaction.category].transactions.push(transaction);
    }
    
    if (!isCapitalFlow) {
      if (transaction.amount >= 0) {
        income += transaction.amount;
      } else {
        expenses += Math.abs(transaction.amount);
      }
    }
  });
  
  Object.entries(categorizedTransactions).forEach(([category, data]) => {
    if (data.total >= 0) {
      incomeDetails.push({
        description: category,
        amount: data.total
      });
    } else {
      expenseDetails.push({
        description: category,
        amount: Math.abs(data.total)
      });
    }
  });
  
  incomeDetails.sort((a, b) => b.amount - a.amount);
  expenseDetails.sort((a, b) => b.amount - a.amount);
  
  // Note: Assets are current snapshot values, not historical, so we use current values
  const buildingsValue = 0;
  
  // Note: Asset calculations removed as they reference wine/vineyard systems
  const cashMoney = gameState.money || 0;
  const fixedAssets = buildingsValue;
  const currentAssets = 0;
  const totalAssets = cashMoney + fixedAssets + currentAssets;
  
  return {
    income,
    expenses,
    netIncome: income - expenses,
    incomeDetails,
    expenseDetails,
    cashMoney,
    totalAssets,
    fixedAssets,
    currentAssets,
    buildingsValue
  };
}

// Helper function to filter transactions by time period
function filterTransactionByPeriod(
  transaction: Transaction,
  period: 'daily' | 'monthly' | 'yearly' | 'all',
  currentDate: { day: number; month: number; year: number },
  options: { day?: number; month?: number; year?: number }
): boolean {
  switch (period) {
    case 'daily':
      return transaction.date.day === (options.day ?? currentDate.day) &&
             transaction.date.month === (options.month ?? currentDate.month) &&
             transaction.date.year === (options.year ?? currentDate.year);
    case 'monthly':
      return transaction.date.month === (options.month ?? currentDate.month) &&
             transaction.date.year === (options.year ?? currentDate.year);
    case 'yearly':
      return transaction.date.year === (options.year ?? currentDate.year);
    case 'all':
      return true;
    default:
      return false;
  }
}
