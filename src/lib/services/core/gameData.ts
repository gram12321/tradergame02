import type { Facility } from '@/lib/types/types';
import { supabase } from '@/lib/utils/supabase';
import { getFacilitiesByCompanyId } from '@/lib/database';

/**
 * Centralized game data store with realtime subscriptions
 * All game entities are stored here and updated via Supabase realtime
 */

// Game data state
interface GameData {
  facilities: Map<string, Facility[]>; // Map of companyId -> facilities
  lastUpdate: string;
}

let gameData: GameData = {
  facilities: new Map(),
  lastUpdate: new Date().toISOString(),
};

// Listeners for data changes
type FacilitiesListener = (companyId: string, facilities: Facility[]) => void;
type FacilityListener = (facility: Facility | null) => void;

let facilitiesListeners: Map<string, FacilitiesListener[]> = new Map();
let facilityListeners: Map<string, FacilityListener[]> = new Map();

// Subscription channels
let activeSubscriptions: Map<string, ReturnType<typeof supabase.channel>> = new Map();
let currentCompanyId: string | null = null;

/**
 * Initialize game data subscriptions for a company
 */
export function initializeGameData(companyId: string): void {
  if (currentCompanyId === companyId && activeSubscriptions.has(`facilities-${companyId}`)) {
    return;
  }

  // Cleanup old subscriptions if switching companies
  if (currentCompanyId && currentCompanyId !== companyId) {
    cleanupGameData();
  }

  currentCompanyId = companyId;

  // Load initial data
  loadFacilitiesForCompany(companyId);

  // Subscribe to facilities changes
  const facilitiesChannel = supabase
    .channel(`facilities-${companyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'facilities',
        filter: `company_id=eq.${companyId}`,
      },
      () => {
        // Reload facilities data on any change
        loadFacilitiesForCompany(companyId);
      }
    )
    .subscribe();

  activeSubscriptions.set(`facilities-${companyId}`, facilitiesChannel);
}

/**
 * Load facilities for a company and notify listeners
 */
async function loadFacilitiesForCompany(companyId: string): Promise<void> {
  try {
    const facilities = await getFacilitiesByCompanyId(companyId);
    
    // Update game data store
    gameData.facilities.set(companyId, facilities);
    gameData.lastUpdate = new Date().toISOString();

    // Notify all listeners for this company
    const listeners = facilitiesListeners.get(companyId) || [];
    listeners.forEach(listener => listener(companyId, facilities));

    // Notify individual facility listeners
    facilities.forEach(facility => {
      const facilityListenerList = facilityListeners.get(facility.id) || [];
      facilityListenerList.forEach(listener => listener(facility));
    });
  } catch (error) {
    console.error('Error loading facilities for company:', companyId, error);
  }
}

/**
 * Subscribe to facilities updates for a company
 */
export function subscribeFacilities(
  companyId: string,
  listener: FacilitiesListener
): () => void {
  // Add listener
  const listeners = facilitiesListeners.get(companyId) || [];
  listeners.push(listener);
  facilitiesListeners.set(companyId, listeners);

  // Send current data immediately if available
  const currentFacilities = gameData.facilities.get(companyId);
  if (currentFacilities) {
    listener(companyId, currentFacilities);
  }

  // Return unsubscribe function
  return () => {
    const listeners = facilitiesListeners.get(companyId) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    if (listeners.length === 0) {
      facilitiesListeners.delete(companyId);
    }
  };
}

/**
 * Subscribe to a single facility's updates
 */
export function subscribeFacility(
  facilityId: string,
  listener: FacilityListener
): () => void {
  // Add listener
  const listeners = facilityListeners.get(facilityId) || [];
  listeners.push(listener);
  facilityListeners.set(facilityId, listeners);

  // Send current data immediately if available
  for (const facilities of gameData.facilities.values()) {
    const facility = facilities.find(f => f.id === facilityId);
    if (facility) {
      listener(facility);
      break;
    }
  }

  // Return unsubscribe function
  return () => {
    const listeners = facilityListeners.get(facilityId) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    if (listeners.length === 0) {
      facilityListeners.delete(facilityId);
    }
  };
}

/**
 * Get current facilities for a company (synchronous)
 */
export function getFacilities(companyId: string): Facility[] {
  return gameData.facilities.get(companyId) || [];
}

/**
 * Get a single facility (synchronous)
 */
export function getFacility(facilityId: string): Facility | null {
  for (const facilities of gameData.facilities.values()) {
    const facility = facilities.find(f => f.id === facilityId);
    if (facility) return facility;
  }
  return null;
}

/**
 * Force refresh facilities for a company
 */
export async function refreshFacilities(companyId: string): Promise<void> {
  await loadFacilitiesForCompany(companyId);
}

/**
 * Refresh facilities for all active companies
 * Called after game tick to ensure UI updates
 */
export async function refreshAllActiveFacilities(): Promise<void> {
  const companyIds = Array.from(gameData.facilities.keys());
  
  await Promise.all(
    companyIds.map(companyId => loadFacilitiesForCompany(companyId))
  );
}

/**
 * Cleanup all subscriptions and clear data
 */
export function cleanupGameData(): void {
  // Unsubscribe from all channels
  activeSubscriptions.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  activeSubscriptions.clear();

  // Clear listeners
  facilitiesListeners.clear();
  facilityListeners.clear();

  // Clear data
  gameData.facilities.clear();
  
  currentCompanyId = null;
}

/**
 * Get current company ID
 */
export function getCurrentCompanyId(): string | null {
  return currentCompanyId;
}

