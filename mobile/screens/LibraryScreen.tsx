import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { colors, spacing } from '../theme/colors';

export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creative Library</Text>
      <Text style={styles.empty}>Your creative items will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, padding: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
});
