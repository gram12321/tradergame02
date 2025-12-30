import type { Recipe, RecipeId, ProductionFacilityType } from '@/lib/types/types';

/**
 * All game recipes
 */
export const RECIPES: Record<RecipeId, Recipe> = {
  grow_grain: {
    id: 'grow_grain',
    name: 'Grow Grain',
    inputs: [], // No inputs required
    outputs: [
      {
        resourceId: 'grain',
        quantity: 1,
      },
    ],
    processingTicks: 2,
    facilityTypes: ['farm'],
  },
  mill_grain: {
    id: 'mill_grain',
    name: 'Mill Grain',
    inputs: [],
    outputs: [],
    processingTicks: 1,
    facilityTypes: ['mill'],
  },
  bake_bread: {
    id: 'bake_bread',
    name: 'Bake Bread',
    inputs: [],
    outputs: [],
    processingTicks: 1,
    facilityTypes: ['bakery'],
  },
};

/**
 * Get recipe by ID
 */
export function getRecipe(recipeId: RecipeId): Recipe {
  return RECIPES[recipeId];
}

/**
 * Get all recipes for a facility type
 */
export function getRecipesForFacilityType(facilityType: ProductionFacilityType): Recipe[] {
  return Object.values(RECIPES).filter((recipe) =>
    recipe.facilityTypes.includes(facilityType)
  );
}

