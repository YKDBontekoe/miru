import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
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
import { ProductivityEmptyState } from '@/features/productivity/components/ProductivityEmptyState';
import { ProductivityHeader } from '@/features/productivity/components/ProductivityHeader';
import { PriorityChips } from '@/features/productivity/components/PriorityChips';
import { EventCard } from '@/features/productivity/components/EventCard';
import { TodayPlanCard } from '@/features/productivity/components/TodayPlanCard';
import {
  useProductivityViewModel,
  RenderItemData,
} from '@/features/productivity/hooks/useProductivityViewModel';

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
  },
  transparent: 'transparent',
};
const S = theme.spacing;
const R = theme.borderRadius;

export default function ProductivityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const openCreateTask = params.openCreateTask;
  const openCreateNote = params.openCreateNote;

  const [showCreateNote, setShowCreateNote] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const {
    fetchNotes,
    fetchTasks,
    fetchEvents,
    isLoading,
    error,
    errorNotes,
    errorTasks,
    errorEvents,
    deleteNote,
    deleteTask,
    toggleTask,
  } = useProductivityStore();

  const {
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
  } = useProductivityViewModel();

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

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => {
      if (item.type === 'note') {
        const note = item.item as Note;
        return <NoteCard note={note} onDelete={() => confirmDelete(() => deleteNote(note.id))} />;
      }
      if (item.type === 'event') {
        const event = item.item as CalendarEvent;
        return <EventCard event={event} />;
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
    [confirmDelete, deleteNote, deleteTask, toggleTask]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProductivityHeader
        pendingTasksCount={pendingTasksCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        generateTodayPlan={generateTodayPlan}
        setShowCreateNote={setShowCreateNote}
        setShowCreateTask={setShowCreateTask}
      />

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
        <PriorityChips
          taskPriority={taskPriority}
          setTaskPriority={setTaskPriority}
          taskPriorityCounts={taskPriorityCounts}
        />
      )}

      {error || errorNotes || errorTasks || errorEvents ? (
        <View style={styles.errorContainer}>
          <AppText style={styles.errorText}>
            {error || errorNotes || errorTasks || errorEvents}
          </AppText>
          <Pressable onPress={handleRefresh} style={styles.retryButton}>
            <AppText style={styles.retryText}>{t('settings.actions.retry') || 'Retry'}</AppText>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={dataToRender}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={T.primary.DEFAULT}
          />
        }
        renderItem={renderItem}
        ListHeaderComponent={
          activeTab === 'today' ? (
            <TodayPlanCard todayPlan={todayPlan} setTodayPlan={setTodayPlan} />
          ) : null
        }
        ListEmptyComponent={
          <ProductivityEmptyState
            activeTab={activeTab}
            searchQuery={searchQuery}
            setShowCreateNote={setShowCreateNote}
            setShowCreateTask={setShowCreateTask}
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
  errorContainer: {
    backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
    padding: S.md,
    marginHorizontal: S.xl,
    marginBottom: S.sm,
    borderRadius: R.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorText: {
    color: theme.colors.status.error,
    flex: 1,
  },
  retryButton: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    borderRadius: R.md,
    marginLeft: S.md,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
