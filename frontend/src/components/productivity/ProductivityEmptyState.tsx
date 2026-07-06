import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { theme } from '@/core/theme';
import { ProductivityTab } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';

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

interface Props {
  activeTab: ProductivityTab;
  searchQuery: string;
  onShowCreateNote: () => void;
  onShowCreateTask: () => void;
}

/**
 * Empty state component for the Productivity Screen.
 */
export function ProductivityEmptyState({
  activeTab,
  searchQuery,
  onShowCreateNote,
  onShowCreateTask,
}: Props) {
  const { t } = useTranslation();

  const contentMap = {
    notes: {
      icon: 'document-text' as const,
      title: t('productivity.no_notes') || 'No Notes',
      subtitle:
        t('productivity.capture_thoughts') ||
        'Capture your thoughts and track what needs to get done.',
    },
    tasks: {
      icon: 'checkbox' as const,
      title: t('productivity.no_tasks') || 'No Tasks',
      subtitle:
        t('productivity.capture_thoughts') ||
        'Capture your thoughts and track what needs to get done.',
    },
    today: {
      icon: 'sunny-outline' as const,
      title: t('productivity.nothing_urgent_today') || 'Nothing urgent today',
      subtitle: t('productivity.today_empty_detail') || 'Enjoy your day!',
    },
    all: {
      icon: 'planet' as const,
      title: t('productivity.workspace_clear') || 'Your workspace is clear',
      subtitle:
        t('productivity.capture_thoughts') ||
        'Capture your thoughts and track what needs to get done.',
    },
  };
  const activeContent = contentMap[activeTab] || contentMap.all;

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={activeContent.icon} size={42} color={T.primary.DEFAULT} />
      </View>
      <AppText variant="h3" style={styles.emptyTitle}>
        {searchQuery ? t('productivity.no_matches') || 'No matches found' : activeContent.title}
      </AppText>
      <AppText style={styles.emptySubtitle}>
        {searchQuery
          ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
          : activeContent.subtitle}
      </AppText>

      {!searchQuery && (
        <View style={styles.emptyActions}>
          {(activeTab === 'all' || activeTab === 'notes') && (
            <Pressable
              onPress={onShowCreateNote}
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
              onPress={onShowCreateTask}
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
}

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
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
        elevation: 0,
      },
      android: {
        elevation: 0,
      },
      default: {
        elevation: 0,
      },
    }),
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
