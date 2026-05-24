import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import type { Tab } from './useProductivityViewModel';

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

type ProductivityEmptyStateProps = {
  t: (key: string, options?: any) => string;
  activeTab: Tab;
  searchQuery: string;
  onShowCreateNote: () => void;
  onShowCreateTask: () => void;
};

export const ProductivityEmptyState: React.FC<ProductivityEmptyStateProps> = ({
  t,
  activeTab,
  searchQuery,
  onShowCreateNote,
  onShowCreateTask,
}) => {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
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
          color={T.primary.DEFAULT}
        />
      </View>
      <AppText variant="h3" style={styles.emptyTitle}>
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
      <AppText style={styles.emptySubtitle}>
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
                {t('productivity.new_task')}
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
    padding: S.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: S.xl,
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
    color: T.onSurface.light,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: S.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: T.onSurface.mutedLight,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: S.xl,
    maxWidth: '80%',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: S.md,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.primary.DEFAULT,
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    borderRadius: R.full,
  },
  emptyButtonSecondary: {
    backgroundColor: T.primary.surfaceLight,
  },
  emptyButtonText: {
    color: T.white,
    fontWeight: '600',
    fontSize: 15,
  },
  emptyButtonTextSecondary: {
    color: T.primary.DEFAULT,
    fontWeight: '600',
    fontSize: 15,
  },
});
