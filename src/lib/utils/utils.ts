import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DAYS_PER_MONTH, MONTHS_PER_YEAR } from '@/lib/constants/timeConstants';
import { GAME_INITIALIZATION } from '@/lib/constants';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
export function getRandomFromArray<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// ========================================
// SECTION 2: NUMBER & CURRENCY FORMATTING
// ========================================

/**
 * Unified number formatting function that handles regular numbers, currency, and compact notation
 * Replaces formatCurrency and formatCompact functions
 * 
 * @param value The number to format
 * @param options Formatting options
 * @returns Formatted number string
 * 
 * @example
 * // Regular number formatting
 * formatNumber(1234.5) // "1.234,50" (German locale)
 * formatNumber(0.987, { adaptiveNearOne: true }) // "0.98700" (extra precision near 1.0)
 * formatNumber(0.01, { smartMaxDecimals: true }) // "0.01" (2 decimals for small numbers)
 * formatNumber(5.2, { smartMaxDecimals: true }) // "5.2" (1 decimal for medium numbers)
 * formatNumber(15, { smartMaxDecimals: true }) // "15" (0 decimals for large numbers)
 * 
 * // Currency formatting
 * formatNumber(1234.56, { currency: true }) // "€1,235"
 * formatNumber(1234567, { currency: true, compact: true }) // "€1.2M"
 * 
 * // Compact notation
 * formatNumber(1234567, { compact: true }) // "1.2M"
 * formatNumber(1234567, { compact: true, decimals: 2 }) // "1.23M"
 */
