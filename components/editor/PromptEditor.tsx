'use client';

import { useState, useCallback, useMemo } from 'react';
import { Copy, Download, FileJson, Eye, EyeOff, Sparkles, Check } from 'lucide-react';

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

interface PromptEditorProps {
  initialData?: ParsedPrompt;
  imageUrl?: string;
  onSave?: (data: ParsedPrompt) => void;
  onChange?: (data: ParsedPrompt) => void;
}

const DIMENSIONS = [
  { key: 'subject', label: 'Subject', placeholder: 'Main subject or focus...', description: 'The primary subject of the image' },
  { key: 'environment', label: 'Environment', placeholder: 'Background setting...', description: 'Scene or location context' },
  { key: 'composition', label: 'Composition', placeholder: 'How elements are arranged...', description: 'Framing and layout technique' },
  { key: 'lighting', label: 'Lighting', placeholder: 'Light quality and direction...', description: 'Illumination characteristics' },
  { key: 'mood', label: 'Mood', placeholder: 'Emotional atmosphere...', description: 'Feeling or tone conveyed' },
  { key: 'style', label: 'Style', placeholder: 'Artistic style...', description: 'Visual aesthetic approach' },
  { key: 'camera', label: 'Camera', placeholder: 'Camera settings...', description: 'Technical capture details' },
  { key: 'color', label: 'Color', placeholder: 'Color palette...', description: 'Color grading and harmony' },
] as const;

export function PromptEditor({ initialData = {}, imageUrl, onSave }: PromptEditorProps) {
  const [data, setData] = useState<ParsedPrompt>(initialData);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const naturalPrompt = useMemo(() => {
    return Object.entries(data)
      .filter(([, value]) => value && value.trim())
      .map(([, value]) => value)
      .join(', ');
  }, [data]);

  const handleChange = useCallback((key: keyof ParsedPrompt, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(naturalPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [naturalPrompt]);

  const handleExportJSON = useCallback(() => {
    const exportData = {
      parsed: data,
      natural: naturalPrompt,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, naturalPrompt]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400/20 to-purple-500/20">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Prompt Editor</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showRaw ? 'Structured' : 'Raw'}
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <FileJson className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Image Preview */}
      {imageUrl && (
        <div className="mb-6 rounded-xl overflow-hidden bg-black/20 border border-white/10">
          <img src={imageUrl} alt="Source" className="w-full h-48 object-contain" />
        </div>
      )}

      {showRaw ? (
        /* Raw View */
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={naturalPrompt}
              readOnly
              className="w-full h-40 p-4 rounded-xl bg-black/20 border border-white/10 text-white/90 resize-none focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50"
              aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
            >
              {copied ? <Check className="w-4 h-4 text-green-400" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-white/60 mb-2">JSON Preview</h3>
            <pre className="text-xs text-white/50 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        /* Structured Form */
        <div className="space-y-4">
          {DIMENSIONS.map(({ key, label, placeholder, description }) => (
            <div key={key} className="group">
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                {label}
                <span className="ml-2 text-xs text-white/40 font-normal">{description}</span>
              </label>
              <input
                type="text"
                value={data[key as keyof ParsedPrompt] || ''}
                onChange={(e) => handleChange(key as keyof ParsedPrompt, e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/30 
                         focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30
                         transition-all duration-200"
              />
            </div>
          ))}
        </div>
      )}

      {/* Natural Language Preview */}
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-purple-500/10 border border-cyan-400/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-cyan-400">Natural Language Prompt</h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-400/20 hover:bg-cyan-400/30 
                     text-cyan-400 text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-white/90 leading-relaxed">
          {naturalPrompt || 'Fill in the dimensions above to generate a natural language prompt...'}
        </p>
      </div>

      {/* Save Button */}
      {onSave && (
        <button
          onClick={() => onSave(data)}
          className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 
                   text-white font-medium hover:opacity-90 transition-opacity"
        >
          Save Changes
        </button>
      )}
    </div>
  );
}
