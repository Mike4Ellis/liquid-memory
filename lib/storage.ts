/**
 * Storage utilities for Liquid Memory
 * Handles local file system operations and metadata storage
 */

import localforage from 'localforage';
import { generateThumbnail, type ThumbnailResult } from './thumbnail';

// Error handling wrapper
class StorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new StorageError(errorMessage, error);
  }
}

// Configure localforage instances
const imageDb = localforage.createInstance({
  name: 'liquid-memory',
  storeName: 'images'
});

const creativeDb = localforage.createInstance({
  name: 'liquid-memory',
  storeName: 'creative-items'
});

const tagsDb = localforage.createInstance({
  name: 'liquid-memory',
  storeName: 'tags'
});

// ==================== Types ====================

export interface ParsedPrompt {
  subject?: string;
  environment?: string;
  composition?: string;
  lighting?: string;
  mood?: string;
  style?: string;
  camera?: string;
  color?: string;
}

export interface StoredImage {
  id: string;
  name: string;
  type: string;
  size: number;
  thumbnailUrl: string;
  fullImageUrl: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  createdAt: number;
}

export interface CreativeItem {
  id: string;
  imageId: string;
  thumbnailUrl: string;
  fullImageUrl: string;
  prompt: ParsedPrompt;
  naturalPrompt: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
  createdAt: number;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  items: CreativeItem[];
  tags: Tag[];
}

// ==================== Image Storage (Legacy) ====================

export async function saveImage(file: File, thumbnailResult?: ThumbnailResult): Promise<StoredImage> {
  return withErrorHandling(async () => {
    const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    let thumbnail: ThumbnailResult;
    if (thumbnailResult) {
      thumbnail = thumbnailResult;
    } else {
      thumbnail = await generateThumbnail(file);
    }
    
    const fullImageUrl = await readFileAsDataURL(file);
    
    const item: StoredImage = {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      thumbnailUrl: thumbnail.thumbnail,
      fullImageUrl,
      thumbnailWidth: thumbnail.width,
      thumbnailHeight: thumbnail.height,
      createdAt: Date.now()
    };
    
    await imageDb.setItem(id, item);
    return item;
  }, 'Failed to save image');
}

export async function getAllImages(): Promise<StoredImage[]> {
  const items: StoredImage[] = [];
  await imageDb.iterate((value) => {
    items.push(value as StoredImage);
  });
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getImage(id: string): Promise<StoredImage | null> {
  return await imageDb.getItem<StoredImage>(id);
}

export async function deleteImage(id: string): Promise<void> {
  await imageDb.removeItem(id);
}

// ==================== Creative Item Storage ====================

export async function createCreativeItem(
  imageId: string,
  thumbnailUrl: string,
  fullImageUrl: string,
  prompt: ParsedPrompt,
  naturalPrompt: string,
  tags: string[] = []
): Promise<CreativeItem> {
  const id = `creative_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();
  
  const item: CreativeItem = {
    id,
    imageId,
    thumbnailUrl,
    fullImageUrl,
    prompt,
    naturalPrompt,
    tags,
    createdAt: now,
    updatedAt: now
  };
  
  await creativeDb.setItem(id, item);
  
  // Update tag counts
  for (const tagName of tags) {
    await incrementTagCount(tagName);
  }
  
  return item;
}

export async function updateCreativeItem(
  id: string,
  updates: Partial<Omit<CreativeItem, 'id' | 'createdAt'>>
): Promise<CreativeItem | null> {
  const existing = await creativeDb.getItem<CreativeItem>(id);
  if (!existing) return null;
  
  // Handle tag changes
  if (updates.tags) {
    const oldTags = new Set(existing.tags);
    const newTags = new Set(updates.tags);
    
    // Decrement removed tags
    for (const tag of oldTags) {
      if (!newTags.has(tag)) {
        await decrementTagCount(tag);
      }
    }
    
    // Increment added tags
    for (const tag of newTags) {
      if (!oldTags.has(tag)) {
        await incrementTagCount(tag);
      }
    }
  }
  
  const updated: CreativeItem = {
    ...existing,
    ...updates,
    updatedAt: Date.now()
  };
  
  await creativeDb.setItem(id, updated);
  return updated;
}

export async function deleteCreativeItem(id: string): Promise<boolean> {
  const item = await creativeDb.getItem<CreativeItem>(id);
  if (!item) return false;
  
  // Decrement tag counts
  for (const tag of item.tags) {
    await decrementTagCount(tag);
  }
  
  await creativeDb.removeItem(id);
  return true;
}

export async function getCreativeItem(id: string): Promise<CreativeItem | null> {
  return await creativeDb.getItem<CreativeItem>(id);
}

export async function getAllCreativeItems(): Promise<CreativeItem[]> {
  const items: CreativeItem[] = [];
  await creativeDb.iterate((value) => {
    items.push(value as CreativeItem);
  });
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

// ==================== Search & Filter ====================

export async function searchCreativeItems(query: string): Promise<CreativeItem[]> {
  const allItems = await getAllCreativeItems();
  const lowerQuery = query.toLowerCase();
  
  return allItems.filter(item => {
    // Search in natural prompt
    if (item.naturalPrompt.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in tags
    if (item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
    
    // Search in individual prompt dimensions
    return Object.values(item.prompt).some(value => 
      value?.toLowerCase().includes(lowerQuery)
    );
  });
}

export async function filterByTag(tagName: string): Promise<CreativeItem[]> {
  const allItems = await getAllCreativeItems();
  return allItems.filter(item => 
    item.tags.some(tag => tag.toLowerCase() === tagName.toLowerCase())
  );
}

export async function filterByTags(tagNames: string[]): Promise<CreativeItem[]> {
  const allItems = await getAllCreativeItems();
  const lowerTags = tagNames.map(t => t.toLowerCase());
  return allItems.filter(item =>
    lowerTags.every(tag => 
      item.tags.some(itemTag => itemTag.toLowerCase() === tag)
    )
  );
}

// ==================== Tag Management ====================

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

function getRandomColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

export async function getOrCreateTag(name: string): Promise<Tag> {
  const existing = await tagsDb.getItem<Tag>(name.toLowerCase());
  if (existing) return existing;
  
  const newTag: Tag = {
    id: `tag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: name.trim(),
    color: getRandomColor(),
    count: 0,
    createdAt: Date.now()
  };
  
  await tagsDb.setItem(name.toLowerCase(), newTag);
  return newTag;
}