export function formatNumber(value: number, options?: {
  decimals?: number;
  forceDecimals?: boolean;
  smartDecimals?: boolean;
  smartMaxDecimals?: boolean; // when true, reduce decimals for larger numbers (0-1%: 2-3 decimals, 1-10%: 1 decimal, 10%+: 0 decimals)
  adaptiveNearOne?: boolean; // when true, increase decimals near 1.0 (e.g., 0.95-1.0)
  currency?: boolean; // when true, formats as currency with € symbol
  compact?: boolean; // when true, uses compact notation (K, M, B, T)
  percent?: boolean; // when true, formats as a percentage
  percentIsDecimal?: boolean; // when percent is true: input is decimal (0-1) if true, else 0-100
}): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return options?.currency ? '€0' : '0';
  }
  
  const { 
    decimals, 
    forceDecimals = false, 
    smartDecimals = false, 
    smartMaxDecimals = false, 
    adaptiveNearOne = true,
    currency = false,
    compact = false,
    percent = false,
    percentIsDecimal = true
  } = options || {};

  // Handle percentage formatting first (ignores compact/currency)
  if (percent) {
    const finalDecimals = decimals !== undefined ? decimals : 1;
    const percentage = percentIsDecimal ? value * 100 : value;
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: finalDecimals,
      maximumFractionDigits: finalDecimals
    }).format(percentage / 100);
  }

  // Handle compact notation (with or without currency)
  if (compact) {
    const absValue = Math.abs(value);
    // Default decimals for compact: 1 for currency, 1 for regular
    const compactDecimals = decimals !== undefined ? decimals : 1;
    
    let compactValue: string;
    if (absValue >= 1e12) {
      compactValue = (value / 1e12).toFixed(compactDecimals) + 'T';
    } else if (absValue >= 1e9) {
      compactValue = (value / 1e9).toFixed(compactDecimals) + 'B';
    } else if (absValue >= 1e6) {
      compactValue = (value / 1e6).toFixed(compactDecimals) + 'M';
    } else if (absValue >= 1e3) {
      compactValue = (value / 1e3).toFixed(compactDecimals) + 'K';
    } else {
      compactValue = value.toFixed(compactDecimals);
    }
    
    return currency ? '€' + compactValue : compactValue;
  }
  
  // Handle currency formatting (non-compact)
  if (currency) {
    const finalDecimals = decimals !== undefined ? decimals : 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: finalDecimals,
      maximumFractionDigits: finalDecimals
    }).format(value);
  }
  
  // Regular number formatting (original logic)
  const effectiveDecimals = decimals ?? 2;

  // Smart max decimals: reduce decimals for larger numbers
  let calculatedDecimals = effectiveDecimals;
  if (smartMaxDecimals) {
    const absValue = Math.abs(value);
    if (absValue >= 10) {
      calculatedDecimals = 0; // 10%+: 0 decimals (15%, 100%)
    } else if (absValue >= 1) {
      calculatedDecimals = 1; // 1-10%: 1 decimal (1.2%, 8.5%)
    } else {
      calculatedDecimals = 2; // 0-1%: 2 decimals (0.01%, 0.15%)
    }
  }
  
  // Dynamically increase precision when approaching 1.0 to better show differences (e.g., 0.987 → 0.9870)
  // This ALWAYS takes precedence over smart options when near 1.0
  if (adaptiveNearOne && value < 1 && value >= 0.95) {
    calculatedDecimals = Math.max(calculatedDecimals, 4);
    if (value >= 0.98) {
      calculatedDecimals = Math.max(calculatedDecimals, 5);
    }
  }
  
  // For large numbers (>1000), don't show decimals unless forced
  if (Math.abs(value) >= 1000 && !forceDecimals && !smartDecimals) {
    return value.toLocaleString('de-DE', {
      maximumFractionDigits: 0
    });
  }
  
  // For small whole numbers, don't show decimals unless forced
  if (Number.isInteger(value) && !forceDecimals && !smartDecimals) {
    return value.toLocaleString('de-DE', {
      maximumFractionDigits: 0
    });
  }
  
  // Smart decimals mode: intelligent decimal display based on value magnitude
  // Always uses calculatedDecimals as base (includes smartMaxDecimals and adaptiveNearOne logic)
  // If decimals is specified: uses calculatedDecimals (preserves original behavior)
  // If decimals is NOT specified: uses calculatedDecimals for >=1, new intelligent logic for <1
  // NOTE: Uses minimumFractionDigits: 0 (when forceDecimals is false) to remove trailing zeros
  //       So whole numbers show as "6" not "6,0", but decimals show as "6,1"
  if (smartDecimals) {
    // Handle zero case: show "0" with no decimals
    if (value === 0) {
      return '0';
    }
    
    // If decimals is specified with smartDecimals, use calculatedDecimals (includes smartMaxDecimals and adaptiveNearOne)
    // This preserves the original behavior completely
    if (decimals !== undefined) {
      const maxDecimals = Math.min(calculatedDecimals, 6); // Cap for readability
      const formatted = value.toLocaleString('de-DE', {
        minimumFractionDigits: forceDecimals ? maxDecimals : 0,
        maximumFractionDigits: maxDecimals
      });
      return formatted;
    }
    
    // New intelligent behavior: no decimals specified
    // For values >= 1: use calculatedDecimals (which includes smartMaxDecimals: >=10: 0, >=1: 1, default: 2)
    if (Math.abs(value) >= 1) {
      const maxDecimals = Math.min(calculatedDecimals, 6);
      return value.toLocaleString('de-DE', {
        minimumFractionDigits: forceDecimals ? maxDecimals : 0,
        maximumFractionDigits: maxDecimals
      });
    }
    
    // Handle values > 0 and < 1: show 2 decimals after first non-zero digit
    // BUT respect adaptiveNearOne first (takes precedence)
    // Example: 0.999999 → 0.99999 (adaptiveNearOne: 5 decimals)
    // Example: 0.00044 → 0.00044 (first non-zero at pos 4, show positions 4-5, need 5 total decimals)
    // Example: 0.123 → 0.12 (first non-zero at pos 1, show positions 1-2, need 2 total decimals)
    
    // Check adaptiveNearOne first (takes precedence over new logic)
    if (adaptiveNearOne && value >= 0.95) {
      let adaptiveDecimals = 4;
      if (value >= 0.98) {
        adaptiveDecimals = 5;
      }
      return value.toLocaleString('de-DE', {
        minimumFractionDigits: forceDecimals ? adaptiveDecimals : 0,
        maximumFractionDigits: adaptiveDecimals
      });
    }
    
    // New intelligent logic: show 2 decimals after first non-zero digit
    const absValue = Math.abs(value);
    
    // Use logarithmic approach to find the order of magnitude
    // This handles floating point precision better than string conversion
    // log10(0.00044) ≈ -3.357, so first non-zero is at position ceil(3.357) = 4
    const log10 = Math.log10(absValue);
    const firstNonZeroPosition = Math.ceil(-log10);
    
    // Calculate total decimal places to show: include first non-zero position + 1 more decimal
    // (to show 2 digits total: first non-zero + 1 more)
    // Cap at 6 decimals total for readability
    const totalDecimals = Math.min(firstNonZeroPosition + 1, 6);
    
    // Ensure at least 2 decimals for values < 1 (for values like 0.123)
    const finalDecimals = Math.max(totalDecimals, 2);
    
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: forceDecimals ? finalDecimals : 0,
      maximumFractionDigits: finalDecimals
    });
  }
  
  // For decimals or when forced, show specified decimal places
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: calculatedDecimals,
    maximumFractionDigits: calculatedDecimals
  });
}

