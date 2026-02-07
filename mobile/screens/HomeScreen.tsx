import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Liquid Memory</Text>
        <Text style={styles.subtitle}>AI Creative Studio</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="camera" size={32} color={colors.accentCyan} />
          <Text style={styles.actionText}>Capture & Parse</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="images" size={32} color={colors.accentPurple} />
          <Text style={styles.actionText}>Browse Library</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Items</Text>
        <Text style={styles.emptyText}>No items yet. Start by capturing an image!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { padding: spacing.lg, paddingTop: spacing.xxl },
  title: { fontSize: 32, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: spacing.sm },
  actions: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md },
  actionCard: { flex: 1, backgroundColor: colors.bgSecondary, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  actionText: { color: colors.textPrimary, marginTop: spacing.sm, fontWeight: '600' },
  section: { padding: spacing.lg },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.md },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