export async function getAllTags(): Promise<Tag[]> {
  const tags: Tag[] = [];
  await tagsDb.iterate((value) => {
    tags.push(value as Tag);
  });
  return tags.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function incrementTagCount(name: string): Promise<void> {
  const tag = await getOrCreateTag(name);
  tag.count++;
  await tagsDb.setItem(name.toLowerCase(), tag);
}

export async function decrementTagCount(name: string): Promise<void> {
  const tag = await tagsDb.getItem<Tag>(name.toLowerCase());
  if (tag && tag.count > 0) {
    tag.count--;
    await tagsDb.setItem(name.toLowerCase(), tag);
  }
}

export async function renameTag(oldName: string, newName: string): Promise<boolean> {
  const tag = await tagsDb.getItem<Tag>(oldName.toLowerCase());
  if (!tag) return false;
  
  // Update all items with this tag
  const items = await filterByTag(oldName);
  for (const item of items) {
    const newTags = item.tags.map(t => 
      t.toLowerCase() === oldName.toLowerCase() ? newName : t
    );
    await updateCreativeItem(item.id, { tags: newTags });
  }
  
  // Delete old tag and create new one with same count
  await tagsDb.removeItem(oldName.toLowerCase());
  const newTag: Tag = {
    ...tag,
    name: newName.trim(),
    count: items.length
  };
  await tagsDb.setItem(newName.toLowerCase(), newTag);
  
  return true;
}

export async function deleteTag(name: string): Promise<boolean> {
  const tag = await tagsDb.getItem<Tag>(name.toLowerCase());
  if (!tag) return false;
  
  // Remove tag from all items
  const items = await filterByTag(name);
  for (const item of items) {
    const newTags = item.tags.filter(t => t.toLowerCase() !== name.toLowerCase());
    await updateCreativeItem(item.id, { tags: newTags });
  }
  
  await tagsDb.removeItem(name.toLowerCase());
  return true;
}

// ==================== Import / Export ====================

export async function exportAllData(): Promise<ExportData> {
  const [items, tags] = await Promise.all([
    getAllCreativeItems(),
    getAllTags()
  ]);
  
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    items,
    tags
  };
}

export async function importData(data: ExportData): Promise<{ success: boolean; imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;
  
  try {
    // Validate version
    if (!data.version) {
      errors.push('Invalid export data: missing version');
      return { success: false, imported: 0, errors };
    }
    
    // Import tags first
    if (data.tags) {
      for (const tag of data.tags) {
        await tagsDb.setItem(tag.name.toLowerCase(), tag);
      }
    }
    
    // Import items
    if (data.items) {
      for (const item of data.items) {
        try {
          await creativeDb.setItem(item.id, item);
          imported++;
        } catch (err) {
          errors.push(`Failed to import item ${item.id}: ${err}`);
        }
      }
    }
    
    return { success: errors.length === 0, imported, errors };
  } catch (err) {
    errors.push(`Import failed: ${err}`);
    return { success: false, imported, errors };
  }
}

export function downloadExport(data: ExportData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `liquid-memory-export-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==================== Utility ====================

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
