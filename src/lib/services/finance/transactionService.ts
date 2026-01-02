import {
  createTransaction,
  getTransactionsByCompanyId,
  getLatestTransaction,
  getTransactionsByCategory,
  type Transaction,
} from '@/lib/database/finance/transactionsDB';
import { getCompanyByName, updateCompany } from '@/lib/database';
import { getGameState } from '../core/gameState';
import { GAME_INITIALIZATION } from '@/lib/constants';

/**
 * Transaction Service
 * Handles business logic for financial transactions
 * Manages money flow, balance tracking, and transaction history
 */

/**
 * Transaction categories for reporting and filtering
 */
export const TRANSACTION_CATEGORIES = {
  // Income categories
  SALES: 'sales',
  MARKET_SALE: 'market_sale',
  
  // Expense categories
  PURCHASE: 'purchase',
  MARKET_PURCHASE: 'market_purchase',
  
  // Capital flow (not included in income/expense calculations)
  STARTING_CAPITAL: 'starting_capital',
  
  // Other
  OTHER_INCOME: 'other_income',
  OTHER_EXPENSE: 'other_expense',
} as const;

/**
 * Categories that represent capital flow (not operational income/expense)
 * These don't affect profit/loss calculations
 */
export const CAPITAL_FLOW_CATEGORIES = new Set([
  TRANSACTION_CATEGORIES.STARTING_CAPITAL,
]);

/**
 * Create a transaction and update company balance
 * This is the primary function for recording financial activity
 */
export async function addTransaction(
  companyName: string,
  amount: number,
  description: string,
  category: string,
): Promise<Transaction> {
  try {
    // Get company
    const company = await getCompanyByName(companyName);
    if (!company) {
      throw new Error(`Company not found: ${companyName}`);
    }

    // Calculate new balance
    const newBalance = company.money + amount;

    // Update company balance
    await updateCompany(company.id, { money: newBalance });

    // Get current game state
    const gameState = getGameState();
    
    // Create transaction record
    const transaction = await createTransaction({
      companyId: company.id,
      amount,
      description,
      category,
      balanceAfter: newBalance,
      gameDate: {
        day: gameState.time.day,
        month: gameState.time.month,
        year: gameState.time.year,
        tick: gameState.time.tick,
      },
    });

    return transaction;
  } catch (error: any) {
    console.error('Add transaction error:', error);
    throw new Error(`Failed to add transaction: ${error.message || error}`);
  }
}

/**
 * Create starting capital transaction for a new company
 * Called automatically when a company is created
 */
export async function createStartingCapitalTransaction(
  companyName: string,
  amount: number = GAME_INITIALIZATION.STARTING_CAPITAL
): Promise<Transaction> {
  return addTransaction(
    companyName,
    amount,
    'Starting capital',
    TRANSACTION_CATEGORIES.STARTING_CAPITAL
  );
}

/**
 * Get all transactions for a company
 */
export async function getCompanyTransactions(companyName: string): Promise<Transaction[]> {
  try {
    const company = await getCompanyByName(companyName);
    if (!company) {
      throw new Error(`Company not found: ${companyName}`);
    }

    return getTransactionsByCompanyId(company.id);
  } catch (error: any) {
    console.error('Get company transactions error:', error);
    throw error;
  }
}

/**
 * Get current balance for a company
 * Returns the balance from the most recent transaction
 * Falls back to company.money if no transactions exist
 */
export async function getCurrentBalance(companyName: string): Promise<number> {
  try {
    const company = await getCompanyByName(companyName);
    if (!company) {
      throw new Error(`Company not found: ${companyName}`);
    }

    const latestTransaction = await getLatestTransaction(company.id);
    
    // If no transactions, return company money (should match)
    if (!latestTransaction) {
      return company.money;
    }

    return latestTransaction.balanceAfter;
  } catch (error: any) {
    console.error('Get current balance error:', error);
    throw error;
  }
}

/**
 * Get transactions by category for reporting
 */
export async function getTransactionsByType(
  companyName: string,
  category: string
): Promise<Transaction[]> {
  try {
    const company = await getCompanyByName(companyName);
    if (!company) {
      throw new Error(`Company not found: ${companyName}`);
    }

    return getTransactionsByCategory(company.id, category);
  } catch (error: any) {
    console.error('Get transactions by type error:', error);
    throw error;
  }
}

/**
 * Calculate financial summary for a company
 * Returns income, expenses, and net income
 * Excludes capital flow transactions
 */
export async function getFinancialSummary(companyName: string): Promise<{
  income: number;
  expenses: number;
  netIncome: number;
  balance: number;
  transactionCount: number;
}> {
  try {
    const transactions = await getCompanyTransactions(companyName);
    
    let income = 0;
    let expenses = 0;
    
    transactions.forEach(transaction => {
      // Skip capital flow transactions
      if (CAPITAL_FLOW_CATEGORIES.has(transaction.category as any)) {
        return;
      }
      
      if (transaction.amount > 0) {
        income += transaction.amount;
      } else {
        expenses += Math.abs(transaction.amount);
      }
    });
    
    const balance = await getCurrentBalance(companyName);
    
    return {
      income,
      expenses,
      netIncome: income - expenses,
      balance,
      transactionCount: transactions.length,
    };
  } catch (error: any) {
    console.error('Get financial summary error:', error);
    throw error;
  }
}

/**
 * Check if a company can afford a purchase
 */
export async function canAfford(companyName: string, amount: number): Promise<boolean> {
  try {
    const balance = await getCurrentBalance(companyName);
    return balance >= amount;
  } catch (error: any) {
    console.error('Can afford check error:', error);
    return false;
  }
}

/**
 * Process a purchase (negative transaction)
 * Returns null if company cannot afford it
 */
export async function processPurchase(
  companyName: string,
  amount: number,
  description: string,
  category: string = TRANSACTION_CATEGORIES.PURCHASE
): Promise<Transaction | null> {
  try {
    // Check if can afford
    const affordable = await canAfford(companyName, amount);
    if (!affordable) {
      return null;
    }

    // Create negative transaction
    return await addTransaction(
      companyName,
      -Math.abs(amount), // Ensure negative
      description,
      category
    );
  } catch (error: any) {
    console.error('Process purchase error:', error);
    throw error;
  }
}

/**
 * Process a sale (positive transaction)
 */
export async function processSale(
  companyName: string,
  amount: number,
  description: string,
  category: string = TRANSACTION_CATEGORIES.SALES
): Promise<Transaction> {
  try {
    return await addTransaction(
      companyName,
      Math.abs(amount), // Ensure positive
      description,
      category
    );
  } catch (error: any) {
    console.error('Process sale error:', error);
    throw error;
  }
}

