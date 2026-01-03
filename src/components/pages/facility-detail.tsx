import { useState, useEffect, useRef } from 'react';
import type { RecipeId, ResourceId } from '@/lib/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Input, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/shadCN/table';
import { updateFacility } from '@/lib/database';
import { getRecipe, getResourceName, getResourceIcon, getAllResources } from '@/lib/constants';
import { startProduction, stopProduction, createMultipleListings } from '@/lib/services';
import { getGameState } from '@/lib/services/core';
import { Building2, Factory, Warehouse, Store, ArrowLeft, Pencil, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [forSaleValues, setForSaleValues] = useState<Record<string, number>>({});
  const [expandedSections, setExpandedSections] = useState({
    activeRecipeInputs: true,
    facilityInputs: true,
    facilityOutputs: true,
    otherResources: false,
  });
  const [salePrices, setSalePrices] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoading: isStarting, withLoading: withStartingLoading } = useLoadingState();
  const { isLoading: isStopping, withLoading: withStoppingLoading } = useLoadingState();
  const { isLoading: isRenaming, withLoading: withRenamingLoading } = useLoadingState();
  const { isLoading: isSavingListings, withLoading: withSavingListingsLoading } = useLoadingState();
  const lastActiveRecipeRef = useRef<RecipeId | undefined>(undefined);
  
  // Use centralized game data hook for realtime facility updates
  const { facility, isLoading } = useFacility(facilityId);

  // Toggle section expand/collapse
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Check if facility has required inputs for a recipe
  const hasRequiredInputs = (recipeId: RecipeId): boolean => {
    if (!facility) return false;
    
    const recipe = getRecipe(recipeId);
    return recipe?.inputs.every(input => {
      const inventoryItem = facility.inventory.items.find(i => i.resourceId === input.resourceId);
      return inventoryItem && inventoryItem.quantity >= input.quantity;
    }) ?? false;
  };

  const handleStartProduction = async (recipeId: RecipeId) => {
    if (!facility) return;

    await withStartingLoading(async () => {
      const updatedFacility = await startProduction(facility, recipeId);
      if (updatedFacility) {
        const recipe = getRecipe(recipeId);
        toast({
          title: 'Production Started',
          description: `Started producing: ${recipe?.name || 'Unknown Recipe'}`,
        });
        setShowRecipes(false); // Hide recipes after starting production
      } else {
        toast({
          title: 'Waiting for Inputs',
          description: 'Production will start automatically when required inputs are available.',
          variant: 'default',
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
          description: 'Production has been paused. You can resume by selecting the same recipe.',
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
      const recipeName = getRecipe(lastActiveRecipeRef.current!)?.name || 'Unknown';
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
      const outputItem = recipe?.outputs.find(o => o.resourceId === resourceId);
      if (outputItem && recipe) {
        production = outputItem.quantity / recipe.processingTicks; // per tick
      }

      // Check if this resource is consumed
      const inputItem = recipe?.inputs.find(i => i.resourceId === resourceId);
      if (inputItem && recipe) {
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

  // Get categorized resources for the 4 sublists
  const getCategorizedResources = () => {
    if (!facility) return {
      activeRecipeInputs: [],
      facilityInputs: [],
      facilityOutputs: [],
      otherResources: [],
    };

    // Get all possible resource IDs from the resources data
    const allResourceIds = Object.keys(getAllResources()) as ResourceId[];

    // Get active recipe inputs
    const activeRecipeInputs = new Set<ResourceId>();
    if (facility.activeRecipeId) {
      const activeRecipe = getRecipe(facility.activeRecipeId);
      activeRecipe?.inputs.forEach(input => {
        activeRecipeInputs.add(input.resourceId);
      });
    }

    // Get all possible inputs from available recipes (facility inputs)
    const facilityInputs = new Set<ResourceId>();
    facility.availableRecipeIds.forEach(recipeId => {
      const recipe = getRecipe(recipeId);
      recipe?.inputs.forEach(input => {
        facilityInputs.add(input.resourceId);
      });
    });

    // Get all possible outputs from available recipes (facility outputs)
    const facilityOutputs = new Set<ResourceId>();
    facility.availableRecipeIds.forEach(recipeId => {
      const recipe = getRecipe(recipeId);
      recipe?.outputs.forEach(output => {
        facilityOutputs.add(output.resourceId);
      });
    });

    // Filter function based on "Show Available Only" toggle
    const shouldShowResource = (resourceId: ResourceId) => {
      if (showAvailableOnly) {
        const inventoryItem = facility.inventory.items.find(item => item.resourceId === resourceId);
        return inventoryItem && inventoryItem.quantity > 0;
      }
      return true;
    };

    // Categorize resources
    const categorized = {
      activeRecipeInputs: [] as ResourceId[],
      facilityInputs: [] as ResourceId[],
      facilityOutputs: [] as ResourceId[],
      otherResources: [] as ResourceId[],
    };

    allResourceIds.forEach(resourceId => {
      if (!shouldShowResource(resourceId)) return;

      if (activeRecipeInputs.has(resourceId)) {
        categorized.activeRecipeInputs.push(resourceId);
      } else if (facilityInputs.has(resourceId)) {
        categorized.facilityInputs.push(resourceId);
      } else if (facilityOutputs.has(resourceId)) {
        categorized.facilityOutputs.push(resourceId);
      } else {
        categorized.otherResources.push(resourceId);
      }
    });

    return categorized;
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
                  {facility.isProducing ? (
                    hasRequiredInputs(facility.activeRecipeId!) ? (
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
                        className="text-xs bg-orange-100 text-orange-800 border-orange-200"
                      >
                        Needs Input
                      </Badge>
                    )
                  ) : (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-gray-100 text-gray-800 border-gray-200"
                    >
                      Stopped
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Selected Recipe</p>
                  <p className="font-semibold">{getRecipe(facility.activeRecipeId!)?.name || 'Unknown Recipe'}</p>
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
                        id="showAvailableOnly"
                        checked={showAvailableOnly}
                        onCheckedChange={setShowAvailableOnly}
                      />
                      <label
                        htmlFor="showAvailableOnly"
                        className="text-sm font-medium cursor-pointer select-none"
                      >
                        Show available only
                      </label>
                    </div>
                    <Badge variant="outline">
                      {facility.inventory.currentUsage} / {facility.inventory.capacity}
                    </Badge>
                  </div>
                </div>
              {(() => {
                const categorized = getCategorizedResources();
                const totalResources = categorized.activeRecipeInputs.length + 
                                     categorized.facilityInputs.length + 
                                     categorized.facilityOutputs.length + 
                                     categorized.otherResources.length;

                if (totalResources === 0) {
                  return (
                    <p className="text-muted-foreground italic py-4 text-center">
                      {showAvailableOnly ? 'No available resources' : 'No items in inventory'}
                    </p>
                  );
                }

                const renderResourceRow = (resourceId: ResourceId) => {
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
                };

                return (
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
                        {/* Active Recipe Inputs */}
                        {categorized.activeRecipeInputs.length > 0 && (
                          <>
                            <TableRow 
                              className="bg-blue-50 hover:bg-blue-100 cursor-pointer"
                              onClick={() => toggleSection('activeRecipeInputs')}
                            >
                              <TableCell colSpan={10} className="font-semibold text-blue-900">
                                <div className="flex items-center gap-2">
                                  {expandedSections.activeRecipeInputs ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <span>Active Recipe Inputs ({categorized.activeRecipeInputs.length})</span>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedSections.activeRecipeInputs && categorized.activeRecipeInputs.map(renderResourceRow)}
                          </>
                        )}

                        {/* Facility Inputs (excluding active recipe inputs) */}
                        {categorized.facilityInputs.length > 0 && (
                          <>
                            <TableRow 
                              className="bg-green-50 hover:bg-green-100 cursor-pointer"
                              onClick={() => toggleSection('facilityInputs')}
                            >
                              <TableCell colSpan={10} className="font-semibold text-green-900">
                                <div className="flex items-center gap-2">
                                  {expandedSections.facilityInputs ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <span>Facility Inputs ({categorized.facilityInputs.length})</span>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedSections.facilityInputs && categorized.facilityInputs.map(renderResourceRow)}
                          </>
                        )}

                        {/* Facility Outputs */}
                        {categorized.facilityOutputs.length > 0 && (
                          <>
                            <TableRow 
                              className="bg-purple-50 hover:bg-purple-100 cursor-pointer"
                              onClick={() => toggleSection('facilityOutputs')}
                            >
                              <TableCell colSpan={10} className="font-semibold text-purple-900">
                                <div className="flex items-center gap-2">
                                  {expandedSections.facilityOutputs ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <span>Facility Outputs ({categorized.facilityOutputs.length})</span>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedSections.facilityOutputs && categorized.facilityOutputs.map(renderResourceRow)}
                          </>
                        )}

                        {/* Other Resources */}
                        {categorized.otherResources.length > 0 && (
                          <>
                            <TableRow 
                              className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                              onClick={() => toggleSection('otherResources')}
                            >
                              <TableCell colSpan={10} className="font-semibold text-gray-900">
                                <div className="flex items-center gap-2">
                                  {expandedSections.otherResources ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <span>Other Resources ({categorized.otherResources.length})</span>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedSections.otherResources && categorized.otherResources.map(renderResourceRow)}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
              
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
                {/* Active Production Card */}
                {(() => {
                  const activeRecipe = getRecipe(facility.activeRecipeId!);
                  if (!activeRecipe) return null;
                  
                  const progressTicks = facility.progressTicks ?? 0;
                  const totalTicks = activeRecipe.processingTicks;
                  const progressPercent = totalTicks > 0 ? (progressTicks / totalTicks) * 100 : 0;
                  
                  const gameState = getGameState();
                  const currentTick = gameState.time.tick;
                  const startedTick = currentTick - progressTicks;
                  const completionTick = startedTick + totalTicks;
                  
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
                            {!facility.isProducing ? (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-gray-100 text-gray-800 border-gray-200"
                              >
                                Stopped
                              </Badge>
                            ) : !hasRequiredInputs(facility.activeRecipeId!) ? (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-orange-100 text-orange-800 border-orange-200"
                              >
                                Needs Input
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-green-100 text-green-800 border-green-200 relative"
                              >
                                <div className="absolute inset-0 bg-green-300 opacity-50 animate-[ping_2s_ease-in-out_infinite] rounded-md" />
                                <span className="relative z-10">Producing</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRecipes(!showRecipes)}
                            >
                              {showRecipes ? 'Hide Recipes' : 'Change Recipe'}
                            </Button>
                            {facility.isProducing && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleStopProduction}
                                disabled={isStopping}
                              >
                                Stop
                              </Button>
                            )}
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

                {/* Recipe Selection - Only show when user clicks "Change Recipe" */}
                {showRecipes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Recipes</CardTitle>
                      <CardDescription>
                        Select a recipe to change production
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {facility.availableRecipeIds.map((recipeId) => {
                          const recipe = getRecipe(recipeId);
                          if (!recipe) return null;
                          
                          const isActive = facility.activeRecipeId === recipeId;
                          
                          return (
                            <Button
                              key={recipeId}
                              onClick={() => {
                                if (!isActive) {
                                  handleStartProduction(recipeId);
                                  setShowRecipes(false);
                                }
                              }}
                              disabled={isStarting || isActive}
                              variant="outline"
                              className={`w-full justify-start h-auto flex flex-col items-start p-3 ${
                                isActive 
                                  ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                                  : 'hover:bg-blue-50'
                              }`}
                            >
                              <div className="flex justify-between items-center w-full mb-2">
                                <span className={`font-medium ${isActive ? 'text-green-700' : ''}`}>
                                  {recipe.name}
                                  {isActive && ' (Current)'}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {recipe.processingTicks} {recipe.processingTicks === 1 ? 'tick' : 'ticks'}
                                </Badge>
                              </div>
                              
                              <div className="text-xs w-full space-y-1">
                                <div className="flex items-start gap-2">
                                  <span className="font-medium text-muted-foreground whitespace-nowrap">Inputs:</span>
                                  <div className="flex-1">
                                    {recipe.inputs.length === 0 ? (
                                      <span className="text-muted-foreground italic">None</span>
                                    ) : (
                                      <span>
                                        {recipe.inputs.map((input, idx) => (
                                          <span key={idx}>
                                            {idx > 0 && ', '}
                                            {getResourceIcon(input.resourceId)} {getResourceName(input.resourceId)} × {input.quantity}
                                          </span>
                                        ))}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="font-medium text-muted-foreground whitespace-nowrap">Outputs:</span>
                                  <div className="flex-1">
                                    {recipe.outputs.length === 0 ? (
                                      <span className="text-muted-foreground italic">None</span>
                                    ) : (
                                      <span className="text-green-700 font-medium">
                                        {recipe.outputs.map((output, idx) => (
                                          <span key={idx}>
                                            {idx > 0 && ', '}
                                            {getResourceIcon(output.resourceId)} {getResourceName(output.resourceId)} × {output.quantity}
                                          </span>
                                        ))}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
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

