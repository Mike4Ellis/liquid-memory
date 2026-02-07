import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

interface CreativeItem {
  id: string;
  thumbnailUrl: string;
  naturalPrompt: string;
  tags: string[];
  createdAt: number;
}

// Memoized list item for performance
const ListItem = memo(({ item, onPress }: { item: CreativeItem; onPress: () => void }) => (
  <TouchableOpacity 
    style={styles.card}
    onPress={onPress}
    accessibilityLabel={`Creative item: ${item.naturalPrompt.slice(0, 50)}...`}
    accessibilityRole="button"
  >
    <Image 
      source={{ uri: item.thumbnailUrl }} 
      style={styles.thumbnail}
      resizeMode="cover"
      accessibilityLabel="Thumbnail image"
    />
    <View style={styles.cardContent}>
      <Text style={styles.promptText} numberOfLines={2}>
        {item.naturalPrompt}
      </Text>
      <View style={styles.tagContainer}>
        {item.tags.slice(0, 3).map((tag, idx) => (
          <View key={idx} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  </TouchableOpacity>
));

export default function LibraryScreen() {
  const [items, setItems] = useState<CreativeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load items with error handling
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Load from local storage / sync with cloud
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 500));
      setItems([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load items';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.naturalPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag ? item.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(items.flatMap(item => item.tags)));

  const handleItemPress = useCallback((item: CreativeItem) => {
    // Navigate to detail/edit screen
    console.log('Pressed item:', item.id);
  }, []);

  const renderItem = useCallback(({ item }: { item: CreativeItem }) => (
    <ListItem item={item} onPress={() => handleItemPress(item)} />
  ), [handleItemPress]);

  const getItemLayout = useCallback((data: unknown, index: number) => ({
    length: 116, // card height + margin
    offset: 116 * index,
    index,
  }), []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadItems}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} accessibilityLabel="Search icon" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search prompts or tags..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search input"
          accessibilityHint="Type to search your creative library"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <View style={styles.tagFilter}>
          <TouchableOpacity
            style={[styles.filterTag, !selectedTag && styles.filterTagActive]}
            onPress={() => setSelectedTag(null)}
            accessibilityLabel="Show all items"
            accessibilityState={{ selected: !selectedTag }}
          >
            <Text style={[styles.filterTagText, !selectedTag && styles.filterTagTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {allTags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.filterTag, selectedTag === tag && styles.filterTagActive]}
              onPress={() => setSelectedTag(tag === selectedTag ? null : tag)}
              accessibilityLabel={`Filter by ${tag}`}
              accessibilityState={{ selected: selectedTag === tag }}
            >
              <Text style={[styles.filterTagText, selectedTag === tag && styles.filterTagTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color={colors.textMuted} accessibilityLabel="Empty state icon" />
          <Text style={styles.emptyText}>No items yet</Text>
          <Text style={styles.emptySubtext}>
            Capture images to build your creative library
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentCyan} />
          }
          // Performance optimizations
          getItemLayout={getItemLayout}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.accentCyan,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryText: {
    color: colors.bgPrimary,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    color: colors.textPrimary,
    fontSize: 16,
  },
  tagFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTagActive: {
    backgroundColor: colors.accentCyan,
    borderColor: colors.accentCyan,
  },
  filterTagText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  filterTagTextActive: {
    color: colors.bgPrimary,
    fontWeight: '600',
  },
  list: {
    padding: spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    height: 100,
  },
  thumbnail: {
    width: 100,
    height: 100,
    backgroundColor: colors.bgTertiary,
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  promptText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
