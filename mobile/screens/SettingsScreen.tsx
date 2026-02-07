import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications' as const,
          label: 'Enable Notifications',
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: 'sunny' as const,
          label: 'Daily Inspiration (9 AM)',
          value: dailyReminder,
          onToggle: setDailyReminder,
        },
      ],
    },
    {
      title: 'Cloud Sync',
      items: [
        {
          icon: 'cloud' as const,
          label: 'Auto Sync',
          value: syncEnabled,
          onToggle: setSyncEnabled,
        },
        {
          icon: 'lock-closed' as const,
          label: 'End-to-End Encryption',
          value: encryptionEnabled,
          onToggle: setEncryptionEnabled,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'information-circle' as const,
          label: 'Version',
          value: '1.0.0',
          isText: true,
        },
        {
          icon: 'document-text' as const,
          label: 'Privacy Policy',
          action: () => {},
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {settingsSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, itemIndex) => (
              <View
                key={itemIndex}
                style={[
                  styles.row,
                  itemIndex < section.items.length - 1 && styles.rowBorder,
                ]}
              >
                <View style={styles.rowLeft}>
                  <Ionicons name={item.icon} size={20} color={colors.accentCyan} />
                  <Text style={styles.rowLabel}>{item.label}</Text>
                </View>
                
                {'value' in item && typeof item.value === 'boolean' ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: colors.bgTertiary, true: colors.accentCyan }}
                    thumbColor={item.value ? colors.textPrimary : colors.textMuted}
                  />
                ) : 'isText' in item ? (
                  <Text style={styles.rowValue}>{item.value}</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                )}
              </View>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: colors.error,
    margin: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
