import { useState, useEffect, useRef } from 'react';
import type { RecipeId, ResourceId } from '@/lib/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Input, UnifiedTooltip, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/shadCN/table';
import { updateFacility } from '@/lib/database';
import { getRecipe, getResourceName, getResourceIcon, RESOURCES_DATA } from '@/lib/constants';
import { startProduction, stopProduction, checkRecipeAvailability, createMultipleListings } from '@/lib/services';
import { getGameState } from '@/lib/services/core';
import { getTailwindClasses } from '@/lib/utils/colorMapping';
import { Building2, Factory, Warehouse, Store, ArrowLeft, Square, Pencil, Check, X } from 'lucide-react';
import { toast, formatNumber } from '@/lib/utils';
import { useLoadingState, useFacility } from '@/hooks';

interface FacilityDetailProps {
  facilityId: string;
  currentCompany?: { id: string; name: string } | null;
  onBack?: () => void;
}

export function FacilityDetail({ facilityId, currentCompany: _currentCompany, onBack }: FacilityDetailProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<RecipeId | ''>('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [forSaleValues, setForSaleValues] = useState<Record<string, number>>({});
  const [salePrices, setSalePrices] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoading: isStarting, withLoading: withStartingLoading } = useLoadingState();
  const { isLoading: isStopping, withLoading: withStoppingLoading } = useLoadingState();
  const { isLoading: isRenaming, withLoading: withRenamingLoading } = useLoadingState();
  const { isLoading: isSavingListings, withLoading: withSavingListingsLoading } = useLoadingState();
  const lastActiveRecipeRef = useRef<RecipeId | undefined>(undefined);
  
  // Use centralized game data hook for realtime facility updates
  const { facility, isLoading } = useFacility(facilityId);

  // Set default selected recipe when facility loads
  useEffect(() => {
    if (facility && facility.availableRecipeIds.length > 0 && !selectedRecipeId) {
      setSelectedRecipeId(facility.availableRecipeIds[0]);
    }
  }, [facility, selectedRecipeId]);

  const handleStartProduction = async (recipeId: RecipeId) => {
    if (!facility) return;

    await withStartingLoading(async () => {
      const updatedFacility = await startProduction(facility, recipeId);
      if (updatedFacility) {
        const recipe = getRecipe(recipeId);
        toast({
          title: 'Production Started',
          description: `Started producing: ${recipe.name}`,
        });
        setShowRecipes(false); // Hide recipes after starting production
      } else {
        toast({
          title: 'Error',
          description: 'Failed to start production. Check if facility has required inputs.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleStopProduction = async () => {
    if (!facility) return;

    await withStoppingLoading(async () => {
      const updatedFacility = await stopProduction(facility);
      if (updatedFacility) {
        toast({
          title: 'Production Stopped',
          description: 'Production has been cancelled.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to stop production.',
          variant: 'destructive',
        });
      }
    });
  };

  const startEditingName = () => {
    if (facility) {
      setEditedName(facility.name);
      setIsEditingName(true);
    }
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const saveNewName = async () => {
    if (!facility || !editedName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid facility name',
        variant: 'destructive',
      });
      cancelEditingName();
      return;
    }

    // If name hasn't changed, just cancel editing
    if (editedName.trim() === facility.name) {
      cancelEditingName();
      return;
    }

    await withRenamingLoading(async () => {
      try {
        await updateFacility(facility.id, {
          name: editedName.trim(),
        });
        setIsEditingName(false);
        setEditedName('');
        toast({
          title: 'Success',
          description: 'Facility renamed successfully',
        });
      } catch (error: any) {
        console.error('Error renaming facility:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to rename facility',
          variant: 'destructive',
        });
        cancelEditingName();
      }
    });
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  // Track production completion and show toast
  useEffect(() => {
    if (!facility) return;

    // Check if production was just completed
    const wasCompleted = !facility.activeRecipeId && !!lastActiveRecipeRef.current;
    
    if (wasCompleted) {
      const recipeName = getRecipe(lastActiveRecipeRef.current!).name;
      toast({
        title: 'Production Complete',
        description: `Completed: ${recipeName}`,
      });
    }

    // Update ref
    lastActiveRecipeRef.current = facility.activeRecipeId;
  }, [facility?.activeRecipeId]);

  const getFacilityTypeIcon = (type: string) => {
    switch (type) {
      case 'production':
        return <Factory className="h-6 w-6" />;
      case 'warehouse':
        return <Warehouse className="h-6 w-6" />;
      case 'retail':
        return <Store className="h-6 w-6" />;
      default:
        return <Building2 className="h-6 w-6" />;
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

  // Calculate resource metrics for display
  // TODO: Backend implementation needed for import/export/production/consumption calculations
  const calculateResourceMetrics = (resourceId: ResourceId) => {
    let production = 0;
    let consumption = 0;

    // Calculate production and consumption from active recipe
    if (facility?.activeRecipeId) {
      const recipe = getRecipe(facility.activeRecipeId);
      
      // Check if this resource is produced
      const outputItem = recipe.outputs.find(o => o.resourceId === resourceId);
      if (outputItem) {
        production = outputItem.quantity / recipe.processingTicks; // per tick
      }

      // Check if this resource is consumed
      const inputItem = recipe.inputs.find(i => i.resourceId === resourceId);
      if (inputItem) {
        consumption = inputItem.quantity / recipe.processingTicks; // per tick
      }
    }

    // TODO: Import and export rates need backend implementation
    const importRate = 0; // Placeholder
    const exportRate = 0; // Placeholder
    
    // TODO: Source cost needs backend implementation
    const sourceCost = 0; // Placeholder

    const netChange = production - consumption + importRate - exportRate;

    return {
      import: importRate,
      export: exportRate,
      production,
      consumption,
      netChange,
      sourceCost,
    };
  };

  // Format number with sign (+ or -) for net change display
  const formatWithSign = (num: number): string => {
    if (num === 0) return '-';
    const sign = num > 0 ? '+' : '';
    return sign + formatNumber(num, { decimals: 1, smartDecimals: true });
  };

  // Get CSS class for net value color
  const getNetValueColor = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  // Handle for sale value change
  const handleForSaleChange = (resourceId: ResourceId, value: number) => {
    const inventoryItem = facility?.inventory.items.find(i => i.resourceId === resourceId);
    const maxValue = inventoryItem?.quantity || 0;
    const validValue = Math.max(0, Math.min(value, maxValue));
    
    setForSaleValues(prev => ({
      ...prev,
      [resourceId]: validValue
    }));
  };

  // Handle sale price change
  const handleSalePriceChange = (resourceId: ResourceId, value: number) => {
    const validValue = Math.max(0, value);
    setSalePrices(prev => ({
      ...prev,
      [resourceId]: validValue
    }));
  };

  // Handle saving market listings
  const handleSaveListings = async () => {
    if (!facility) return;

    await withSavingListingsLoading(async () => {
      try {
        // Filter out resources with valid quantities and prices
        const listingsToCreate = Object.entries(forSaleValues)
          .filter(([resourceId, quantity]) => {
            const price = salePrices[resourceId];
            return quantity > 0 && price !== undefined && price >= 0;
          })
          .map(([resourceId, quantity]) => ({
            resourceId: resourceId as ResourceId,
            quantity,
            pricePerUnit: salePrices[resourceId] || 0,
          }));

        if (listingsToCreate.length === 0) {
          toast({
            title: 'No Listings to Save',
            description: 'Please set quantity and price for at least one resource',
            variant: 'default',
          });
          return;
        }

        // Create listings
        const createdListings = await createMultipleListings(
          facility.id,
          facility.companyId,
          listingsToCreate
        );

        toast({
          title: 'Listings Created',
          description: `Successfully created ${createdListings.length} market listing${createdListings.length > 1 ? 's' : ''}`,
        });

        // Reset form values
        setForSaleValues({});
        setSalePrices({});
      } catch (error: any) {
        console.error('Error saving listings:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to save listings',
          variant: 'destructive',
        });
      }
    });
  };

  // Get filtered resources based on "Show Active Only" toggle
  const getFilteredResources = () => {
    if (!facility) return [];

    // Get all possible resource IDs from the resources data
    const allResourceIds = Object.keys(RESOURCES_DATA) as ResourceId[];

    return allResourceIds.filter(resourceId => {
      if (!showOnlyActive) {
        // Show all resources that exist in inventory
        return facility.inventory.items.some(item => item.resourceId === resourceId);
      }

      // Show active resources only
      // 1. Check if resource exists in inventory with quantity > 0
      const inventoryItem = facility.inventory.items.find(item => item.resourceId === resourceId);
      if (inventoryItem && inventoryItem.quantity > 0) return true;

      // 2. Check if resource is for sale
      if (forSaleValues[resourceId] > 0) return true;

      // 3. Check if resource is part of active recipe
      if (facility.activeRecipeId) {
        const recipe = getRecipe(facility.activeRecipeId);
        const isInput = recipe.inputs.some(i => i.resourceId === resourceId);
        const isOutput = recipe.outputs.some(o => o.resourceId === resourceId);
        if (isInput || isOutput) return true;
      }

      // 4. Check if resource has any metrics
      const metrics = calculateResourceMetrics(resourceId);
      if (metrics.production > 0 || metrics.consumption > 0 || metrics.import > 0 || metrics.export > 0) {
        return true;
      }

      return false;
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading facility...</p>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Facility Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The facility you're looking for doesn't exist.
            </p>
            {onBack && (
              <Button onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Facilities
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const inventoryUsagePercent = facility.inventory.capacity > 0
    ? (facility.inventory.currentUsage / facility.inventory.capacity) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-3 rounded-lg ${getFacilityTypeColor(facility.type)}`}>
            {getFacilityTypeIcon(facility.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <>
                  <Input
                    ref={inputRef}
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveNewName();
                      } else if (e.key === 'Escape') {
                        cancelEditingName();
                      }
                    }}
                    onBlur={saveNewName}
                    disabled={isRenaming}
                    className="text-3xl font-bold h-12"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveNewName}
                    disabled={isRenaming}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditingName}
                    disabled={isRenaming}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold">{facility.name}</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startEditingName}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <p className="text-muted-foreground">
              {facility.facilitySubtype || facility.type} • {facility.cityId}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="management" className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="management">Management</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="production">Production</TabsTrigger>
              </TabsList>
            </div>

            {/* Management Tab */}
            <TabsContent value="management" className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Facility Type</p>
                  <Badge variant="outline">
                    {facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}
                  </Badge>
                </div>
                {facility.facilitySubtype && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Production Type</p>
                    <p className="font-semibold">
                      {facility.facilitySubtype.charAt(0).toUpperCase() + facility.facilitySubtype.slice(1)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">City</p>
                  <p className="font-semibold">{facility.cityId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Workers</p>
                  <p className="font-semibold">{facility.workerCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Production Status</p>
                  {facility.activeRecipeId ? (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-green-100 text-green-800 border-green-200 relative"
                    >
                      <div className="absolute inset-0 bg-green-300 opacity-50 animate-[ping_2s_ease-in-out_infinite] rounded-md" />
                      <span className="relative z-10">Producing</span>
                    </Badge>
                  ) : (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-amber-100 text-amber-800 border-amber-200"
                    >
                      Not Producing
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Effectivity</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${facility.effectivity}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">
                    {facility.effectivity}%
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Inventory</CardTitle>
                    <CardDescription className="mt-1">
                      Resource management and sales
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="showActiveOnly"
                        checked={showOnlyActive}
                        onCheckedChange={setShowOnlyActive}
                      />
                      <label
                        htmlFor="showActiveOnly"
                        className="text-sm font-medium cursor-pointer select-none"
                      >
                        Show active only
                      </label>
                    </div>
                    <Badge variant="outline">
                      {facility.inventory.currentUsage} / {facility.inventory.capacity}
                    </Badge>
                  </div>
                </div>
              {getFilteredResources().length === 0 ? (
                <p className="text-muted-foreground italic py-4 text-center">
                  {showOnlyActive ? 'No active resources' : 'No items in inventory'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Resource</TableHead>
                        <TableHead className="text-center w-[80px]">Import</TableHead>
                        <TableHead className="text-center w-[80px]">Export</TableHead>
                        <TableHead className="text-center w-[100px]">Production</TableHead>
                        <TableHead className="text-center w-[110px]">Consumption</TableHead>
                        <TableHead className="text-center w-[80px]">Net</TableHead>
                        <TableHead className="text-center w-[100px]">Source Cost</TableHead>
                        <TableHead className="text-center w-[100px]">For Sale</TableHead>
                        <TableHead className="text-center w-[100px]">Sale Price</TableHead>
                        <TableHead className="text-right w-[100px]">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredResources().map((resourceId) => {
                        const inventoryItem = facility.inventory.items.find(i => i.resourceId === resourceId);
                        const amount = inventoryItem?.quantity || 0;
                        const metrics = calculateResourceMetrics(resourceId);

                        return (
                          <TableRow key={resourceId}>
                            {/* Resource */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getResourceIcon(resourceId)}</span>
                                <span className="font-medium">{getResourceName(resourceId)}</span>
                              </div>
                            </TableCell>

                            {/* Import */}
                            <TableCell className="text-center text-blue-600">
                              {metrics.import > 0 ? formatNumber(metrics.import, { decimals: 1, smartDecimals: true }) : '-'}
                            </TableCell>

                            {/* Export */}
                            <TableCell className="text-center text-purple-600">
                              {metrics.export > 0 ? formatNumber(metrics.export, { decimals: 1, smartDecimals: true }) : '-'}
                            </TableCell>

                            {/* Production */}
                            <TableCell className="text-center text-green-600">
                              {metrics.production > 0 ? formatNumber(metrics.production, { decimals: 1, smartDecimals: true }) : '-'}
                            </TableCell>

                            {/* Consumption */}
                            <TableCell className="text-center text-red-600">
                              {metrics.consumption > 0 ? formatNumber(metrics.consumption, { decimals: 1, smartDecimals: true }) : '-'}
                            </TableCell>

                            {/* Net */}
                            <TableCell className="text-center">
                              <span className={getNetValueColor(metrics.netChange)}>
                                {metrics.netChange !== 0 ? formatWithSign(metrics.netChange) : '-'}
                              </span>
                            </TableCell>

                            {/* Source Cost */}
                            <TableCell className="text-center">
                              {metrics.sourceCost > 0 ? formatNumber(metrics.sourceCost, { currency: true, decimals: 2 }) : '-'}
                            </TableCell>

                            {/* For Sale */}
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                max={amount}
                                value={forSaleValues[resourceId] || 0}
                                onChange={(e) => handleForSaleChange(resourceId, parseInt(e.target.value) || 0)}
                                className="w-20 h-8 text-center"
                                disabled={amount === 0}
                              />
                            </TableCell>

                            {/* Sale Price */}
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={salePrices[resourceId] || 0}
                                onChange={(e) => handleSalePriceChange(resourceId, parseFloat(e.target.value) || 0)}
                                className="w-20 h-8 text-center"
                                disabled={(forSaleValues[resourceId] || 0) === 0}
                              />
                            </TableCell>

                            {/* Amount */}
                            <TableCell className="text-right font-semibold">
                              {amount}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Capacity Usage</span>
                  <span className="text-sm font-semibold">
                    {formatNumber(inventoryUsagePercent, { percent: true, decimals: 1, percentIsDecimal: false })}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(inventoryUsagePercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Save button for inventory changes */}
              {(Object.keys(forSaleValues).length > 0 || Object.keys(salePrices).length > 0) && (
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <Button
                    onClick={handleSaveListings}
                    disabled={isSavingListings}
                  >
                    {isSavingListings ? 'Saving...' : 'Create Market Listings'}
                  </Button>
                </div>
              )}
              </div>
            </TabsContent>

            {/* Production Tab */}
            <TabsContent value="production" className="px-6 pb-6">
              <div className="space-y-4">
                {/* Active Production */}
          {facility.activeRecipeId && (() => {
            const activeRecipe = getRecipe(facility.activeRecipeId);
            const progressTicks = facility.progressTicks ?? 0;
            const totalTicks = activeRecipe.processingTicks;
            const progressPercent = totalTicks > 0 ? (progressTicks / totalTicks) * 100 : 0;
            
            // Get current game tick to calculate started tick and completion tick
            const gameState = getGameState();
            const currentTick = gameState.time.tick;
            const startedTick = currentTick - progressTicks;
            const completionTick = startedTick + totalTicks;
            
            // Get main output resource for display
            const mainOutput = activeRecipe.outputs[0];
            const outputIcon = mainOutput ? getResourceIcon(mainOutput.resourceId) : '';
            const outputName = mainOutput ? getResourceName(mainOutput.resourceId) : '';
            const outputAmount = mainOutput?.quantity || 0;
            
            return (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Producing: {outputIcon} {outputName}
                        </CardTitle>
                        <CardDescription>Currently producing: {activeRecipe.name}</CardDescription>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-green-100 text-green-800 border-green-200 relative"
                      >
                        <div className="absolute inset-0 bg-green-300 opacity-50 animate-[ping_2s_ease-in-out_infinite] rounded-md" />
                        <span className="relative z-10">Producing</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRecipes(!showRecipes)}
                      >
                        {showRecipes ? 'Hide Recipes' : 'Change Recipe'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStopProduction}
                        disabled={isStopping}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-semibold">
                          {progressTicks} / {totalTicks} ticks ({Math.round(progressPercent)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Production Status Information */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <span>Started at tick #{startedTick}</span>
                      <span className="mx-1">•</span>
                      <span>Will produce</span>
                      <span className="font-medium text-green-700">
                        {outputAmount} {outputIcon} {outputName}
                      </span>
                      <span>@Tick #{completionTick}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Inputs</p>
                        {activeRecipe.inputs.length === 0 ? (
                          <p className="text-sm italic text-muted-foreground">None</p>
                        ) : (
                          <ul className="text-sm space-y-1">
                            {activeRecipe.inputs.map((input, idx) => (
                              <li key={idx} className="flex items-center gap-1">
                                <span>{getResourceIcon(input.resourceId)}</span>
                                <span>{getResourceName(input.resourceId)} × {input.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Outputs</p>
                        {activeRecipe.outputs.length === 0 ? (
                          <p className="text-sm italic text-muted-foreground">None</p>
                        ) : (
                          <ul className="text-sm space-y-1">
                            {activeRecipe.outputs.map((output, idx) => (
                              <li key={idx} className="flex items-center gap-1">
                                <span>{getResourceIcon(output.resourceId)}</span>
                                <span>{getResourceName(output.resourceId)} × {output.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

                {/* Recipes Section - Always show if no active production, or show when toggle is on */}
                {(!facility.activeRecipeId || showRecipes) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Recipes</CardTitle>
                      <CardDescription>
                        Select a recipe to start production
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {facility.availableRecipeIds.length === 0 ? (
                        <p className="text-muted-foreground italic py-4 text-center">No recipes available</p>
                      ) : (
                        <div className="space-y-2">
                          {/* Warning message when changing recipe during active production */}
                          {facility.activeRecipeId && showRecipes && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <p className="text-sm text-yellow-700">
                                Current production will be canceled if you change recipes. Any input resources already consumed will not be returned.
                              </p>
                            </div>
                          )}

                          {/* No Recipe Active Card */}
                          {!facility.activeRecipeId && (
                            (() => {
                              const redScheme = getTailwindClasses('red');
                              return (
                                <div
                                  className={`w-full p-3 border rounded-md transition-all ${redScheme.background} ${redScheme.border}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`font-medium ${redScheme.text}`}>
                                      ⚠️ No Recipe Active
                                    </span>
                                    <Badge className={`text-xs ${redScheme.badge}`}>
                                      Waiting
                                    </Badge>
                                  </div>
                                  <p className={`text-xs mt-2 ${redScheme.text} opacity-80`}>
                                    No production is currently running. Select a recipe below to start production.
                                  </p>
                                </div>
                              );
                            })()
                          )}
                  
                  {facility.availableRecipeIds.map((recipeId) => {
                    try {
                      const recipe = getRecipe(recipeId);
                      const isActive = facility.activeRecipeId === recipeId;
                      const isSelected = selectedRecipeId === recipeId;
                      const canStart = !facility.activeRecipeId; // Can start if no active production
                      
                      // Check if recipe is available (has required inputs)
                      const recipeAvailability = checkRecipeAvailability(facility, recipeId);
                      const isRecipeAvailable = recipeAvailability.available;
                      
                      // Get color scheme based on state
                      const greenScheme = getTailwindClasses('green');
                      const blueScheme = getTailwindClasses('blue');
                      const redScheme = getTailwindClasses('red');
                      
                      // Format inputs with icons
                      const formatInputs = () => {
                        if (recipe.inputs.length === 0) return <span className="text-muted-foreground italic">No inputs required</span>;
                        return (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {recipe.inputs.map((input, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1">
                                <span>{getResourceIcon(input.resourceId)}</span>
                                <span>{getResourceName(input.resourceId)}</span>
                                <span className="font-semibold">× {input.quantity}</span>
                              </span>
                            ))}
                          </div>
                        );
                      };
                      
                      // Format outputs with icons
                      const formatOutputs = () => {
                        if (recipe.outputs.length === 0) return <span className="text-muted-foreground italic">No outputs</span>;
                        return (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {recipe.outputs.map((output, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 text-green-700 font-medium">
                                <span>{getResourceIcon(output.resourceId)}</span>
                                <span>{getResourceName(output.resourceId)}</span>
                                <span className="font-semibold">× {output.quantity}</span>
                              </span>
                            ))}
                          </div>
                        );
                      };
                      
                      // Determine classes based on state
                      const getButtonClasses = () => {
                        if (!isRecipeAvailable) {
                          return `w-full justify-start h-auto flex flex-col items-start p-3 transition-all ${redScheme.background} ${redScheme.border} opacity-60 cursor-not-allowed`;
                        }
                        if (isActive) {
                          return `w-full justify-start h-auto flex flex-col items-start p-3 transition-all ${greenScheme.background} ${greenScheme.border} hover:bg-green-100`;
                        }
                        if (isSelected) {
                          return `w-full justify-start h-auto flex flex-col items-start p-3 transition-all ${blueScheme.background} border-blue-300 hover:bg-blue-100`;
                        }
                        return `w-full justify-start h-auto flex flex-col items-start p-3 transition-all ${blueScheme.background} hover:bg-blue-100 ${blueScheme.border}`;
                      };
                      
                      const textColor = !isRecipeAvailable 
                        ? redScheme.text 
                        : isActive 
                        ? greenScheme.text 
                        : blueScheme.text;
                      const borderColor = !isRecipeAvailable 
                        ? redScheme.border 
                        : isActive 
                        ? greenScheme.border 
                        : blueScheme.border;
                      const badgeClasses = !isRecipeAvailable 
                        ? redScheme.badge 
                        : isActive 
                        ? greenScheme.badge 
                        : blueScheme.badge;
                      
                      // Create tooltip content for unavailable recipes
                      const tooltipContent = !isRecipeAvailable ? (
                        <div className="space-y-2">
                          <p className="font-semibold">Recipe Unavailable</p>
                          <p className="text-sm">Missing input resources:</p>
                          <ul className="text-sm space-y-1 list-disc list-inside">
                            {recipeAvailability.missingResources.map((missing, idx) => (
                              <li key={idx}>
                                {getResourceIcon(missing.resourceId)} {getResourceName(missing.resourceId)}: 
                                <span className="font-semibold"> {missing.available}/{missing.required}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null;
                      
                      const buttonElement = (
                        <Button
                          key={recipeId}
                          onClick={() => {
                            setSelectedRecipeId(recipeId);
                            if (canStart && !isActive && isRecipeAvailable) {
                              handleStartProduction(recipeId);
                            }
                          }}
                          disabled={isStarting || (isActive && !canStart) || !isRecipeAvailable}
                          variant="outline"
                          className={getButtonClasses()}
                        >
                          <div className="flex justify-between items-center w-full mb-2">
                            <span className={`font-medium ${textColor}`}>
                              {recipe.name}
                              {isActive && ' (Current)'}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {recipe.processingTicks} {recipe.processingTicks === 1 ? 'tick' : 'ticks'}
                            </Badge>
                          </div>
                          
                          <div className="text-xs w-full space-y-2">
                            <div className="flex items-start gap-2">
                              <span className={`font-medium ${textColor} whitespace-nowrap`}>Inputs:</span>
                              <div className="flex-1">{formatInputs()}</div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className={`font-medium ${textColor} whitespace-nowrap`}>Outputs:</span>
                              <div className="flex-1">{formatOutputs()}</div>
                            </div>
                          </div>
                          
                          {isActive && (
                            <div className={`mt-2 pt-2 border-t ${borderColor} w-full`}>
                              <Badge className={`text-xs ${badgeClasses}`}>
                                Production Active
                              </Badge>
                            </div>
                          )}
                          {!isRecipeAvailable && !isActive && (
                            <div className={`mt-2 pt-2 border-t ${borderColor} w-full`}>
                              <Badge className={`text-xs ${badgeClasses}`}>
                                Unavailable
                              </Badge>
                            </div>
                          )}
                        </Button>
                      );
                      
                      // Wrap in tooltip if unavailable
                      if (!isRecipeAvailable && tooltipContent) {
                        return (
                          <UnifiedTooltip
                            key={recipeId}
                            content={tooltipContent}
                            title="Recipe Unavailable"
                            side="top"
                          >
                            <div>{buttonElement}</div>
                          </UnifiedTooltip>
                        );
                      }
                      
                      return buttonElement;
                    } catch (error) {
                      return (
                        <div
                          key={recipeId}
                          className="w-full p-3 border rounded-md bg-muted text-muted-foreground text-sm"
                        >
                          Recipe not found: {recipeId}
                        </div>
                      );
                    }
                  })}
                </div>
              )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

