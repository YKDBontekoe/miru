import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateNoteModal } from '@/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '@/components/productivity/CreateTaskModal';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import {
  useProductivityViewModel,
  RenderItemData,
} from '@/features/productivity/useProductivityViewModel';
import { ProductivityHeader } from '@/features/productivity/ProductivityHeader';
import { ProductivityTabs } from '@/features/productivity/ProductivityTabs';
import { TaskPriorityFilters } from '@/features/productivity/TaskPriorityFilters';
import { ProductivityEmptyState } from '@/features/productivity/ProductivityEmptyState';
import { TodayPlanCard } from '@/features/productivity/TodayPlanCard';
import { ProductivityRenderItem } from '@/features/productivity/ProductivityRenderItem';
import { AppText } from '@/components/AppText';

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
    error,
    dataToRender,
    pendingTasksCount,
    taskPriorityCounts,
    handleRefresh,
    generateTodayPlan,
    confirmDelete,
    deleteNote,
    deleteTask,
    toggleTask,
    fetchNotes,
    fetchTasks,
  } = useProductivityViewModel();

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => (
      <ProductivityRenderItem
        item={item}
        language={i18n.language}
        confirmDelete={confirmDelete}
        deleteNote={deleteNote}
        deleteTask={deleteTask}
        toggleTask={toggleTask}
      />
    ),
    [confirmDelete, deleteNote, deleteTask, i18n.language, toggleTask]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProductivityHeader
        t={t}
        pendingTasksCount={pendingTasksCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onGenerateTodayPlan={generateTodayPlan}
        onShowCreateNote={() => setShowCreateNote(true)}
        onShowCreateTask={() => setShowCreateTask(true)}
      />

      <ProductivityTabs t={t} activeTab={activeTab} setActiveTab={setActiveTab} />

      {(activeTab === 'tasks' || activeTab === 'today') && (
        <TaskPriorityFilters
          t={t}
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
          <TodayPlanCard
            t={t}
            activeTab={activeTab}
            todayPlan={todayPlan}
            setTodayPlan={setTodayPlan}
          />
        }
        ListEmptyComponent={
          error ? (
            <View style={{ padding: S.xl, alignItems: 'center', marginTop: S.xl }}>
              <AppText
                style={{
                  color: DESIGN_TOKENS.colors.destructive,
                  textAlign: 'center',
                  marginBottom: S.md,
                }}
              >
                {error}
              </AppText>
              <Pressable
                onPress={handleRefresh}
                style={({ pressed }) => [
                  {
                    backgroundColor: DESIGN_TOKENS.colors.primary,
                    paddingHorizontal: S.lg,
                    paddingVertical: S.sm,
                    borderRadius: theme.borderRadius.md,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <AppText style={{ color: '#FFF', fontWeight: '600' }}>
                  {t('common.retry') || 'Retry'}
                </AppText>
              </Pressable>
            </View>
          ) : (
            <ProductivityEmptyState
              t={t}
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
    padding: S.xl,
    paddingBottom: 100,
  },
});
