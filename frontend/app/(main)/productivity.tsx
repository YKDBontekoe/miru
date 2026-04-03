import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { NoteCard } from '../../src/components/productivity/NoteCard';
import { TaskCard } from '../../src/components/productivity/TaskCard';
import { theme } from '../../src/core/theme';
import { CalendarEvent, Note, Task } from '../../src/core/models';
import { useProductivityStore } from '../../src/store/useProductivityStore';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  surface: { light: DESIGN_TOKENS.colors.surface, highLight: DESIGN_TOKENS.colors.surfaceSoft },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
    disabledLight: '#97AEA3',
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

type Tab = 'today' | 'all' | 'notes' | 'tasks';
type TaskPriority = 'all' | 'overdue' | 'today' | 'upcoming' | 'no_due';

type RenderItemData = {
  date?: number;
  type: 'note' | 'task' | 'event';
  item: Note | Task | CalendarEvent;
  id: string;
};

export default function ProductivityScreen() {
  const { t, i18n } = useTranslation();
  const { openCreateTask, openCreateNote } = useLocalSearchParams<{
    openCreateTask?: string;
    openCreateNote?: string;
  }>();
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [todayPlan, setTodayPlan] = useState<string | null>(null);

  const {
    notes,
    tasks,
    events,
    fetchNotes,
    fetchTasks,
    fetchEvents,
    isLoading,
    deleteNote,
    deleteTask,
    toggleTask,
  } = useProductivityStore();

  useEffect(() => {
    fetchNotes();
    fetchTasks();
    fetchEvents();
  }, [fetchEvents, fetchNotes, fetchTasks]);

  useEffect(() => {
    if (openCreateTask === '1' || openCreateTask === 'true') {
      setShowCreateTask(true);
    }
  }, [openCreateTask]);

  useEffect(() => {
    if (openCreateNote === '1' || openCreateNote === 'true') {
      setShowCreateNote(true);
    }
  }, [openCreateNote]);

  const handleRefresh = useCallback(() => {
    fetchNotes();
    fetchTasks();
    fetchEvents();
  }, [fetchEvents, fetchNotes, fetchTasks]);

  const confirmDelete = useCallback(
    (action: () => Promise<void>) =>
      Alert.alert(
        t('productivity.delete') || 'Delete',
        t('productivity.are_you_sure') || 'Are you sure?',
        [
          { text: t('settings.actions.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('settings.actions.delete') || 'Delete',
            style: 'destructive',
            onPress: () => action(),
          },
        ]
      ),
    [t]
  );

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const lowerQ = searchQuery.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(lowerQ) || n.content.toLowerCase().includes(lowerQ)
    );
  }, [notes, searchQuery]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const lowerQ = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(lowerQ) ||
        (task.description?.toLowerCase().includes(lowerQ) ?? false)
    );
  }, [searchQuery, tasks]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const lowerQ = searchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(lowerQ) ||
        (event.description?.toLowerCase().includes(lowerQ) ?? false) ||
        (event.location?.toLowerCase().includes(lowerQ) ?? false)
    );
  }, [events, searchQuery]);

  const pendingTasksCount = useMemo(
    () => filteredTasks.filter((task) => !task.completed).length,
    [filteredTasks]
  );

  const getTaskPriority = useCallback((task: Task): Exclude<TaskPriority, 'all'> => {
    if (!task.due_date) return 'no_due';
    const now = new Date();
    const due = new Date(task.due_date);
    if (isNaN(due.getTime())) return 'no_due';
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(dayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (due < dayStart) return 'overdue';
    if (due >= dayStart && due < tomorrow) return 'today';
    return 'upcoming';
  }, []);

  const taskPriorityCounts = useMemo(() => {
    const counts: Record<TaskPriority, number> = {
      all: 0,
      overdue: 0,
      today: 0,
      upcoming: 0,
      no_due: 0,
    };
    filteredTasks
      .filter((task) => !task.completed)
      .forEach((task) => {
        counts.all += 1;
        counts[getTaskPriority(task)] += 1;
      });
    return counts;
  }, [filteredTasks, getTaskPriority]);

  const prioritizedTasks = useMemo(() => {
    const tasksToRank = filteredTasks.filter((task) => !task.completed);
    const pool =
      taskPriority === 'all'
        ? tasksToRank
        : tasksToRank.filter((task) => getTaskPriority(task) === taskPriority);
    return [...pool].sort((a, b) => {
      const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });
  }, [filteredTasks, getTaskPriority, taskPriority]);

  const mixedData = useMemo(() => {
    const data: RenderItemData[] = [];
    filteredNotes.forEach((note) => {
      data.push({
        type: 'note',
        item: note,
        id: `note-${note.id}`,
        date: new Date(note.created_at).getTime(),
      });
    });
    filteredTasks.forEach((task) => {
      data.push({
        type: 'task',
        item: task,
        id: `task-${task.id}`,
        date: new Date(task.created_at).getTime(),
      });
    });
    return data.sort((a, b) => (b.date || 0) - (a.date || 0));
  }, [filteredNotes, filteredTasks]);

  const todayData = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const overdueTasks = filteredTasks.filter((task) => {
      if (task.completed || !task.due_date) return false;
      return new Date(task.due_date) < start;
    });

    const dueTodayTasks = filteredTasks.filter((task) => {
      if (task.completed || !task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return dueDate >= start && dueDate < end;
    });

    const upcomingEvents = filteredEvents.filter((event) => {
      const startTime = new Date(event.start_time);
      return startTime >= start && startTime < weekEnd;
    });

    const items: RenderItemData[] = [
      ...overdueTasks.map((task) => ({
        type: 'task' as const,
        item: task,
        id: `overdue-${task.id}`,
        date: task.due_date ? new Date(task.due_date).getTime() : undefined,
      })),
      ...dueTodayTasks.map((task) => ({
        type: 'task' as const,
        item: task,
        id: `today-${task.id}`,
        date: task.due_date ? new Date(task.due_date).getTime() : undefined,
      })),
      ...upcomingEvents.map((event) => ({
        type: 'event' as const,
        item: event,
        id: `event-${event.id}`,
        date: new Date(event.start_time).getTime(),
      })),
    ];

    return items.sort((a, b) => (a.date || 0) - (b.date || 0));
  }, [filteredEvents, filteredTasks]);

  const dataToRender: RenderItemData[] =
    activeTab === 'today'
      ? todayData
      : activeTab === 'all'
        ? mixedData
        : activeTab === 'notes'
          ? filteredNotes.map((note) => ({ type: 'note' as const, item: note, id: note.id }))
          : prioritizedTasks.map((task) => ({ type: 'task' as const, item: task, id: task.id }));

  const generateTodayPlan = useCallback(() => {
    const now = new Date();
    const nextTasks = prioritizedTasks.slice(0, 3);
    const nextEvents = [...filteredEvents]
      .filter((event) => new Date(event.end_time) >= now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3);

    const lines: string[] = [];
    if (taskPriorityCounts.overdue > 0) {
      lines.push(`1) Recover overdue: start with ${taskPriorityCounts.overdue} overdue task(s).`);
    } else {
      lines.push('1) No overdue tasks: start with highest-impact open work.');
    }

    if (nextTasks.length > 0) {
      lines.push(`2) Focus block: ${nextTasks.map((task) => task.title).join(', ')}.`);
    } else {
      lines.push('2) Focus block: no pending tasks, use this for planning or review.');
    }

    if (nextEvents.length > 0) {
      const eventLine = nextEvents
        .map((event) =>
          new Intl.DateTimeFormat(i18n.language, {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(event.start_time))
        )
        .join(', ');
      lines.push(`3) Calendar checkpoints at ${eventLine}.`);
    } else {
      lines.push('3) Calendar is light: reserve time for deep work and wrap-up.');
    }

    setTodayPlan(lines.join('\n'));
    setActiveTab('today');
  }, [filteredEvents, i18n.language, prioritizedTasks, taskPriorityCounts.overdue]);

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => {
      if (item.type === 'note') {
        const note = item.item as Note;
        return <NoteCard note={note} onDelete={() => confirmDelete(() => deleteNote(note.id))} />;
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
                {new Intl.DateTimeFormat(i18n.language, {
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
          onToggle={() => toggleTask(task.id)}
          onDelete={() => confirmDelete(() => deleteTask(task.id))}
        />
      );
    },
    [confirmDelete, deleteNote, deleteTask, i18n.language, toggleTask]
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
            value={searchQuery}
            onChangeText={setSearchQuery}
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

      {(activeTab === 'tasks' || activeTab === 'today') && (
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
              { key: 'all', label: `All (${taskPriorityCounts.all})` },
              { key: 'overdue', label: `Overdue (${taskPriorityCounts.overdue})` },
              { key: 'today', label: `Today (${taskPriorityCounts.today})` },
              { key: 'upcoming', label: `Upcoming (${taskPriorityCounts.upcoming})` },
              { key: 'no_due', label: `No due (${taskPriorityCounts.no_due})` },
            ] as const
          ).map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setTaskPriority(option.key)}
              style={({ pressed }) => [
                {
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: taskPriority === option.key ? T.primary.DEFAULT : T.border.light,
                  backgroundColor:
                    taskPriority === option.key ? T.primary.surfaceLight : T.surface.light,
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

      <FlatList
        data={dataToRender}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && dataToRender.length > 0}
            onRefresh={handleRefresh}
            tintColor={T.primary.DEFAULT}
          />
        }
        renderItem={renderItem}
        ListHeaderComponent={
          activeTab === 'today' && todayPlan ? (
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
                <Pressable onPress={() => setTodayPlan(null)}>
                  <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
                </Pressable>
              </View>
              <AppText style={{ color: T.onSurface.mutedLight, marginTop: 8, lineHeight: 20 }}>
                {todayPlan}
              </AppText>
            </View>
          ) : null
        }
        ListEmptyComponent={
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
                    onPress={() => setShowCreateNote(true)}
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
                        activeTab === 'all' || activeTab === 'today' ? T.primary.DEFAULT : T.white
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
                      New Task
                    </AppText>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        }
      />

      <CreateNoteModal
        visible={showCreateNote}
        onClose={() => setShowCreateNote(false)}
        onCreated={fetchNotes}
      />
      <CreateTaskModal
        visible={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onCreated={fetchTasks}
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
