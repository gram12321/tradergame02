// Barrel export for core services
export {
  getGameState,
  processGameTick,
  processGameTickManual,
  setProcessingState,
  setCurrentCompanyForNotifications,
} from './gameState';

export { getTimeUntilNextTick } from './gametick';

export { notificationService, type PlayerNotification } from './notificationService';