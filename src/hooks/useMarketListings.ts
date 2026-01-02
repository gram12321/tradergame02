import { useEffect, useState } from 'react';
import type { ResourceId } from '@/lib/types/types';
import { getActiveMarketListings, getActiveListingsByResource, type MarketListing } from '@/lib/database';
import { supabase } from '@/lib/utils/supabase';

/**
 * Hook to fetch and subscribe to all active market listings
 * Uses Supabase realtime for automatic updates
 */
export function useMarketListings() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Initial load
    const loadInitial = async () => {
      try {
        const data = await getActiveMarketListings();
        if (isMounted) {
          setListings(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading market listings:', err);
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadInitial();

    // Subscribe to market_listings changes for realtime updates
    const channel = supabase
      .channel('market-listings-all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_listings',
        },
        () => {
          // Reload listings on any change
          if (isMounted) {
            loadInitial();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    listings,
    isLoading,
    error,
    refetch: async () => {
      try {
        const data = await getActiveMarketListings();
        setListings(data);
      } catch (err) {
        setError(err as Error);
      }
    },
  };
}

/**
 * Hook to fetch and subscribe to market listings for a specific resource
 * Uses Supabase realtime for automatic updates
 */
export function useMarketListingsByResource(resourceId: ResourceId | null) {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!resourceId) {
      setListings([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Initial load
    const loadInitial = async () => {
      try {
        const data = await getActiveListingsByResource(resourceId);
        if (isMounted) {
          setListings(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error(`Error loading listings for resource ${resourceId}:`, err);
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadInitial();

    // Subscribe to market_listings changes for this resource
    const channel = supabase
      .channel(`market-listings-${resourceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_listings',
          filter: `resource_id=eq.${resourceId}`,
        },
        () => {
          // Reload listings on any change
          if (isMounted) {
            loadInitial();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [resourceId]);

  return {
    listings,
    isLoading,
    error,
    refetch: async () => {
      if (resourceId) {
        try {
          const data = await getActiveListingsByResource(resourceId);
          setListings(data);
        } catch (err) {
          setError(err as Error);
        }
      }
    },
  };
}

