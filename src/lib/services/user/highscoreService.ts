import { notificationService } from '@/lib/services';
import { NotificationCategory } from '../../types/types';
import { upsertHighscore, loadHighscores, deleteHighscores, type ScoreType, type HighscoreData, type HighscoreEntry } from '@/lib/database';

/**
 * Minimal Highscore Service
 * Generic highscores system for tracking company achievements
 */

export interface HighscoreSubmission {
  companyId: string;
  companyName: string;
  scoreType: ScoreType;
  scoreValue: number;
  gameDay?: number;
  gameMonth?: number;
  gameYear?: number;
  achievedAt?: string; // ISO string; when provided, overrides default now
}

class HighscoreService {
  /**
   * Submit a highscore entry
   */
  public async submitHighscore(submission: HighscoreSubmission): Promise<{ success: boolean; error?: string }> {
    try {
      const highscoreData: HighscoreData = {
        company_id: submission.companyId,
        company_name: submission.companyName,
        score_type: submission.scoreType,
        score_value: submission.scoreValue,
        game_day: submission.gameDay,
        game_month: submission.gameMonth,
        game_year: submission.gameYear,
        achieved_at: submission.achievedAt || new Date().toISOString()
      };

      return await upsertHighscore(highscoreData);
    } catch (error) {
      console.error('Error submitting highscore:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get highscores by type
   */
  public async getHighscores(scoreType: ScoreType, limit: number = 20): Promise<HighscoreEntry[]> {
    try {
      return await loadHighscores(scoreType, limit);
    } catch (error) {
      console.error('Error getting highscores:', error);
      return [];
    }
  }

  /**
   * Clear highscores
   */
  public async clearHighscores(scoreType?: ScoreType): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await deleteHighscores(scoreType);
      
      if (result.success) {
        const message = scoreType 
          ? `Cleared ${scoreType} highscores`
          : 'Cleared all highscores';
        await notificationService.addMessage(message, 'highscoreService.clearHighscores', 'Highscores Cleared', NotificationCategory.SYSTEM);
      }
      
      return result;
    } catch (error) {
      console.error('Error clearing highscores:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get human-readable name for score type
   */
  public getScoreTypeName(scoreType: ScoreType): string {
    const names: Record<string, string> = {
      'company_value': 'Company Value',
      'company_value_per_month': 'Company Value per Month'
    };
    return names[scoreType] || scoreType;
  }

  /**
   * Submit company value highscore
   */
  public async submitCompanyHighscores(
    companyId: string,
    companyName: string,
    gameDay: number,
    gameMonth: number,
    gameYear: number,
    currentCompanyValue: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.submitHighscore({
        companyId,
        companyName,
        scoreType: 'company_value',
        scoreValue: currentCompanyValue,
        gameDay,
        gameMonth,
        gameYear
      });

      return result;
    } catch (error) {
      console.error('Error submitting company highscores:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export const highscoreService = new HighscoreService();
export default highscoreService;
