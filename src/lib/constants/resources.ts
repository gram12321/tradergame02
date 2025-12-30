import type { Resource, ResourceId } from '@/lib/types/types';

/**
 * Type definition for resources collection
 */
export type Resources = Record<ResourceId, Resource>;

/**
 * All game resources data
 */
export const RESOURCES_DATA: Resources = {
  grain: {
    id: 'grain',
    name: 'Grain',
  },
  flour: {
    id: 'flour',
    name: 'Flour',
  },
  bread: {
    id: 'bread',
    name: 'Bread',
  },
};

/**
 * Get resource by ID
 */
export function getResource(resourceId: ResourceId): Resource | undefined {
  return RESOURCES_DATA[resourceId];
}

/**
 * Resource icon/emoji mapping
 */
export const RESOURCE_ICONS: Record<ResourceId, string> = {
  grain: '🌾',
  flour: '🧾',
  bread: '🍞',
};

/**
 * Get resource name by ID
 */
export function getResourceName(resourceId: ResourceId | string): string {
  const resource = RESOURCES_DATA[resourceId as ResourceId];
  return resource?.name || resourceId;
}

/**
 * Get resource icon/emoji by ID
 */
export function getResourceIcon(resourceId: ResourceId | string): string {
  return RESOURCE_ICONS[resourceId as ResourceId] || '📦';
}

