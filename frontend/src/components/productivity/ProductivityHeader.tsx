import React from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
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
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
  transparent: 'transparent',
};

const S = theme.spacing;
const R = theme.borderRadius;

type Tab = 'today' | 'all' | 'notes' | 'tasks';
type TaskPriority = 'all' | 'overdue' | 'today' | 'upcoming' | 'no_due';

interface Props {
  pendingTasksCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  generateTodayPlan: () => void;
  taskPriority: TaskPriority;
  setTaskPriority: (priority: TaskPriority) => void;
  taskPriorityCounts: Record<TaskPriority, number>;
  setShowCreateNote: (show: boolean) => void;
  setShowCreateTask: (show: boolean) => void;
}

export function ProductivityHeader({
  pendingTasksCount,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  generateTodayPlan,
  taskPriority,
  setTaskPriority,
  taskPriorityCounts,
  setShowCreateNote,
  setShowCreateTask,
}: Props) {
  const { t } = useTranslation();

  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: t('productivity.today') || 'Today' },
    { key: 'all', label: t('productivity.all') || 'All' },
    { key: 'notes', label: t('productivity.notes') || 'Notes' },
    { key: 'tasks', label: t('productivity.tasks') || 'Tasks' },
  ];

  const priorityOptions: { key: TaskPriority; label: string }[] = [
    { key: 'all', label: t('productivity.priority.all', { count: taskPriorityCounts.all }) || `All (${taskPriorityCounts.all})` },
    { key: 'overdue', label: t('productivity.priority.overdue', { count: taskPriorityCounts.overdue }) || `Overdue (${taskPriorityCounts.overdue})` },
    { key: 'today', label: t('productivity.priority.today', { count: taskPriorityCounts.today }) || `Today (${taskPriorityCounts.today})` },
    { key: 'upcoming', label: t('productivity.priority.upcoming', { count: taskPriorityCounts.upcoming }) || `Upcoming (${taskPriorityCounts.upcoming})` },
    { key: 'no_due', label: t('productivity.priority.no_due', { count: taskPriorityCounts.no_due }) || `Someday (${taskPriorityCounts.no_due})` },
  ];

  return (
    <>
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
              onPress={generateTodayPlan}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateNote(true)}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateTask(true)}
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
            style={styles.searchInput}
            placeholder={t('productivity.search') || 'Search notes, tasks, events...'}
            placeholderTextColor={T.onSurface.mutedLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={T.onSurface.mutedLight} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
          >
            <AppText style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {(activeTab === 'tasks' || activeTab === 'today') && (
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: S.xl,
            marginBottom: S.sm,
            flexWrap: 'wrap',
          }}
        >
          {priorityOptions.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setTaskPriority(option.key)}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: R.full,
                  backgroundColor:
                    taskPriority === option.key ? T.primary.surfaceLight : T.surface.light,
                  borderWidth: 1,
                  borderColor: taskPriority === option.key ? T.primary.DEFAULT : T.border.light,
                  marginRight: 8,
                  marginBottom: 8,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AppText
                variant="caption"
                style={{
                  color: taskPriority === option.key ? T.primary.DEFAULT : T.onSurface.mutedLight,
                  fontWeight: '700',
                }}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: T.surface.highLight,
    borderRadius: R.xl,
    padding: S.xs,
    marginHorizontal: S.xl,
    marginTop: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: T.border.light,
  },
  tabButton: {
    flex: 1,
    paddingVertical: S.sm,
    alignItems: 'center',
    borderRadius: R.lg,
    backgroundColor: T.transparent,
  },
  tabButtonActive: {
    backgroundColor: T.surface.light,
    ...theme.elevation.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: T.onSurface.mutedLight,
  },
  tabTextActive: {
    fontWeight: '700',
    color: T.onSurface.light,
  },
});
