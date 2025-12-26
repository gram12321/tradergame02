import type { GameDate } from '@/lib/types/types';

/**
 * Game calendar constants
 */
const DAYS_PER_MONTH = 24;
const MONTHS_PER_YEAR = 7;

/**
 * Create default game date
 */
export function createDefaultGameDate(): GameDate {
  return {
    day: 1,
    month: 1,
    year: 1,
  };
}

/**
 * Advance game date by one day
 * Handles month and year rollover
 */
export function advanceGameDate(date: GameDate): GameDate {
  let newDay = date.day + 1;
  let newMonth = date.month;
  let newYear = date.year;

  // Check if day exceeds days per month
  if (newDay > DAYS_PER_MONTH) {
    newDay = 1;
    newMonth += 1;
  }

  // Check if month exceeds months per year
  if (newMonth > MONTHS_PER_YEAR) {
    newMonth = 1;
    newYear += 1;
  }

  return {
    day: newDay,
    month: newMonth,
    year: newYear,
  };
}

/**
 * Format game date as string
 */
export function formatGameDate(date: GameDate): string {
  return `Year ${date.year}, Month ${date.month}, Day ${date.day}`;
}

/**
 * Format game date as short string
 */
export function formatGameDateShort(date: GameDate): string {
  return `${date.year}/${date.month}/${date.day}`;
}

/**
 * Calculate time until next tick from nextTickTime ISO string
 */
export function getTimeUntilNextTick(nextTickTime: string): string {
  const now = new Date();
  const nextTick = new Date(nextTickTime);
  const diff = nextTick.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Ready';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

