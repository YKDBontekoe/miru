import re

with open('frontend/src/hooks/viewmodels/useProductivityViewModel.ts', 'r') as f:
    content = f.read()

# 1. Fix upcomingEvents filtering
content = content.replace(
    'return startTime >= start && startTime < weekEnd;',
    'return startTime >= start && startTime < weekEnd && new Date(event.end_time) >= new Date();'
)

# 2. Fix confirmDelete unhandled rejection
old_confirm_delete = """    (action: () => Promise<void>) =>
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
      ),"""
new_confirm_delete = """    (action: () => Promise<void>) =>
      Alert.alert(
        t('productivity.delete') || 'Delete',
        t('productivity.are_you_sure') || 'Are you sure?',
        [
          { text: t('settings.actions.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('settings.actions.delete') || 'Delete',
            style: 'destructive',
            onPress: () => {
              void action().catch(() => {
                Alert.alert(t('productivity.delete_failed') || 'Delete failed');
              });
            },
          },
        ]
      ),"""
content = content.replace(old_confirm_delete, new_confirm_delete)

# 3. Fix generateTodayPlan using unfiltered datasets
old_generate = """  const generateTodayPlan = useCallback(() => {
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

    setTodayPlan(lines.join('\\n'));
    setActiveTab('today');
  }, [filteredEvents, i18n.language, prioritizedTasks, taskPriorityCounts.overdue]);"""

new_generate = """  const generateTodayPlan = useCallback(() => {
    const now = new Date();

    // Get full unfiltered datasets
    const openTasks = tasks.filter(t => !t.completed);

    // Get all events
    const upcomingFullEvents = events.filter((event) => new Date(event.end_time) >= now);

    // Calculate full priority counts
    const fullCounts = { overdue: 0 };
    openTasks.forEach(t => {
      if (getTaskPriority(t) === 'overdue') fullCounts.overdue += 1;
    });

    const fullPrioritizedTasks = [...openTasks].sort((a, b) => {
      const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });

    const nextTasks = fullPrioritizedTasks.slice(0, 3);
    const nextEvents = [...upcomingFullEvents]
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3);

    const lines: string[] = [];
    if (fullCounts.overdue > 0) {
      lines.push(`1) Recover overdue: start with ${fullCounts.overdue} overdue task(s).`);
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

    setTodayPlan(lines.join('\\n'));
    setActiveTab('today');
  }, [events, getTaskPriority, i18n.language, tasks]);"""
content = content.replace(old_generate, new_generate)

# 4. Memoize dataToRender
old_data_to_render = """  const dataToRender: RenderItemData[] =
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
          : prioritizedTasks.map((task) => ({ type: 'task' as const, item: task, id: task.id }));"""
new_data_to_render = """  const dataToRender: RenderItemData[] = useMemo(() => {
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
  }, [activeTab, todayData, mixedData, filteredNotes, prioritizedTasks, taskPriority, getTaskPriority]);"""
content = content.replace(old_data_to_render, new_data_to_render)

# 5. Debounce search
if 'useDebounce' not in content:
    # Add simple debounce
    old_search_state = "  const [searchQuery, setSearchQuery] = useState('');"
    new_search_state = """  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);"""
    content = content.replace(old_search_state, new_search_state)

    # Update search usages
    content = content.replace(
        """if (!searchQuery) return notes;
    const lowerQ = searchQuery.toLowerCase();""",
        """if (!debouncedQuery) return notes;
    const lowerQ = debouncedQuery.toLowerCase();"""
    ).replace(
        "}, [notes, searchQuery]);",
        "}, [notes, debouncedQuery]);"
    )

    content = content.replace(
        """if (!searchQuery) return tasks;
    const lowerQ = searchQuery.toLowerCase();""",
        """if (!debouncedQuery) return tasks;
    const lowerQ = debouncedQuery.toLowerCase();"""
    ).replace(
        "}, [searchQuery, tasks]);",
        "}, [debouncedQuery, tasks]);"
    )

    content = content.replace(
        """if (!searchQuery) return events;
    const lowerQ = searchQuery.toLowerCase();""",
        """if (!debouncedQuery) return events;
    const lowerQ = debouncedQuery.toLowerCase();"""
    ).replace(
        "}, [events, searchQuery]);",
        "}, [events, debouncedQuery]);"
    )

# 6. Fix router nextParams effects
old_task_effect = """  useEffect(() => {
    if (openCreateTask === '1' || openCreateTask === 'true') {
      setShowCreateTask(true);
      const nextParams = Object.fromEntries(
        Object.entries(params).filter(
          ([key, value]) => key !== 'openCreateTask' && typeof value === 'string'
        )
      );
      router.replace({ pathname, params: nextParams });
    }
  }, [openCreateTask, params, pathname, router]);"""
new_task_effect = """  useEffect(() => {
    if (openCreateTask === '1' || openCreateTask === 'true') {
      setShowCreateTask(true);
      const nextParams = { ...params };
      delete nextParams.openCreateTask;
      router.replace({ pathname, params: nextParams });
    }
  }, [openCreateTask, params, pathname, router]);"""
content = content.replace(old_task_effect, new_task_effect)

old_note_effect = """  useEffect(() => {
    if (openCreateNote === '1' || openCreateNote === 'true') {
      setShowCreateNote(true);
      const nextParams = Object.fromEntries(
        Object.entries(params).filter(
          ([key, value]) => key !== 'openCreateNote' && typeof value === 'string'
        )
      );
      router.replace({ pathname, params: nextParams });
    }
  }, [openCreateNote, params, pathname, router]);"""
new_note_effect = """  useEffect(() => {
    if (openCreateNote === '1' || openCreateNote === 'true') {
      setShowCreateNote(true);
      const nextParams = { ...params };
      delete nextParams.openCreateNote;
      router.replace({ pathname, params: nextParams });
    }
  }, [openCreateNote, params, pathname, router]);"""
content = content.replace(old_note_effect, new_note_effect)

with open('frontend/src/hooks/viewmodels/useProductivityViewModel.ts', 'w') as f:
    f.write(content)
