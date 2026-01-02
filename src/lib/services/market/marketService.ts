import { 
  createMarketListing, 
  updateMarketListing, 
  cancelMarketListing,
  getListingsByFacilityId,
  getActiveMarketListings,
  getActiveListingsByResource,
  batchCreateListings,
  cancelAllFacilityListings,
  type MarketListing,
  type ListingStatus
} from '@/lib/database/market/marketListingsDB';
import { getFacilityById } from '@/lib/database';
import type { Facility, ResourceId } from '@/lib/types/types';

/**
 * Market Service
 * Handles business logic for marketplace operations
 * Validates inventory, processes transactions, and manages listings
 */

/**
 * Interface for creating a new listing from a facility
 */
export interface CreateListingRequest {
  facilityId: string;
  companyId: string;
  resourceId: ResourceId;
  quantity: number;
  pricePerUnit: number;
}

/**
 * Result of listing creation validation
 */
export interface ListingValidationResult {
  valid: boolean;
  error?: string;
  availableQuantity?: number;
}

/**
 * Validate if a facility can create a listing for a resource
 * Checks if facility has enough quantity in inventory
 */
export function validateListingCreation(
  facility: Facility,
  resourceId: ResourceId,
  quantity: number
): ListingValidationResult {
  // Check if facility has this resource in inventory
  const inventoryItem = facility.inventory.items.find(
    item => item.resourceId === resourceId
  );

  if (!inventoryItem) {
    return {
      valid: false,
      error: `Resource ${resourceId} not found in facility inventory`,
      availableQuantity: 0,
    };
  }

  // Check if facility has enough quantity
  if (inventoryItem.quantity < quantity) {
    return {
      valid: false,
      error: `Insufficient quantity. Available: ${inventoryItem.quantity}, Requested: ${quantity}`,
      availableQuantity: inventoryItem.quantity,
    };
  }

  // Check if quantity is positive
  if (quantity <= 0) {
    return {
      valid: false,
      error: 'Quantity must be greater than 0',
      availableQuantity: inventoryItem.quantity,
    };
  }

  return {
    valid: true,
    availableQuantity: inventoryItem.quantity,
  };
}

/**
 * Create a single market listing
 * Validates inventory and creates the listing
 * Note: This does NOT remove items from inventory until they are sold
 */
