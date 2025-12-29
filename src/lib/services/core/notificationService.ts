import { toast } from "@/lib/utils/toast";
import { getGameState } from "@/lib/services/core/gameState";
import {
  saveNotification,
  loadNotifications,
  clearNotifications as clearNotificationsFromDb,
  type NotificationFilter,
  saveNotificationFilter,
  loadNotificationFilters,
  deleteNotificationFilter,
  clearNotificationFilters
} from "@/lib/database/core/notificationsDB";
import { NotificationCategory } from "@/lib/types/types";

export interface PlayerNotification {
  id: string;
  gameDay: number;
  gameMonth: number;
  gameYear: number;
  text: string;
  origin: string;
  userFriendlyOrigin: string;
  category: NotificationCategory;
  isRead?: boolean;
  isDismissed?: boolean;
}

let notifications: PlayerNotification[] = [];
let notificationFilters: NotificationFilter[] = [];
let listeners: ((messages: PlayerNotification[]) => void)[] = [];
let hasLoadedFromDb = false;
let hasLoadedFiltersFromDb = false;
let currentCompanyName: string | null = null;

function notifyListeners() {
  listeners.forEach(listener => listener([...notifications]));
}

async function loadFromDbIfNeeded(companyName: string) {
  if (hasLoadedFromDb) return;
  try {
    const records = await loadNotifications(companyName);
    notifications = records.map(r => ({
      id: r.id,
      gameDay: r.game_day,
      gameMonth: r.game_month,
      gameYear: r.game_year,
      text: r.text,
      origin: r.origin,
      userFriendlyOrigin: r.userFriendlyOrigin,
      category: r.category
    }));
    hasLoadedFromDb = true;
    notifyListeners();
  } catch {
    // Non-critical
  }
}

async function loadFiltersFromDbIfNeeded(companyName: string) {
  if (hasLoadedFiltersFromDb) return;
  try {
    notificationFilters = await loadNotificationFilters(companyName);
    hasLoadedFiltersFromDb = true;
  } catch {
    // Non-critical
  }
}

function isNotificationBlocked(origin: string, category: NotificationCategory): boolean | 'history' {
  let shouldBlock = false;
  let blockFromHistory = false;

  notificationFilters.forEach(filter => {
    let matches = false;
    switch (filter.type) {
      case 'origin':
        matches = filter.value === origin;
        break;
      case 'category':
        matches = filter.value === category;
        break;
    }
    if (matches) {
      shouldBlock = true;
      if (filter.blockFromHistory) {
        blockFromHistory = true;
      }
    }
  });

  if (!shouldBlock) return false;
  return blockFromHistory ? true : 'history';
}

