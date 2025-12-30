import { useState, useEffect, useRef } from 'react';
import type { RecipeId } from '@/lib/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Input } from '@/components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/shadCN/table';
import { updateFacility } from '@/lib/database';
import { getRecipe, getResourceName } from '@/lib/constants';
import { startProduction, stopProduction } from '@/lib/services';
import { Building2, Factory, Warehouse, Store, ArrowLeft, Play, Square, Pencil, Check, X } from 'lucide-react';
import { toast } from '@/lib/utils';
import { useLoadingState, useFacility } from '@/hooks';

interface FacilityDetailProps {
  facilityId: string;
  currentCompany?: { id: string; name: string } | null;
  onBack?: () => void;
}

export function FacilityDetail({ facilityId, currentCompany: _currentCompany, onBack }: FacilityDetailProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoading: isStarting, withLoading: withStartingLoading } = useLoadingState();
  const { isLoading: isStopping, withLoading: withStoppingLoading } = useLoadingState();
  const { isLoading: isRenaming, withLoading: withRenamingLoading } = useLoadingState();
  const lastActiveRecipeRef = useRef<RecipeId | undefined>(undefined);
  
  // Use centralized game data hook for realtime facility updates
  const { facility, isLoading } = useFacility(facilityId);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Type</p>
                  <Badge variant="outline">{facility.type}</Badge>
                </div>
                {facility.facilitySubtype && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Subtype</p>
                    <p className="font-semibold">{facility.facilitySubtype}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">City</p>
                  <p className="font-semibold">{facility.cityId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Effectivity</p>
                  <p className="font-semibold">{facility.effectivity}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Workers</p>
                  <p className="font-semibold">{facility.workerCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Inventory</CardTitle>
                <Badge variant="outline">
                  {facility.inventory.currentUsage} / {facility.inventory.capacity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {facility.inventory.items.length === 0 ? (
                <p className="text-muted-foreground italic py-4 text-center">No items in inventory</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facility.inventory.items.map((item) => (
                      <TableRow key={item.resourceId}>
                        <TableCell>
                          {getResourceName(item.resourceId)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Capacity Usage</span>
                  <span className="text-sm font-semibold">{inventoryUsagePercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(inventoryUsagePercent, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Production */}
          {facility.activeRecipeId && (() => {
            const activeRecipe = getRecipe(facility.activeRecipeId);
            const progressTicks = facility.progressTicks ?? 0;
            const totalTicks = activeRecipe.processingTicks;
            const progressPercent = totalTicks > 0 ? (progressTicks / totalTicks) * 100 : 0;
            
            return (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Active Production</CardTitle>
                      <CardDescription>Currently producing: {activeRecipe.name}</CardDescription>
                    </div>
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
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Inputs</p>
                        {activeRecipe.inputs.length === 0 ? (
                          <p className="text-sm italic text-muted-foreground">None</p>
                        ) : (
                          <ul className="text-sm space-y-1">
                            {activeRecipe.inputs.map((input, idx) => (
                              <li key={idx}>
                                {getResourceName(input.resourceId)} × {input.quantity}
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
                              <li key={idx}>
                                {getResourceName(output.resourceId)} × {output.quantity}
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

          {/* Recipes */}
          <Card>
            <CardHeader>
              <CardTitle>Available Recipes</CardTitle>
              <CardDescription>
                Recipes this facility can execute
              </CardDescription>
            </CardHeader>
            <CardContent>
              {facility.availableRecipeIds.length === 0 ? (
                <p className="text-muted-foreground italic py-4 text-center">No recipes available</p>
              ) : (
                <div className="space-y-4">
                  {facility.availableRecipeIds.map((recipeId) => {
                    try {
                      const recipe = getRecipe(recipeId);
                      const isActive = facility.activeRecipeId === recipeId;
                      const canStart = !facility.activeRecipeId; // Can start if no active production
                      
                      return (
                        <Card 
                          key={recipeId} 
                          className={`border-l-4 ${isActive ? 'border-l-green-500' : 'border-l-primary'}`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold">{recipe.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Processing time: {recipe.processingTicks} tick(s)
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isActive && <Badge variant="default">Active</Badge>}
                                <Badge variant="secondary">{recipeId}</Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Inputs</p>
                                {recipe.inputs.length === 0 ? (
                                  <p className="text-sm italic text-muted-foreground">None</p>
                                ) : (
                                  <ul className="text-sm space-y-1">
                                    {recipe.inputs.map((input, idx) => (
                                      <li key={idx}>
                                        {getResourceName(input.resourceId)} × {input.quantity}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Outputs</p>
                                {recipe.outputs.length === 0 ? (
                                  <p className="text-sm italic text-muted-foreground">None</p>
                                ) : (
                                  <ul className="text-sm space-y-1">
                                    {recipe.outputs.map((output, idx) => (
                                      <li key={idx}>
                                        {getResourceName(output.resourceId)} × {output.quantity}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            {!isActive && (
                              <div className="mt-4 pt-3 border-t">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleStartProduction(recipeId)}
                                  disabled={!canStart || isStarting}
                                  className="w-full"
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Start Production
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    } catch (error) {
                      return (
                        <Card key={recipeId} className="border-l-4 border-l-muted">
                          <CardContent className="pt-4">
                            <p className="text-sm text-muted-foreground">Recipe not found: {recipeId}</p>
                          </CardContent>
                        </Card>
                      );
                    }
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Effectivity</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${facility.effectivity}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">
                    {facility.effectivity}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Inventory Usage</p>
                <p className="text-2xl font-bold">
                  {inventoryUsagePercent.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {facility.inventory.currentUsage} of {facility.inventory.capacity}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                <p className="text-2xl font-bold">{facility.inventory.items.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Recipes</p>
                <p className="text-2xl font-bold">{facility.availableRecipeIds.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

