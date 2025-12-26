// Resource Definitions
// All resources available in the game

import type { Resource, ResourceId } from '@/lib/types/types';

/**
 * Basic production chain resources
 */
export const RESOURCES: Record<ResourceId, Resource> = {
  grain: {
    id: 'grain',
    name: 'Grain',
    category: 'raw_material',
    quality: 1,
  },
  flour: {
    id: 'flour',
    name: 'Flour',
    category: 'processed',
    quality: 1,
  },
  bread: {
    id: 'bread',
    name: 'Bread',
    category: 'product',
    quality: 1,
  },
};