export const notificationService = {
  /**
   * Initialize the notification service with a company name
   * This sets the current company context for all operations
   */
  async ensureInitialized(companyName: string) {
    currentCompanyName = companyName;
    await Promise.all([loadFromDbIfNeeded(companyName), loadFiltersFromDbIfNeeded(companyName)]);
  },

  /**
   * Set the current company name for the notification service
   */
  setCompanyName(companyName: string) {
    currentCompanyName = companyName;
    // Reset loaded flags to reload data for new company
    hasLoadedFromDb = false;
    hasLoadedFiltersFromDb = false;
    notifications = [];
    notificationFilters = [];
    notifyListeners();
  },

  addListener(listener: (messages: PlayerNotification[]) => void) {
    listeners.push(listener);
  },

  removeListener(listener: (messages: PlayerNotification[]) => void) {
    listeners = listeners.filter(l => l !== listener);
  },

  getMessages() {
    return [...notifications];
  },

  async addMessage(text: string, origin: string, userFriendlyOrigin: string, category: NotificationCategory, companyName?: string) {
    const company = companyName || currentCompanyName;
    if (!company) {
      console.warn('notificationService.addMessage: No company name provided');
      return null;
    }

    await loadFiltersFromDbIfNeeded(company);

    const blockStatus = isNotificationBlocked(origin, category);
    if (blockStatus === true) {
      return null;
    }

    const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? (globalThis.crypto as any).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const gameState = getGameState();
    const { GAME_INITIALIZATION } = await import('@/lib/constants');
    const gameDay = gameState.time.day || GAME_INITIALIZATION.STARTING_DAY;
    const gameMonth = gameState.time.month || GAME_INITIALIZATION.STARTING_MONTH;
    const gameYear = gameState.time.year || GAME_INITIALIZATION.STARTING_YEAR;

    const message: PlayerNotification = {
      id,
      gameDay,
      gameMonth,
      gameYear,
      text,
      origin,
      userFriendlyOrigin,
      category
    };

    notifications = [message, ...notifications];
    notifyListeners();

    saveNotification({
      id,
      game_day: gameDay,
      game_month: gameMonth,
      game_year: gameYear,
      text,
      origin,
      userFriendlyOrigin,
      category
    }, company);

    const showToasts = localStorage.getItem('showNotifications') !== 'false';
    const shouldShowToast = showToasts && blockStatus === false;
    if (shouldShowToast) {
      toast({
        title: userFriendlyOrigin,
        description: text,
        variant: 'default',
        origin,
        userFriendlyOrigin,
        category,
      });
    }

    return message;
  },

  clearMessages(companyName?: string) {
    const company = companyName || currentCompanyName;
    if (!company) {
      console.warn('notificationService.clearMessages: No company name provided');
      return;
    }

    notifications = [];
    notifyListeners();
    clearNotificationsFromDb(company);
  },

  dismissMessage(id: string) {
    notifications = notifications.filter(n => n.id !== id);
    notifyListeners();
  },

  markAsRead(id: string) {
    notifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    notifyListeners();
  },

  markAllAsRead() {
    notifications = notifications.map(n => ({ ...n, isRead: true }));
    notifyListeners();
  },

  getFilters() {
    return [...notificationFilters];
  },

  addFilter(type: 'origin' | 'category', value: string, description?: string, blockFromHistory?: boolean, companyName?: string) {
    const company = companyName || currentCompanyName;
    if (!company) {
      console.warn('notificationService.addFilter: No company name provided');
      return null;
    }

    const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? (globalThis.crypto as any).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const filter: NotificationFilter = {
      id,
      type,
      value,
      description,
      blockFromHistory: blockFromHistory ?? false,
      createdAt: new Date().toISOString()
    };

    notificationFilters = [filter, ...notificationFilters];
    saveNotificationFilter(filter, company);
    return filter;
  },

  removeFilter(filterId: string, companyName?: string) {
    const company = companyName || currentCompanyName;
    if (!company) {
      console.warn('notificationService.removeFilter: No company name provided');
      return;
    }

    notificationFilters = notificationFilters.filter(f => f.id !== filterId);
    deleteNotificationFilter(filterId, company);
  },

  clearFilters(companyName?: string) {
    const company = companyName || currentCompanyName;
    if (!company) {
      console.warn('notificationService.clearFilters: No company name provided');
      return;
    }

    notificationFilters = [];
    clearNotificationFilters(company);
  },

  updateFilter(filterId: string, updates: Partial<Omit<NotificationFilter, 'id'>>, companyName?: string) {
    const company = companyName || currentCompanyName;
    if (!company) {
      console.warn('notificationService.updateFilter: No company name provided');
      return null;
    }

    const filterIndex = notificationFilters.findIndex(f => f.id === filterId);
    if (filterIndex === -1) return null;
    const updatedFilter = { ...notificationFilters[filterIndex], ...updates };
    notificationFilters[filterIndex] = updatedFilter;
    saveNotificationFilter(updatedFilter, company);
    return updatedFilter;
  },

  blockNotificationOrigin(origin: string, blockFromHistory?: boolean, companyName?: string) {
    return this.addFilter('origin', origin, `Blocked origin: ${origin}`, blockFromHistory, companyName);
  },

  blockNotificationCategory(category: string, blockFromHistory?: boolean, companyName?: string) {
    const capitalizedCategory = category.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return this.addFilter('category', category, `Blocked category: ${capitalizedCategory}`, blockFromHistory, companyName);
  }
};

