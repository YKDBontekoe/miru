import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';

const S = theme.spacing;
const R = theme.borderRadius;

interface ProductivityEmptyStateProps {
  searchQuery: string;
  activeTab: 'today' | 'all' | 'notes' | 'tasks';
  setShowCreateNote: (show: boolean) => void;
  setShowCreateTask: (show: boolean) => void;
}

export const ProductivityEmptyState = React.memo(({
  searchQuery,
  activeTab,
  setShowCreateNote,
  setShowCreateTask,
}: ProductivityEmptyStateProps) => {
  const { t } = useTranslation();

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
          color={DESIGN_TOKENS.colors.primary}
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
                ? t('productivity.nothing_urgent_today') || 'Nothing urgent today'
                : t('productivity.workspace_clear') || 'Your workspace is clear'}
      </AppText>
      <AppText style={styles.emptySubtitle}>
        {searchQuery
          ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
          : activeTab === 'today'
            ? t('productivity.today_empty_detail') || 'Enjoy your day!'
            : t('productivity.capture_thoughts') ||
              'Capture your thoughts and track what needs to get done.'}
      </AppText>

      {!searchQuery && (
        <View style={styles.emptyActions}>
          {(activeTab === 'all' || activeTab === 'notes') && (
            <Pressable
              onPress={() => setShowCreateNote(true)}
              style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="add" size={18} color={'#FFFFFF'} style={{ marginEnd: 6 }} />
              <AppText style={styles.emptyButtonText}>
                {t('productivity.newNote') || 'New Note'}
              </AppText>
            </Pressable>
          )}
          {(activeTab === 'all' || activeTab === 'tasks' || activeTab === 'today') && (
            <Pressable
              onPress={() => setShowCreateTask(true)}
              style={({ pressed }) => [
                styles.emptyButton,
                (activeTab === 'all' || activeTab === 'today') && styles.emptyButtonSecondary,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons
                name="add"
                size={18}
                color={
                  activeTab === 'all' || activeTab === 'today' ? DESIGN_TOKENS.colors.primary : '#FFFFFF'
                }
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
});

ProductivityEmptyState.displayName = 'ProductivityEmptyState';

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: S.massive,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.lg,
  },
  emptyTitle: {
    marginBottom: S.sm,
    textAlign: 'center',
    color: DESIGN_TOKENS.colors.text,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: S.xl,
    color: DESIGN_TOKENS.colors.muted,
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
    backgroundColor: DESIGN_TOKENS.colors.primary,
    borderRadius: R.xl,
    paddingVertical: S.md,
    paddingHorizontal: S.xl,
    ...theme.elevation.md,
  },
  emptyButtonSecondary: {
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
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
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyButtonTextSecondary: {
    color: DESIGN_TOKENS.colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
