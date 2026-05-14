import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View, Pressable } from 'react-native';
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

interface RenderItemDeps {
  confirmDelete: (action: () => Promise<void>) => void;
  deleteNote: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  language: string;
}

const renderItem = ({ item, extraData }: { item: RenderItemData, extraData: RenderItemDeps }) => {
  const deps = extraData;
  if (item.type === 'note') {
    const note = item.item as Note;
    return <NoteCard note={note} onDelete={() => deps.confirmDelete(() => deps.deleteNote(note.id))} />;
  }
  if (item.type === 'event') {
    const event = item.item as CalendarEvent;
    return (
      <View className="flex-row items-center bg-surface border border-border rounded-xl p-4 mb-3 shadow-sm">
        <View className="w-8 h-8 rounded-lg bg-primarySoft items-center justify-center mr-4">
          <Ionicons name="calendar-outline" size={16} className="text-primary" />
        </View>
        <View className="flex-1">
          <AppText className="text-text font-bold text-[15px]">{event.title}</AppText>
          <AppText className="text-muted mt-0.5 text-[13px]">
            {new Intl.DateTimeFormat(deps.language, {
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
      onToggle={() => deps.toggleTask(task.id)}
      onDelete={() => deps.confirmDelete(() => deps.deleteTask(task.id))}
    />
  );
};

export default function ProductivityScreen() {
  const vm = useProductivityViewModel();

  const handleRenderItem = useCallback(
    ({ item }: { item: RenderItemData }) => renderItem({
      item,
      extraData: {
        confirmDelete: vm.confirmDelete,
        deleteNote: vm.deleteNote,
        deleteTask: vm.deleteTask,
        toggleTask: vm.toggleTask,
        language: vm.i18n.language,
      }
    }),
    [vm.confirmDelete, vm.deleteNote, vm.deleteTask, vm.toggleTask, vm.i18n.language]
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
        extraData={{
          confirmDelete: vm.confirmDelete,
          deleteNote: vm.deleteNote,
          deleteTask: vm.deleteTask,
          toggleTask: vm.toggleTask,
          language: vm.i18n.language,
        }}
        refreshControl={
          <RefreshControl
            refreshing={vm.isLoading}
            onRefresh={vm.handleRefresh}
            tintColor={T.primary.DEFAULT}
          />
        }
        renderItem={handleRenderItem}
        ListHeaderComponent={
          vm.activeTab === 'today' && vm.todayPlan ? (
            <View className="rounded-xl bg-primarySoft border border-border p-4 mb-3">
              <View className="flex-row justify-between items-center">
                <AppText className="text-text font-bold text-[15px]">Today plan</AppText>
                <Pressable
                  onPress={() => vm.setTodayPlan(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss today plan"
                >
                  <Ionicons name="close" size={16} className="text-muted" />
                </Pressable>
              </View>
              <AppText className="text-muted mt-2 leading-5">{vm.todayPlan}</AppText>
            </View>
          ) : null
        }
        ListEmptyComponent={
          vm.isLoading ? (
            <View style={{ paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={T.primary.DEFAULT} />
            </View>
          ) : (
            <ProductivityEmptyState
              activeTab={vm.activeTab}
              searchQuery={vm.searchQuery}
              setShowCreateNote={vm.setShowCreateNote}
              setShowCreateTask={vm.setShowCreateTask}
            />
          )
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
});
