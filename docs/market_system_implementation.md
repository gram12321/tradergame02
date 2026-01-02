# Market System Implementation

## Purpose

Player-to-player marketplace. Facilities list inventory for sale; other companies browse listings. Purchases are not implemented yet.

## Data Model

**Table**: `market_listings`  
**Source**: `docs/sql_scripts/create_market_listings_table.sql`

**Core fields**: `facility_id`, `company_id`, `resource_id`, `quantity`, `price_per_unit`, `listing_status`, `created_at`, `updated_at`

**Status values**: `active`, `sold`, `cancelled`, `expired`

**Indexes**: facility, company, resource, status, active+resource

**RLS**: anyone can read active listings; companies can read/write their own listings only.

## Code Entry Points

**DB layer**: `src/lib/database/market/marketListingsDB.ts`  
Listing CRUD and query helpers.

**Service layer**: `src/lib/services/market/marketService.ts`  
Validation and business logic for create/update/cancel and queries.

## UI Entry Points

- Create listings: `src/components/pages/facility-detail.tsx` (inventory tab)
- Browse listings: `src/components/pages/marketplace.tsx`
- Data hooks: `src/hooks/useMarketListings.ts`

## Current Behavior

- Listings are created from facility inventory and are visible in the marketplace.
- Marketplace browse page supports search, filter, sort, and realtime updates via Supabase.
- Purchase flow is not implemented (depends on finance/transactions system).

## Status

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

## ⏳ Future Enhancements (Not Yet Implemented)

### Purchase Functionality
The "Buy" button is stubbed. When the transaction/finance system is ready:

1. Validate buyer has enough money
2. Validate buyer facility has inventory space
3. Transfer resources from seller to buyer
4. Transfer money from buyer to seller
5. Update or remove listing
6. Create transaction records

### Additional Features to Consider
- **Bulk Purchase**: Buy partial quantities from listings
- **Price History**: Track historical prices per resource
- **Seller Ratings**: Rate sellers after transactions
- **Wishlist**: Save searches or favorite resources
- **Notifications**: Alert when specific resources are listed
- **Location-Based**: Show distance between buyer/seller facilities
- **Shipping Costs**: Factor in distance for pricing

### Future implementation Brainstoming
- **Bulk Purchase**: Buy partial quantities
- **Price History**: See historical pricing trends
- **Seller Ratings**: Rate your trading partners
- **Wishlist**: Save favorite resources or searches
- **Notifications**: Get alerts for specific resources
- **Location-Based**: See distance to seller facilities
- **Shipping Costs**: Distance-based pricing