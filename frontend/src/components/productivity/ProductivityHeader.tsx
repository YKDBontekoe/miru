import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { theme } from '../../core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  surface: { light: DESIGN_TOKENS.colors.surface, highLight: DESIGN_TOKENS.colors.surfaceSoft },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
    disabledLight: DESIGN_TOKENS.colors.faint,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
  white: '#FFFFFF',
  transparent: 'transparent',
};

const S = theme.spacing;
const R = theme.borderRadius;

interface ProductivityHeaderProps {
  pendingTasksCount: number;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onGeneratePlan: () => void;
  onShowCreateNote: () => void;
  onShowCreateTask: () => void;
}

export function ProductivityHeader({
  pendingTasksCount,
  searchQuery,
  onSearchQueryChange,
  onGeneratePlan,
  onShowCreateNote,
  onShowCreateTask,
}: ProductivityHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <View>
          <AppText variant="h1" style={styles.headerTitle}>
            {t('productivity.title') || 'Workspace'}
          </AppText>
          <AppText style={styles.headerSubtitle}>
            {pendingTasksCount === 0
              ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
              : t('productivity.header.subtitle.pending', { count: pendingTasksCount }) ||
                `You have ${pendingTasksCount} tasks pending.`}
          </AppText>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={onGeneratePlan}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
          </Pressable>
          <Pressable
            onPress={onShowCreateNote}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
          </Pressable>
          <Pressable
            onPress={onShowCreateTask}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="checkbox" size={20} color={T.primary.DEFAULT} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color={T.onSurface.mutedLight}
          style={styles.searchIcon}
        />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          placeholder={t('productivity.search') || 'Search notes & tasks...'}
          placeholderTextColor={T.onSurface.disabledLight}
          style={styles.searchInput}
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: S.xl,
    paddingTop: S.md,
    paddingBottom: S.lg,
    backgroundColor: T.surface.light,
    ...theme.elevation.sm,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.lg,
  },
  headerTitle: {
    color: T.onSurface.light,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: T.onSurface.mutedLight,
    fontSize: 14,
    marginTop: S.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: S.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: R.full,
    backgroundColor: T.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.background.light,
    borderRadius: R.lg,
    paddingHorizontal: S.md,
    height: 44,
    borderWidth: 1,
    borderColor: T.border.light,
  },
  searchIcon: {
    marginRight: S.sm,
  },
  searchInput: {
    flex: 1,
    color: T.onSurface.light,
    fontSize: 16,
    height: '100%',
  },
});
