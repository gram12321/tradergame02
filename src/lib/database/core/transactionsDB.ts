import { supabase } from './supabase';
import { Transaction } from '../../types/types';
import { getCurrentCompanyName } from '../../services/core/gameState';
import { buildGameDate } from '../dbMapperUtils';
import { GAME_INITIALIZATION } from '@/lib/constants';

const TRANSACTIONS_TABLE = 'transactions';

/**
 * Transactions Database Operations
 * Basic CRUD operations for transaction data persistence
 */

export interface TransactionData {
  id?: string;
  company_name: string;
  amount: number;
  description: string;
  category: string;
  recurring: boolean;
  money: number;
  day: number;
  month: number;
  year: number;
}

/**
 * Map database row to Transaction
 */
function mapTransactionFromDB(row: any): Transaction {
  return {
    id: row.id,
    date: buildGameDate(row.day, row.month, row.year) || {
      day: GAME_INITIALIZATION.STARTING_DAY,
      month: GAME_INITIALIZATION.STARTING_MONTH,
      year: GAME_INITIALIZATION.STARTING_YEAR
    },
    amount: row.amount,
    description: row.description,
    category: row.category,
    recurring: row.recurring || false,
    money: row.money
  };
}

/**
 * Insert transaction
 */
export const insertTransaction = async (transactionData: TransactionData): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from(TRANSACTIONS_TABLE)
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error inserting transaction:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Load transactions
 */
export const loadTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from(TRANSACTIONS_TABLE)
      .select('*')
      .eq('company_name', getCurrentCompanyName());

    if (error) throw error;

    const transactions = (data || []).map(row => mapTransactionFromDB(row));

    // Sort by date (newest first)
    return transactions.sort((a, b) => {
      if (a.date.year !== b.date.year) return b.date.year - a.date.year;
      if (a.date.month !== b.date.month) return b.date.month - a.date.month;
      if (a.date.day !== b.date.day) return b.date.day - a.date.day;
      return b.id.localeCompare(a.id);
    });
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
};
