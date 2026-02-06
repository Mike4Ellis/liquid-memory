'use client';

import { useCallback, memo } from 'react';
import type { CreativeItem } from '@/lib/storage';
import { LazyImage } from './LazyImage';

interface VirtualGridProps {
  items: CreativeItem[];
  onDelete: (id: string) => void;
  onCopy: (prompt: string, id: string) => void;
  copiedId: string | null;
}

// Simple grid with pagination for performance
const ITEMS_PER_PAGE = 50;

function GridItem({ 
  item, 
  onDelete, 
  onCopy, 
  isCopied 
}: { 
  item: CreativeItem; 
  onDelete: (id: string) => void; 
  onCopy: (prompt: string, id: string) => void;
  isCopied: boolean;
}) {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all h-full">
      {/* Thumbnail */}
      <div className="aspect-square relative overflow-hidden">
        <LazyImage
          src={item.thumbnailUrl}
          alt={item.naturalPrompt.slice(0, 50)}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onCopy(item.naturalPrompt, item.id)}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Copy prompt"
          >
            {isCopied ? (
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm text-white/80 line-clamp-2 mb-2">
          {item.naturalPrompt || 'No prompt generated'}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/60"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 2 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/60">
                +{item.tags.length - 2}
              </span>
            )}
          </div>
          <span className="text-xs text-white/40">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

const MemoizedGridItem = memo(GridItem);

export function OptimizedGrid({ items, onDelete, onCopy, copiedId }: VirtualGridProps) {
  // Use pagination instead of virtual scroll for simplicity
  const visibleItems = items.slice(0, ITEMS_PER_PAGE);
  const hasMore = items.length > ITEMS_PER_PAGE;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleItems.map((item) => (
          <MemoizedGridItem
            key={item.id}
            item={item}
            onDelete={onDelete}
            onCopy={onCopy}
            isCopied={copiedId === item.id}
          />
        ))}
      </div>
      
      {hasMore && (
        <div className="mt-8 text-center">
          <p className="text-sm text-white/50 mb-2">
            Showing {ITEMS_PER_PAGE} of {items.length} items
          </p>
          <p className="text-xs text-white/30">
            Use search or filters to find more items
          </p>
        </div>
      )}
    </div>
  );
}
