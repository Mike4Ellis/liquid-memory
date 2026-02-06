'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  X,
  Search,
  Tag,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  Check,
  Grid3X3,
  List,
  Copy,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import {
  getAllTags,
  getAllCreativeItems,
  renameTag,
  deleteTag,
  getOrCreateTag,
  filterByTag,
  type Tag as TagType,
  type CreativeItem,
} from '@/lib/storage';

type ViewMode = 'grid' | 'list';
type ModalType = 'create' | 'rename' | 'delete' | 'view' | null;

export default function TagsPage() {
  const [tags, setTags] = useState<TagType[]>([]);
  const [items, setItems] = useState<CreativeItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CreativeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null);
  const [tagNameInput, setTagNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allTags, allItems] = await Promise.all([
        getAllTags(),
        getAllCreativeItems(),
      ]);
      setTags(allTags);
      setItems(allItems);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter tags based on search
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle create tag
  const handleCreateTag = async () => {
    if (!tagNameInput.trim()) {
      setError('Tag name cannot be empty');
      return;
    }

    const trimmedName = tagNameInput.trim();
    const exists = tags.some(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      setError('Tag already exists');
      return;
    }

    setIsSubmitting(true);
    try {
      await getOrCreateTag(trimmedName);
      await loadData();
      closeModal();
    } catch (err) {
      setError('Failed to create tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rename tag
  const handleRenameTag = async () => {
    if (!selectedTag || !tagNameInput.trim()) {
      setError('Tag name cannot be empty');
      return;
    }

    const trimmedName = tagNameInput.trim();
    if (trimmedName.toLowerCase() === selectedTag.name.toLowerCase()) {
      closeModal();
      return;
    }

    const exists = tags.some(
      (t) =>
        t.name.toLowerCase() === trimmedName.toLowerCase() &&
        t.id !== selectedTag.id
    );
    if (exists) {
      setError('Tag name already exists');
      return;
    }

    setIsSubmitting(true);
    try {
      await renameTag(selectedTag.name, trimmedName);
      await loadData();
      closeModal();
    } catch (err) {
      setError('Failed to rename tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete tag
  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    setIsSubmitting(true);
    try {
      await deleteTag(selectedTag.name);
      await loadData();
      closeModal();
    } catch (err) {
      setError('Failed to delete tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle view tag items
  const handleViewTag = async (tag: TagType) => {
    setSelectedTag(tag);
    setIsLoading(true);
    try {
      const tagItems = await filterByTag(tag.name);
      setFilteredItems(tagItems);
      setModalType('view');
    } catch (err) {
      console.error('Failed to load tag items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Open modal helpers
  const openCreateModal = () => {
    setTagNameInput('');
    setError(null);
    setModalType('create');
  };

  const openRenameModal = (tag: TagType, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTag(tag);
    setTagNameInput(tag.name);
    setError(null);
    setModalType('rename');
  };

  const openDeleteModal = (tag: TagType, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTag(tag);
    setError(null);
    setModalType('delete');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedTag(null);
    setTagNameInput('');
    setError(null);
    setIsSubmitting(false);
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

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a25]">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-black/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400/20 to-purple-500/20">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <h1 className="text-xl font-semibold text-white">Liquid Memory</h1>
              </Link>
              <span className="text-white/30">/</span>
              <Link href="/library" className="text-white/70 hover:text-white transition-colors">
                Library
              </Link>
              <span className="text-white/30">/</span>
              <span className="text-white/70">Tags</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">New Tag</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags..."
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

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-white/50">
            <span>{tags.length} tags</span>
            <span>•</span>
            <span>{items.length} items</span>
          </div>
        </div>

        {/* Tags Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
          </div>
        ) : filteredTags.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-2xl bg-white/5 mb-4">
              <Tag className="w-12 h-12 text-white/30" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'No matching tags' : 'No tags yet'}
            </h3>
            <p className="text-sm text-white/50 max-w-md mb-6">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create tags to organize your creative items'}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Create Your First Tag
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                onClick={() => handleViewTag(tag)}
                className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
              >
                {/* Color Bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: tag.color }}
                />

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <h3 className="font-medium text-white truncate">
                        {tag.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <ImageIcon className="w-4 h-4" />
                      <span>{tag.count} items</span>
                    </div>
                    <span className="text-xs text-white/30">
                      {formatDate(tag.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => openRenameModal(tag, e)}
                    className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                    title="Rename"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => openDeleteModal(tag, e)}
                    className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Tag Modal */}
      {modalType === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a25] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Create New Tag</h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={tagNameInput}
                  onChange={(e) => setTagNameInput(e.target.value)}
                  placeholder="Enter tag name..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTag}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Tag Modal */}
      {modalType === 'rename' && selectedTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a25] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Rename Tag</h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  New Name
                </label>
                <input
                  type="text"
                  value={tagNameInput}
                  onChange={(e) => setTagNameInput(e.target.value)}
                  placeholder="Enter new name..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameTag()}
                />
              </div>
              <p className="text-sm text-white/50">
                This will update the tag in {selectedTag.count} item
                {selectedTag.count !== 1 ? 's' : ''}.
              </p>
              {error && (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameTag}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Renaming...' : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tag Modal */}
      {modalType === 'delete' && selectedTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a25] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Delete Tag</h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-white/70">
                  Are you sure you want to delete the tag{' '}
                  <span className="text-white font-medium">&quot;{selectedTag.name}&quot;</span>?
                </p>
              </div>
              <p className="text-sm text-white/50">
                This will remove the tag from {selectedTag.count} item
                {selectedTag.count !== 1 ? 's' : ''}. This action cannot be undone.
              </p>
              {error && (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTag}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Tag Items Modal */}
      {modalType === 'view' && selectedTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-5xl max-h-[90vh] rounded-2xl bg-[#1a1a25] border border-white/10 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedTag.color }}
                />
                <h3 className="text-lg font-semibold text-white">
                  {selectedTag.name}
                </h3>
                <span className="text-sm text-white/50">
                  ({filteredItems.length} items)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10 mr-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'grid'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'list'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/50">No items with this tag</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10"
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.naturalPrompt.slice(0, 50)}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() =>
                              handleCopy(item.naturalPrompt, item.id)
                            }
                            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-white/70 line-clamp-2">
                          {item.naturalPrompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.naturalPrompt.slice(0, 50)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 line-clamp-2">
                          {item.naturalPrompt}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopy(item.naturalPrompt, item.id)}
                        className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
