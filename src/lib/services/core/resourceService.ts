import { supabase } from '@/lib/utils/supabase';
import type { Resource } from '@/lib/types/types';

// Cache for resources to avoid repeated database calls
let resourcesCache: Record<string, Resource> | null = null;

/**
 * Fetch all resources from database with caching
 */
export async function fetchResources(): Promise<Record<string, Resource>> {
  // Return cached data if available
  if (resourcesCache) {
    return resourcesCache;
  }

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }

  if (!data) {
    throw new Error('No resources data returned from database');
  }

  // Convert database format to frontend format
  resourcesCache = data.reduce((acc, resource) => {
    acc[resource.id] = {
      id: resource.id,
      name: resource.name,
      icon: resource.icon,
    };
    return acc;
  }, {} as Record<string, Resource>);

  return resourcesCache || {};
}

/**
 * Get a single resource from database by ID
 */
export async function getResourceFromDB(resourceId: string): Promise<Resource | null> {
  // Check cache first
  if (resourcesCache && resourcesCache[resourceId]) {
    return resourcesCache[resourceId];
  }

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .single();

  if (error) {
    console.error(`Error fetching resource ${resourceId}:`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    icon: data.icon,
  };
}

/**
 * Clear resources cache (useful for testing or after updates)
 */
export function clearResourcesCache(): void {
  resourcesCache = null;
}
