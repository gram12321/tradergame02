import { supabase } from './supabase';

const HIGHSCORES_TABLE = 'highscores';

/**
 * Highscores Database Operations
 * Basic CRUD operations for highscores data persistence
 */

export type ScoreType = string;

export interface HighscoreData {
  company_id: string;
  company_name: string;
  score_type: ScoreType;
  score_value: number;
  game_day?: number;
  game_month?: number;
  game_year?: number;
  achieved_at: string;
  metadata?: Record<string, any>;
}

export interface HighscoreEntry {
  id: string;
  companyId: string;
  companyName: string;
  scoreType: ScoreType;
  scoreValue: number;
  gameDay?: number;
  gameMonth?: number;
  gameYear?: number;
  achievedAt: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Map database row to HighscoreEntry
 */
function mapHighscoreFromDB(dbScore: any): HighscoreEntry {
  return {
    id: dbScore.id,
    companyId: dbScore.company_id,
    companyName: dbScore.company_name,
    scoreType: dbScore.score_type,
    scoreValue: dbScore.score_value,
    gameDay: dbScore.game_day,
    gameMonth: dbScore.game_month,
    gameYear: dbScore.game_year,
    achievedAt: new Date(dbScore.achieved_at),
    createdAt: new Date(dbScore.created_at),
    metadata: dbScore.metadata
  };
}

/**
 * Upsert highscore
 */
export const upsertHighscore = async (highscoreData: HighscoreData): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from(HIGHSCORES_TABLE)
      .upsert(highscoreData);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error upserting highscore:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Load highscores by type
 */
export const loadHighscores = async (scoreType: ScoreType, limit: number = 20, ascending: boolean = false): Promise<HighscoreEntry[]> => {
  try {
    const { data, error } = await supabase
      .from(HIGHSCORES_TABLE)
      .select('*')
      .eq('score_type', scoreType)
      .order('score_value', { ascending })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapHighscoreFromDB);
  } catch (error) {
    console.error('Error loading highscores:', error);
    return [];
  }
};

/**
 * Get company score
 */
export const getCompanyScore = async (companyId: string, scoreType: ScoreType): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from(HIGHSCORES_TABLE)
      .select('score_value')
      .eq('company_id', companyId)
      .eq('score_type', scoreType)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error('Error getting company score:', error);
    return null;
  }
};

/**
 * Delete highscores
 */
export const deleteHighscores = async (scoreType?: ScoreType): Promise<{ success: boolean; error?: string }> => {
  try {
    let query = supabase.from(HIGHSCORES_TABLE).delete();

    if (scoreType) {
      query = query.eq('score_type', scoreType);
    }

    const { error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting highscores:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};
