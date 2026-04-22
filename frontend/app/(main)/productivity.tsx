import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../src/components/AppText';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { NoteCard } from '../../src/components/productivity/NoteCard';
import { TaskCard } from '../../src/components/productivity/TaskCard';
import { ProductivityHeader } from '../../src/components/productivity/ProductivityHeader';
import { ProductivityEmptyState } from '../../src/components/productivity/ProductivityEmptyState';
import { theme } from '../../src/core/theme';
import { CalendarEvent, Note, Task } from '../../src/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import {
  useProductivityViewModel,
  RenderItemData,
} from '../../src/features/productivity/useProductivityViewModel';

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
  const {
    i18n,
    dataToRender,
    isLoading,
    handleRefresh,
    activeTab,
    setActiveTab,
    taskPriority,
    setTaskPriority,
    taskPriorityCounts,
    searchQuery,
    setSearchQuery,
    showCreateNote,
    setShowCreateNote,
    showCreateTask,
    setShowCreateTask,
    todayPlan,
    setTodayPlan,
    generateTodayPlan,
    confirmDelete,
    deleteNote,
    deleteTask,
    toggleTask,
    pendingTasksCount,
    fetchNotes,
    fetchTasks,
  } = useProductivityViewModel();

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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        generateTodayPlan={generateTodayPlan}
        taskPriority={taskPriority}
        setTaskPriority={setTaskPriority}
        taskPriorityCounts={taskPriorityCounts}
        setShowCreateNote={setShowCreateNote}
        setShowCreateTask={setShowCreateTask}
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
          activeTab === 'today' && todayPlan ? (
            <View
              style={{
                borderRadius: R.xl,
                backgroundColor: T.primary.surfaceLight,
                borderWidth: 1,
                borderColor: T.border.light,
                padding: S.lg,
                marginBottom: S.md,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <AppText style={{ color: T.onSurface.light, fontWeight: '700', fontSize: 15 }}>
                  Today plan
                </AppText>
                <Pressable onPress={() => setTodayPlan(null)}>
                  <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
                </Pressable>
              </View>
              <AppText style={{ color: T.onSurface.mutedLight, marginTop: 8, lineHeight: 20 }}>
                {todayPlan}
              </AppText>
            </View>
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
});
