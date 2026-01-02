# Market System Implementation

## Overview

The market system allows facilities to list resources from their inventory for sale, and other players/companies to purchase those resources. This creates a player-to-player marketplace where supply and demand drive the economy.

## Key Concepts

- **Facility-Based Trading**: Players don't have personal inventories. Instead, each facility manages its own inventory and can list resources for sale.
- **Market Listings**: Resources listed for sale with quantity and price per unit.
- **Company Isolation**: Each listing is tied to both a facility and a company for proper scoping.

## Database Schema

### Table: `market_listings`

Created by running: `docs/sql_scripts/create_market_listings_table.sql`

**Columns:**
- `id` (UUID, Primary Key): Unique listing identifier
- `facility_id` (UUID, Foreign Key → facilities): The facility selling the resource
- `company_id` (UUID, Foreign Key → companies): The company that owns the facility
- `resource_id` (TEXT): The resource being sold (matches ResourceId type)
- `quantity` (INTEGER): Amount available for sale (must be > 0)
- `price_per_unit` (NUMERIC): Price per unit of resource (must be >= 0)
- `listing_status` (TEXT): Status of listing - 'active', 'sold', 'cancelled', or 'expired'
- `created_at` (TIMESTAMP): When the listing was created
- `updated_at` (TIMESTAMP): Last update timestamp (auto-updated)

**Indexes:**
- `idx_market_listings_facility_id`: Fast lookups by facility
- `idx_market_listings_company_id`: Fast lookups by company
- `idx_market_listings_resource_id`: Fast lookups by resource
- `idx_market_listings_status`: Fast status filtering
- `idx_market_listings_active_resource`: Optimized for active resource queries

**Row Level Security (RLS):**
- Anyone can view active listings (marketplace is public)
- Companies can view all their own listings (any status)
- Companies can create/update/delete their own listings only

## Architecture

### Database Layer: `src/lib/database/market/marketListingsDB.ts`

Handles all direct database operations for market listings.

**Key Functions:**
- `getActiveMarketListings()`: Get all active listings in the marketplace
- `getActiveListingsByResource(resourceId)`: Get active listings for a specific resource (sorted by price)
- `getListingsByFacilityId(facilityId)`: Get all listings for a facility (all statuses)
- `getListingsByCompanyId(companyId)`: Get all listings for a company (all statuses)
- `getListingById(listingId)`: Get a single listing by ID
- `createMarketListing(listing)`: Create a new listing
- `updateMarketListing(listingId, updates)`: Update an existing listing
- `cancelMarketListing(listingId)`: Cancel a listing (sets status to 'cancelled')
- `markListingAsSold(listingId)`: Mark listing as sold
- `deleteMarketListing(listingId)`: Permanently delete a listing
- `batchCreateListings(listings)`: Create multiple listings at once
- `cancelAllFacilityListings(facilityId)`: Cancel all active listings for a facility

### Service Layer: `src/lib/services/market/marketService.ts`

Handles business logic and validation for marketplace operations.

**Key Functions:**
- `validateListingCreation(facility, resourceId, quantity)`: Validates if a facility can create a listing
- `createListing(request)`: Create a single listing with validation
- `createMultipleListings(facilityId, companyId, listings)`: Create multiple listings at once
- `updateListing(listingId, updates)`: Update listing quantity/price
- `cancelListing(listingId)`: Cancel a listing
- `cancelAllListingsForFacility(facilityId)`: Cancel all listings for a facility
- `getAllActiveListings()`: Get all active marketplace listings
- `getListingsForResource(resourceId)`: Get listings for a specific resource
- `getFacilityListings(facilityId)`: Get all listings for a facility
- `getMarketplaceStats()`: Get marketplace statistics
- `purchaseFromListing()`: **TODO** - Not yet implemented (requires transaction system)

## User Interface Integration

### Facility Detail Page

The facility detail page (`src/components/pages/facility-detail.tsx`) now includes the ability to create market listings:

1. Navigate to the **Inventory** tab
2. For each resource in inventory:
   - Set "For Sale" quantity (limited to available inventory)
   - Set "Sale Price" per unit
3. Click "Create Market Listings" button to submit

**Features:**
- Validates quantities against available inventory
- Prevents negative prices
- Shows success/error toasts
- Resets form after successful creation
- Loading states during submission

## Usage Examples

### Creating Listings via Service Layer

```typescript
import { createListing, createMultipleListings } from '@/lib/services';

// Create a single listing
const listing = await createListing({
  facilityId: 'facility-uuid',
  companyId: 'company-uuid',
  resourceId: 'wheat',
  quantity: 100,
  pricePerUnit: 5.50,
});

// Create multiple listings at once
const listings = await createMultipleListings(
  'facility-uuid',
  'company-uuid',
  [
    { resourceId: 'wheat', quantity: 100, pricePerUnit: 5.50 },
    { resourceId: 'flour', quantity: 50, pricePerUnit: 8.00 },
  ]
);
```

### Querying Listings

```typescript
import { getAllActiveListings, getListingsForResource } from '@/lib/services';

// Get all active marketplace listings
const allListings = await getAllActiveListings();

// Get listings for a specific resource (sorted by price)
const wheatListings = await getListingsForResource('wheat');
// Returns listings sorted by price (cheapest first)
```

### Managing Listings

```typescript
import { updateListing, cancelListing } from '@/lib/services';

// Update listing quantity or price
await updateListing('listing-uuid', {
  quantity: 75,
  pricePerUnit: 6.00,
});

// Cancel a listing
await cancelListing('listing-uuid');
```

## Navigation Integration ✅

The marketplace is integrated into the main navigation:

