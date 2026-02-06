/**
 * Thumbnail generation utility
 */

export interface ThumbnailResult {
  thumbnail: string; // base64
  width: number;
  height: number;
}

const MAX_THUMBNAIL_SIZE = 300;

export async function generateThumbnail(file: File): Promise<ThumbnailResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Calculate dimensions maintaining aspect ratio
      let { width, height } = img;
      if (width > height) {
        if (width > MAX_THUMBNAIL_SIZE) {
          height = Math.round((height * MAX_THUMBNAIL_SIZE) / width);
          width = MAX_THUMBNAIL_SIZE;
        }
      } else {
        if (height > MAX_THUMBNAIL_SIZE) {
          width = Math.round((width * MAX_THUMBNAIL_SIZE) / height);
          height = MAX_THUMBNAIL_SIZE;
        }
      }
      
      // Create canvas and draw thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      const thumbnail = canvas.toDataURL('image/jpeg', 0.85);
      
      resolve({ thumbnail, width, height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}
