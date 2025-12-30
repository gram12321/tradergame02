import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Label } from '@/components/ui';
import { DEFAULT_CITIES, getResourceName } from '@/lib/constants';
import { createFarm } from '@/lib/services';
import { Building2, Factory, Warehouse, Store, Plus } from 'lucide-react';
import { toast } from '@/lib/utils';
import { useLoadingState, useFacilities } from '@/hooks';

interface FacilitiesProps {
  currentCompany?: { id: string; name: string } | null;
  onFacilitySelect?: (facilityId: string) => void;
  onBack?: () => void;
}

export function Facilities({ currentCompany, onFacilitySelect, onBack }: FacilitiesProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string>(DEFAULT_CITIES[0].id);
  const { isLoading: isCreating, withLoading } = useLoadingState();
  
  // Use centralized game data hook for realtime facility updates
  const { facilities, isLoading, refetch } = useFacilities(currentCompany?.id || null);

  const handleCreateFacility = async () => {
    if (!currentCompany?.id) {
      toast({
        title: 'Error',
        description: 'No company selected',
        variant: 'destructive',
      });
      return;
    }

    await withLoading(async () => {
      try {
        const newFacility = await createFarm(
          currentCompany.id,
          currentCompany.name,
          selectedCityId
        );

        toast({
          title: 'Success',
          description: `Farm "${newFacility.name}" created successfully! Production started automatically.`,
        });
        setIsCreateDialogOpen(false);
        setSelectedCityId(DEFAULT_CITIES[0].id);
        refetch();
      } catch (error: any) {
        console.error('Error creating facility:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create facility',
          variant: 'destructive',
        });
      }
    });
  };

  const getFacilityTypeIcon = (type: string) => {
    switch (type) {
      case 'production':
        return <Factory className="h-5 w-5" />;
      case 'warehouse':
        return <Warehouse className="h-5 w-5" />;
      case 'retail':
        return <Store className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getFacilityTypeColor = (type: string) => {
    switch (type) {
      case 'production':
        return 'bg-blue-100 text-blue-700';
      case 'warehouse':
        return 'bg-green-100 text-green-700';
      case 'retail':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading facilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Facilities</h1>
          <p className="text-muted-foreground">
            Manage and monitor all your company facilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Facility
          </Button>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
      </div>

      {facilities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Facilities</h3>
            <p className="text-muted-foreground">
              You don't have any facilities yet. Create your first facility to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((facility) => (
            <Card
              key={facility.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onFacilitySelect?.(facility.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getFacilityTypeColor(facility.type)}`}>
                      {getFacilityTypeIcon(facility.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{facility.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {facility.facilitySubtype || facility.type}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">{facility.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Effectivity</p>
                    <p className="font-semibold">{facility.effectivity}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Workers</p>
                    <p className="font-semibold">{facility.workerCount}</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Inventory</p>
                  {facility.inventory.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Empty</p>
                  ) : (
                    <div className="space-y-1">
                      {facility.inventory.items.slice(0, 3).map((item) => (
                        <div key={item.resourceId} className="flex justify-between text-sm">
                          <span>{getResourceName(item.resourceId)}</span>
                          <span className="font-semibold">{item.quantity}</span>
                        </div>
                      ))}
                      {facility.inventory.items.length > 3 && (
                        <p className="text-xs text-muted-foreground italic">
                          +{facility.inventory.items.length - 3} more items
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Capacity</span>
                      <span>
                        {facility.inventory.currentUsage} / {facility.inventory.capacity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-1">Recipes</p>
                  <div className="flex flex-wrap gap-1">
                    {facility.availableRecipeIds.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">None</span>
                    ) : (
                      facility.availableRecipeIds.slice(0, 3).map((recipeId) => (
                        <Badge key={recipeId} variant="secondary" className="text-xs">
                          {recipeId.replace('_', ' ')}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Facility Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Facility</DialogTitle>
            <DialogDescription>
              Build a new production facility. Currently, only farms are available.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="facility-city">City</Label>
              <select
                id="facility-city"
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                disabled={isCreating}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {DEFAULT_CITIES.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg bg-muted p-3 space-y-2">
              <p className="text-sm font-medium">Facility Type</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Production</Badge>
                <Badge variant="outline">Farm</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Farms can produce grain using the "Grow Grain" recipe. The facility will be automatically named.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFacility}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Farm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
