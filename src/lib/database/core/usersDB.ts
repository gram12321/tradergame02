import { supabase } from './supabase';

const USERS_TABLE = 'users';

/**
 * Users Database Operations
 * Basic CRUD operations for user data persistence
 * NOTE: Auth operations (signup/signin/signout) remain in authService
 */

export interface UserData {
  id?: string;
  email?: string;
  name: string;
  avatar?: string;
  avatar_color?: string;
  created_at?: string;
  updated_at?: string;
}

// AuthUser type (camelCase version of UserData for app usage)
export type AuthUser = {
  id: string;
  email?: string;
  name: string;
  avatar?: string;
  avatarColor?: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Insert user
 */
export const insertUser = async (userData: UserData): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .insert(userData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error inserting user:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<AuthUser | null> => {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    
    // Map UserData to AuthUser
    return {
      id: data.id!,
      email: data.email,
      name: data.name,
      avatar: data.avatar,
      avatarColor: data.avatar_color,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date()
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

/**
 * Update user
 */
export const updateUser = async (userId: string, updates: Partial<UserData>): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from(USERS_TABLE)
      .update(updateData)
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from(USERS_TABLE)
      .delete()
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};
