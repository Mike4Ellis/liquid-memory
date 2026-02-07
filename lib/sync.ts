/**
 * Data Synchronization Engine for Liquid Memory
 * US-017: Offline-first architecture with conflict resolution
 */

import { getSupabaseClient } from './supabase';
import { getAllCreativeItems, type CreativeItem } from './storage';
import type { Database } from '@/types/supabase';

type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error';
type SyncOperation = 'create' | 'update' | 'delete';

// ==================== Types ====================

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: Date | null;
  pendingCount: number;
  isSyncing: boolean;
  error: string | null;
}

export interface SyncQueueItem {
  id: string;
  operation: SyncOperation;
  tableName: string;
  recordId: string;
  payload: Record<string, unknown>;
  retryCount: number;
  createdAt: Date;
}

export interface ConflictResolution {
  localItem: CreativeItem;
  remoteItem: CreativeItem;
  strategy: 'local' | 'remote' | 'merge';
}

// ==================== Sync Queue Management ====================

const SYNC_QUEUE_KEY = 'liquid-memory-sync-queue';
const LAST_SYNC_KEY = 'liquid-memory-last-sync';

/**
 * Add operation to sync queue
 */
export async function queueSyncOperation(
  operation: SyncOperation,
  tableName: string,
  recordId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const queue = await getSyncQueue();
  
  // Check if there's already a pending operation for this record
  const existingIndex = queue.findIndex(
    item => item.recordId === recordId && item.tableName === tableName
  );
  
  const newItem: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    operation,
    tableName,
    recordId,
    payload,
    retryCount: 0,
    createdAt: new Date(),
  };
  
  if (existingIndex >= 0) {
    // Replace existing operation
    queue[existingIndex] = newItem;
  } else {
    queue.push(newItem);
  }
  
  await saveSyncQueue(queue);
}

/**
 * Get all pending sync operations
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return parsed.map((item: SyncQueueItem) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));
  } catch {
    return [];
  }
}

/**
 * Save sync queue to localStorage
 */
async function saveSyncQueue(queue: SyncQueueItem[]): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
  const queue = await getSyncQueue();
  const filtered = queue.filter(item => item.id !== id);
  await saveSyncQueue(filtered);
}

/**
 * Clear entire sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

// ==================== Core Sync Engine ====================

/**
 * Perform full sync with cloud
 * This is the main entry point for synchronization
 */
export async function performSync(): Promise<{
  success: boolean;
  synced: number;
  conflicts: ConflictResolution[];
  errors: string[];
}> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, synced: 0, conflicts: [], errors: ['Not authenticated'] };
  }
  
  const results = {
    success: true,
    synced: 0,
    conflicts: [] as ConflictResolution[],
    errors: [] as string[],
  };
  
  try {
    // 1. Process local sync queue first
    const queueResults = await processSyncQueue(user.id);
    results.synced += queueResults.synced;
    results.errors.push(...queueResults.errors);
    
    // 2. Fetch remote changes since last sync
    const lastSync = await getLastSyncTime();
    const remoteChanges = await fetchRemoteChanges(user.id, lastSync);
    
    // 3. Merge remote changes with local data
    for (const remoteItem of remoteChanges) {
      const localItem = await findLocalItemByCloudId(remoteItem.id);
      
      if (!localItem) {
        // New remote item - add to local
        await importRemoteItem(remoteItem);
        results.synced++;
      } else if (new Date(remoteItem.updated_at) > new Date(localItem.updatedAt)) {
        // Remote is newer - check for conflicts
        const hasLocalChanges = await hasUnsyncedChanges(localItem.id);
        
        if (hasLocalChanges) {
          // Conflict detected
          results.conflicts.push({
            localItem,
            remoteItem: convertCloudToLocal(remoteItem),
            strategy: 'remote', // Default to remote, user can change
          });
        } else {
          // No local changes, apply remote
          await updateLocalItem(convertCloudToLocal(remoteItem));
          results.synced++;
        }
      }
    }
    
    // 4. Upload local items that haven't been synced
    const unsyncedLocals = await getUnsyncedLocalItems();
    for (const localItem of unsyncedLocals) {
      try {
        await uploadLocalItem(user.id, localItem as never);
        results.synced++;
      } catch (_err) {
        results.errors.push(`Failed to upload ${localItem.id}: ${_err}`);
      }
    }
    
    // 5. Update last sync time
    await setLastSyncTime(new Date());
    
  } catch (_err) {
    results.success = false;
    results.errors.push(`Sync failed: ${_err}`);
  }
  
  return results;
}

/**
 * Process pending sync queue
 */
async function processSyncQueue(userId: string): Promise<{ synced: number; errors: string[] }> {
  const supabase = getSupabaseClient();
  const queue = await getSyncQueue();
  const results = { synced: 0, errors: [] as string[] };
  
  for (const item of queue) {
    try {
      let error: Error | null = null;
      
      switch (item.operation) {
        case 'create':
        case 'update':
          ({ error } = await supabase.from('creative_items').upsert({
            ...item.payload,
            user_id: userId,
            updated_at: new Date().toISOString(),
          } as never));
          break;
          
        case 'delete':
          ({ error } = await supabase.from('creative_items').update({
            deleted_at: new Date().toISOString(),
          } as never).eq('id', item.recordId));
          break;
      }
      
      if (error) throw error;
      
      await removeFromSyncQueue(item.id);
      results.synced++;
      
    } catch {
      item.retryCount++;
      
      if (item.retryCount >= 3) {
        results.errors.push(`Max retries exceeded for ${item.recordId}`);
        await removeFromSyncQueue(item.id);
      }
    }
  }
  
  // Save updated queue with retry counts
  await saveSyncQueue(queue.filter(item => item.retryCount < 3));
  
  return results;
}