/**
 * Format a number as percentage
 * 
 * @param value The number to format (0-1 range or 0-100 range)
 * @param decimals Number of decimal places (default: 1)
 * @param isDecimal Whether the input is in decimal form (0-1) or percentage form (0-100)
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercent(0.873, 1) // "87.3%"
 */
export function formatPercent(value: number, decimals: number = 1, isDecimal: boolean = true): string {
  return formatNumber(value, { percent: true, decimals, percentIsDecimal: isDecimal });
}

// ========================================
// SECTION 3: DATE & TIME FORMATTING
// ========================================

/**
 * Format timestamp as HH:MM:SS
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Format a date as a readable string
 * 
 * @param date The date to format
 * @param includeTime Whether to include time (default: false)
 * @returns Formatted date string
 */
export function formatDate(date: Date, includeTime: boolean = false): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid Date';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format game date components as a readable string
 * 
 * @example formatGameDate(3, 2, 2024) // "Day 3, Month 2, 2024"
 */
export function formatGameDate(day?: number, month?: number, year?: number): string {
  const dayNum = day || 1;
  const monthNum = month || 1;
  const yearNum = year || 2024;
  
  return `Day ${dayNum}, Month ${monthNum}, ${yearNum}`;
}

/**
 * Format game date object as a readable string
 */
export function formatGameDateFromObject(gameDate: { day: number; month: number; year: number }): string {
  return formatGameDate(gameDate.day, gameDate.month, gameDate.year);
}

// ========================================
// SECTION 4: GAME TIME CALCULATIONS
// ========================================

/**
 * Calculate absolute days from game start (2024, Day 1, Month 1)
 * Used for calculating game progression and time-based effects
 * 
 * @param currentDay Current day number (1-24)
 * @param currentMonth Current month number (1-7)
 * @param currentYear Current year
 * @param startDay Starting day (default: 1)
 * @param startMonth Starting month (default: 1)
 * @param startYear Starting year (default: 2024)
 * @returns Total days elapsed
 */
export function calculateAbsoluteDays(
  currentDay: number,
  currentMonth: number,
  currentYear: number,
  startDay: number = 1,
  startMonth: number = 1,
  startYear: number = 2024
): number {
  const startAbsoluteDays =
    (startYear - GAME_INITIALIZATION.STARTING_YEAR) * (DAYS_PER_MONTH * MONTHS_PER_YEAR) +
    (startMonth - 1) * DAYS_PER_MONTH +
    (startDay - 1);

  const currentAbsoluteDays =
    (currentYear - GAME_INITIALIZATION.STARTING_YEAR) * (DAYS_PER_MONTH * MONTHS_PER_YEAR) +
    (currentMonth - 1) * DAYS_PER_MONTH +
    (currentDay - 1);

  return Math.max(1, currentAbsoluteDays - startAbsoluteDays + 1);
}

/**
 * Calculate days elapsed for a company since founding
 * 
 * @param foundedYear Year the company was founded
 * @param currentDay Current day number
 * @param currentMonth Current month number
 * @param currentYear Current year
 * @returns Days elapsed since founding
 */
export function calculateCompanyDays(
  foundedYear: number,
  currentDay: number,
  currentMonth: number,
  currentYear: number
): number {
  const startDays = (foundedYear - GAME_INITIALIZATION.STARTING_YEAR) * (DAYS_PER_MONTH * MONTHS_PER_YEAR) +
                    (1 - 1) * DAYS_PER_MONTH +
                    (1 - 1);
  const currentDays = (currentYear - GAME_INITIALIZATION.STARTING_YEAR) * (DAYS_PER_MONTH * MONTHS_PER_YEAR) +
                      (currentMonth - 1) * DAYS_PER_MONTH +
                      (currentDay - 1);
  return Math.max(1, currentDays - startDays + 1);
}


// ========================================
// SECTION 6: COLOR & BADGE UTILITIES
// ========================================

/**
 * Get color category name based on value (0-1)
 * Used for displaying quality level labels
 */
