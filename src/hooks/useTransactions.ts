import { useState, useEffect } from 'react';
import { supabase } from '@/lib/utils/supabase';
import { Transaction, getTransactionsByCompanyId } from '@/lib/database';

/**
 * Custom hook to fetch transactions for a company
 * Supports real-time updates
 */
export function useTransactions(companyId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!companyId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTransactionsByCompanyId(companyId);
        if (isMounted) {
          setTransactions(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTransactions();

    // Set up real-time subscription
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          // Refetch on any change
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [companyId]);

  return {
    transactions,
    isLoading,
    error,
  };
}

