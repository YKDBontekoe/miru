import React from 'react';
import { View, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { TFunction } from 'i18next';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { Tab, TaskPriority } from '@/hooks/viewmodels/useProductivityViewModel';
import { CalendarEvent } from '@/core/models';

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

/**
 * Props for ProductivityHeader
 */
export interface ProductivityHeaderProps {
  t: TFunction;
  pendingTasksCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onGeneratePlan: () => void;
  onShowCreateNote: () => void;
  onShowCreateTask: () => void;
}

/**
 * Renders the top title, subtitle, search bar, and action buttons.
 */
export const ProductivityHeader = React.memo(
  ({
    t,
    pendingTasksCount,
    searchQuery,
    setSearchQuery,
    onGeneratePlan,
    onShowCreateNote,
    onShowCreateTask,
  }: ProductivityHeaderProps) => {
    const [localSearch, setLocalSearch] = useState(searchQuery);

    const debouncedSetSearchQuery = useMemo(
      () => debounce((v: string) => setSearchQuery(v), 300),
      [setSearchQuery]
    );

    useEffect(() => {
      return () => {
        debouncedSetSearchQuery.cancel();
      };
    }, [debouncedSetSearchQuery]);

    useEffect(() => {
      setLocalSearch(searchQuery);
    }, [searchQuery]);

    const handleSearchChange = (text: string) => {
      setLocalSearch(text);
      debouncedSetSearchQuery(text);
    };

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
              accessibilityRole="button"
              accessibilityLabel="Generate plan"
            >
              <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={onShowCreateNote}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Create note"
            >
              <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={onShowCreateTask}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Create task"
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
            value={localSearch}
            onChangeText={handleSearchChange}
            placeholder={t('productivity.search') || 'Search notes & tasks...'}
            placeholderTextColor={T.onSurface.disabledLight}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>
      </View>
    );
  }
);

ProductivityHeader.displayName = 'ProductivityHeader';

/**
 * Props for ProductivityTabs
 */
export interface ProductivityTabsProps {
  t: TFunction;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

/**
 * Renders the horizontal list of tabs.
 */
export const ProductivityTabs = React.memo(
  ({ t, activeTab, setActiveTab }: ProductivityTabsProps) => (
    <View style={styles.tabsContainer}>
      {(['today', 'all', 'notes', 'tasks'] as const).map((tab) => (
        <Pressable
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={({ pressed }) => [
            styles.tabButton,
            activeTab === tab && styles.tabButtonActive,
            pressed && activeTab !== tab && { opacity: 0.6 },
          ]}
        >
          <AppText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab === 'today'
              ? t('productivity.today')
              : tab === 'all'
                ? t('productivity.all') || 'All'
                : tab === 'notes'
                  ? t('productivity.notes') || 'Notes'
                  : t('productivity.tasks') || 'Tasks'}
          </AppText>
        </Pressable>
      ))}
    </View>
  )
);

ProductivityTabs.displayName = 'ProductivityTabs';

/**
 * Props for ProductivityFilters
 */
export interface ProductivityFiltersProps {
  t: TFunction;
  activeTab: Tab;
  taskPriority: TaskPriority;
  setTaskPriority: (p: TaskPriority) => void;
  taskPriorityCounts: Record<TaskPriority, number>;
}

/**
 * Renders the horizontal list of priority filters.
 */
