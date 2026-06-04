import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
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
import { ProductivityHeader } from '../../src/components/productivity/ProductivityHeader';
import { ProductivityTabs } from '../../src/components/productivity/ProductivityTabs';
import { ProductivityEmptyState } from '../../src/components/productivity/ProductivityEmptyState';
import { ProductivityTodayPlan } from '../../src/components/productivity/ProductivityTodayPlan';
import { useProductivityScreen } from '../../src/hooks/useProductivityScreen';
import { theme } from '../../src/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import type { Note, Task, CalendarEvent } from '../../src/core/models';
import type { RenderItemData } from '../../src/hooks/useProductivityScreen';

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

export default function ProductivityScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const openCreateTask = params.openCreateTask;
  const openCreateNote = params.openCreateNote;

  const {
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
    handleRefresh,
    pendingTasksCount,
    taskPriorityCounts,
    generateTodayPlan,
    deleteNote,
    deleteTask,
    toggleTask,
    fetchNotes,
    fetchTasks,
  } = useProductivityScreen();

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
  }, [openCreateTask, params, pathname, router, setShowCreateTask]);

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
  }, [openCreateNote, params, pathname, router, setShowCreateNote]);

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

      <ProductivityTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        taskPriority={taskPriority}
        setTaskPriority={setTaskPriority}
        taskPriorityCounts={taskPriorityCounts}
      />

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
          <ProductivityTodayPlan
            activeTab={activeTab}
            todayPlan={todayPlan}
            onClose={() => setTodayPlan(null)}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={T.primary.DEFAULT} />
            </View>
          ) : (
            <ProductivityEmptyState
              activeTab={activeTab}
              searchQuery={searchQuery}
              onShowCreateNote={() => setShowCreateNote(true)}
              onShowCreateTask={() => setShowCreateTask(true)}
            />
          )
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
  loadingContainer: {
    paddingVertical: S.massive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
