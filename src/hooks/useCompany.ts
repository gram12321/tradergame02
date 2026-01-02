import { useState, useEffect } from 'react';
import { supabase } from '@/lib/utils/supabase';
import { Company, getCompanyById } from '@/lib/database';

/**
 * Custom hook to fetch and track a company with real-time updates
 * Subscribes to company changes in the database
 */
export function useCompany(companyId: string | null) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!companyId) {
      setCompany(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchCompany = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCompanyById(companyId);
        if (isMounted) {
          setCompany(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch company'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCompany();

    // Set up real-time subscription to company changes
    const channel = supabase
      .channel('company-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${companyId}`,
        },
        () => {
          // Refetch on any change
          fetchCompany();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [companyId]);

  return {
    company,
    isLoading,
    error,
  };
}
