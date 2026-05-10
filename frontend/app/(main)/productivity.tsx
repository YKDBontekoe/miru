import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { NoteCard } from '../../src/components/productivity/NoteCard';
import { TaskCard } from '../../src/components/productivity/TaskCard';
import { theme } from '../../src/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import {
  RenderItemData,
  useProductivityViewModel,
} from '../../src/hooks/viewmodels/useProductivityViewModel';
import {
  ProductivityEventCard,
  ProductivityFilters,
  ProductivityHeader,
  ProductivityListEmpty,
  ProductivityTabs,
  ProductivityTodayPlan,
} from '../../src/components/productivity/ProductivityWidgets';
import { CalendarEvent, Note, Task } from '../../src/core/models';

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  primary: { DEFAULT: DESIGN_TOKENS.colors.primary },
};

const S = theme.spacing;

export default function ProductivityScreen() {
  const {
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
    isLoading,
    handleRefresh,
    confirmDelete,
    deleteNote,
    deleteTask,
    toggleTask,
    fetchNotes,
    fetchTasks,
    pendingTasksCount,
    taskPriorityCounts,
    dataToRender,
    generateTodayPlan,
  } = useProductivityViewModel();

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => {
      if (item.type === 'note') {
        const note = item.item as Note;
        return <NoteCard note={note} onDelete={() => confirmDelete(() => deleteNote(note.id))} />;
      }
      if (item.type === 'event') {
        const event = item.item as CalendarEvent;
        return <ProductivityEventCard event={event} i18nLanguage={i18n.language} />;
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
        t={t}
        pendingTasksCount={pendingTasksCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onGeneratePlan={generateTodayPlan}
        onShowCreateNote={() => setShowCreateNote(true)}
        onShowCreateTask={() => setShowCreateTask(true)}
      />

      <ProductivityTabs t={t} activeTab={activeTab} setActiveTab={setActiveTab} />

      <ProductivityFilters
        t={t}
        activeTab={activeTab}
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
          activeTab === 'today' ? (
            <View style={styles.listHeaderPadding}>
              <ProductivityTodayPlan todayPlan={todayPlan} setTodayPlan={setTodayPlan} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <ProductivityListEmpty
            t={t}
            searchQuery={searchQuery}
            activeTab={activeTab}
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
    paddingVertical: S.lg,
    paddingBottom: 100,
  },
  listHeaderPadding: {
    paddingHorizontal: S.xl,
  },
});