export const ProductivityFilters = React.memo(
  ({
    t,
    activeTab,
    taskPriority,
    setTaskPriority,
    taskPriorityCounts,
  }: ProductivityFiltersProps) => {
    if (activeTab !== 'tasks' && activeTab !== 'today') return null;

    const options = [
      { key: 'all', label: t('productivity.priority.all', { count: taskPriorityCounts.all }) },
      {
        key: 'overdue',
        label: t('productivity.priority.overdue', { count: taskPriorityCounts.overdue }),
      },
      {
        key: 'today',
        label: t('productivity.priority.today', { count: taskPriorityCounts.today }),
      },
      {
        key: 'upcoming',
        label: t('productivity.priority.upcoming', { count: taskPriorityCounts.upcoming }),
      },
      {
        key: 'no_due',
        label: t('productivity.priority.no_due', { count: taskPriorityCounts.no_due }),
      },
    ] as const;

    return (
      <View style={styles.filtersContainer}>
        {options.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setTaskPriority(option.key)}
            style={({ pressed }) => [
              styles.filterButton,
              {
                borderColor: taskPriority === option.key ? T.primary.DEFAULT : T.border.light,
                backgroundColor: taskPriority === option.key ? T.primary.surfaceLight : T.surface.light,
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
    );
  }
);

ProductivityFilters.displayName = 'ProductivityFilters';

/**
 * Props for ProductivityTodayPlan
 */
export interface ProductivityTodayPlanProps {
  todayPlan: string | null;
  setTodayPlan: (plan: string | null) => void;
}

/**
 * Renders the AI-generated "Today plan" card.
 */
export const ProductivityTodayPlan = React.memo(
  ({ todayPlan, setTodayPlan }: ProductivityTodayPlanProps) => {
    if (!todayPlan) return null;

    return (
      <View style={styles.planContainer}>
        <View style={styles.planHeader}>
          <AppText style={styles.planTitle}>Today plan</AppText>
          <Pressable
            onPress={() => setTodayPlan(null)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss plan"
          >
            <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
          </Pressable>
        </View>
        <AppText style={styles.planText}>{todayPlan}</AppText>
      </View>
    );
  }
);

ProductivityTodayPlan.displayName = 'ProductivityTodayPlan';

/**
 * Props for ProductivityListEmpty
 */
export interface ProductivityListEmptyProps {
  t: TFunction;
  searchQuery: string;
  activeTab: Tab;
  onShowCreateNote: () => void;
  onShowCreateTask: () => void;
}

/**
 * Renders the empty state view.
 */
export const ProductivityListEmpty = React.memo(
  ({
    t,
    searchQuery,
    activeTab,
    onShowCreateNote,
    onShowCreateTask,
  }: ProductivityListEmptyProps) => {
    const iconName =
      activeTab === 'notes'
        ? 'document-text'
        : activeTab === 'tasks'
          ? 'checkbox'
          : activeTab === 'today'
            ? 'sunny-outline'
            : 'planet';

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name={iconName} size={42} color={T.primary.DEFAULT} />
        </View>
        <AppText variant="h3" style={styles.emptyTitle}>
          {searchQuery
            ? t('productivity.no_matches') || 'No matches found'
            : activeTab === 'notes'
              ? t('productivity.no_notes') || 'No Notes'
              : activeTab === 'tasks'
                ? t('productivity.no_tasks') || 'No Tasks'
                : activeTab === 'today'
                  ? t('productivity.nothing_urgent_today') || 'Nothing Urgent Today'
                  : t('productivity.workspace_clear') || 'Your workspace is clear'}
        </AppText>
        <AppText style={styles.emptySubtitle}>
          {searchQuery
            ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
            : activeTab === 'today'
              ? t('productivity.today_empty_detail') || 'Enjoy your day.'
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
                  {t('productivity.new_task') || 'New Task'}
                </AppText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  }
);

ProductivityListEmpty.displayName = 'ProductivityListEmpty';

/**
 * Props for ProductivityEventCard
 */
export interface ProductivityEventCardProps {
  event: CalendarEvent;
  i18nLanguage: string;
}

/**
 * Renders an event item in the list.
 */
export const ProductivityEventCard = React.memo(
  ({ event, i18nLanguage }: ProductivityEventCardProps) => (
    <View style={styles.eventCard}>
      <View style={styles.eventIcon}>
        <Ionicons name="calendar-outline" size={16} color={T.primary.DEFAULT} />
      </View>
      <View style={styles.eventBody}>
        <AppText style={styles.eventTitle}>{event.title}</AppText>
        <AppText style={styles.eventMeta}>
          {new Intl.DateTimeFormat(i18nLanguage, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: event.is_all_day ? undefined : '2-digit',
            minute: event.is_all_day ? undefined : '2-digit',
          }).format(new Date(event.start_time))}
        </AppText>
      </View>
    </View>
  )
);

ProductivityEventCard.displayName = 'ProductivityEventCard';

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
    height: 44,
    borderRadius: 20,
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
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: S.xl,
    marginBottom: S.sm,
  },
  filterButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  planContainer: {
    borderRadius: R.xl,
    backgroundColor: T.primary.surfaceLight,
    borderWidth: 1,
    borderColor: T.border.light,
    padding: S.lg,
    marginBottom: S.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    color: T.onSurface.light,
    fontWeight: '700',
    fontSize: 16,
  },
  planText: {
    color: T.onSurface.mutedLight,
    marginTop: 8,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: S.xxl,
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
    fontSize: 16,
  },
  emptyButtonTextSecondary: {
    color: T.primary.DEFAULT,
    fontWeight: '700',
    fontSize: 16,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: T.surface.light,
    borderRadius: R.lg,
    padding: S.md,
    marginBottom: S.sm,
    marginHorizontal: S.xl,
    borderWidth: 1,
    borderColor: T.border.light,
    alignItems: 'center',
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.md,
  },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: T.onSurface.light,
    marginBottom: 2,
  },
  eventMeta: {
    fontSize: 13,
    color: T.onSurface.mutedLight,
  },
});