export function getColorCategory(value: number): string {
  if (value < 0.1) return "Awful";
  if (value < 0.2) return "Terrible";
  if (value < 0.3) return "Poor";
  if (value < 0.4) return "Below Average";
  if (value < 0.5) return "Average";
  if (value < 0.6) return "Above Average";
  if (value < 0.7) return "Good";
  if (value < 0.8) return "Very Good";
  if (value < 0.9) return "Excellent";
  return "Perfect";
}

/**
 * Shared color map for quality-based colors (0-1 scale)
 * Maps level (0-9) to Tailwind text/background classes (explicit strings for JIT detection)
 */
const QUALITY_COLOR_CLASSES: ReadonlyArray<{ text: string; bg: string }> = [
  { text: 'text-red-600', bg: 'bg-red-600' },
  { text: 'text-red-500', bg: 'bg-red-500' },
  { text: 'text-orange-500', bg: 'bg-orange-500' },
  { text: 'text-amber-500', bg: 'bg-amber-500' },
  { text: 'text-yellow-500', bg: 'bg-yellow-500' },
  { text: 'text-lime-500', bg: 'bg-lime-500' },
  { text: 'text-lime-600', bg: 'bg-lime-600' },
  { text: 'text-green-600', bg: 'bg-green-600' },
  { text: 'text-green-700', bg: 'bg-green-700' },
  { text: 'text-green-800', bg: 'bg-green-800' },
];

/**
 * Get Tailwind color class based on quality value (0-1)
 * Returns text color class from red (poor) to green (excellent)
 * 
 * @example getColorClass(0.85) // "text-green-700"
 */
export function getColorClass(value: number): string {
  const level = Math.max(0, Math.min(9, Math.floor(value * 10)));
  return QUALITY_COLOR_CLASSES[level]?.text ?? 'text-gray-500';
}


/**
 * Get badge color classes based on rating value (0-1)
 * Returns both text and background colors for badge components
 * 
 * @example getBadgeColorClasses(0.85) // { text: 'text-green-700', bg: 'bg-green-100' }
 */
export function getBadgeColorClasses(value: number): { text: string; bg: string } {
  const level = Math.max(0, Math.min(9, Math.floor(value * 10)));
  const colorMap: Record<number, { text: string; bg: string }> = {
    0: { text: 'text-red-600', bg: 'bg-red-100' },
    1: { text: 'text-red-500', bg: 'bg-red-100' },
    2: { text: 'text-orange-500', bg: 'bg-orange-100' },
    3: { text: 'text-amber-500', bg: 'bg-amber-100' },
    4: { text: 'text-yellow-500', bg: 'bg-yellow-100' },
    5: { text: 'text-lime-500', bg: 'bg-lime-100' },
    6: { text: 'text-lime-600', bg: 'bg-lime-100' },
    7: { text: 'text-green-600', bg: 'bg-green-100' },
    8: { text: 'text-green-700', bg: 'bg-green-100' },
    9: { text: 'text-green-800', bg: 'bg-green-100' },
  };
  return colorMap[level] || { text: 'text-gray-500', bg: 'bg-gray-100' };
}

// ========================================
// SECTION 7: NOTIFICATION FORMATTING
// ========================================

/**
 * Format a combined month change notification with clear sections and line breaks
 * @param monthChangeMessage The month change announcement
 * @returns Formatted notification text
 */
export function formatMonthChangeNotification(
  monthChangeMessage: string
): string {
  return `🎉 ${monthChangeMessage}`;
}

// ========================================
// SECTION 8: UI & DISPLAY UTILITIES
// ========================================

/**
 * Get flag icon CSS class for country flags using flag-icon-css
 * Returns the complete CSS class string for use with flag-icon-css library
 * Loaded via: https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/css/flag-icon.min.css
 * 
 * @param countryName - Name of the country (e.g., "Italy", "France", "US")
 * @returns Complete CSS class string (e.g., "flag-icon flag-icon-it")
 * 
 * @example
 * <span className={getFlagIcon("Italy")}></span>
 * // Returns: <span class="flag-icon flag-icon-it"></span>
 */
export function getFlagIcon(countryName: string | undefined | null): string {
  if (!countryName) return "flag-icon flag-icon-xx";
  
  const countryToFlagCode: { [key: string]: string } = {
    "Italy": "it",
    "France": "fr", 
    "Spain": "es",
    "United States": "us",
    "US": "us",
    "Germany": "de",
  };
  
  const flagCode = countryToFlagCode[countryName] || "xx";
  return `flag-icon flag-icon-${flagCode}`;
}



