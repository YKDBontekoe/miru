import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { useTheme } from '@/hooks/useTheme';

interface ProductivityHeaderProps {
  pendingTasksCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onGeneratePlan: () => void;
  onCreateNote: () => void;
  onCreateTask: () => void;
}

export const ProductivityHeader = React.memo(function ProductivityHeader({
  pendingTasksCount,
  searchQuery,
  setSearchQuery,
  onGeneratePlan,
  onCreateNote,
  onCreateTask,
}: ProductivityHeaderProps) {
  const { t } = useTranslation();
  const { C } = useTheme();

  return (
    <View style={[styles.headerContainer, { backgroundColor: C.surface }]}>
      <View style={styles.headerRow}>
        <View>
          <AppText variant="h1" style={[styles.headerTitle, { color: C.text }]}>
            {t('productivity.title') || 'Workspace'}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: C.subtext }]}>
            {pendingTasksCount === 0
              ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
              : t('productivity.header.subtitle.pending', { count: pendingTasksCount }) ||
                `You have ${pendingTasksCount} tasks pending.`}
          </AppText>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={onGeneratePlan}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: C.primarySurface },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="sparkles" size={20} color={C.primary} />
          </Pressable>
          <Pressable
            onPress={onCreateNote}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: C.primarySurface },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="document-text" size={20} color={C.primary} />
          </Pressable>
          <Pressable
            onPress={onCreateTask}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: C.primarySurface },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="checkbox" size={20} color={C.primary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: C.bg, borderColor: C.border }]}>
        <Ionicons name="search" size={18} color={C.subtext} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('productivity.search') || 'Search notes & tasks...'}
          placeholderTextColor={C.subtext}
          style={[styles.searchInput, { color: C.text }]}
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    ...theme.elevation.sm,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
});
