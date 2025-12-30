import type { City } from '@/lib/types/types';

/**
 * Default cities available in the game
 * Cities are the fundamental geographic units with economic characteristics
 */
export const DEFAULT_CITIES: City[] = [
  {
    id: 'city-1',
    name: 'Capital City',
    wealth: 0.8,
    population: 100000,
    baseWage: 0.8,
    purchasePower: 0.8,
    qualityDemand: 5,
  },
  {
    id: 'city-2',
    name: 'Port Town',
    wealth: 0.6,
    population: 50000,
    baseWage: 0.6,
    purchasePower: 0.6,
    qualityDemand: 3,
  },
  {
    id: 'city-3',
    name: 'Mountain Village',
    wealth: 0.4,
    population: 10000,
    baseWage: 0.4,
    purchasePower: 0.4,
    qualityDemand: 2,
  },
  {
    id: 'city-4',
    name: 'Riverside',
    wealth: 0.5,
    population: 30000,
    baseWage: 0.5,
    purchasePower: 0.5,
    qualityDemand: 2.5,
  },
  {
    id: 'city-5',
    name: 'Plains Town',
    wealth: 0.5,
    population: 25000,
    baseWage: 0.5,
    purchasePower: 0.5,
    qualityDemand: 2.5,
  },
];

/**
 * Get city by ID
 */
export function getCityById(cityId: string): City | undefined {
  return DEFAULT_CITIES.find(city => city.id === cityId);
}

/**
 * Get city by name
 */
export function getCityByName(cityName: string): City | undefined {
  return DEFAULT_CITIES.find(city => city.name === cityName);
}

