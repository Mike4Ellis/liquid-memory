/**
 * Authentication System for Liquid Memory
 * US-016: Anonymous login, OAuth, and session management
 */

import { getSupabaseClient, createSupabaseClient } from './supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// ==================== Types ====================

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
}

export type AuthProvider = 'anonymous' | 'email' | 'google' | 'github';

// ==================== Anonymous Auth ====================

/**
 * Sign in anonymously
 * Creates a temporary user without requiring email/password
 */
export async function signInAnonymously(): Promise<{ user: User | null; error: AuthError | null }> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.signInAnonymously();
  
  if (error) {
    console.error('Anonymous sign-in failed:', error);
    return { user: null, error };
  }
  
  // Initialize user settings for anonymous user
  if (data.user) {
    await initializeUserSettings(data.user.id);
  }
  
  return { user: data.user, error: null };
}

/**
 * Convert anonymous account to permanent account
 */
export async function convertAnonymousToPermanent(
  email: string,
  password: string
): Promise<{ success: boolean; error: AuthError | null }> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.updateUser({
    email,
    password,
  });
  
  if (error) {
    console.error('Account conversion failed:', error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
}

// ==================== Email/Password Auth ====================

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) {
    console.error('Sign up failed:', error);
    return { user: null, error };
  }
  
  if (data.user) {
    await initializeUserSettings(data.user.id);
  }
  
  return { user: data.user, error: null };
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Sign in failed:', error);
    return { user: null, error };
  }
  
  return { user: data.user, error: null };
}

// ==================== OAuth Providers ====================

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(
  provider: 'google' | 'github'
): Promise<{ url: string | null; error: AuthError | null }> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) {
    console.error(`OAuth sign-in with ${provider} failed:`, error);
    return { url: null, error };
  }
  
  return { url: data.url, error: null };
}

// ==================== Session Management ====================

/**
 * Get current session
 */
export async function getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.getSession();
  
  return { session: data.session, error };
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.getUser();
  
  return { user: data.user, error };
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out failed:', error);
  }
  
  return { error };
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  const supabase = getSupabaseClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  
  return () => subscription.unsubscribe();
}

// ==================== Helper Functions ====================

/**
 * Initialize default user settings
 */
async function initializeUserSettings(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  await supabase.from('user_settings').upsert({
    user_id: userId,
    encryption_enabled: false,
    sync_enabled: true,
  } as never, {
    onConflict: 'user_id',
  });
}

/**
 * Check if user is anonymous
 */
export function isAnonymousUser(user: User | null): boolean {
  if (!user) return false;
  return user.is_anonymous === true;
}

/**
 * Get user's display name
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Guest';
  
  if (isAnonymousUser(user)) {
    return `Anonymous (${user.id.slice(0, 8)})`;
  }
  
  return user.email?.split('@')[0] || user.user_metadata?.name || 'User';
}
