import type {
  Facility,
  FacilityInventory,
  FacilityProductionState,
  Recipe,
  RecipeId,
  ResourceId,
} from '@/lib/types/types';
import { RECIPES } from '@/lib/constants';

/**
 * Production result interface
 */
export interface ProductionResult {
  success: boolean;
  inputsConsumed: Array<{ resourceId: ResourceId; quantity: number }>;
  outputsProduced: Array<{ resourceId: ResourceId; quantity: number }>;
  effectivity: number;
  error?: string;
}

/**
 * Calculate final effectivity for a facility
 * Takes into account base effectivity and office cap (if applicable)
 */
export function calculateEffectivity(facility: Facility): number {
  let effectivity = facility.baseEffectivity;

  // Apply office effectivity cap (Phase 2 feature)
  // Formula: baseEffectivity * officeEffectivity
  if (facility.officeEffectivityCap !== undefined) {
    effectivity = facility.baseEffectivity * (facility.officeEffectivityCap / 100);
  }

  // Ensure effectivity is within valid range (0-100%)
  return Math.max(0, Math.min(100, effectivity));
}

/**
 * Check if facility has sufficient inputs for the recipe
 */
export function canProduce(
  facility: Facility,
  recipe: Recipe
): { canProduce: boolean; missingInputs?: Array<{ resourceId: ResourceId; required: number; available: number }> } {
  // Recipes with no inputs can always be produced
  if (recipe.inputs.length === 0) {
    return { canProduce: true };
  }

  const missingInputs: Array<{ resourceId: ResourceId; required: number; available: number }> = [];

  for (const input of recipe.inputs) {
    const inventoryItem = facility.inventory.items.find(
      (item) => item.resourceId === input.resourceId
    );
    const available = inventoryItem?.quantity || 0;

    if (available < input.quantity) {
      missingInputs.push({
        resourceId: input.resourceId as ResourceId,
        required: input.quantity,
        available,
      });
    }
  }

  return {
    canProduce: missingInputs.length === 0,
    missingInputs: missingInputs.length > 0 ? missingInputs : undefined,
  };
}

/**
 * Consume inputs from facility inventory
 */
function consumeInputs(
  inventory: FacilityInventory,
  inputs: Array<{ resourceId: ResourceId; quantity: number }>
): FacilityInventory {
  const newItems = [...inventory.items];
  let newUsage = inventory.currentUsage;

  for (const input of inputs) {
    const itemIndex = newItems.findIndex(
      (item) => item.resourceId === input.resourceId
    );

    if (itemIndex >= 0) {
      const item = newItems[itemIndex];
      const consumed = Math.min(item.quantity, input.quantity);
      item.quantity -= consumed;
      newUsage -= consumed;

      // Remove item if quantity reaches zero
      if (item.quantity <= 0) {
        newItems.splice(itemIndex, 1);
      }
    }
  }

  return {
    ...inventory,
    items: newItems,
    currentUsage: Math.max(0, newUsage),
  };
}

/**
 * Produce outputs and add to facility inventory
 */
function produceOutputs(
  inventory: FacilityInventory,
  outputs: Array<{ resourceId: ResourceId; quantity: number }>
): FacilityInventory {
  const newItems = [...inventory.items];
  let newUsage = inventory.currentUsage;

  for (const output of outputs) {
    const itemIndex = newItems.findIndex(
      (item) => item.resourceId === output.resourceId
    );

    // Check capacity
    const spaceNeeded = output.quantity;
    const availableSpace = inventory.capacity - inventory.currentUsage;

    if (availableSpace < spaceNeeded) {
      // Not enough space - this should be handled by the caller
      // For now, we'll add what we can
      const canAdd = Math.max(0, availableSpace);
      if (canAdd > 0) {
        if (itemIndex >= 0) {
          newItems[itemIndex].quantity += canAdd;
        } else {
          newItems.push({
            resourceId: output.resourceId,
            quantity: canAdd,
          });
        }
        newUsage += canAdd;
      }
    } else {
      // Enough space - add full output
      if (itemIndex >= 0) {
        newItems[itemIndex].quantity += output.quantity;
      } else {
        newItems.push({
          resourceId: output.resourceId,
          quantity: output.quantity,
        });
      }
      newUsage += output.quantity;
    }
  }

  return {
    ...inventory,
    items: newItems,
    currentUsage: Math.min(inventory.capacity, newUsage),
  };
}

/**
 * Calculate production progress increment based on effectivity
 * Effectivity affects processing speed (how much progress per tick)
 */
function calculateProgressIncrement(
  effectivity: number,
  processingTicks: number
): number {
  // Effectivity as percentage (0-100) affects how fast production completes
  // 100% effectivity = full progress per tick
  // 50% effectivity = half progress per tick
  const progressPerTick = 1 / processingTicks;
  return (progressPerTick * effectivity) / 100;
}

/**
 * Process production for a single facility on a game tick
 */
