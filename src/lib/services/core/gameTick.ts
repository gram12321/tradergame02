import { getGameState, updateGameState, getCurrentCompany } from '@/lib/services';
import { notificationService, progressActivities, checkAndTriggerBookkeeping, processEconomyPhaseTransition, processSeasonalLoanPayments, highscoreService, checkAllAchievements, calculateCompanyValue, enforceEmergencyQuickLoanIfNeeded, restructureForcedLoansIfNeeded } from '@/lib/services';
import { triggerGameUpdate } from '@/hooks/useGameUpdates';
import { NotificationCategory, hasMinimizedModals, restoreAllMinimizedModals } from '@/lib/utils';
import { GAME_INITIALIZATION } from '@/lib/constants';
import { DAYS_PER_MONTH, MONTHS_PER_YEAR } from '@/lib/constants/timeConstants';

// Prevent concurrent game tick execution
let isProcessingGameTick = false;

// Throttle configuration for expensive, non-critical checks
const ACHIEVEMENT_CHECK_INTERVAL_DAYS = 4 * DAYS_PER_MONTH; // run every 4 months worth of days
let lastAchievementCheckAbsoluteDay = -1;

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

  // Block time advancement if modals are minimized - restore them but don't advance time
  if (hasMinimizedModals()) {
    restoreAllMinimizedModals();
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
    currentYear = GAME_INITIALIZATION.STARTING_YEAR
  } = currentState;

  const previousMonth = month;
  const previousYear = currentYear;
  let newMonth: number | undefined;
  let economyPhaseMessage: string | null = null;

  // Increment day
  day += 1;

  // Check if month changes (every DAYS_PER_MONTH days)
  if (day > DAYS_PER_MONTH) {
    day = 1;
    month += 1;
    newMonth = month; // Store the new month for combined notification

    // Check if year changes (every MONTHS_PER_YEAR months)
    if (month > MONTHS_PER_YEAR) {
      month = 1;
      currentYear += 1;
      await onNewYear(previousYear, currentYear);
      await notificationService.addMessage(`A new year has begun! Welcome to ${currentYear}!`, 'time.newYear', 'New Year Events', NotificationCategory.TIME_CALENDAR);
    }

    // Process month change (collect economy phase notification if month changed)
    economyPhaseMessage = await onMonthChange(previousMonth, month, true);
  }

  // Update game state with new time values
  await updateGameState({ day, month, currentYear });

  // Progress all activities based on assigned staff work contribution
  await progressActivities();

  // Process daily effects (wage payment will be handled here, but we'll suppress it if month changed)
  const wageMessage = await processDailyEffects(!!newMonth);

  // Check for bookkeeping activity creation (day 1 of any month)
  // Pass month change info and all collected messages if we just changed months
  await checkAndTriggerBookkeeping(newMonth ? `Month ${newMonth}` : undefined, economyPhaseMessage, wageMessage);

  // Automatically pay dividends on month change (day 1 of each month)
  if (day === 1) {
    try {
      const { payDividends } = await import('../index');
      const result = await payDividends();
      if (result.success && result.totalPayment && result.totalPayment > 0) {
        // Dividends paid successfully - notification handled by payDividends
      } else if (result.error && result.error === 'Insufficient funds to pay dividends') {
        // Silently skip if insufficient funds (automatic payment)
      } else if (result.error && result.error === 'Dividend rate is not set or is zero') {
        // Silently skip if no dividend rate set
      }
      // Other errors are silently ignored for automatic payments
    } catch (error) {
      console.warn('Error automatically paying dividends:', error);
      // Don't fail game tick if dividend payment fails
    }
  }

  // Log the time advancement
  await notificationService.addMessage(`Time advanced to Day ${day}, Month ${month}, ${currentYear}`, 'time.advancement', 'Time Advancement', NotificationCategory.TIME_CALENDAR);

  // Submit highscores for company progress assessment (daily)
  await submitDailyHighscores();

  const isNewYearTick = month === 1 && day === 1;

  if (isNewYearTick) {
    triggerGameUpdate();
    await restructureForcedLoansIfNeeded();
  }

  // Trigger final UI refresh after all daily effects are processed
  triggerGameUpdate();
};

/**
 * Handle effects that happen on month change
 * @param skipNotification If true, returns notification text instead of sending it
 * @returns Notification message text if economy phase changed (and skipNotification is true), null otherwise
 */
const onMonthChange = async (_previousMonth: number, _newMonth: number, skipNotification: boolean = false): Promise<string | null> => {
  // Month change notification is handled in the main processGameTick function

  // Process economy phase transition
  return await processEconomyPhaseTransition(skipNotification);
};

/**
 * Handle effects that happen at the start of a new year
 */
const onNewYear = async (_previousYear: number, _newYear: number): Promise<void> => {
  // New year notification is handled in the main processGameTick function

  // Update growth trend multipliers based on performance vs expectations
  try {
    const { updateGrowthTrend } = await import('../finance/shares/growthTrendService');
    await updateGrowthTrend();
  } catch (error) {
    console.error('Error updating growth trend on new year:', error);
    // Don't fail the entire year transition if growth trend update fails
  }
};


/**
 * Process effects that happen every day
 * OPTIMIZED: Runs independent operations in parallel
 * @param suppressWageNotification If true, returns wage notification text instead of sending it
 * @returns Wage notification message text if wages were paid (and suppressWageNotification is true), null otherwise
 */
