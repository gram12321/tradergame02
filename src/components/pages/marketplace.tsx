import { useState, useMemo } from 'react';
import type { ResourceId } from '@/lib/types/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Select,
} from '@/components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/shadCN/table';
import { getResourceName, getResourceIcon, RESOURCES_DATA } from '@/lib/constants';
import { ShoppingCart, Search, TrendingUp, Package, Users, ArrowUpDown } from 'lucide-react';
import { toast, formatNumber } from '@/lib/utils';
import { useMarketListings, useLoadingState } from '@/hooks';
import type { MarketListing } from '@/lib/database';

interface MarketplaceProps {
  currentCompany?: { id: string; name: string } | null;
  onBack?: () => void;
}

type SortOption = 'price-asc' | 'price-desc' | 'quantity-asc' | 'quantity-desc' | 'newest' | 'oldest';

export function Marketplace({ currentCompany, onBack: _onBack }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<ResourceId | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const { isLoading: isPurchasing, withLoading: withPurchasingLoading } = useLoadingState();

  // Fetch market listings with realtime updates
  const { listings, isLoading, error, refetch } = useMarketListings();

  // Calculate marketplace stats
  const stats = useMemo(() => {
    const uniqueResources = new Set(listings.map(l => l.resourceId)).size;
    const uniqueSellers = new Set(listings.map(l => l.facilityId)).size;
    const totalValue = listings.reduce((sum, l) => sum + (l.quantity * l.pricePerUnit), 0);

    return {
      totalListings: listings.length,
      uniqueResources,
      uniqueSellers,
      totalValue,
    };
  }, [listings]);

  // Get unique resources from listings for filter dropdown
  const availableResources = useMemo(() => {
    const resourceSet = new Set(listings.map(l => l.resourceId));
    return Array.from(resourceSet).sort();
  }, [listings]);

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    let filtered = [...listings];

    // Filter by resource
    if (selectedResource !== 'all') {
      filtered = filtered.filter(l => l.resourceId === selectedResource);
    }

    // Filter by search query (resource name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        getResourceName(l.resourceId).toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
        break;
      case 'quantity-asc':
        filtered.sort((a, b) => a.quantity - b.quantity);
        break;
      case 'quantity-desc':
        filtered.sort((a, b) => b.quantity - a.quantity);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
    }

    return filtered;
  }, [listings, selectedResource, searchQuery, sortBy]);

  // Handle purchase (stubbed for now)
  const handlePurchase = async (listing: MarketListing) => {
    if (!currentCompany) {
      toast({
        title: 'Error',
        description: 'Please log in to purchase items',
        variant: 'destructive',
      });
      return;
    }

    await withPurchasingLoading(async () => {
      // TODO: Implement purchase functionality when transaction system is ready
      toast({
        title: 'Feature Coming Soon',
        description: 'Purchase functionality will be implemented with the transaction system',
        variant: 'default',
      });
    });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Marketplace</h3>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">Browse and purchase resources from other players</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.totalListings}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.uniqueResources}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.uniqueSellers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Market Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {formatNumber(stats.totalValue, { currency: true, decimals: 0 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Browse Listings</CardTitle>
          <CardDescription>Filter and search for resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Resource Filter */}
            <Select
              value={selectedResource}
              onValueChange={(value) => setSelectedResource(value as ResourceId | 'all')}
            >
              <option value="all">All Resources</option>
              {availableResources.map((resourceId) => (
                <option key={resourceId} value={resourceId}>
                  {getResourceIcon(resourceId)} {getResourceName(resourceId)}
                </option>
              ))}
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="quantity-asc">Quantity: Low to High</option>
              <option value="quantity-desc">Quantity: High to Low</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Listings</CardTitle>
              <CardDescription>
                {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Loading marketplace...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Listings Found</h3>
              <p className="text-muted-foreground">
                {listings.length === 0
                  ? 'The marketplace is empty. Be the first to list resources!'
                  : 'Try adjusting your filters or search query.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Resource</TableHead>
                    <TableHead className="text-right w-[100px]">Quantity</TableHead>
                    <TableHead className="text-right w-[120px]">Price/Unit</TableHead>
                    <TableHead className="text-right w-[120px]">Total Price</TableHead>
                    <TableHead className="w-[180px]">Seller</TableHead>
                    <TableHead className="text-center w-[100px]">Listed</TableHead>
                    <TableHead className="text-center w-[120px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map((listing) => {
                    const totalPrice = listing.quantity * listing.pricePerUnit;
                    const isOwnListing = currentCompany?.id === listing.companyId;
                    const listingDate = new Date(listing.createdAt);
                    const daysAgo = Math.floor((Date.now() - listingDate.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <TableRow key={listing.id}>
                        {/* Resource */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getResourceIcon(listing.resourceId)}</span>
                            <span className="font-medium">{getResourceName(listing.resourceId)}</span>
                          </div>
                        </TableCell>

                        {/* Quantity */}
                        <TableCell className="text-right font-semibold">
                          {formatNumber(listing.quantity, { decimals: 0 })}
                        </TableCell>

                        {/* Price per Unit */}
                        <TableCell className="text-right">
                          {formatNumber(listing.pricePerUnit, { currency: true, decimals: 2 })}
                        </TableCell>

                        {/* Total Price */}
                        <TableCell className="text-right font-semibold">
                          {formatNumber(totalPrice, { currency: true, decimals: 2 })}
                        </TableCell>

                        {/* Seller */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isOwnListing && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Your Listing
                              </Badge>
                            )}
                            {!isOwnListing && (
                              <span className="text-sm text-muted-foreground">
                                Facility #{listing.facilityId.slice(0, 8)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Listed Date */}
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-center">
                          {isOwnListing ? (
                            <Badge variant="outline" className="text-xs">
                              Your Item
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handlePurchase(listing)}
                              disabled={isPurchasing}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Buy
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

