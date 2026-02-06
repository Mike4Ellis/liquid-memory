'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DragDropUpload } from '@/components/upload/DragDropUpload';
import { StoredImage } from '@/lib/storage';
import { Sparkles, ImagePlus, Library } from 'lucide-react';

export default function Home() {
  const [lastUploaded, setLastUploaded] = useState<StoredImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (image: StoredImage) => {
    setLastUploaded(image);
    setError(null);
    console.log('Uploaded:', image);
  };

  const handleError = (err: string) => {
    setError(err);
    setLastUploaded(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a25]">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400/20 to-purple-500/20">
              <Sparkles className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold text-white">
              Liquid Memory
            </h1>
          </Link>
          
          <nav className="flex items-center gap-2">
            <Link 
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Upload page - current page"
              aria-current="page"
            >
              <ImagePlus className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">Upload</span>
            </Link>
            <Link 
              href="/library"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Navigate to library"
            >
              <Library className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">Library</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">
              Upload an Image
            </h2>
            <p className="text-white/50">
              Drop an image to analyze and extract AI prompts
            </p>
          </div>

          {/* Upload Component */}
          <DragDropUpload
            onUploadComplete={handleUploadComplete}
            onError={handleError}
          />

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {lastUploaded && (
            <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-medium text-white mb-4">
                Upload Complete!
              </h3>
              <div className="space-y-2 text-sm text-white/60">
                <p>ID: <span className="text-white/80 font-mono">{lastUploaded.id}</span></p>
                <p>Name: <span className="text-white/80">{lastUploaded.name}</span></p>
                <p>Type: <span className="text-white/80">{lastUploaded.type}</span></p>
                <p>Size: <span className="text-white/80">{(lastUploaded.size / 1024).toFixed(1)} KB</span></p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