export async function createListing(
  request: CreateListingRequest
): Promise<MarketListing | null> {
  try {
    // Validate price
    if (request.pricePerUnit < 0) {
      throw new Error('Price per unit cannot be negative');
    }

    // Get facility to validate inventory
    const facility = await getFacilityById(request.facilityId);
    if (!facility) {
      throw new Error('Facility not found');
    }

    // Validate listing
    const validation = validateListingCreation(
      facility,
      request.resourceId,
      request.quantity
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Create listing
    const listing = await createMarketListing({
      facilityId: request.facilityId,
      companyId: request.companyId,
      resourceId: request.resourceId,
      quantity: request.quantity,
      pricePerUnit: request.pricePerUnit,
      listingStatus: 'active',
    });

    return listing;
  } catch (error: any) {
    console.error('Create listing error:', error);
    throw error;
  }
}

/**
 * Create multiple listings at once for a facility
 * Validates all listings before creating any
 */
export async function createMultipleListings(
  facilityId: string,
  companyId: string,
  listings: Array<{ resourceId: ResourceId; quantity: number; pricePerUnit: number }>
): Promise<MarketListing[]> {
  try {
    // Get facility to validate inventory
    const facility = await getFacilityById(facilityId);
    if (!facility) {
      throw new Error('Facility not found');
    }

    // Validate all listings first
    const validationErrors: string[] = [];
    for (const listing of listings) {
      if (listing.pricePerUnit < 0) {
        validationErrors.push(`${listing.resourceId}: Price cannot be negative`);
        continue;
      }

      const validation = validateListingCreation(
        facility,
        listing.resourceId,
        listing.quantity
      );

      if (!validation.valid) {
        validationErrors.push(`${listing.resourceId}: ${validation.error}`);
      }
    }

    // If any validation failed, don't create any listings
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed:\n${validationErrors.join('\n')}`);
    }

    // Create all listings
    const listingRequests = listings.map(listing => ({
      facilityId,
      companyId,
      resourceId: listing.resourceId,
      quantity: listing.quantity,
      pricePerUnit: listing.pricePerUnit,
      listingStatus: 'active' as ListingStatus,
    }));

    const createdListings = await batchCreateListings(listingRequests);

    return createdListings;
  } catch (error: any) {
    console.error('Create multiple listings error:', error);
    throw error;
  }
}

/**
 * Update an existing listing
 * Can update quantity and/or price
 * Validates new quantity against current inventory
 */
export async function updateListing(
  listingId: string,
  updates: { quantity?: number; pricePerUnit?: number }
): Promise<MarketListing> {
  try {
    // Validate updates
    if (updates.quantity !== undefined && updates.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (updates.pricePerUnit !== undefined && updates.pricePerUnit < 0) {
      throw new Error('Price per unit cannot be negative');
    }

    // Update listing
    const updatedListing = await updateMarketListing(listingId, updates);

    return updatedListing;
  } catch (error: any) {
    console.error('Update listing error:', error);
    throw error;
  }
}

/**
 * Cancel a listing
 * Sets status to 'cancelled' and makes it inactive
 */
export async function cancelListing(listingId: string): Promise<MarketListing> {
  try {
    const cancelledListing = await cancelMarketListing(listingId);

    return cancelledListing;
  } catch (error: any) {
    console.error('Cancel listing error:', error);
    throw error;
  }
}

/**
 * Cancel all active listings for a facility
 * Useful when a facility is being closed or needs to remove all listings
 */
export async function cancelAllListingsForFacility(facilityId: string): Promise<number> {
  try {
    const cancelledCount = await cancelAllFacilityListings(facilityId);

    return cancelledCount;
  } catch (error: any) {
    console.error('Cancel all facility listings error:', error);
    throw error;
  }
}

/**
 * Get all active listings from the marketplace
 */
export async function getAllActiveListings(): Promise<MarketListing[]> {
  return getActiveMarketListings();
}

/**
 * Get all active listings for a specific resource
 * Sorted by price (cheapest first)
 */
export async function getListingsForResource(resourceId: ResourceId): Promise<MarketListing[]> {
  return getActiveListingsByResource(resourceId);
}

/**
 * Get all listings for a facility (all statuses)
 */
export async function getFacilityListings(facilityId: string): Promise<MarketListing[]> {
  return getListingsByFacilityId(facilityId);
}

/**
 * Purchase from a market listing
 * Handles inventory transfer and payment
 * TODO: Implement when transaction/finance system is ready
 */
export async function purchaseFromListing(
  _listingId: string,
  _buyerFacilityId: string,
  _quantity: number
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement purchase logic
  // 1. Validate buyer facility exists and has space
  // 2. Validate buyer company has enough money
  // 3. Remove items from seller facility inventory
  // 4. Add items to buyer facility inventory
  // 5. Transfer money from buyer to seller
  // 6. Update or mark listing as sold
  // 7. Create transaction record
  
  return {
    success: false,
    error: 'Purchase functionality not yet implemented - requires transaction system',
  };
}

/**
 * Get marketplace statistics
 * Useful for analytics and UI display
 */
export async function getMarketplaceStats(): Promise<{
  totalActiveListings: number;
  uniqueResources: number;
  uniqueSellers: number;
}> {
  try {
    const listings = await getActiveMarketListings();

    const uniqueResources = new Set(listings.map(l => l.resourceId)).size;
    const uniqueSellers = new Set(listings.map(l => l.facilityId)).size;

    return {
      totalActiveListings: listings.length,
      uniqueResources,
      uniqueSellers,
    };
  } catch (error: any) {
    console.error('Get marketplace stats error:', error);
    throw error;
  }
}

