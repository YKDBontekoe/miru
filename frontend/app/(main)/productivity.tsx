import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
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
import { ProductivityEmptyState } from '@/components/productivity/ProductivityEmptyState';
import { TodayPlanCard } from '@/components/productivity/TodayPlanCard';
import { PriorityFilter, TaskPriority } from '@/components/productivity/PriorityFilter';
import { ProductivityTabs, Tab } from '@/components/productivity/ProductivityTabs';
import { ProductivityItem, RenderItemData } from '@/components/productivity/ProductivityItem';
import { theme } from '../../src/core/theme';
import { Task } from '../../src/core/models';
import { useProductivityStore } from '../../src/store/useProductivityStore';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const S = theme.spacing;
const R = theme.borderRadius;


export default function ProductivityScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const openCreateTask = params.openCreateTask;
  const openCreateNote = params.openCreateNote;
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );


  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );


  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );


  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );

  return () => clearTimeout(handler);
  }, [searchInput]);
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
    const controller = new AbortController();
    fetchNotes(controller.signal);
    fetchTasks(controller.signal);
    fetchEvents(controller.signal);

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );


  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );


  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );


  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );

  return () => {
      controller.abort();
    };
  }, [fetchEvents, fetchNotes, fetchTasks]);

  useEffect(() => {
    if (openCreateTask === '1' || openCreateTask === 'true') {
      setShowCreateTask(true);
      const nextParams = Object.fromEntries(
        Object.entries(params).filter(
          ([key, value]) => key !== 'openCreateTask' && typeof value === 'string'
        )
      );
      router.replace({ pathname, params: nextParams });
    }
  }, [openCreateTask, params, pathname, router]);

  useEffect(() => {
    if (openCreateNote === '1' || openCreateNote === 'true') {
      setShowCreateNote(true);
      const nextParams = Object.fromEntries(
        Object.entries(params).filter(
          ([key, value]) => key !== 'openCreateNote' && typeof value === 'string'
        )
      );
      router.replace({ pathname, params: nextParams });
    }
  }, [openCreateNote, params, pathname, router]);

  const handleRefresh = useCallback(() => {
    fetchNotes();
    fetchTasks();
    fetchEvents();
  }, [fetchEvents, fetchNotes, fetchTasks]);


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
      ? todayData.filter((entry) => {
          if (entry.type !== 'task') return true;
          if (taskPriority === 'all') return true;
          return getTaskPriority(entry.item as Task) === taskPriority;
        })
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
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );


  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );


  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );


  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
  );

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityItem
        item={item}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [deleteNote, deleteTask, toggleTask]
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
              <Ionicons name="sparkles" size={20} color={DESIGN_TOKENS.colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateNote(true)}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="document-text" size={20} color={DESIGN_TOKENS.colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateTask(true)}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="checkbox" size={20} color={DESIGN_TOKENS.colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={DESIGN_TOKENS.colors.muted}
            style={styles.searchIcon}
          />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t('productivity.search') || 'Search notes & tasks...'}
            placeholderTextColor={DESIGN_TOKENS.colors.faint}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ProductivityTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {(activeTab === 'tasks' || activeTab === 'today') && (
        <PriorityFilter
          taskPriority={taskPriority}
          setTaskPriority={setTaskPriority}
          taskPriorityCounts={taskPriorityCounts}
        />
      )}

      <FlatList
        data={dataToRender}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={DESIGN_TOKENS.colors.primary}
          />
        }
        renderItem={renderItem}) => (
          <ProductivityItem
            item={item}
            deleteNote={deleteNote}
            deleteTask={deleteTask}
            toggleTask={toggleTask}
          />
        )}
        ListHeaderComponent={<TodayPlanCard todayPlan={activeTab === 'today' ? todayPlan : null} setTodayPlan={setTodayPlan} />}
        ListEmptyComponent={
          !isLoading ? (
            <ProductivityEmptyState
              searchQuery={searchQuery}
              activeTab={activeTab}
              setShowCreateNote={setShowCreateNote}
              setShowCreateTask={setShowCreateTask}
            />
          ) : null
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
    backgroundColor: DESIGN_TOKENS.colors.pageBg,
  },
  headerContainer: {
    paddingHorizontal: S.xl,
    paddingTop: S.md,
    paddingBottom: S.lg,
    backgroundColor: DESIGN_TOKENS.colors.surface,
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
    color: DESIGN_TOKENS.colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: DESIGN_TOKENS.colors.muted,
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
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.pageBg,
    borderRadius: R.lg,
    paddingHorizontal: S.md,
    height: 44,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  searchIcon: {
    marginRight: S.sm,
  },
  searchInput: {
    flex: 1,
    color: DESIGN_TOKENS.colors.text,
    fontSize: 16,
    height: '100%',
  },
  listContent: {
    paddingHorizontal: S.xl,
    paddingBottom: 100,
    paddingTop: S.sm,
  },
});
