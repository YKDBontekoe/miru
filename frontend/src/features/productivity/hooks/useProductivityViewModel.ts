import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarEvent, Note, Task } from '@/core/models';
import { TaskPriority } from '../components/PriorityChips';
import { useProductivityStore } from '@/store/useProductivityStore';

export type Tab = 'today' | 'all' | 'notes' | 'tasks';

export type RenderItemData = {
  date?: number;
  type: 'note' | 'task' | 'event';
  item: Note | Task | CalendarEvent;
  id: string;
};

export function useProductivityViewModel() {
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [todayPlan, setTodayPlan] = useState<string | null>(null);

  const { notes, tasks, events } = useProductivityStore();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredNotes = useMemo(() => {
    if (!debouncedQuery) return notes;
    const lowerQ = debouncedQuery.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(lowerQ) || n.content.toLowerCase().includes(lowerQ)
    );
  }, [notes, debouncedQuery]);

  const filteredTasks = useMemo(() => {
    if (!debouncedQuery) return tasks;
    const lowerQ = debouncedQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(lowerQ) ||
        (task.description?.toLowerCase().includes(lowerQ) ?? false)
    );
  }, [debouncedQuery, tasks]);

  const filteredEvents = useMemo(() => {
    if (!debouncedQuery) return events;
    const lowerQ = debouncedQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(lowerQ) ||
        (event.description?.toLowerCase().includes(lowerQ) ?? false) ||
        (event.location?.toLowerCase().includes(lowerQ) ?? false)
    );
  }, [events, debouncedQuery]);

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

    // When activeTab is today, only count tasks that are overdue or due today
    // We recreate the same logic used for todayData to keep counts consistent
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    let sourceTasks = filteredTasks.filter((task) => !task.completed);

    if (activeTab === 'today') {
      sourceTasks = sourceTasks.filter((task) => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate < end; // Includes both overdue and due today
      });
    }

    sourceTasks.forEach((task) => {
      counts.all += 1;
      counts[getTaskPriority(task)] += 1;
    });
    return counts;
  }, [filteredTasks, getTaskPriority, activeTab]);

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

  const dataToRender = useMemo(() => {
    return activeTab === 'today'
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
  }, [
    activeTab,
    todayData,
    taskPriority,
    mixedData,
    filteredNotes,
    prioritizedTasks,
    getTaskPriority,
  ]);

  const generateTodayPlan = useCallback(() => {
    const now = new Date();
    const nextTasks = prioritizedTasks.slice(0, 3);
    const nextEvents = [...filteredEvents]
      .filter((event) => new Date(event.end_time) >= now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3);

    const lines: string[] = [];
    const { t } = i18n;

    if (taskPriorityCounts.overdue > 0) {
      lines.push(
        t('productivity.plan.recover_overdue', {
          count: taskPriorityCounts.overdue,
          defaultValue: `1) Recover overdue: start with ${taskPriorityCounts.overdue} overdue task(s).`,
        })
      );
    } else {
      lines.push(
        t('productivity.plan.no_overdue', {
          defaultValue: '1) No overdue tasks: start with highest-impact open work.',
        })
      );
    }

    if (nextTasks.length > 0) {
      lines.push(
        t('productivity.plan.focus_block', {
          tasks: nextTasks.map((task) => task.title).join(', '),
          defaultValue: `2) Focus block: ${nextTasks.map((task) => task.title).join(', ')}.`,
        })
      );
    } else {
      lines.push(
        t('productivity.plan.no_focus', {
          defaultValue: '2) Focus block: no pending tasks, use this for planning or review.',
        })
      );
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
      lines.push(
        t('productivity.plan.calendar_checkpoints', {
          times: eventLine,
          defaultValue: `3) Calendar checkpoints at ${eventLine}.`,
        })
      );
    } else {
      lines.push(
        t('productivity.plan.calendar_light', {
          defaultValue: '3) Calendar is light: reserve time for deep work and wrap-up.',
        })
      );
    }

    setTodayPlan(lines.join('\n'));
    setActiveTab('today');
  }, [filteredEvents, i18n, prioritizedTasks, taskPriorityCounts.overdue]);

  return {
    activeTab,
    setActiveTab,
    taskPriority,
    setTaskPriority,
    searchQuery,
    setSearchQuery,
    todayPlan,
    setTodayPlan,
    pendingTasksCount,
    taskPriorityCounts,
    dataToRender,
    generateTodayPlan,
  };
}
