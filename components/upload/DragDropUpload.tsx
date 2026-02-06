'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { generateThumbnail } from '@/lib/thumbnail';
import { saveImage, type StoredImage } from '@/lib/storage';

interface DragDropUploadProps {
  onUploadComplete?: (image: StoredImage) => void;
  onError?: (error: string) => void;
}

export function DragDropUpload({ onUploadComplete, onError }: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError?.('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setProgress(30);
      };
      reader.readAsDataURL(file);

      // Generate thumbnail
      const thumbnail = await generateThumbnail(file);
      setProgress(60);

      // Save to storage
      const stored = await saveImage(file, thumbnail);
      setProgress(100);

      onUploadComplete?.(stored);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const clearPreview = () => {
    setPreview(null);
    setProgress(0);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center
            transition-all duration-300 cursor-pointer
            ${isDragging 
              ? 'border-cyan-400 bg-cyan-400/10 scale-[1.02]' 
              : 'border-white/20 hover:border-white/40 hover:bg-white/5'
            }
          `}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className={`
              p-4 rounded-full transition-all duration-300
              ${isDragging ? 'bg-cyan-400/20' : 'bg-white/5'}
            `}>
              <Upload className={`
                w-8 h-8 transition-colors duration-300
                ${isDragging ? 'text-cyan-400' : 'text-white/60'}
              `} />
            </div>
            
            <div>
              <p className="text-lg font-medium text-white">
                Drop your image here
              </p>
              <p className="text-sm text-white/50 mt-1">
                or click to browse (JPG, PNG, WebP)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-black/20">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-contain"
          />
          
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-white/80">{progress}%</span>
              </div>
            </div>
          )}
          
          <button
            onClick={clearPreview}
            disabled={uploading}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
