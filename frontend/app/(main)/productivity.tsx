import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { CreateNoteModal } from '@/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '@/components/productivity/CreateTaskModal';
import { NoteCard } from '@/components/productivity/NoteCard';
import { TaskCard } from '@/components/productivity/TaskCard';
import { theme } from '@/core/theme';
import { CalendarEvent, Note, Task } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import {
  RenderItemData,
  useProductivityViewModel,
} from '@/hooks/viewmodels/useProductivityViewModel';

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

type ProductivityListItemProps = {
  item: RenderItemData;
  callbacks: {
    deleteNote: (id: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    confirmDelete: (action: () => Promise<void>) => void;
  };
  language: string;
};

const ProductivityListItem = React.memo(
  ({ item, callbacks, language }: ProductivityListItemProps) => {
    if (item.type === 'note') {
      const note = item.item as Note;
      return (
        <NoteCard
          note={note}
          onDelete={() => callbacks.confirmDelete(() => callbacks.deleteNote(note.id))}
        />
      );
    }
    if (item.type === 'event') {
      const event = item.item as CalendarEvent;
      return (
        <View style={styles.eventCard}>
          <View style={styles.eventIcon}>
            <Ionicons name="calendar-outline" size={16} color={T.primary.DEFAULT} />
          </View>
          <View style={styles.eventBody}>
            <AppText style={styles.eventTitle}>{event.title}</AppText>
            <AppText style={styles.eventMeta}>
              {new Intl.DateTimeFormat(language, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: event.is_all_day ? undefined : '2-digit',
                minute: event.is_all_day ? undefined : '2-digit',
              }).format(new Date(event.start_time))}
            </AppText>
          </View>
        </View>
      );
    }

    const task = item.item as Task;
    return (
      <TaskCard
        task={task}
        onToggle={() => callbacks.toggleTask(task.id)}
        onDelete={() => callbacks.confirmDelete(() => callbacks.deleteTask(task.id))}
      />
    );
  }
);

ProductivityListItem.displayName = 'ProductivityListItem';

