import { supabase } from '@/lib/utils/supabase';
import type { ResourceId } from '@/lib/types/types';

/**
 * Market Listing Status
 */
export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired';

/**
 * Database record interface for market listings
 */
export interface DbMarketListingRecord {
  id: string;
  facility_id: string;
  company_id: string;
  resource_id: ResourceId;
  quantity: number;
  price_per_unit: number;
  listing_status: ListingStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Market Listing interface (frontend format)
 */
export interface MarketListing {
  id: string;
  facilityId: string;
  companyId: string;
  resourceId: ResourceId;
  quantity: number;
  pricePerUnit: number;
  listingStatus: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert database record to MarketListing interface
 */
function dbRecordToListing(record: DbMarketListingRecord): MarketListing {
  return {
    id: record.id,
    facilityId: record.facility_id,
    companyId: record.company_id,
    resourceId: record.resource_id,
    quantity: record.quantity,
    pricePerUnit: record.price_per_unit,
    listingStatus: record.listing_status,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

/**
 * Convert MarketListing to database record format
 */
function listingToDbRecord(
  listing: Omit<MarketListing, 'id' | 'createdAt' | 'updatedAt'>
): Omit<DbMarketListingRecord, 'id' | 'created_at' | 'updated_at'> {
  return {
    facility_id: listing.facilityId,
    company_id: listing.companyId,
    resource_id: listing.resourceId,
    quantity: listing.quantity,
    price_per_unit: listing.pricePerUnit,
    listing_status: listing.listingStatus,
  };
}

/**
 * Get all active listings from the marketplace
 */
export async function getActiveMarketListings(): Promise<MarketListing[]> {
  try {
    const { data, error } = await supabase
      .from('market_listings')
      .select('*')
      .eq('listing_status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active market listings:', error);
      throw new Error(`Failed to fetch market listings: ${error.message}`);
    }

    return (data || []).map(dbRecordToListing);
  } catch (error: any) {
    console.error('Get active market listings error:', error);
    throw error;
  }
}

/**
 * Get active listings for a specific resource
 */
export async function getActiveListingsByResource(resourceId: ResourceId): Promise<MarketListing[]> {
  try {
    const { data, error } = await supabase
      .from('market_listings')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('listing_status', 'active')
      .order('price_per_unit', { ascending: true }); // Cheapest first

    if (error) {
      console.error(`Error fetching listings for resource ${resourceId}:`, error);
      throw new Error(`Failed to fetch listings: ${error.message}`);
    }

    return (data || []).map(dbRecordToListing);
  } catch (error: any) {
    console.error('Get listings by resource error:', error);
    throw error;
  }
}

/**
 * Get all listings for a facility (all statuses)
 */
export async function getListingsByFacilityId(facilityId: string): Promise<MarketListing[]> {
  try {
    const { data, error } = await supabase
      .from('market_listings')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching listings for facility ${facilityId}:`, error);
      throw new Error(`Failed to fetch facility listings: ${error.message}`);
    }

    return (data || []).map(dbRecordToListing);
  } catch (error: any) {
    console.error('Get listings by facility error:', error);
    throw error;
  }
}

/**
 * Get all listings for a company (all statuses)
 */
export async function getListingsByCompanyId(companyId: string): Promise<MarketListing[]> {
  try {
    const { data, error } = await supabase
      .from('market_listings')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching listings for company ${companyId}:`, error);
      throw new Error(`Failed to fetch company listings: ${error.message}`);
    }

    return (data || []).map(dbRecordToListing);
  } catch (error: any) {
    console.error('Get listings by company error:', error);
    throw error;
  }
}

/**
 * Get a single listing by ID
 */
export async function getListingById(listingId: string): Promise<MarketListing | null> {
  try {
    const { data, error } = await supabase
      .from('market_listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error(`Error fetching listing ${listingId}:`, error);
      throw new Error(`Failed to fetch listing: ${error.message}`);
    }

    return data ? dbRecordToListing(data) : null;
  } catch (error: any) {
    console.error('Get listing by ID error:', error);
    throw error;
  }
}

/**
 * Create a new market listing
 */
export async function createMarketListing(
  listing: Omit<MarketListing, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MarketListing> {
  try {
    const dbRecord = listingToDbRecord(listing);

    const { data, error } = await supabase
      .from('market_listings')
      .insert(dbRecord)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase create listing error:', error);
      throw new Error(`Failed to create listing: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create listing: No data returned');
    }

    return dbRecordToListing(data);
  } catch (error: any) {
    console.error('Create market listing error:', error);
    throw error;
  }
}

/**
 * Update a market listing
 */
export async function updateMarketListing(
  listingId: string,
  updates: Partial<Omit<MarketListing, 'id' | 'facilityId' | 'companyId' | 'createdAt' | 'updatedAt'>>
): Promise<MarketListing> {
  try {
    const dbUpdates: Partial<DbMarketListingRecord> = {};

    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.pricePerUnit !== undefined) dbUpdates.price_per_unit = updates.pricePerUnit;
    if (updates.listingStatus !== undefined) dbUpdates.listing_status = updates.listingStatus;
    if (updates.resourceId !== undefined) dbUpdates.resource_id = updates.resourceId;

    const { data, error } = await supabase
      .from('market_listings')
      .update(dbUpdates)
      .eq('id', listingId)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase update listing error:', error);
      throw new Error(`Failed to update listing: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to update listing: No data returned');
    }

    return dbRecordToListing(data);
  } catch (error: any) {
    console.error('Update market listing error:', error);
    throw error;
  }
}

/**
 * Cancel a market listing (set status to 'cancelled')
 */
export async function cancelMarketListing(listingId: string): Promise<MarketListing> {
  return updateMarketListing(listingId, { listingStatus: 'cancelled' });
}

/**
 * Mark a listing as sold
 */
export async function markListingAsSold(listingId: string): Promise<MarketListing> {
  return updateMarketListing(listingId, { listingStatus: 'sold' });
}

/**
 * Delete a market listing permanently
 */
export async function deleteMarketListing(listingId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('market_listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      console.error('Supabase delete listing error:', error);
      throw new Error(`Failed to delete listing: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Delete market listing error:', error);
    throw error;
  }
}

/**
 * Batch create multiple listings for a facility
 * Useful when a facility wants to list multiple resources at once
 */
export async function batchCreateListings(
  listings: Array<Omit<MarketListing, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<MarketListing[]> {
  try {
    const dbRecords = listings.map(listingToDbRecord);

    const { data, error } = await supabase
      .from('market_listings')
      .insert(dbRecords)
      .select('*');

    if (error) {
      console.error('Supabase batch create listings error:', error);
      throw new Error(`Failed to create listings: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create listings: No data returned');
    }

    return data.map(dbRecordToListing);
  } catch (error: any) {
    console.error('Batch create listings error:', error);
    throw error;
  }
}

/**
 * Cancel all active listings for a facility
 */
export async function cancelAllFacilityListings(facilityId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('market_listings')
      .update({ listing_status: 'cancelled' })
      .eq('facility_id', facilityId)
      .eq('listing_status', 'active')
      .select('id');

    if (error) {
      console.error('Supabase cancel facility listings error:', error);
      throw new Error(`Failed to cancel listings: ${error.message}`);
    }

    return data?.length || 0;
  } catch (error: any) {
    console.error('Cancel all facility listings error:', error);
    throw error;
  }
}

