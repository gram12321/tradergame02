import { supabase } from '@/lib/utils/supabase';

/**
 * Transaction Database Operations
 * Handles all direct database operations for financial transactions
 */

/**
 * Database record interface for transactions
 */
export interface DbTransactionRecord {
  id: string;
  company_id: string;
  amount: number;
  description: string;
  category: string;
  balance_after: number;
  game_day: number;
  game_month: number;
  game_year: number;
  game_tick: number;
  created_at: string;
}

/**
 * Transaction interface (frontend format)
 */
export interface Transaction {
  id: string;
  companyId: string;
  amount: number;
  description: string;
  category: string;
  balanceAfter: number;
  gameDate: {
    day: number;
    month: number;
    year: number;
    tick: number;
  };
  createdAt: string;
}

/**
 * Convert database record to Transaction interface
 */
function dbRecordToTransaction(record: DbTransactionRecord): Transaction {
  return {
    id: record.id,
    companyId: record.company_id,
    amount: record.amount,
    description: record.description,
    category: record.category,
    balanceAfter: record.balance_after,
    gameDate: {
      day: record.game_day,
      month: record.game_month,
      year: record.game_year,
      tick: record.game_tick,
    },
    createdAt: record.created_at,
  };
}

/**
 * Convert Transaction to database record format
 */
function transactionToDbRecord(
  transaction: Omit<Transaction, 'id' | 'createdAt'>
): Omit<DbTransactionRecord, 'id' | 'created_at'> {
  return {
    company_id: transaction.companyId,
    amount: transaction.amount,
    description: transaction.description,
    category: transaction.category,
    balance_after: transaction.balanceAfter,
    game_day: transaction.gameDate.day,
    game_month: transaction.gameDate.month,
    game_year: transaction.gameDate.year,
    game_tick: transaction.gameDate.tick,
  };
}

/**
 * Get all transactions for a company
 * Sorted by date (newest first)
 */
export async function getTransactionsByCompanyId(companyId: string): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', companyId)
      .order('game_year', { ascending: false })
      .order('game_month', { ascending: false })
      .order('game_day', { ascending: false })
      .order('game_tick', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return (data || []).map(dbRecordToTransaction);
  } catch (error: any) {
    console.error('Get transactions error:', error);
    throw error;
  }
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error(`Error fetching transaction ${transactionId}:`, error);
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }

    return data ? dbRecordToTransaction(data) : null;
  } catch (error: any) {
    console.error('Get transaction by ID error:', error);
    throw error;
  }
}

/**
 * Create a new transaction
 * This is the primary way to record financial activity
 */
export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'createdAt'>
): Promise<Transaction> {
  try {
    const dbRecord = transactionToDbRecord(transaction);

    const { data, error } = await supabase
      .from('transactions')
      .insert(dbRecord)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase create transaction error:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create transaction: No data returned');
    }

    return dbRecordToTransaction(data);
  } catch (error: any) {
    console.error('Create transaction error:', error);
    throw error;
  }
}

/**
 * Get transactions by category for a company
 */
export async function getTransactionsByCategory(
  companyId: string,
  category: string
): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', companyId)
      .eq('category', category)
      .order('game_year', { ascending: false })
      .order('game_month', { ascending: false })
      .order('game_day', { ascending: false })
      .order('game_tick', { ascending: false });

    if (error) {
      console.error(`Error fetching transactions for category ${category}:`, error);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return (data || []).map(dbRecordToTransaction);
  } catch (error: any) {
    console.error('Get transactions by category error:', error);
    throw error;
  }
}

/**
 * Get transactions for a specific game date range
 */
export async function getTransactionsByDateRange(
  companyId: string,
  startDate: { year: number; month: number; day: number },
  endDate: { year: number; month: number; day: number }
): Promise<Transaction[]> {
  try {
    // This is a simplified query - for production you'd want more sophisticated date filtering
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', companyId)
      .gte('game_year', startDate.year)
      .lte('game_year', endDate.year)
      .order('game_year', { ascending: false })
      .order('game_month', { ascending: false })
      .order('game_day', { ascending: false })
      .order('game_tick', { ascending: false });

    if (error) {
      console.error('Error fetching transactions by date range:', error);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    // Filter by exact date range in application code
    const transactions = (data || []).map(dbRecordToTransaction);
    
    return transactions.filter(t => {
      const tDate = t.gameDate;
      
      // Check if within start date
      if (tDate.year < startDate.year) return false;
      if (tDate.year === startDate.year) {
        if (tDate.month < startDate.month) return false;
        if (tDate.month === startDate.month && tDate.day < startDate.day) return false;
      }
      
      // Check if within end date
      if (tDate.year > endDate.year) return false;
      if (tDate.year === endDate.year) {
        if (tDate.month > endDate.month) return false;
        if (tDate.month === endDate.month && tDate.day > endDate.day) return false;
      }
      
      return true;
    });
  } catch (error: any) {
    console.error('Get transactions by date range error:', error);
    throw error;
  }
}

/**
 * Get the most recent transaction for a company
 * Useful for getting current balance
 */
export async function getLatestTransaction(companyId: string): Promise<Transaction | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', companyId)
      .order('game_year', { ascending: false })
      .order('game_month', { ascending: false })
      .order('game_day', { ascending: false })
      .order('game_tick', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No transactions yet
      }
      console.error('Error fetching latest transaction:', error);
      throw new Error(`Failed to fetch latest transaction: ${error.message}`);
    }

    return data ? dbRecordToTransaction(data) : null;
  } catch (error: any) {
    console.error('Get latest transaction error:', error);
    throw error;
  }
}

/**
 * Get transaction count for a company
 */
export async function getTransactionCount(companyId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (error) {
      console.error('Error getting transaction count:', error);
      throw new Error(`Failed to get transaction count: ${error.message}`);
    }

    return count || 0;
  } catch (error: any) {
    console.error('Get transaction count error:', error);
    throw error;
  }
}