**Files Updated**:
- `src/App.tsx`: Added marketplace route and component
- `src/components/layout/Header.tsx`: Added marketplace to navigation items
- `src/lib/utils/icons.tsx`: Added marketplace emoji (🛒)

**Access**: Click "Marketplace" in the main navigation bar

## Installation Steps

### 1. Create Database Table

Run the SQL script in your Supabase SQL Editor:

```bash
# File: docs/sql_scripts/create_market_listings_table.sql
```

This will:
- Create the `market_listings` table
- Set up indexes for performance
- Configure Row Level Security (RLS)
- Add update triggers for timestamps

### 2. Verify Imports

The barrel exports have been updated:
- `src/lib/database/index.ts` exports market database functions
- `src/lib/services/index.ts` exports market service functions

You can now import from:
```typescript
import { createListing, getActiveMarketListings } from '@/lib/services';
```

### 3. Test the System

**Create Listings**:
1. Start your development server
2. Navigate to a facility detail page
3. Go to the Inventory tab
4. Set quantities and prices for resources
5. Click "Create Market Listings"
6. Verify listings are created in the database

**Browse Marketplace**:
1. Click "Marketplace" in the main navigation
2. View all active listings
3. Use search to find specific resources
4. Filter by resource type
5. Sort by price, quantity, or date
6. View marketplace statistics
7. Identify your own listings (marked with "Your Listing" badge)

## Future Enhancements

### Purchasing System (TODO)

The `purchaseFromListing()` function is stubbed but not implemented. When the transaction/finance system is ready, it should:

1. Validate buyer facility exists and has inventory space
2. Validate buyer company has enough money
3. Remove items from seller facility inventory
4. Add items to buyer facility inventory
5. Transfer money from buyer to seller company
6. Update or mark listing as sold/reduce quantity
7. Create transaction record for both parties
8. Handle partial purchases (buy less than full listing quantity)

### Marketplace UI Page ✅ IMPLEMENTED

**Location**: `src/components/pages/marketplace.tsx`

A dedicated marketplace page where players can:
- ✅ Browse all active listings with realtime updates
- ✅ Filter by resource type
- ✅ Sort by price (low/high), quantity (low/high), date (newest/oldest)
- ✅ Search for specific resources by name
- ✅ View seller information and identify own listings
- ✅ See marketplace statistics (total listings, unique resources, active sellers, total value)
- ⏳ Purchase directly from the marketplace (coming soon - requires transaction system)

**Features**:
- Real-time updates via Supabase subscriptions
- Responsive table layout
- Statistics dashboard with 4 key metrics
- Advanced filtering and sorting
- Search functionality
- Visual indicators for own listings
- Empty state messaging
- Error handling with retry capability

### Advanced Features

- **Listing Expiration**: Auto-expire listings after a certain time
- **Listing Fees**: Charge a small fee to create listings
- **Price History**: Track historical prices for resources
- **Bulk Orders**: Request to buy resources not yet listed
- **Contracts**: Long-term supply agreements between facilities
- **Shipping Costs**: Factor in distance between buyer/seller facilities
- **Resource Quality**: Different quality levels affect pricing

## Database Relationships

```
companies (1) ─── (many) market_listings
facilities (1) ─── (many) market_listings

market_listings references:
  - facilities(id) ON DELETE CASCADE
  - companies(id) ON DELETE CASCADE
```

When a facility or company is deleted, all associated listings are automatically removed.

## Security Considerations

- Row Level Security (RLS) ensures companies can only modify their own listings
- Active listings are publicly visible (marketplace is open to all)
- Input validation prevents negative quantities and prices
- Inventory validation prevents overselling

## Performance Considerations

- Indexes optimize common query patterns
- Batch operations reduce database round-trips
- Supabase realtime subscriptions provide automatic UI updates
- Composite indexes for resource+status queries

## Testing Checklist

- [ ] Run SQL script to create table
- [ ] Verify RLS policies work correctly
- [ ] Test creating single listing via UI
- [ ] Test creating multiple listings at once
- [ ] Test updating listing quantity/price
- [ ] Test cancelling listings
- [ ] Test inventory validation (can't sell more than available)
- [ ] Test price validation (can't be negative)
- [ ] Verify listings appear in database
- [ ] Test with multiple companies/facilities
- [ ] Verify proper isolation between companies

## Troubleshooting

**Issue**: Listings not appearing in database
- Check if SQL script ran successfully
- Verify RLS policies are configured
- Check browser console for errors

**Issue**: Can't create listings
- Verify facility has inventory for the resource
- Check that quantities don't exceed available inventory
- Ensure prices are non-negative

**Issue**: Import errors
- Run `npm install` to ensure dependencies are current
- Verify barrel export files are updated
- Clear TypeScript cache and restart IDE

## Related Files

**Database Layer:**
- `src/lib/database/market/marketListingsDB.ts`
- `src/lib/database/index.ts`

**Service Layer:**
- `src/lib/services/market/marketService.ts`
- `src/lib/services/market/index.ts`
- `src/lib/services/index.ts`

**UI Components:**
- `src/components/pages/facility-detail.tsx` (create listings)
- `src/components/pages/marketplace.tsx` (browse marketplace)

**Hooks:**
- `src/hooks/useMarketListings.ts`
- `src/hooks/index.ts`

**Navigation:**
- `src/App.tsx`
- `src/components/layout/Header.tsx`
- `src/lib/utils/icons.tsx`

**SQL Scripts:**
- `docs/sql_scripts/create_market_listings_table.sql`

**Documentation:**
- `docs/market_system_implementation.md` (this file)

