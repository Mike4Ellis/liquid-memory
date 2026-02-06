'use client';

import { useState, useCallback } from 'react';
import { 
  Wand2, 
  ArrowLeft, 
  Sparkles,
  Image as ImageIcon,
  Download,
  Save,
  Loader2,
  Settings2,
  X,
  Check,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { PromptEditor, type ParsedPrompt } from '@/components/editor/PromptEditor';
import { createCreativeItem } from '@/lib/storage';

type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

interface GeneratedImage {
  url: string;
  seed: number;
  prompt: string;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState<ParsedPrompt>({});
  const [naturalPrompt, setNaturalPrompt] = useState('');
  const [size, setSize] = useState<'1024x1024' | '1024x768' | '768x1024'>('1024x1024');
  const [style, setStyle] = useState<'photorealistic' | 'anime' | 'oil-painting' | 'watercolor' | 'sketch'>('photorealistic');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Generate image using pollinations.ai (free, no API key needed)
  const handleGenerate = useCallback(async () => {
    if (!naturalPrompt.trim()) {
      setError('Please enter a prompt first');
      return;
    }

    setStatus('generating');
    setError(null);
    setSavedId(null);

    try {
      // Use pollinations.ai for free image generation
      // Format: https://image.pollinations.ai/prompt/{encoded_prompt}?width={w}&height={h}&seed={seed}&nologo=true
      const encodedPrompt = encodeURIComponent(naturalPrompt);
      const [width, height] = size.split('x').map(Number);
      const randomSeed = seed ?? Math.floor(Math.random() * 1000000);
      
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${randomSeed}&nologo=true&enhance=true`;
      
      // Preload image to verify it works
      const img = new Image();
      img.onload = () => {
        setGeneratedImages(prev => [{
          url: imageUrl,
          seed: randomSeed,
          prompt: naturalPrompt
        }, ...prev]);
        setStatus('success');
      };
      img.onerror = () => {
        setError('Failed to generate image. Please try again.');
        setStatus('error');
      };
      img.src = imageUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setStatus('error');
    }
  }, [naturalPrompt, size, seed]);

  // Save generated image to library
  const handleSave = async (imageUrl: string, genPrompt: string) => {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create file from blob
      const file = new File([blob], `generated-${Date.now()}.png`, { type: 'image/png' });
      
      // Convert to data URL for storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fullImageUrl = reader.result as string;
        
        // Create thumbnail (simplified - in production, use proper thumbnail generation)
        const item = await createCreativeItem(
          `gen_${Date.now()}`,
          fullImageUrl, // Use full image as thumbnail for now
          fullImageUrl,
          prompt,
          genPrompt,
          ['generated', style]
        );
        
        setSavedId(item.id);
        setTimeout(() => setSavedId(null), 2000);
      };
      reader.readAsDataURL(blob);
      
    } catch (err) {
      console.error('Failed to save:', err);
      setError('Failed to save image');
    }
  };

  // Handle prompt change from editor
  const handlePromptChange = useCallback((newPrompt: ParsedPrompt) => {
    setPrompt(newPrompt);
    // Build natural prompt from dimensions
    const parts = Object.values(newPrompt).filter(Boolean);
    setNaturalPrompt(parts.join(', '));
  }, []);

  // Random seed
  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a25]">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-black/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/library" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </Link>
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400/20 to-purple-500/20">
                <Wand2 className="w-5 h-5 text-cyan-400" />
              </div>
              <h1 className="text-xl font-semibold text-white">AI Image Generation</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSeed(undefined)}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-sm"
              >
                Random Seed
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Prompt Editor */}
          <div>
            <PromptEditor
              initialData={prompt}
              onChange={handlePromptChange}
            />

            {/* Quick Prompt Input */}
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Natural Language Prompt
              </label>
              <textarea
                value={naturalPrompt}
                onChange={(e) => setNaturalPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Parameters */}
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4 text-white/50" />
                <span className="text-sm font-medium text-white/80">Parameters</span>
              </div>

              <div className="space-y-4">
                {/* Size */}
                <div>
                  <label className="text-xs text-white/50 mb-2 block">Size</label>
                  <div className="flex gap-2">
                    {(['1024x1024', '1024x768', '768x1024'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                          size === s
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {s.replace('x', ' × ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style */}
                <div>
                  <label className="text-xs text-white/50 mb-2 block">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="photorealistic">Photorealistic</option>
                    <option value="anime">Anime</option>
                    <option value="oil-painting">Oil Painting</option>
                    <option value="watercolor">Watercolor</option>
                    <option value="sketch">Sketch</option>
                  </select>
                </div>

                {/* Seed */}
                <div>
                  <label className="text-xs text-white/50 mb-2 block">Seed (optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={seed ?? ''}
                      onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Random"
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      onClick={randomizeSeed}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={status === 'generating' || !naturalPrompt.trim()}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'generating' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Image
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Generated Images</h2>
            
            {generatedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-white/10 bg-white/5">
                <div className="p-6 rounded-2xl bg-white/5 mb-4">
                  <ImageIcon className="w-12 h-12 text-white/30" />
                </div>
                <p className="text-white/50 mb-2">No images generated yet</p>
                <p className="text-sm text-white/30 text-center max-w-sm">
                  Enter a prompt and click Generate to create AI images
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedImages.map((img, index) => (
                  <div
                    key={index}
                    className="rounded-xl overflow-hidden border border-white/10 bg-white/5"
                  >
                    <img
                      src={img.url}
                      alt={`Generated ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-4">
                      <p className="text-xs text-white/50 mb-3 line-clamp-2">
                        {img.prompt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-white/40">
                          Seed: {img.seed}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={img.url}
                            download={`generated-${img.seed}.png`}
                            className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleSave(img.url, img.prompt)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                              savedId === img.url
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                            }`}
                          >
                            {savedId === img.url ? (
                              <>
                                <Check className="w-4 h-4" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Save to Library
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
