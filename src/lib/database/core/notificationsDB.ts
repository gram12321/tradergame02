import { supabase } from '@/lib/utils/supabase';
import { NotificationCategory } from '@/lib/types/types';

const NOTIFICATIONS_TABLE = 'notifications';

/**
 * Notification Database Operations
 * Basic CRUD operations for notification data persistence
 * 
 * Note: All functions accept companyName as a parameter for proper scoping
 */

export interface DbNotificationRecord {
  id: string;
  game_day: number;
  game_month: number;
  game_year: number;
  text: string;
  origin: string;
  userFriendlyOrigin: string;
  category: NotificationCategory;
}

export interface NotificationFilter {
  id: string;
  type: 'origin' | 'category';
  value: string;
  description?: string;
  blockFromHistory?: boolean;
  createdAt: string;
}

/**
 * Save notification
 */
export const saveNotification = async (notification: DbNotificationRecord, companyName: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .upsert({
        id: notification.id,
        company_name: companyName,
        game_day: notification.game_day,
        game_month: notification.game_month,
        game_year: notification.game_year,
        text: notification.text,
        origin: notification.origin || null,
        userfriendlyorigin: notification.userFriendlyOrigin || null,
        category: notification.category || null
      });

    if (error) throw error;
  } catch (error) {
    // Silently fail - notifications are non-critical
  }
};

/**
 * Load notifications
 */
export const loadNotifications = async (companyName: string): Promise<DbNotificationRecord[]> => {
  try {
    const { data, error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .select('*')
      .eq('company_name', companyName)
      .order('game_year', { ascending: false })
      .order('game_month', { ascending: false })
      .order('game_day', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      game_day: row.game_day || 1,
      game_month: row.game_month || 1,
      game_year: row.game_year,
      text: row.text,
      origin: row.origin,
      userFriendlyOrigin: row.userfriendlyorigin,
      category: row.category
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Clear notifications
 */
export const clearNotifications = async (companyName: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .delete()
      .eq('company_name', companyName);

    if (error) throw error;
  } catch (error) {
    // Silently fail
  }
};

// ===== NOTIFICATION FILTER OPERATIONS =====

const NOTIFICATION_FILTERS_TABLE = 'notification_filters';

/**
 * Save notification filter
 */
export const saveNotificationFilter = async (filter: NotificationFilter, companyName: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(NOTIFICATION_FILTERS_TABLE)
      .upsert({
        id: filter.id,
        company_name: companyName,
        filter_type: filter.type,
        filter_value: filter.value,
        description: filter.description,
        block_from_history: filter.blockFromHistory ?? false,
        created_at: filter.createdAt
      });

    if (error) throw error;
  } catch (error) {
    // Silently fail - filters are non-critical
  }
};

/**
 * Load notification filters
 */
export const loadNotificationFilters = async (companyName: string): Promise<NotificationFilter[]> => {
  try {
    const { data, error } = await supabase
      .from(NOTIFICATION_FILTERS_TABLE)
      .select('*')
      .eq('company_name', companyName)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      type: row.filter_type as 'origin' | 'category',
      value: row.filter_value,
      description: row.description,
      blockFromHistory: row.block_from_history ?? false,
      createdAt: row.created_at
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Delete notification filter
 */
export const deleteNotificationFilter = async (filterId: string, companyName: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(NOTIFICATION_FILTERS_TABLE)
      .delete()
      .eq('id', filterId)
      .eq('company_name', companyName);

    if (error) throw error;
  } catch (error) {
    // Silently fail
  }
};

/**
 * Clear notification filters
 */
export const clearNotificationFilters = async (companyName: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(NOTIFICATION_FILTERS_TABLE)
      .delete()
      .eq('company_name', companyName);

    if (error) throw error;
  } catch (error) {
    // Silently fail
  }
};

