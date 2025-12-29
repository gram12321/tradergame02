// Barrel export for core services
export {
  getGameState,
  processGameTick,
  processGameTickManual,
  setProcessingState,
  setCurrentCompanyForNotifications,
  initializeGameState,
  cleanupGameState,
  addGameStateListener,
} from './gameState';

export { getTimeUntilNextTick } from './gametick';

export { notificationService, type PlayerNotification } from './notificationService';