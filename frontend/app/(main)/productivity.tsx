import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { NoteCard } from '../../src/components/productivity/NoteCard';
import { TaskCard } from '../../src/components/productivity/TaskCard';
import { ProductivityHeader } from '../../src/components/productivity/ProductivityHeader';
import { ProductivityTabs } from '../../src/components/productivity/ProductivityTabs';
import { ProductivityEmptyState } from '../../src/components/productivity/ProductivityEmptyState';
import { ProductivityTodayPlan } from '../../src/components/productivity/ProductivityTodayPlan';
import { theme } from '../../src/core/theme';
import { CalendarEvent, Note, ProductivityTab, Task } from '../../src/core/models';
import { useProductivityStore } from '../../src/store/useProductivityStore';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  surface: { light: DESIGN_TOKENS.colors.surface },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
};
const S = theme.spacing;
const R = theme.borderRadius;

type TaskPriority = 'all' | 'overdue' | 'today' | 'upcoming' | 'no_due';

type RenderItemData = {
  date?: number;
  type: 'note' | 'task' | 'event';
  item: Note | Task | CalendarEvent;
  id: string;
};

export default function ProductivityScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const openCreateTask = params.openCreateTask;
  const openCreateNote = params.openCreateNote;
  const [activeTab, setActiveTab] = useState<ProductivityTab>('today');
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
    const controller = new AbortController();
    fetchNotes(controller.signal);
    fetchTasks(controller.signal);
    fetchEvents(controller.signal);
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
      <ProductivityHeader
        pendingTasksCount={pendingTasksCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onGeneratePlan={generateTodayPlan}
        onShowCreateNote={() => setShowCreateNote(true)}
        onShowCreateTask={() => setShowCreateTask(true)}
      />

      <ProductivityTabs activeTab={activeTab} setActiveTab={setActiveTab} />

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
              {
                key: 'all',
                label: t('productivity.priority.all', { count: taskPriorityCounts.all }),
              },
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
          activeTab === 'today' ? (
            <ProductivityTodayPlan todayPlan={todayPlan} onClearPlan={() => setTodayPlan(null)} />
          ) : null
        }
        ListEmptyComponent={
          <ProductivityEmptyState
            activeTab={activeTab}
            searchQuery={searchQuery}
            onShowCreateNote={() => setShowCreateNote(true)}
            onShowCreateTask={() => setShowCreateTask(true)}
          />
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
});
