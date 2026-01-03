// Barrel export for core services
export {
  getGameState,
  processGameTickManual,
  setProcessingState,
  setCurrentCompanyForNotifications,
  initializeGameState,
  cleanupGameState,
  addGameStateListener,
} from './gameState';

export { getTimeUntilNextTick } from './gametick';

export { notificationService, type PlayerNotification } from './notificationService';

export {
  fetchRecipes,
  getRecipeFromDB,
  clearRecipesCache,
} from './recipeService';

export {
  fetchResources,
  getResourceFromDB,
  clearResourcesCache,
} from './resourceService';

export {
  fetchFacilityTypes,
  getFacilityTypeFromDB,
  clearFacilityTypesCache,
  type FacilityTypeConfig,
} from './facilityTypeService';

export {
  initializeGameData,
  subscribeFacilities,
  subscribeFacility,
  getFacilities,
  getFacility,
  refreshFacilities,
  refreshAllActiveFacilities,
  cleanupGameData,
  getCurrentCompanyId,
} from './gameData';