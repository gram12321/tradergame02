import { getGameState, updateGameState, getCurrentCompany } from '@/lib/services';
import { notificationService, highscoreService, calculateCompanyValue } from '@/lib/services';
import { triggerGameUpdate } from '@/hooks/useGameUpdates';
import { NotificationCategory } from '@/lib/utils';
import { GAME_INITIALIZATION } from '@/lib/constants';
import { DAYS_PER_MONTH, MONTHS_PER_YEAR } from '@/lib/constants/constants';

// Prevent concurrent game tick execution
let isProcessingGameTick = false;

/**
 * Enhanced time advancement with automatic game events
 * This replaces the simple incrementWeek() function with a more sophisticated system
 * Includes protection against concurrent execution to prevent race conditions
 * Also prevents time advancement when modals are minimized
 */
export const processGameTick = async (): Promise<void> => {
  // Prevent concurrent execution - if already processing, return early
  if (isProcessingGameTick) {
    console.warn('Game tick already in progress, skipping duplicate call to prevent race conditions');
    return;
  }



  try {
    isProcessingGameTick = true;
    await executeGameTick();
  } finally {
    isProcessingGameTick = false;
  }
};

/**
 * Internal function that performs the actual game tick logic
 */
const executeGameTick = async (): Promise<void> => {
  const currentState = getGameState();
  let {
    day = GAME_INITIALIZATION.STARTING_DAY,
    month = GAME_INITIALIZATION.STARTING_MONTH,
    year = GAME_INITIALIZATION.STARTING_YEAR
  } = currentState;

  const previousYear = year;

  // Increment day
  day += 1;

  // Check if month changes (every DAYS_PER_MONTH days)
  if (day > DAYS_PER_MONTH) {
    day = 1;
    month += 1;

    // Check if year changes (every MONTHS_PER_YEAR months)
    if (month > MONTHS_PER_YEAR) {
      month = 1;
      year += 1;
      await onNewYear(previousYear, year);
      await notificationService.addMessage(`A new year has begun! Welcome to ${year}!`, 'time.newYear', 'New Year Events', NotificationCategory.TIME_CALENDAR);
    }
  }

  // Update game state with new time values
  await updateGameState({ day, month, year });





  // Log the time advancement
  await notificationService.addMessage(`Time advanced to Day ${day}, Month ${month}, ${year}`, 'time.advancement', 'Time Advancement', NotificationCategory.TIME_CALENDAR);

  // Submit highscores for company progress assessment (daily)
  await submitDailyHighscores();

  // Trigger final UI refresh after all daily effects are processed
  triggerGameUpdate();
};


/**
 * Handle effects that happen at the start of a new year
 */
const onNewYear = async (_previousYear: number, _newYear: number): Promise<void> => {
  // New year notification is handled in the main processGameTick function


};



/**
 * Submit daily highscores for company progress assessment
 * This runs at the end of each game tick to assess company performance
 */
async function submitDailyHighscores(): Promise<void> {
  try {
    const currentCompany = getCurrentCompany();
    if (!currentCompany) return;

    const gameState = getGameState();

    // Calculate company value (total assets - total liabilities)
    const companyValue = await calculateCompanyValue();

    // Use the highscoreService method that handles business logic
    await highscoreService.submitCompanyHighscores(
      currentCompany.name,
      gameState.day || 1,
      gameState.month || 1,
      gameState.year || 2024,
      companyValue
    );
  } catch (error) {
    console.error('Failed to submit daily highscores:', error);
  }
}


