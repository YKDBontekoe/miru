import React, { useEffect, useCallback } from 'react';
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
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { NoteCard } from '../../src/components/productivity/NoteCard';
import { TaskCard } from '../../src/components/productivity/TaskCard';
import { EventCard } from '../../src/components/productivity/EventCard';
import { theme } from '../../src/core/theme';
import { CalendarEvent, Note, Task } from '../../src/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { RenderItemData, useProductivityViewModel } from '../../src/hooks/useProductivityViewModel';

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

const renderItem = ({
  item,
  extraData,
}: {
  item: RenderItemData;
  extraData: {
    confirmDelete: (action: () => Promise<void>) => void;
    deleteNote: (id: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
  };
}) => {
  if (item.type === 'note') {
    const note = item.item as Note;
    return (
      <NoteCard
        note={note}
        onDelete={() => extraData.confirmDelete(() => extraData.deleteNote(note.id))}
      />
    );
  }
  if (item.type === 'event') {
    const event = item.item as CalendarEvent;
    return <EventCard event={event} />;
  }

  const task = item.item as Task;
  return (
    <TaskCard
      task={task}
      onToggle={() => extraData.toggleTask(task.id)}
      onDelete={() => extraData.confirmDelete(() => extraData.deleteTask(task.id))}
    />
  );
};

export default function ProductivityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const openCreateTask = params.openCreateTask;
  const openCreateNote = params.openCreateNote;

  const { state, actions } = useProductivityViewModel();
  const [inputValue, setInputValue] = React.useState(state.searchQuery);

  const debounceTimer = React.useRef<NodeJS.Timeout | null>(null);

  const handleChange = React.useCallback(
    (text: string) => {
      setInputValue(text);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        actions.setSearchQuery(text);
      }, 300);
    },
    [actions]
  );

  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  useEffect(() => {
    if (openCreateTask === '1' || openCreateTask === 'true') {
      actions.setShowCreateTask(true);
      const nextParams = Object.fromEntries(
        Object.entries(params).filter(
          ([key, value]) => key !== 'openCreateTask' && typeof value === 'string'
        )
      );
      router.replace({ pathname, params: nextParams });
    }
  }, [openCreateTask, params, pathname, router, actions, actions.setShowCreateTask]);

  useEffect(() => {
    if (openCreateNote === '1' || openCreateNote === 'true') {
      actions.setShowCreateNote(true);
      const nextParams = Object.fromEntries(
        Object.entries(params).filter(
          ([key, value]) => key !== 'openCreateNote' && typeof value === 'string'
        )
      );
      router.replace({ pathname, params: nextParams });
    }
  }, [openCreateNote, params, pathname, router, actions, actions.setShowCreateNote]);

  const memoizedRenderItem = useCallback(
    (props: { item: RenderItemData }) =>
      renderItem({
        item: props.item,
        extraData: {
          confirmDelete: actions.confirmDelete,
          deleteNote: actions.deleteNote,
          deleteTask: actions.deleteTask,
          toggleTask: actions.toggleTask,
        },
      }),
    [actions.confirmDelete, actions.deleteNote, actions.deleteTask, actions.toggleTask]
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
              {state.pendingTasksCount === 0
                ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
                : t('productivity.header.subtitle.pending', { count: state.pendingTasksCount }) ||
                  `You have ${state.pendingTasksCount} tasks pending.`}
            </AppText>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={actions.generateTodayPlan}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => actions.setShowCreateNote(true)}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => actions.setShowCreateTask(true)}
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
            value={inputValue}
            onChangeText={handleChange}
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
            onPress={() => actions.setActiveTab(tab)}
            style={({ pressed }) => [
              styles.tabButton,
              state.activeTab === tab && styles.tabButtonActive,
              pressed && state.activeTab !== tab && { opacity: 0.6 },
            ]}
          >
            <AppText style={[styles.tabText, state.activeTab === tab && styles.tabTextActive]}>
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

      {(state.activeTab === 'tasks' || state.activeTab === 'today') && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: S.xl,
            marginBottom: S.sm,
          }}
        >
          {(
            [
              {
                key: 'all',
                label: t('productivity.priority.all', { count: state.taskPriorityCounts.all }),
              },
              {
                key: 'overdue',
                label: t('productivity.priority.overdue', {
                  count: state.taskPriorityCounts.overdue,
                }),
              },
              {
                key: 'today',
                label: t('productivity.priority.today', { count: state.taskPriorityCounts.today }),
              },
              {
                key: 'upcoming',
                label: t('productivity.priority.upcoming', {
                  count: state.taskPriorityCounts.upcoming,
                }),
              },
              {
                key: 'no_due',
                label: t('productivity.priority.no_due', {
                  count: state.taskPriorityCounts.no_due,
                }),
              },
            ] as const
          ).map((option) => (
            <Pressable
              key={option.key}
              onPress={() => actions.setTaskPriority(option.key)}
              style={({ pressed }) => [
                {
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: state.taskPriority === option.key ? T.primary.DEFAULT : T.border.light,
                  backgroundColor:
                    state.taskPriority === option.key ? T.primary.surfaceLight : T.surface.light,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  marginRight: 8,
                  marginBottom: 8,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AppText
                variant="caption"
                style={{
                  color: state.taskPriority === option.key ? T.primary.DEFAULT : T.onSurface.mutedLight,
                  fontWeight: '700',
                }}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}

      {state.hasError ? (
        <View style={styles.emptyContainer}>
          <AppText style={{ color: T.onSurface.light, marginBottom: S.md }}>
            {state.errorMessage}
          </AppText>
          <Pressable
            onPress={actions.handleRefresh}
            style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}
          >
            <AppText style={styles.emptyButtonText}>Retry</AppText>
          </Pressable>
        </View>
      ) : (
      <FlatList
        data={state.dataToRender}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.isLoading && state.dataToRender.length > 0}
            onRefresh={actions.handleRefresh}
            tintColor={T.primary.DEFAULT}
          />
        }
        renderItem={memoizedRenderItem}
        ListHeaderComponent={
          state.activeTab === 'today' && state.todayPlan ? (
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
                  Today plan
                </AppText>
                <Pressable onPress={() => actions.setTodayPlan(null)}>
                  <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
                </Pressable>
              </View>
              <AppText style={{ color: T.onSurface.mutedLight, marginTop: 8, lineHeight: 20 }}>
                {state.todayPlan}
              </AppText>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={
                  state.activeTab === 'notes'
                    ? 'document-text'
                    : state.activeTab === 'tasks'
                      ? 'checkbox'
                      : state.activeTab === 'today'
                        ? 'sunny-outline'
                        : 'planet'
                }
                size={42}
                color={T.primary.DEFAULT}
              />
            </View>
            <AppText variant="h3" style={styles.emptyTitle}>
              {state.searchQuery
                ? t('productivity.no_matches') || 'No matches found'
                : state.activeTab === 'notes'
                  ? t('productivity.no_notes') || 'No Notes'
                  : state.activeTab === 'tasks'
                    ? t('productivity.no_tasks') || 'No Tasks'
                    : state.activeTab === 'today'
                      ? t('productivity.nothing_urgent_today')
                      : t('productivity.workspace_clear') || 'Your workspace is clear'}
            </AppText>
            <AppText style={styles.emptySubtitle}>
              {state.searchQuery
                ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
                : state.activeTab === 'today'
                  ? t('productivity.today_empty_detail')
                  : t('productivity.capture_thoughts') ||
                    'Capture your thoughts and track what needs to get done.'}
            </AppText>

            {!state.searchQuery && (
              <View style={styles.emptyActions}>
                {(state.activeTab === 'all' || state.activeTab === 'notes') && (
                  <Pressable
                    onPress={() => actions.setShowCreateNote(true)}
                    style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="add" size={18} color={T.white} style={{ marginEnd: 6 }} />
                    <AppText style={styles.emptyButtonText}>
                      {t('productivity.newNote') || 'New Note'}
                    </AppText>
                  </Pressable>
                )}
                {(state.activeTab === 'all' || state.activeTab === 'tasks' || state.activeTab === 'today') && (
                  <Pressable
                    onPress={() => actions.setShowCreateTask(true)}
                    style={({ pressed }) => [
                      styles.emptyButton,
                      (state.activeTab === 'all' || state.activeTab === 'today') &&
                        styles.emptyButtonSecondary,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={
                        state.activeTab === 'all' || state.activeTab === 'today'
                          ? T.primary.DEFAULT
                          : T.white
                      }
                      style={{ marginEnd: 6 }}
                    />
                    <AppText
                      style={
                        state.activeTab === 'all' || state.activeTab === 'today'
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
        }
      />
      )}

      <CreateNoteModal
        visible={state.showCreateNote}
        onClose={() => actions.setShowCreateNote(false)}
        onCreated={actions.fetchNotes}
      />
      <CreateTaskModal
        visible={state.showCreateTask}
        onClose={() => actions.setShowCreateTask(false)}
        onCreated={actions.fetchTasks}
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