const processDailyEffects = async (suppressWageNotification: boolean = false): Promise<string | null> => {
  const gameState = getGameState();
  const currentDay = gameState.day || 1;
  const currentMonth = gameState.month || 1;

  // Weekly decay is now handled by the unified prestige hook
  // No need to call decay functions here

  // OPTIMIZATION: Run all independent weekly operations in parallel
  // These operations don't depend on each other and can execute concurrently
  const weeklyTasks = [
    // TODO: Re-implement order/contract generation for tradergame
    // TODO: Re-implement wine processing for tradergame

    // Adjust share price incrementally (daily incremental update)
    (async () => {
      try {
        const { adjustSharePriceIncrementally } = await import('../index');
        await adjustSharePriceIncrementally();
      } catch (error) {
        console.warn('Error during incremental share price adjustment:', error);
      }
    })(),

    // OPTIMIZATION: Defer board satisfaction snapshot to avoid heavy calculation every day
    // Only calculate if company is public (has non-player shareholders)
    // This reduces gameTick latency significantly
    (async () => {
      try {
        const { getCurrentCompany } = await import('../index');
        const company = await getCurrentCompany();
        if (!company) return;
        
        // Check if company has non-player shareholders (public company)
        const { getCompanyShares } = await import('../../database/core/companySharesDB');
        const shares = await getCompanyShares(company.id);
        
        // Only calculate if there are non-player shareholders (public company)
        // 100% player-owned companies don't need board satisfaction tracking
        if (shares && shares.outstandingShares > 0) {
          const { getBoardSatisfactionBreakdown } = await import('../board/boardSatisfactionService');
          // Fire and forget - don't block game tick
          // Pass storeSnapshot=true to trigger snapshot storage during game tick
          void getBoardSatisfactionBreakdown(true).catch(err => 
            console.warn('Error storing board satisfaction snapshot:', err)
          );
        }
      } catch (error) {
        console.warn('Error checking company shares for board satisfaction:', error);
      }
    })()
  ];

  // Throttled, non-blocking achievement checks (decoupled from tick critical path)
  try {
    // Calculate absolute day number
    const absDay = (gameState.currentYear! - GAME_INITIALIZATION.STARTING_YEAR) * (DAYS_PER_MONTH * MONTHS_PER_YEAR) +
                   (gameState.month! - 1) * DAYS_PER_MONTH +
                   (gameState.day! - 1);
    const shouldRunAchievements =
      lastAchievementCheckAbsoluteDay < 0 ||
      absDay - lastAchievementCheckAbsoluteDay >= ACHIEVEMENT_CHECK_INTERVAL_DAYS;

    if (shouldRunAchievements) {
      lastAchievementCheckAbsoluteDay = absDay;
      // Fire-and-forget; do not await to keep tick latency low
      void (async () => {
        try {
          await checkAllAchievements();
        } catch (error) {
          console.warn('Error during throttled achievement checking:', error);
        }
      })();
    }
  } catch (error) {
    console.warn('Failed to schedule achievement checks:', error);
  }

  // Process monthly wage payments (at the start of each month - day 1)
  let wageMessage: string | null = null;
  if (currentDay === 1) {
    // Process wages synchronously if we need to capture the notification
    if (suppressWageNotification) {
      try {
        // TODO: Re-implement wage processing for tradergame
        // const staff = await getAllStaff();
        // wageMessage = await processMonthlyWages(staff, true);
      } catch (error) {
        console.warn('Error during monthly wage processing:', error);
      }
    } else {
      weeklyTasks.push(
        (async () => {
          try {
            // TODO: Re-implement wage processing for tradergame
            // const staff = await getAllStaff();
            // await processMonthlyWages(staff, false);
          } catch (error) {
            console.warn('Error during monthly wage processing:', error);
          }
        })()
      );
    }

    // Process monthly loan payments (at the start of each month - day 1)
    weeklyTasks.push(
      (async () => {
        try {
          await processSeasonalLoanPayments();
        } catch (error) {
          console.warn('Error during monthly loan payments:', error);
        }
      })()
    );
  }

  // OPTIMIZATION: Wait for all tasks to complete in parallel
  await Promise.all(weeklyTasks);

  try {
    await enforceEmergencyQuickLoanIfNeeded();
  } catch (error) {
    console.warn('Error enforcing emergency quick loan:', error);
  }

  return wageMessage;
};

/**
 * Submit daily highscores for company progress assessment
 * This runs at the end of each game tick to assess company performance
 */
async function submitDailyHighscores(): Promise<void> {
  try {
    const currentCompany = getCurrentCompany();
    if (!currentCompany) return;

    // Calculate company value (total assets - total liabilities)
    const companyValue = await calculateCompanyValue();

    // Use the highscoreService method that handles business logic
    await highscoreService.submitCompanyHighscores(
      currentCompany.id,
      currentCompany.name,
      currentCompany.currentDay || 1,
      currentCompany.currentMonth || 1,
      currentCompany.currentYear || 2024,
      currentCompany.foundedYear,
      companyValue,
      GAME_INITIALIZATION.STARTING_MONEY
    );
  } catch (error) {
    console.error('Failed to submit daily highscores:', error);
  }
}


