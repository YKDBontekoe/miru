import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { Tab } from './ProductivityTabs';

const T = {
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
  white: '#FFFFFF',
};
const S = theme.spacing;
const R = theme.borderRadius;

export interface ProductivityEmptyStateProps {
  activeTab: Tab;
  searchQuery: string;
  onOpenCreateNote: () => void;
  onOpenCreateTask: () => void;
}

const getIconName = (activeTab: Tab) => {
  switch (activeTab) {
    case 'notes':
      return 'document-text';
    case 'tasks':
      return 'checkbox';
    case 'today':
      return 'sunny-outline';
    default:
      return 'planet';
  }
};

const getTitle = (activeTab: Tab, searchQuery: string, t: (key: string) => string) => {
  if (searchQuery) return t('productivity.no_matches') || 'No matches found';
  switch (activeTab) {
    case 'notes':
      return t('productivity.no_notes') || 'No Notes';
    case 'tasks':
      return t('productivity.no_tasks') || 'No Tasks';
    case 'today':
      return t('productivity.nothing_urgent_today') || 'Nothing urgent today';
    default:
      return t('productivity.workspace_clear') || 'Your workspace is clear';
  }
};

const getSubtitle = (activeTab: Tab, searchQuery: string, t: (key: string) => string) => {
  if (searchQuery) return t('productivity.try_adjust_search') || 'Try adjusting your search terms.';
  if (activeTab === 'today') return t('productivity.today_empty_detail') || 'Enjoy your free time.';
  return t('productivity.capture_thoughts') || 'Capture your thoughts and track what needs to get done.';
};

/**
 * Empty state component for the Productivity screen.
 * Displays appropriate icon, title, subtitle, and action buttons based on current tab and search context.
 */
export const ProductivityEmptyState: React.FC<ProductivityEmptyStateProps> = ({
  activeTab,
  searchQuery,
  onOpenCreateNote,
  onOpenCreateTask,
}) => {
  const { t } = useTranslation();

  const iconName = getIconName(activeTab);
  const titleText = getTitle(activeTab, searchQuery, t);
  const subtitleText = getSubtitle(activeTab, searchQuery, t);

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={iconName} size={42} color={T.primary.DEFAULT} />
      </View>
      <AppText variant="h3" style={styles.emptyTitle}>
        {titleText}
      </AppText>
      <AppText style={styles.emptySubtitle}>
        {subtitleText}
      </AppText>

      {!searchQuery && (
        <View style={styles.emptyActions}>
          {(activeTab === 'all' || activeTab === 'notes') && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('productivity.newNote') || 'New Note'}
              onPress={onOpenCreateNote}
              style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="add" size={18} color={T.white} style={{ marginEnd: 6 }} />
              <AppText style={styles.emptyButtonText}>
                {t('productivity.newNote') || 'New Note'}
              </AppText>
            </Pressable>
          )}
          {(activeTab === 'all' || activeTab === 'tasks' || activeTab === 'today') && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('productivity.new_task') || 'New Task'}
              onPress={onOpenCreateTask}
              style={({ pressed }) => [
                styles.emptyButton,
                (activeTab === 'all' || activeTab === 'today') && styles.emptyButtonSecondary,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons
                name="add"
                size={18}
                color={activeTab === 'all' || activeTab === 'today' ? T.primary.DEFAULT : T.white}
                style={{ marginEnd: 6 }}
              />
              <AppText
                style={
                  activeTab === 'all' || activeTab === 'today'
                    ? styles.emptyButtonTextSecondary
                    : styles.emptyButtonText
                }
              >
                {t('productivity.new_task') || 'New Task'}
              </AppText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: S.massive,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.lg,
  },
  emptyTitle: {
    marginBottom: S.sm,
    textAlign: 'center',
    color: T.onSurface.light,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: S.xl,
    color: T.onSurface.mutedLight,
    paddingHorizontal: S.xxxl,
    lineHeight: 22,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: S.md,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.primary.DEFAULT,
    borderRadius: R.xl,
    paddingVertical: S.md,
    paddingHorizontal: S.xl,
    ...theme.elevation.md,
  },
  emptyButtonSecondary: {
    backgroundColor: T.primary.surfaceLight,
    elevation: 0,
    shadowOpacity: 0,
  },
  emptyButtonText: {
    color: T.white,
    fontWeight: '700',
    fontSize: 15,
  },
  emptyButtonTextSecondary: {
    color: T.primary.DEFAULT,
    fontWeight: '700',
    fontSize: 15,
  },
});
