import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useProductivityStore } from '@/store/useProductivityStore';
import { CalendarEvent, Note, Task } from '@/core/models';

export type Tab = 'today' | 'all' | 'notes' | 'tasks';
export type TaskPriority = 'all' | 'overdue' | 'today' | 'upcoming' | 'no_due';

export type RenderItemData = {
  date?: number;
  type: 'note' | 'task' | 'event';
  item: Note | Task | CalendarEvent;
  id: string;
};

export function useProductivityViewModel() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const openCreateTask = params.openCreateTask;
  const openCreateNote = params.openCreateNote;

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
    (action: () => Promise<void>) => {
      Alert.alert(
        t('productivity.delete') || 'Delete',
        t('productivity.are_you_sure') || 'Are you sure?',
        [
          { text: t('settings.actions.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('settings.actions.delete') || 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await action();
              } catch {
                Alert.alert(
                  t('errors.operation_failed') || 'Operation failed',
                  t('errors.try_again') || 'Please try again later'
                );
              }
            },
          },
        ]
      );
    },
    [t]
  );

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredNotes = useMemo(() => {
    if (!debouncedSearchQuery) return notes;
    const lowerQ = debouncedSearchQuery.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(lowerQ) || n.content.toLowerCase().includes(lowerQ)
    );
  }, [notes, debouncedSearchQuery]);

  const filteredTasks = useMemo(() => {
    if (!debouncedSearchQuery) return tasks;
    const lowerQ = debouncedSearchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(lowerQ) ||
        (task.description?.toLowerCase().includes(lowerQ) ?? false)
    );
  }, [debouncedSearchQuery, tasks]);

  const filteredEvents = useMemo(() => {
    if (!debouncedSearchQuery) return events;
    const lowerQ = debouncedSearchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(lowerQ) ||
        (event.description?.toLowerCase().includes(lowerQ) ?? false) ||
        (event.location?.toLowerCase().includes(lowerQ) ?? false)
    );
  }, [events, debouncedSearchQuery]);

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
      const parsedA = a.due_date ? new Date(a.due_date).getTime() : NaN;
      const parsedB = b.due_date ? new Date(b.due_date).getTime() : NaN;
      const aDue = isNaN(parsedA) ? Number.MAX_SAFE_INTEGER : parsedA;
      const bDue = isNaN(parsedB) ? Number.MAX_SAFE_INTEGER : parsedB;
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

  const dataToRender: RenderItemData[] = useMemo(() => {
    if (activeTab === 'today') {
      return todayData.filter((entry) => {
        if (entry.type !== 'task') return true;
        if (taskPriority === 'all') return true;
        return getTaskPriority(entry.item as Task) === taskPriority;
      });
    }
    if (activeTab === 'all') {
      return mixedData;
    }
    if (activeTab === 'notes') {
      return filteredNotes.map((note) => ({ type: 'note' as const, item: note, id: note.id }));
    }
    return prioritizedTasks.map((task) => ({ type: 'task' as const, item: task, id: task.id }));
  }, [activeTab, todayData, mixedData, filteredNotes, prioritizedTasks, taskPriority, getTaskPriority]);

  const generateTodayPlan = useCallback(() => {
    const now = new Date();
    const nextTasks = prioritizedTasks.slice(0, 3);
    const nextEvents = [...filteredEvents]
      .filter((event) => new Date(event.end_time) >= now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3);

    const lines: string[] = [];
    if (taskPriorityCounts.overdue > 0) {
      lines.push(t('productivity.plan.overdue', { count: taskPriorityCounts.overdue }) || `1) Recover overdue: start with ${taskPriorityCounts.overdue} overdue task(s).`);
    } else {
      lines.push(t('productivity.plan.no_overdue') || '1) No overdue tasks: start with highest-impact open work.');
    }

    if (nextTasks.length > 0) {
      lines.push(t('productivity.plan.focus_block', { tasks: nextTasks.map((task) => task.title).join(', ') }) || `2) Focus block: ${nextTasks.map((task) => task.title).join(', ')}.`);
    } else {
      lines.push(t('productivity.plan.no_focus') || '2) Focus block: no pending tasks, use this for planning or review.');
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
      lines.push(t('productivity.plan.calendar', { times: eventLine }) || `3) Calendar checkpoints at ${eventLine}.`);
    } else {
      lines.push(t('productivity.plan.light_calendar') || '3) Calendar is light: reserve time for deep work and wrap-up.');
    }

    setTodayPlan(lines.join('\n'));
    setActiveTab('today');
  }, [filteredEvents, i18n.language, prioritizedTasks, taskPriorityCounts.overdue, t]);

  return {
    t,
    i18n,
    activeTab,
    setActiveTab,
    taskPriority,
    setTaskPriority,
    searchQuery,
    setSearchQuery,
    showCreateNote,
    setShowCreateNote,
    showCreateTask,
    setShowCreateTask,
    todayPlan,
    setTodayPlan,
    dataToRender,
    isLoading,
    pendingTasksCount,
    taskPriorityCounts,
    confirmDelete,
    generateTodayPlan,
    handleRefresh,
    fetchNotes,
    fetchTasks,
    deleteNote,
    deleteTask,
    toggleTask,
  };
}
