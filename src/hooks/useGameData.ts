import { useEffect, useState } from 'react';
import type { Facility } from '@/lib/types/types';
import {
  initializeGameData,
  subscribeFacilities,
  subscribeFacility,
  getFacilities as getSyncFacilities,
  getFacility as getSyncFacility,
  refreshFacilities,
} from '@/lib/services/core/gameData';
import { getFacilitiesByCompanyId, getFacilityById } from '@/lib/database';

/**
 * Hook to subscribe to all facilities for a company
 * Uses centralized game data store for efficient realtime updates
 */
export function useFacilities(companyId: string | null) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!companyId) {
      setFacilities([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Initialize game data for this company
    initializeGameData(companyId);

    // Initial load
    const loadInitial = async () => {
      try {
        const data = await getFacilitiesByCompanyId(companyId);
        if (isMounted) {
          setFacilities(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading facilities:', err);
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadInitial();

    // Subscribe to updates
    const unsubscribe = subscribeFacilities(companyId, (_cId, updatedFacilities) => {
      if (isMounted) {
        setFacilities(updatedFacilities);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [companyId]);

  return {
    facilities,
    isLoading,
    error,
    refetch: () => {
      if (companyId) {
        refreshFacilities(companyId);
      }
    },
  };
}

/**
 * Hook to subscribe to a single facility
 * Uses centralized game data store for efficient realtime updates
 */
export function useFacility(facilityId: string | null) {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!facilityId) {
      setFacility(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Initial load
    const loadInitial = async () => {
      try {
        const data = await getFacilityById(facilityId);
        if (isMounted) {
          setFacility(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading facility:', err);
        if (isMounted) {
          setError(err as Error);
          setFacility(null);
          setIsLoading(false);
        }
      }
    };

    loadInitial();

    // Subscribe to updates
    const unsubscribe = subscribeFacility(facilityId, (updatedFacility) => {
      if (isMounted) {
        setFacility(updatedFacility);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [facilityId]);

  return {
    facility,
    isLoading,
    error,
    refetch: async () => {
      if (facilityId) {
        try {
          const data = await getFacilityById(facilityId);
          setFacility(data);
        } catch (err) {
          setError(err as Error);
        }
      }
    },
  };
}