export function processFacilityProduction(
  facility: Facility
): {
  facility: Facility;
  result: ProductionResult;
} {
  // Only process production facilities
  if (facility.type !== 'production') {
    return {
      facility,
      result: {
        success: false,
        inputsConsumed: [],
        outputsProduced: [],
        effectivity: 0,
        error: 'Facility is not a production facility',
      },
    };
  }

  // Check if facility has a recipe assigned
  const currentRecipeId = facility.productionState.currentRecipeId;
  if (!currentRecipeId) {
    // Try to auto-select first available recipe
    if (facility.availableRecipeIds.length > 0) {
      const autoRecipeId = facility.availableRecipeIds[0];
      const autoRecipe = RECIPES[autoRecipeId];
      if (autoRecipe) {
        const canProduceResult = canProduce(facility, autoRecipe);
        if (canProduceResult.canProduce) {
          // Start production with auto-selected recipe
          const updatedState: FacilityProductionState = {
            currentRecipeId: autoRecipeId,
            isProducing: true,
            productionProgress: 0,
            ticksRemaining: autoRecipe.processingTicks,
          };
          return {
            facility: {
              ...facility,
              productionState: updatedState,
            },
            result: {
              success: true,
              inputsConsumed: [],
              outputsProduced: [],
              effectivity: calculateEffectivity(facility),
            },
          };
        }
      }
    }
    return {
      facility,
      result: {
        success: false,
        inputsConsumed: [],
        outputsProduced: [],
        effectivity: 0,
        error: 'No recipe assigned and no valid recipe available',
      },
    };
  }

  const recipe = RECIPES[currentRecipeId];
  if (!recipe) {
    return {
      facility,
      result: {
        success: false,
        inputsConsumed: [],
        outputsProduced: [],
        effectivity: 0,
        error: `Recipe ${currentRecipeId} not found`,
      },
    };
  }

  const effectivity = calculateEffectivity(facility);
  let updatedState = { ...facility.productionState };
  let updatedInventory = { ...facility.inventory };
  let inputsConsumed: Array<{ resourceId: ResourceId; quantity: number }> = [];
  let outputsProduced: Array<{ resourceId: ResourceId; quantity: number }> = [];

  // If production is in progress, advance it
  if (updatedState.isProducing) {
    // Decrement ticks remaining
    updatedState.ticksRemaining = Math.max(0, updatedState.ticksRemaining - 1);
    
    // Calculate progress increment based on effectivity
    const progressIncrement = calculateProgressIncrement(
      effectivity,
      recipe.processingTicks
    );
    updatedState.productionProgress = Math.min(
      1,
      updatedState.productionProgress + progressIncrement
    );

    // Check if production completed (progress reached 100% or ticks exhausted)
    if (updatedState.productionProgress >= 1 || updatedState.ticksRemaining <= 0) {
      // Production completed - consume inputs and produce outputs
      const canProduceResult = canProduce(facility, recipe);
      if (canProduceResult.canProduce) {
        // Consume inputs
        const inputQuantities = recipe.inputs.map((input) => ({
          resourceId: input.resourceId as ResourceId,
          quantity: input.quantity,
        }));
        updatedInventory = consumeInputs(updatedInventory, inputQuantities);
        inputsConsumed = inputQuantities;

        // Produce outputs (apply effectivity to output quantity)
        const outputQuantities = recipe.outputs.map((output) => ({
          resourceId: output.resourceId as ResourceId,
          quantity: Math.floor((output.quantity * effectivity) / 100),
        }));
        updatedInventory = produceOutputs(updatedInventory, outputQuantities);
        outputsProduced = outputQuantities;

        // Reset production state and check if we can continue
        updatedState.productionProgress = 0;
        updatedState.ticksRemaining = recipe.processingTicks;

        // Check if we can produce again (auto-continue if inputs available)
        const canContinueResult = canProduce(
          { ...facility, inventory: updatedInventory } as Facility,
          recipe
        );
        if (canContinueResult.canProduce) {
          // Continue production
          updatedState.isProducing = true;
        } else {
          // No more inputs - pause production
          updatedState.isProducing = false;
        }
      } else {
        // Not enough inputs - pause production
        updatedState.isProducing = false;
        updatedState.productionProgress = 0;
        updatedState.ticksRemaining = recipe.processingTicks;
      }
    }
  } else if (!updatedState.isProducing) {
    // Production is not active - check if we can start
    const canProduceResult = canProduce(facility, recipe);
    if (canProduceResult.canProduce) {
      // Start production
      updatedState.isProducing = true;
      updatedState.productionProgress = 0;
      updatedState.ticksRemaining = recipe.processingTicks;
    }
  }

  // Update facility effectivity
  const updatedEffectivity = calculateEffectivity(facility);

  return {
    facility: {
      ...facility,
      effectivity: updatedEffectivity,
      inventory: updatedInventory,
      productionState: updatedState,
    },
    result: {
      success: true,
      inputsConsumed,
      outputsProduced,
      effectivity: updatedEffectivity,
    },
  };
}

/**
 * Process production for multiple facilities
 */
export function processFacilitiesProduction(
  facilities: Facility[]
): Array<{ facility: Facility; result: ProductionResult }> {
  return facilities.map(processFacilityProduction);
}

/**
 * Change facility recipe
 */
export function changeFacilityRecipe(
  facility: Facility,
  newRecipeId: RecipeId
): Facility {
  // Validate recipe is available for this facility
  if (!facility.availableRecipeIds.includes(newRecipeId)) {
    throw new Error(
      `Recipe ${newRecipeId} is not available for facility ${facility.id}`
    );
  }

  const recipe = RECIPES[newRecipeId];
  if (!recipe) {
    throw new Error(`Recipe ${newRecipeId} not found`);
  }

  // Check if we can produce with new recipe
  const canProduceResult = canProduce(facility, recipe);

  const newProductionState: FacilityProductionState = {
    currentRecipeId: newRecipeId,
    isProducing: canProduceResult.canProduce,
    productionProgress: 0,
    ticksRemaining: recipe.processingTicks,
  };

  return {
    ...facility,
    productionState: newProductionState,
  };
}

