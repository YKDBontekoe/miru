import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { useTheme } from '@/hooks/useTheme';
import { Tab } from '@/hooks/viewmodels/useProductivityViewModel';

interface ProductivityEmptyStateProps {
  activeTab: Tab;
  searchQuery: string;
  onCreateNote: () => void;
  onCreateTask: () => void;
}

export const ProductivityEmptyState = React.memo(function ProductivityEmptyState({
  activeTab,
  searchQuery,
  onCreateNote,
  onCreateTask,
}: ProductivityEmptyStateProps) {
  const { t } = useTranslation();
  const { C } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: C.primarySurface }]}>
        <Ionicons
          name={
            activeTab === 'notes'
              ? 'document-text'
              : activeTab === 'tasks'
                ? 'checkbox'
                : activeTab === 'today'
                  ? 'sunny-outline'
                  : 'planet'
          }
          size={42}
          color={C.primary}
        />
      </View>
      <AppText variant="h3" style={[styles.emptyTitle, { color: C.text }]}>
        {searchQuery
          ? t('productivity.no_matches') || 'No matches found'
          : activeTab === 'notes'
            ? t('productivity.no_notes') || 'No Notes'
            : activeTab === 'tasks'
              ? t('productivity.no_tasks') || 'No Tasks'
              : activeTab === 'today'
                ? t('productivity.nothing_urgent_today')
                : t('productivity.workspace_clear') || 'Your workspace is clear'}
      </AppText>
      <AppText style={[styles.emptySubtitle, { color: C.subtext }]}>
        {searchQuery
          ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
          : activeTab === 'today'
            ? t('productivity.today_empty_detail')
            : t('productivity.capture_thoughts') ||
              'Capture your thoughts and track what needs to get done.'}
      </AppText>

      {!searchQuery && (
        <View style={styles.emptyActions}>
          {(activeTab === 'all' || activeTab === 'notes') && (
            <Pressable
              onPress={onCreateNote}
              style={({ pressed }) => [
                styles.emptyButton,
                { backgroundColor: C.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={styles.iconMargin} />
              <AppText style={styles.emptyButtonText}>
                {t('productivity.newNote') || 'New Note'}
              </AppText>
            </Pressable>
          )}
          {(activeTab === 'all' || activeTab === 'tasks' || activeTab === 'today') && (
            <Pressable
              onPress={onCreateTask}
              style={({ pressed }) => [
                styles.emptyButton,
                (activeTab === 'all' || activeTab === 'today') && [
                  styles.emptyButtonSecondary,
                  { backgroundColor: C.primarySurface },
                ],
                !(activeTab === 'all' || activeTab === 'today') && { backgroundColor: C.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons
                name="add"
                size={18}
                color={activeTab === 'all' || activeTab === 'today' ? C.primary : '#FFFFFF'}
                style={styles.iconMargin}
              />
              <AppText
                style={
                  activeTab === 'all' || activeTab === 'today'
                    ? [styles.emptyButtonTextSecondary, { color: C.primary }]
                    : styles.emptyButtonText
                }
              >
                {t('productivity.new_task')}
              </AppText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.massive,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xxxl,
    lineHeight: 22,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    ...theme.elevation.md,
  },
  emptyButtonSecondary: {
    ...Platform.select({
      ios: { shadowOpacity: 0, elevation: 0 },
      android: { elevation: 0 },
      default: { elevation: 0 },
    }),
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyButtonTextSecondary: {
    fontWeight: '700',
    fontSize: 15,
  },
  iconMargin: {
    marginEnd: 6,
  },
});
