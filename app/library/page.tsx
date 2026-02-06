'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Grid3X3, 
  List, 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Edit3,
  Tag,
  Image as ImageIcon,
  Sparkles,
  Download,
  Upload,
  X
} from 'lucide-react';
import Link from 'next/link';
import { 
  getAllCreativeItems, 
  deleteCreativeItem, 
  searchCreativeItems,
  filterByTag,
  getAllTags,
  type CreativeItem,
  type Tag as TagType,
  exportAllData,
  downloadExport
} from '@/lib/storage';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

type ViewMode = 'grid' | 'list';

export default function LibraryPage() {
  const [items, setItems] = useState<CreativeItem[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allItems, allTags] = await Promise.all([
        getAllCreativeItems(),
        getAllTags()
      ]);
      setItems(allItems);
      setTags(allTags);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter items based on search and tag (using debounced query)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedTag && !item.tags.includes(selectedTag)) return false;
      if (!debouncedSearchQuery) return true;
      
      const query = debouncedSearchQuery.toLowerCase();
      return (
        item.naturalPrompt.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        Object.values(item.prompt).some(v => v?.toLowerCase().includes(query))
      );
    });
  }, [items, selectedTag, debouncedSearchQuery]);

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const success = await deleteCreativeItem(id);
    if (success) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Handle copy prompt
  const handleCopy = async (prompt: string, id: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle export
  const handleExport = async () => {
    const data = await exportAllData();
    downloadExport(data);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a25]">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-black/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400/20 to-purple-500/20">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <h1 className="text-xl font-semibold text-white">Liquid Memory</h1>
              </Link>
              <span className="text-white/30">/</span>
              <span className="text-white/70">Library</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Export</span>
              </button>
              
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">New</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts, tags..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white/70"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                viewMode === 'list'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Tags Filter */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-white/50 mr-2">Filter by tag:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                selectedTag === null
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              All
            </button>
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.name)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5 ${
                  selectedTag === tag.name
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                <span className="text-xs opacity-60">({tag.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-white/50">
            Showing {filteredItems.length} of {items.length} items
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-2xl bg-white/5 mb-4">
              <ImageIcon className="w-12 h-12 text-white/30" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery || selectedTag ? 'No matches found' : 'Your library is empty'}
            </h3>
            <p className="text-sm text-white/50 max-w-md mb-6">
              {searchQuery || selectedTag 
                ? 'Try adjusting your search or filters'
                : 'Upload images and analyze them to start building your creative library'
              }
            </p>
            {!searchQuery && !selectedTag && (
              <Link
                href="/"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Upload Your First Image
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.naturalPrompt.slice(0, 50)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleCopy(item.naturalPrompt, item.id)}
                      className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                      title="Copy prompt"
                    >
                      {copiedId === item.id ? (
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
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
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all group"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.naturalPrompt.slice(0, 50)}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90 line-clamp-2 mb-2">
                    {item.naturalPrompt || 'No prompt generated'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/60"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs text-white/40 ml-auto">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(item.naturalPrompt, item.id)}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                    title="Copy prompt"
                  >
                    {copiedId === item.id ? (
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
