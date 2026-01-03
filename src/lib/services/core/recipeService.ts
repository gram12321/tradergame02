import { supabase } from '@/lib/utils/supabase';
import type { Recipe } from '@/lib/types/types';

/**
 * Cache for recipes to avoid repeated database calls
 */
let recipesCache: Record<string, Recipe> | null = null;

/**
 * Fetch all recipes from database (single source of truth)
 */
export async function fetchRecipes(): Promise<Record<string, Recipe>> {
  if (recipesCache) {
    return recipesCache;
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('*');

  if (error) {
    console.error('Error fetching recipes:', error);
    return {};
  }

  if (!data) {
    return {};
  }

  // Convert database format to frontend format
  recipesCache = data.reduce((acc, recipe) => {
    acc[recipe.id] = {
      id: recipe.id,
      name: recipe.name,
      inputs: recipe.inputs || [],
      outputs: recipe.outputs || [],
      processingTicks: recipe.processing_ticks,
      facilityTypes: recipe.facility_types || [],
    };
    return acc;
  }, {} as Record<string, Recipe>);

  return recipesCache || {};
}

/**
 * Get recipe by ID
 */
export async function getRecipeFromDB(recipeId: string): Promise<Recipe | null> {
  const recipes = await fetchRecipes();
  return recipes[recipeId] || null;
}

/**
 * Clear recipes cache (call after database updates)
 */
export function clearRecipesCache(): void {
  recipesCache = null;
}
