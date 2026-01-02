-- Market Listings Table
-- Stores facility inventory listings for sale in the marketplace
-- Each facility can list resources from their inventory for other facilities/companies to purchase

CREATE TABLE IF NOT EXISTS market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Facility and company references
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Resource and pricing
  resource_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit NUMERIC(10, 2) NOT NULL CHECK (price_per_unit >= 0),
  
  -- Listing status
  listing_status TEXT NOT NULL DEFAULT 'active' CHECK (listing_status IN ('active', 'sold', 'cancelled', 'expired')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_listings_facility_id ON market_listings(facility_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_company_id ON market_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_resource_id ON market_listings(resource_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_status ON market_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_market_listings_active_resource ON market_listings(resource_id, listing_status) WHERE listing_status = 'active';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_market_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_market_listings_updated_at
  BEFORE UPDATE ON market_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_market_listings_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all active listings (marketplace is public)
CREATE POLICY "Anyone can view active listings"
  ON market_listings
  FOR SELECT
  USING (listing_status = 'active');

-- Policy: Users can view their own company's listings (all statuses)
CREATE POLICY "Companies can view their own listings"
  ON market_listings
  FOR SELECT
  USING (company_id IN (SELECT id FROM companies));

-- Policy: Companies can insert their own listings
CREATE POLICY "Companies can create listings"
  ON market_listings
  FOR INSERT
  WITH CHECK (company_id IN (SELECT id FROM companies));

-- Policy: Companies can update their own listings
CREATE POLICY "Companies can update their own listings"
  ON market_listings
  FOR UPDATE
  USING (company_id IN (SELECT id FROM companies));

-- Policy: Companies can delete their own listings
CREATE POLICY "Companies can delete their own listings"
  ON market_listings
  FOR DELETE
  USING (company_id IN (SELECT id FROM companies));

COMMENT ON TABLE market_listings IS 'Marketplace listings where facilities sell resources from their inventory';
COMMENT ON COLUMN market_listings.facility_id IS 'The facility selling the resource';
COMMENT ON COLUMN market_listings.company_id IS 'The company that owns the facility (for easier queries)';
COMMENT ON COLUMN market_listings.resource_id IS 'The resource being sold (matches ResourceId type)';
COMMENT ON COLUMN market_listings.quantity IS 'Amount of resource available for sale';
COMMENT ON COLUMN market_listings.price_per_unit IS 'Price per unit of resource';
COMMENT ON COLUMN market_listings.listing_status IS 'Status: active, sold, cancelled, or expired';