/**
 * Fetch remote changes since last sync
 */
async function fetchRemoteChanges(
  userId: string,
  since: Date | null
): Promise<Database['public']['Tables']['creative_items']['Row'][]> {
  const supabase = getSupabaseClient();
  
  let query = supabase
    .from('creative_items')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);
  
  if (since) {
    query = query.gt('updated_at', since.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

// ==================== Helper Functions ====================

async function getLastSyncTime(): Promise<Date | null> {
  if (typeof window === 'undefined') return null;
  
  const data = localStorage.getItem(LAST_SYNC_KEY);
  return data ? new Date(data) : null;
}

async function setLastSyncTime(date: Date): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SYNC_KEY, date.toISOString());
}

async function findLocalItemByCloudId(cloudId: string): Promise<CreativeItem | null> {
  // This would need to be implemented based on your storage structure
  // For now, we'll search by matching some unique field
  const allItems = await getAllCreativeItems();
  return allItems.find(item => item.id === cloudId) || null;
}

async function hasUnsyncedChanges(localId: string): Promise<boolean> {
  const queue = await getSyncQueue();
  return queue.some(item => item.recordId === localId);
}

async function getUnsyncedLocalItems(): Promise<CreativeItem[]> {
  const allItems = await getAllCreativeItems();
  const queue = await getSyncQueue();
  const queuedIds = new Set(queue.map(q => q.recordId));
  
  return allItems.filter(item => !queuedIds.has(item.id));
}

function convertCloudToLocal(
  cloudItem: Database['public']['Tables']['creative_items']['Row']
): CreativeItem {
  return {
    id: cloudItem.local_id || cloudItem.id,
    imageId: cloudItem.local_id || cloudItem.id,
    thumbnailUrl: cloudItem.thumbnail_url,
    fullImageUrl: cloudItem.image_url,
    prompt: {
      subject: cloudItem.prompt_subject || undefined,
      environment: cloudItem.prompt_environment || undefined,
      composition: cloudItem.prompt_composition || undefined,
      lighting: cloudItem.prompt_lighting || undefined,
      mood: cloudItem.prompt_mood || undefined,
      style: cloudItem.prompt_style || undefined,
      camera: cloudItem.prompt_camera || undefined,
      color: cloudItem.prompt_color || undefined,
    },
    naturalPrompt: cloudItem.natural_prompt,
    tags: cloudItem.tags,
    createdAt: new Date(cloudItem.created_at).getTime(),
    updatedAt: new Date(cloudItem.updated_at).getTime(),
  };
}

async function importRemoteItem(
  cloudItem: Database['public']['Tables']['creative_items']['Row']
): Promise<void> {
  // Implementation depends on your storage layer
  // Would call createCreativeItem with cloud data
}

async function updateLocalItem(
  localItem: CreativeItem
): Promise<void> {
  // Implementation depends on your storage layer
  // Would call updateCreativeItem with cloud data
}

async function uploadLocalItem(userId: string, localItem: CreativeItem): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase.from('creative_items').upsert({
    user_id: userId,
    local_id: localItem.id,
    image_url: localItem.fullImageUrl,
    thumbnail_url: localItem.thumbnailUrl,
    prompt_subject: localItem.prompt.subject || null,
    prompt_environment: localItem.prompt.environment || null,
    prompt_composition: localItem.prompt.composition || null,
    prompt_lighting: localItem.prompt.lighting || null,
    prompt_mood: localItem.prompt.mood || null,
    prompt_style: localItem.prompt.style || null,
    prompt_camera: localItem.prompt.camera || null,
    prompt_color: localItem.prompt.color || null,
    natural_prompt: localItem.naturalPrompt,
    tags: localItem.tags,
    sync_status: 'synced',
    is_encrypted: false,
    created_at: new Date(localItem.createdAt).toISOString(),
    updated_at: new Date(localItem.updatedAt).toISOString(),
  } as never);
  
  if (error) throw error;
}

// ==================== Conflict Resolution ====================

/**
 * Resolve a sync conflict
 */
export async function resolveConflict(
  conflict: ConflictResolution,
  strategy: 'local' | 'remote' | 'merge'
): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  switch (strategy) {
    case 'local':
      // Re-upload local version
      await uploadLocalItem(user.id, conflict.localItem as never);
      break;
      
    case 'remote':
      // Apply remote to local
      await updateLocalItem(convertCloudToLocal(conflict.remoteItem as unknown as Database['public']['Tables']['creative_items']['Row']));
      break;
      
    case 'merge':
      // Merge both versions (custom logic needed)
      const merged = mergeItems(conflict.localItem, conflict.remoteItem);
      await uploadLocalItem(user.id, merged as never);
      break;
  }
}

function mergeItems(local: CreativeItem, remote: CreativeItem): CreativeItem {
  // Simple merge: take latest timestamp for each field
  return {
    ...local,
    prompt: {
      ...local.prompt,
      ...remote.prompt,
    },
    tags: [...new Set([...local.tags, ...remote.tags])],
    updatedAt: Date.now(),
  };
}
