import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { ProductivityHeader } from '../../src/components/productivity/ProductivityHeader';
import { ProductivitySearch } from '../../src/components/productivity/ProductivitySearch';
import { ProductivityTabs } from '../../src/components/productivity/ProductivityTabs';
import { ProductivityTaskFilters } from '../../src/components/productivity/ProductivityTaskFilters';
import { ProductivityEmptyState } from '../../src/components/productivity/ProductivityEmptyState';
import { ProductivityTodayPlan } from '../../src/components/productivity/ProductivityTodayPlan';
import { ProductivityListItem } from '../../src/components/productivity/ProductivityListItem';
import { useProductivityViewModel, RenderItemData } from '../../src/hooks/useProductivityViewModel';
import { theme } from '../../src/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
  },
};
const S = theme.spacing;

export default function ProductivityScreen() {
  const {
    t,
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
    deleteNote,
    deleteTask,
    toggleTask,
    fetchNotes,
    fetchTasks,
    handleRefresh,
    confirmDelete,
    pendingTasksCount,
    taskPriorityCounts,
    dataToRender,
    generateTodayPlan,
  } = useProductivityViewModel();

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityListItem
        item={item}
        deleteNote={deleteNote}
        toggleTask={toggleTask}
        deleteTask={deleteTask}
        confirmDelete={confirmDelete}
      />
    ),
    [deleteNote, toggleTask, deleteTask, confirmDelete]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProductivityHeader
        title={t('productivity.title') || 'Workspace'}
        subtitle={
          pendingTasksCount === 0
            ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
            : t('productivity.header.subtitle.pending', { count: pendingTasksCount }) ||
              `You have ${pendingTasksCount} tasks pending.`
        }
        onGeneratePlan={generateTodayPlan}
        onAddNote={() => setShowCreateNote(true)}
        onAddTask={() => setShowCreateTask(true)}
      />

      <ProductivitySearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <ProductivityTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {(activeTab === 'tasks' || activeTab === 'today') && (
        <ProductivityTaskFilters
          taskPriority={taskPriority}
          setTaskPriority={setTaskPriority}
          taskPriorityCounts={taskPriorityCounts}
        />
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
          <ProductivityTodayPlan
            activeTab={activeTab}
            todayPlan={todayPlan}
            setTodayPlan={setTodayPlan}
          />
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
  listContent: {
    paddingHorizontal: S.xl,
    paddingBottom: 100,
    paddingTop: S.sm,
  },
});
