// ===== CORE TYPES =====

// Time System - Day-Month-Year for tradergame
export interface GameDate {
  day: number;    // 1-24
  month: number;  // 1-7
  year: number;
}

// ===== FINANCE TYPES =====

// Financial transaction interface
export interface Transaction {
  id: string;
  date: GameDate;
  amount: number; // Positive for income, negative for expense
  description: string;
  category: string;
  recurring: boolean;
  money: number; // Money amount after transaction
}


// ===== NOTIFICATION TYPES =====

/**
 * Notification categories - unified system for all notification types
 */
export enum NotificationCategory {
  SYSTEM = 'system',
  FINANCE_AND_STAFF = 'finance',
  TIME_CALENDAR = 'time',          

}

// ===== GAME STATE =====

export interface GameState extends GameDate {
  companyName: string;
  money: number;
}
