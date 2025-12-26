// Recipe Definitions
// All production recipes available in the game

import type { Recipe, RecipeId } from '@/lib/types/types';

/**
 * Recipe definitions for the basic production chain
 */
export const RECIPES: Record<RecipeId, Recipe> = {
  // Farm: Produces Grain (no input required)
  produce_grain: {
    id: 'produce_grain',
    name: 'Produce Grain',
    description: 'Grow and harvest grain from fields',
    inputs: [],
    outputs: [
      {
        resourceId: 'grain',
        quantity: 1,
      },
    ],
    processingTicks: 1,
    facilityTypes: ['farm'],
  },

  // Mill: Grain -> Flour
  mill_grain: {
    id: 'mill_grain',
    name: 'Mill Grain',
    description: 'Grind grain into flour',
    inputs: [
      {
        resourceId: 'grain',
        quantity: 1,
      },
    ],
    outputs: [
      {
        resourceId: 'flour',
        quantity: 1,
      },
    ],
    processingTicks: 1,
    facilityTypes: ['mill'],
  },

  // Bakery: Flour -> Bread
  bake_bread: {
    id: 'bake_bread',
    name: 'Bake Bread',
    description: 'Bake flour into bread',
    inputs: [
      {
        resourceId: 'flour',
        quantity: 1,
      },
    ],
    outputs: [
      {
        resourceId: 'bread',
        quantity: 1,
      },
    ],
    processingTicks: 1,
    facilityTypes: ['bakery'],
  },
};

/**
 * Recipe registry map for quick lookup
 */
export const RECIPE_MAP = new Map<string, Recipe>(
  Object.entries(RECIPES)
);
