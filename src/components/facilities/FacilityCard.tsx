import type { Facility, ResourceId } from '@/lib/types/types';
import { RECIPES, RESOURCES } from '@/lib/constants';

interface FacilityCardProps {
  facility: Facility;
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const currentRecipe = facility.productionState.currentRecipeId
    ? RECIPES[facility.productionState.currentRecipeId]
    : null;

  const getResourceName = (resourceId: string) => {
    const resource = RESOURCES[resourceId as ResourceId];
    return resource?.name || resourceId;
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{facility.name}</h3>
          <p className="text-sm text-muted-foreground">
            {facility.facilitySubtype || facility.type}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">
            {facility.effectivity.toFixed(0)}% Effectivity
          </div>
          <div className="text-xs text-muted-foreground">
            Base: {facility.baseEffectivity.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Production State */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current Recipe:</span>
          <span className="font-medium">
            {currentRecipe?.name || 'No recipe assigned'}
          </span>
        </div>
        {facility.productionState.isProducing && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Production Progress</span>
              <span>
                {(facility.productionState.productionProgress * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${facility.productionState.productionProgress * 100}%`,
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {facility.productionState.ticksRemaining} tick(s) remaining
            </div>
          </div>
        )}
        {!facility.productionState.isProducing && currentRecipe && (
          <div className="text-xs text-muted-foreground">
            Production paused or waiting for inputs
          </div>
        )}
      </div>

      {/* Recipe Inputs/Outputs */}
      {currentRecipe && (
        <div className="mb-4 space-y-2 rounded-md bg-muted/50 p-3">
          {currentRecipe.inputs.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Inputs:
              </div>
              <div className="space-y-1">
                {currentRecipe.inputs.map((input, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{getResourceName(input.resourceId)}</span>
                    <span className="text-muted-foreground">
                      {input.quantity}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Outputs:
            </div>
            <div className="space-y-1">
              {currentRecipe.outputs.map((output, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{getResourceName(output.resourceId)}</span>
                  <span className="text-muted-foreground">
                    {output.quantity}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventory */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Inventory</span>
          <span className="text-xs text-muted-foreground">
            {facility.inventory.currentUsage} / {facility.inventory.capacity}
          </span>
        </div>
        {facility.inventory.items.length > 0 ? (
          <div className="space-y-1 rounded-md bg-muted/30 p-2">
            {facility.inventory.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span>{getResourceName(item.resourceId)}</span>
                <span className="font-medium">{item.quantity}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md bg-muted/30 p-2 text-sm text-muted-foreground">
            No items in inventory
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>Workers: {facility.workerCount}</span>
        <span>Wage: {facility.wageExpense.toFixed(2)}/tick</span>
      </div>
    </div>
  );
}

