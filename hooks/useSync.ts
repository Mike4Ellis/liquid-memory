/**
 * React Hook for Cloud Synchronization
 * Provides sync state and operations for components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { performSync, queueSyncOperation, getSyncQueue, clearSyncQueue, type ConflictResolution } from '@/lib/sync';
import { onAuthStateChange, getCurrentUser, type AuthState } from '@/lib/auth';
import { createEncryptionManager, type EncryptionManager } from '@/lib/encryption';

export interface SyncHookState {
  // Auth state
  isAuthenticated: boolean;
  user: AuthState['user'];
  isAnonymous: boolean;
  
  // Sync state
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingCount: number;
  syncError: string | null;
  conflicts: ConflictResolution[];
  
  // Encryption state
  isEncryptionEnabled: boolean;
  isEncryptionSetup: boolean;
  isUnlocked: boolean;
  
  // Actions
  sync: () => Promise<void>;
  resolveConflict: (conflict: ConflictResolution, strategy: 'local' | 'remote' | 'merge') => Promise<void>;
  enableEncryption: (password: string) => Promise<void>;
  unlockEncryption: (password: string) => Promise<boolean>;
  lockEncryption: () => void;
  signOut: () => Promise<void>;
}

export function useSync(): SyncHookState {
  const supabase = getSupabaseClient();
  const encryptionManager = useRef<EncryptionManager>(createEncryptionManager()).current;
  
  // Auth state
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    user: AuthState['user'];
    isAnonymous: boolean;
  }>({
    isAuthenticated: false,
    user: null,
    isAnonymous: false,
  });
  
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  
  // Encryption state
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
  const [isEncryptionSetup, setIsEncryptionSetup] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const { user } = await getCurrentUser();
      if (user) {
        setAuthState({
          isAuthenticated: true,
          user,
          isAnonymous: user.is_anonymous === true,
        });
      }
    };
    
    initAuth();
    
    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((event, session) => {
      if (session?.user) {
        setAuthState({
          isAuthenticated: true,
          user: session.user,
          isAnonymous: session.user.is_anonymous === true,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isAnonymous: false,
        });
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Update pending count periodically
  useEffect(() => {
    const updatePending = async () => {
      const queue = await getSyncQueue();
      setPendingCount(queue.length);
    };
    
    updatePending();
    const interval = setInterval(updatePending, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Update encryption state
  useEffect(() => {
    setIsEncryptionSetup(encryptionManager.isSetup);
    setIsEncryptionEnabled(encryptionManager.isEnabled);
    setIsUnlocked(encryptionManager.isEnabled);
  }, [encryptionManager]);
  
  // Perform sync
  const sync = useCallback(async () => {
    if (!authState.isAuthenticated || isSyncing) return;
    
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const result = await performSync();
      
      if (result.conflicts.length > 0) {
        setConflicts(result.conflicts);
      }
      
      if (result.errors.length > 0) {
        setSyncError(result.errors.join(', '));
      }
      
      setLastSyncAt(new Date());
      setPendingCount(0);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [authState.isAuthenticated, isSyncing]);
  
  // Resolve conflict
  const resolveConflict = useCallback(async (
    conflict: ConflictResolution,
    strategy: 'local' | 'remote' | 'merge'
  ) => {
    try {
      const { resolveConflict: doResolve } = await import('@/lib/sync');
      await doResolve(conflict, strategy);
      
      // Remove resolved conflict from list
      setConflicts(prev => prev.filter(c => c.localItem.id !== conflict.localItem.id));
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to resolve conflict');
    }
  }, []);
  
  // Enable encryption
  const enableEncryption = useCallback(async (password: string) => {
    try {
      await encryptionManager.enable(password);
      setIsEncryptionEnabled(true);
      setIsEncryptionSetup(true);
      setIsUnlocked(true);
    } catch (err) {
      throw err;
    }
  }, [encryptionManager]);
  
  // Unlock encryption
  const unlockEncryption = useCallback(async (password: string): Promise<boolean> => {
    const success = await encryptionManager.unlock(password);
    if (success) {
      setIsUnlocked(true);
    }
    return success;
  }, [encryptionManager]);
  
  // Lock encryption
  const lockEncryption = useCallback(() => {
    encryptionManager.lock();
    setIsUnlocked(false);
  }, [encryptionManager]);
  
  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await clearSyncQueue();
    encryptionManager.disable();
    setIsEncryptionEnabled(false);
    setIsUnlocked(false);
  }, [supabase, encryptionManager]);
  
  return {
    // Auth
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isAnonymous: authState.isAnonymous,
    
    // Sync
    isSyncing,
    lastSyncAt,
    pendingCount,
    syncError,
    conflicts,
    
    // Encryption
    isEncryptionEnabled,
    isEncryptionSetup,
    isUnlocked,
    
    // Actions
    sync,
    resolveConflict,
    enableEncryption,
    unlockEncryption,
    lockEncryption,
    signOut,
  };
}
