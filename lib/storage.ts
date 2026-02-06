/**
 * Storage utilities for Liquid Memory
 * Handles local file system operations and metadata storage
 */

import localforage from 'localforage';
import { generateThumbnail, type ThumbnailResult } from './thumbnail';

// Configure localforage
const db = localforage.createInstance({
  name: 'liquid-memory',
  storeName: 'creative-items'
});

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
  type: 'image';
  originalName: string;
  thumbnailDataUrl: string;
  fullImageDataUrl: string;
  createdAt: number;
}

/**
 * Save image with thumbnail to storage
 */
export async function saveImage(file: File, thumbnailResult?: ThumbnailResult): Promise<StoredImage> {
  const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Generate thumbnail if not provided
  let thumbnail: ThumbnailResult;
  if (thumbnailResult) {
    thumbnail = thumbnailResult;
  } else {
    thumbnail = await generateThumbnail(file);
  }
  
  // Read full image as data URL
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
  
  // Save to IndexedDB
  await db.setItem(id, item);
  
  return item;
}

/**
 * Get all saved images
 */
export async function getAllImages(): Promise<StoredImage[]> {
  const items: StoredImage[] = [];
  await db.iterate((value) => {
    items.push(value as StoredImage);
  });
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Get single image by ID
 */
export async function getImage(id: string): Promise<StoredImage | null> {
  return await db.getItem<StoredImage>(id);
}

/**
 * Delete image
 */
export async function deleteImage(id: string): Promise<void> {
  await db.removeItem(id);
}

/**
 * Read file as Data URL
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
