import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../src/components/AppText';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { NoteCard } from '../../src/components/productivity/NoteCard';
import { TaskCard } from '../../src/components/productivity/TaskCard';
import { ProductivityHeader } from '../../src/components/productivity/ProductivityHeader';
import { ProductivityTabs } from '../../src/components/productivity/ProductivityTabs';
import { ProductivityEmptyState } from '../../src/components/productivity/ProductivityEmptyState';
import { TodayPlanBanner } from '../../src/components/productivity/TodayPlanBanner';
import { theme } from '../../src/core/theme';
import { CalendarEvent, Note, Task } from '../../src/core/models';
import {
  RenderItemData,
  useProductivityViewModel,
} from '../../src/hooks/viewmodels/useProductivityViewModel';
import { useTheme } from '../../src/hooks/useTheme';

export default function ProductivityScreen() {
  const { state, actions, i18n } = useProductivityViewModel();
  const { C } = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => {
      if (item.type === 'note') {
        const note = item.item as Note;
        return (
          <NoteCard
            note={note}
            onDelete={() => actions.confirmDelete(() => actions.deleteNote(note.id))}
          />
        );
      }
      if (item.type === 'event') {
        const event = item.item as CalendarEvent;
        return (
          <View style={[styles.eventCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={[styles.eventIcon, { backgroundColor: C.primarySurface }]}>
              <Ionicons name="calendar-outline" size={16} color={C.primary} />
            </View>
            <View style={styles.eventBody}>
              <AppText style={[styles.eventTitle, { color: C.text }]}>{event.title}</AppText>
              <AppText style={[styles.eventMeta, { color: C.subtext }]}>
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
          onToggle={() => actions.toggleTask(task.id)}
          onDelete={() => actions.confirmDelete(() => actions.deleteTask(task.id))}
        />
      );
    },
    [actions, i18n.language, C]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <ProductivityHeader
        pendingTasksCount={state.pendingTasksCount}
        searchQuery={state.searchQuery}
        setSearchQuery={actions.setSearchQuery}
        onGeneratePlan={actions.generateTodayPlan}
        onCreateNote={() => actions.setShowCreateNote(true)}
        onCreateTask={() => actions.setShowCreateTask(true)}
      />

      <ProductivityTabs
        activeTab={state.activeTab}
        setActiveTab={actions.setActiveTab}
        taskPriority={state.taskPriority}
        setTaskPriority={actions.setTaskPriority}
        taskPriorityCounts={state.taskPriorityCounts}
      />

      <FlatList
        data={state.dataToRender}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.isLoading && state.dataToRender.length > 0}
            onRefresh={actions.handleRefresh}
            tintColor={C.primary}
          />
        }
        renderItem={renderItem}
        ListHeaderComponent={
          state.activeTab === 'today' && state.todayPlan ? (
            <TodayPlanBanner
              todayPlan={state.todayPlan}
              onDismiss={() => actions.setTodayPlan(null)}
            />
          ) : null
        }
        ListEmptyComponent={
          <ProductivityEmptyState
            activeTab={state.activeTab}
            searchQuery={state.searchQuery}
            onCreateNote={() => actions.setShowCreateNote(true)}
            onCreateTask={() => actions.setShowCreateTask(true)}
          />
        }
      />

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
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 100,
    paddingTop: theme.spacing.sm,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.elevation.sm,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    fontWeight: '700',
    fontSize: 15,
  },
  eventMeta: {
    marginTop: 2,
    fontSize: 13,
  },
});
