import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { CreateNoteModal } from '@/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '@/components/productivity/CreateTaskModal';
import { NoteCard } from '@/components/productivity/NoteCard';
import { TaskCard } from '@/components/productivity/TaskCard';
import { ProductivityHeader } from '@/components/productivity/ProductivityHeader';
import { ProductivityTabs } from '@/components/productivity/ProductivityTabs';
import { TaskPriorityFilters } from '@/components/productivity/TaskPriorityFilters';
import { ProductivityEmptyState } from '@/components/productivity/ProductivityEmptyState';
import { theme } from '@/core/theme';
import { CalendarEvent, Note, Task } from '@/core/models';
import { RenderItemData, useProductivityViewModel } from '@/hooks/viewmodels/useProductivityViewModel';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { Pressable } from 'react-native';

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
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
  transparent: 'transparent',
};
const S = theme.spacing;
const R = theme.borderRadius;

const renderItem = ({ item, extraData }: { item: RenderItemData, extraData: any }) => {
  const vm = extraData;
  if (item.type === 'note') {
    const note = item.item as Note;
    return <NoteCard note={note} onDelete={() => vm.confirmDelete(() => vm.deleteNote(note.id))} />;
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
            {new Intl.DateTimeFormat(vm.i18n.language, {
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
      onToggle={() => vm.toggleTask(task.id)}
      onDelete={() => vm.confirmDelete(() => vm.deleteTask(task.id))}
    />
  );
};

export default function ProductivityScreen() {
  const vm = useProductivityViewModel();

  const handleRenderItem = useCallback(
    ({ item }: { item: RenderItemData }) => renderItem({ item, extraData: vm }),
    [vm]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProductivityHeader
        pendingTasksCount={vm.pendingTasksCount}
        searchQuery={vm.searchQuery}
        setSearchQuery={vm.setSearchQuery}
        generateTodayPlan={vm.generateTodayPlan}
        setShowCreateNote={vm.setShowCreateNote}
        setShowCreateTask={vm.setShowCreateTask}
      />

      <ProductivityTabs activeTab={vm.activeTab} setActiveTab={vm.setActiveTab} />

      <TaskPriorityFilters
        activeTab={vm.activeTab}
        taskPriority={vm.taskPriority}
        setTaskPriority={vm.setTaskPriority}
        taskPriorityCounts={vm.taskPriorityCounts}
      />

      <FlatList
        data={vm.dataToRender}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        extraData={vm}
        refreshControl={
          <RefreshControl
            refreshing={vm.isLoading && vm.dataToRender.length > 0}
            onRefresh={vm.handleRefresh}
            tintColor={T.primary.DEFAULT}
          />
        }
        renderItem={handleRenderItem}
        ListHeaderComponent={
          vm.activeTab === 'today' && vm.todayPlan ? (
            <View style={styles.todayPlanContainer}>
              <View style={styles.todayPlanHeader}>
                <AppText style={styles.todayPlanTitle}>Today plan</AppText>
                <Pressable onPress={() => vm.setTodayPlan(null)}>
                  <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
                </Pressable>
              </View>
              <AppText style={styles.todayPlanBody}>{vm.todayPlan}</AppText>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <ProductivityEmptyState
            activeTab={vm.activeTab}
            searchQuery={vm.searchQuery}
            setShowCreateNote={vm.setShowCreateNote}
            setShowCreateTask={vm.setShowCreateTask}
          />
        }
      />

      <CreateNoteModal
        visible={vm.showCreateNote}
        onClose={() => vm.setShowCreateNote(false)}
        onCreated={vm.fetchNotes}
      />
      <CreateTaskModal
        visible={vm.showCreateTask}
        onClose={() => vm.setShowCreateTask(false)}
        onCreated={vm.fetchTasks}
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
  todayPlanContainer: {
    borderRadius: R.xl,
    backgroundColor: T.primary.surfaceLight,
    borderWidth: 1,
    borderColor: T.border.light,
    padding: S.lg,
    marginBottom: S.md,
  },
  todayPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayPlanTitle: {
    color: T.onSurface.light,
    fontWeight: '700',
    fontSize: 15,
  },
  todayPlanBody: {
    color: T.onSurface.mutedLight,
    marginTop: 8,
    lineHeight: 20,
  },
});