export default function ProductivityScreen() {
  const { t, i18n } = useTranslation();

  const vm = useProductivityViewModel();

  const listItemCallbacks = useMemo(
    () => ({
      deleteNote: vm.deleteNote,
      toggleTask: vm.toggleTask,
      deleteTask: vm.deleteTask,
      confirmDelete: vm.confirmDelete,
    }),
    [vm.deleteNote, vm.toggleTask, vm.deleteTask, vm.confirmDelete]
  );

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => {
      return (
        <ProductivityListItem item={item} callbacks={listItemCallbacks} language={i18n.language} />
      );
    },
    [listItemCallbacks, i18n.language]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <View>
            <AppText variant="h1" style={styles.headerTitle}>
              {t('productivity.title') || 'Workspace'}
            </AppText>
            <AppText style={styles.headerSubtitle}>
              {vm.pendingTasksCount === 0
                ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
                : t('productivity.header.subtitle.pending', { count: vm.pendingTasksCount }) ||
                  `You have ${vm.pendingTasksCount} tasks pending.`}
            </AppText>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={vm.generateTodayPlan}
              accessibilityRole="button"
              accessibilityLabel={t('productivity.actions.generate_plan') || 'Generate plan'}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => vm.setShowCreateNote(true)}
              accessibilityRole="button"
              accessibilityLabel={t('productivity.actions.create_note') || 'Create note'}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => vm.setShowCreateTask(true)}
              accessibilityRole="button"
              accessibilityLabel={t('productivity.actions.create_task') || 'Create task'}
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
            value={vm.searchInput}
            onChangeText={vm.setSearchInput}
            placeholder={t('productivity.search') || 'Search notes & tasks...'}
            placeholderTextColor={T.onSurface.disabledLight}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {(['today', 'all', 'notes', 'tasks'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => vm.setActiveTab(tab)}
            style={({ pressed }) => [
              styles.tabButton,
              vm.activeTab === tab && styles.tabButtonActive,
              pressed && vm.activeTab !== tab && { opacity: 0.6 },
            ]}
          >
            <AppText style={[styles.tabText, vm.activeTab === tab && styles.tabTextActive]}>
              {tab === 'today'
                ? t('productivity.tabs.today') || 'Today'
                : tab === 'all'
                  ? t('productivity.tabs.all') || 'All'
                  : tab === 'notes'
                    ? t('productivity.tabs.notes') || 'Notes'
                    : t('productivity.tabs.tasks') || 'Tasks'}
            </AppText>
          </Pressable>
        ))}
      </View>

      {(vm.activeTab === 'today' || vm.activeTab === 'tasks') && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: S.xl }}>
          {(
            [
              {
                key: 'all',
                label: t('productivity.priority.all', { count: vm.taskPriorityCounts.all }),
              },
              {
                key: 'overdue',
                label: t('productivity.priority.overdue', { count: vm.taskPriorityCounts.overdue }),
              },
              {
                key: 'today',
                label: t('productivity.priority.today', { count: vm.taskPriorityCounts.today }),
              },
              {
                key: 'upcoming',
                label: t('productivity.priority.upcoming', {
                  count: vm.taskPriorityCounts.upcoming,
                }),
              },
              {
                key: 'no_due',
                label: t('productivity.priority.no_due', { count: vm.taskPriorityCounts.no_due }),
              },
            ] as const
          ).map((option) => (
            <Pressable
              key={option.key}
              onPress={() => vm.setTaskPriority(option.key)}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: R.full,
                  backgroundColor:
                    vm.taskPriority === option.key ? T.primary.surfaceLight : T.surface.highLight,
                  borderWidth: 1,
                  borderColor: vm.taskPriority === option.key ? T.primary.DEFAULT : T.border.light,
                  marginRight: 8,
                  marginBottom: 8,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AppText
                variant="caption"
                style={{
                  color:
                    vm.taskPriority === option.key ? T.primary.DEFAULT : T.onSurface.mutedLight,
                  fontWeight: '700',
                }}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}

      <FlatList
        data={vm.dataToRender}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={vm.isLoading}
            onRefresh={vm.handleRefresh}
            tintColor={T.primary.DEFAULT}
          />
        }
        renderItem={renderItem}
        extraData={{ language: i18n.language, callbacks: listItemCallbacks }}
        ListHeaderComponent={
          vm.activeTab === 'today' && vm.todayPlan ? (
            <View
              style={{
                borderRadius: R.xl,
                backgroundColor: T.primary.surfaceLight,
                borderWidth: 1,
                borderColor: T.border.light,
                padding: S.lg,
                marginBottom: S.md,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <AppText style={{ color: T.onSurface.light, fontWeight: '700', fontSize: 15 }}>
                  {t('productivity.todayPlan') || 'Today plan'}
                </AppText>
                <Pressable
                  onPress={() => vm.setTodayPlan(null)}
                  accessibilityRole="button"
                  accessibilityLabel={t('productivity.actions.close_plan') || 'Close plan'}
                >
                  <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
                </Pressable>
              </View>
              <AppText style={{ color: T.onSurface.mutedLight, marginTop: 8, lineHeight: 20 }}>
                {vm.todayPlan}
              </AppText>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !vm.isLoading && vm.dataToRender.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name={
                    vm.activeTab === 'notes'
                      ? 'document-text'
                      : vm.activeTab === 'tasks'
                        ? 'checkbox'
                        : vm.activeTab === 'today'
                          ? 'sunny-outline'
                          : 'planet'
                  }
                  size={42}
                  color={T.primary.DEFAULT}
                />
              </View>
              <AppText variant="h3" style={styles.emptyTitle}>
                {vm.searchQuery
                  ? t('productivity.no_matches') || 'No matches found'
                  : vm.activeTab === 'notes'
                    ? t('productivity.no_notes') || 'No Notes'
                    : vm.activeTab === 'tasks'
                      ? t('productivity.no_tasks') || 'No Tasks'
                      : vm.activeTab === 'today'
                        ? t('productivity.nothing_urgent_today')
                        : t('productivity.workspace_clear') || 'Your workspace is clear'}
              </AppText>
              <AppText style={styles.emptySubtitle}>
                {vm.searchQuery
                  ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
                  : vm.activeTab === 'today'
                    ? t('productivity.today_empty_detail')
                    : t('productivity.capture_thoughts') ||
                      'Capture your thoughts and track what needs to get done.'}
              </AppText>

              {!vm.searchQuery && (
                <View style={styles.emptyActions}>
                  {(vm.activeTab === 'all' || vm.activeTab === 'notes') && (
                    <Pressable
                      onPress={() => vm.setShowCreateNote(true)}
                      style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}
                    >
                      <Ionicons name="add" size={18} color={T.white} style={{ marginEnd: 6 }} />
                      <AppText style={styles.emptyButtonText}>
                        {t('productivity.newNote') || 'New Note'}
                      </AppText>
                    </Pressable>
                  )}
                  {(vm.activeTab === 'all' ||
                    vm.activeTab === 'tasks' ||
                    vm.activeTab === 'today') && (
                    <Pressable
                      onPress={() => vm.setShowCreateTask(true)}
                      style={({ pressed }) => [
                        styles.emptyButton,
                        (vm.activeTab === 'all' || vm.activeTab === 'today') &&
                          styles.emptyButtonSecondary,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={
                          vm.activeTab === 'all' || vm.activeTab === 'today'
                            ? T.primary.DEFAULT
                            : T.white
                        }
                        style={{ marginEnd: 6 }}
                      />
                      <AppText
                        style={
                          vm.activeTab === 'all' || vm.activeTab === 'today'
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
          ) : null
        }
      />

      <CreateNoteModal
        visible={vm.showCreateNote}
        onClose={() => vm.setShowCreateNote(false)}
        onCreated={vm.fetchNotes}
      />
      <CreateTaskModal
        visible={vm.showCreateTask}
        onClose={() => vm.setShowCreateTask(false)}
        onCreated={vm.fetchTasks}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background.light,
  },
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
  listContent: {
    paddingHorizontal: S.xl,
    paddingBottom: 100,
    paddingTop: S.sm,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface.light,
    borderWidth: 1,
    borderColor: T.border.light,
    borderRadius: R.xl,
    padding: S.lg,
    marginBottom: S.md,
    ...theme.elevation.sm,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: R.lg,
    backgroundColor: T.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.md,
  },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    color: T.onSurface.light,
    fontWeight: '700',
    fontSize: 15,
  },
  eventMeta: {
    color: T.onSurface.mutedLight,
    marginTop: 2,
    fontSize: 13,
  },
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
