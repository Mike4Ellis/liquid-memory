import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

interface ParsedPrompt {
  subject?: string;
  environment?: string;
  composition?: string;
  lighting?: string;
  mood?: string;
  style?: string;
  camera?: string;
  color?: string;
}

export default function PromptEditorScreen() {
  const [prompt, setPrompt] = useState<ParsedPrompt>({
    subject: '',
    environment: '',
    composition: '',
    lighting: '',
    mood: '',
    style: '',
    camera: '',
    color: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const promptFields = [
    { key: 'subject', label: 'Subject', placeholder: 'Main subject of the image...' },
    { key: 'environment', label: 'Environment', placeholder: 'Setting or background...' },
    { key: 'composition', label: 'Composition', placeholder: 'Framing and layout...' },
    { key: 'lighting', label: 'Lighting', placeholder: 'Light sources and quality...' },
    { key: 'mood', label: 'Mood', placeholder: 'Atmosphere and feeling...' },
    { key: 'style', label: 'Style', placeholder: 'Artistic style...' },
    { key: 'camera', label: 'Camera', placeholder: 'Camera settings...' },
    { key: 'color', label: 'Color', placeholder: 'Color palette...' },
  ] as const;

  const naturalPrompt = Object.values(prompt).filter(Boolean).join(', ');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const [isSaving, setIsSaving] = useState(false);

  const validatePrompt = (): boolean => {
    const hasContent = Object.values(prompt).some(value => value.trim().length > 0);
    if (!hasContent) {
      Alert.alert('Validation Error', 'Please fill in at least one field before saving.');
      return false;
    }
    return true;
  };

  const saveItem = async () => {
    if (!validatePrompt()) return;
    
    setIsSaving(true);
    try {
      // TODO: Save to local storage / sync with cloud
      await new Promise(resolve => setTimeout(resolve, 500));
      Alert.alert('Success', 'Item saved to your library!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save item';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Natural Language Preview */}
      <View style={styles.previewSection}>
        <Text style={styles.sectionTitle}>Natural Prompt</Text>
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>
            {naturalPrompt || 'Fill in the fields below to generate a prompt...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.copyButton}>
          <Ionicons name="copy" size={18} color={colors.bgPrimary} />
          <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
        </TouchableOpacity>
      </View>

      {/* Structured Fields */}
      <View style={styles.fieldsSection}>
        <Text style={styles.sectionTitle}>Structured Prompt</Text>
        {promptFields.map(({ key, label, placeholder }) => (
          <View key={key} style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              value={prompt[key]}
              onChangeText={(text) => setPrompt({ ...prompt, [key]: text })}
              multiline
            />
          </View>
        ))}
      </View>

      {/* Tags Section */}
      <View style={styles.tagsSection}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            placeholder="Add a tag..."
            placeholderTextColor={colors.textMuted}
            value={newTag}
            onChangeText={setNewTag}
            onSubmitEditing={addTag}
          />
          <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
            <Ionicons name="add" size={24} color={colors.bgPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.tagsList}>
          {tags.map((tag) => (
            <TouchableOpacity key={tag} style={styles.tag} onPress={() => removeTag(tag)}>
              <Text style={styles.tagText}>{tag}</Text>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
        <Text style={styles.saveButtonText}>Save to Library</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  previewSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  previewBox: {
    backgroundColor: colors.bgSecondary,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentCyan,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  copyButtonText: {
    color: colors.bgPrimary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  fieldsSection: {
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    backgroundColor: colors.bgSecondary,
    color: colors.textPrimary,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  tagsSection: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tagInput: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    color: colors.textPrimary,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addTagButton: {
    backgroundColor: colors.accentCyan,
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    gap: spacing.xs,
  },
  tagText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: colors.accentPurple,
    margin: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
