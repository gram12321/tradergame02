import { GameDate } from '../types/types';

/**
 * Database Mapper Utilities
 * Shared helper functions for mapping database rows to TypeScript interfaces
 */

/**
 * Convert optional number from DB (handles null/undefined)
 * Returns undefined if value is null or undefined, otherwise converts to Number
 */
export function toOptionalNumber(value: any): number | undefined {
  return value != null ? Number(value) : undefined;
}

/**
 * Convert optional string from DB (handles null/empty)
 * Returns undefined if value is falsy, otherwise returns the string
 */
export function toOptionalString(value: any): string | undefined {
  return value || undefined;
}

/**
 * Build GameDate from separate day/month/year fields
 * Returns undefined if any field is missing
 */
export function buildGameDate(
  day: any,
  month: any,
  year: any
): GameDate | undefined {
  if (day != null && month != null && year != null) {
    return {
      day: Number(day),
      month: Number(month),
      year: Number(year)
    };
  }
  return undefined;
}

/**
 * Convert date string from DB to Date object
 * Returns a new Date if value exists, otherwise returns undefined
 */
export function toOptionalDate(value: any): Date | undefined {
  return value ? new Date(value) : undefined;
}

