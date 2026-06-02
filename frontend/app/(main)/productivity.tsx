import React, { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../src/components/AppText';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { NoteCard } from '../../src/components/productivity/NoteCard';
import { TaskCard } from '../../src/components/productivity/TaskCard';
import {
  RenderItemData,
  useProductivityViewModel,
} from '../../src/components/productivity/useProductivityViewModel';
import { ProductivityHeader } from '../../src/components/productivity/ProductivityHeader';
import { ProductivityEmptyState } from '../../src/components/productivity/ProductivityEmptyState';
import { T, S, R } from '../../src/components/productivity/productivityStyles';
import { CalendarEvent, Note, Task } from '../../src/core/models';

export default function ProductivityScreen() {
  const vm = useProductivityViewModel();

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => {
      if (item.type === 'note') {
        const note = item.item as Note;
        return (
          <NoteCard note={note} onDelete={() => vm.confirmDelete(() => vm.deleteNote(note.id))} />
        );
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
    },
    [vm]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProductivityHeader
        t={vm.t}
        pendingTasksCount={vm.pendingTasksCount}
        searchQuery={vm.searchQuery}
        onSearchChange={vm.setSearchQuery}
        onGeneratePlan={vm.generateTodayPlan}
        onShowCreateNote={() => vm.setShowCreateNote(true)}
        onShowCreateTask={() => vm.setShowCreateTask(true)}
      />

      <View style={styles.tabsContainer}>
        {(['today', 'all', 'notes', 'tasks'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => vm.setActiveTab(tab)}
            style={({ pressed }) => [
              styles.tabButton,
              vm.activeTab === tab && styles.tabButtonActive,
              pressed && vm.activeTab !== tab && { opacity: 0.6 },
            ]}
          >
            <AppText style={[styles.tabText, vm.activeTab === tab && styles.tabTextActive]}>
              {tab === 'today'
                ? vm.t('productivity.today')
                : tab === 'all'
                  ? vm.t('productivity.all') || 'All'
                  : tab === 'notes'
                    ? vm.t('productivity.notes') || 'Notes'
                    : vm.t('productivity.tasks') || 'Tasks'}
            </AppText>
          </Pressable>
        ))}
      </View>

      {(vm.activeTab === 'tasks' || vm.activeTab === 'today') && (
        <View style={styles.priorityContainer}>
          {(
            [
              {
                key: 'all',
                label: vm.t('productivity.priority.all', { count: vm.taskPriorityCounts.all }),
              },
              {
                key: 'overdue',
                label: vm.t('productivity.priority.overdue', {
                  count: vm.taskPriorityCounts.overdue,
                }),
              },
              {
                key: 'today',
                label: vm.t('productivity.priority.today', { count: vm.taskPriorityCounts.today }),
              },
              {
                key: 'upcoming',
                label: vm.t('productivity.priority.upcoming', {
                  count: vm.taskPriorityCounts.upcoming,
                }),
              },
              {
                key: 'no_due',
                label: vm.t('productivity.priority.no_due', {
                  count: vm.taskPriorityCounts.no_due,
                }),
              },
            ] as const
          ).map((option) => (
            <Pressable
              key={option.key}
              onPress={() => vm.setTaskPriority(option.key)}
              style={({ pressed }) => [
                styles.priorityButton,
                {
                  borderColor: vm.taskPriority === option.key ? T.primary.DEFAULT : T.border.light,
                  backgroundColor:
                    vm.taskPriority === option.key ? T.primary.surfaceLight : T.surface.light,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AppText
                variant="caption"
                style={{
                  color:
                    vm.taskPriority === option.key ? T.primary.DEFAULT : T.onSurface.mutedLight,
                  fontWeight: '700',
                }}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}

      <FlatList
        data={vm.dataToRender}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={vm.isLoading && vm.dataToRender.length > 0}
            onRefresh={vm.handleRefresh}
            tintColor={T.primary.DEFAULT}
          />
        }
        renderItem={renderItem}
        ListHeaderComponent={
          vm.activeTab === 'today' && vm.todayPlan ? (
            <View style={styles.todayPlanContainer}>
              <View style={styles.todayPlanHeader}>
                <AppText style={styles.todayPlanTitle}>Today plan</AppText>
                <Pressable onPress={() => vm.setTodayPlan(null)}>
                  <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
                </Pressable>
              </View>
              <AppText style={styles.todayPlanText}>{vm.todayPlan}</AppText>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <ProductivityEmptyState
            activeTab={vm.activeTab}
            searchQuery={vm.searchQuery}
            t={vm.t}
            onShowCreateNote={() => vm.setShowCreateNote(true)}
            onShowCreateTask={() => vm.setShowCreateTask(true)}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: S.xl,
    marginBottom: S.sm,
  },
  priorityButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  todayPlanText: {
    color: T.onSurface.mutedLight,
    marginTop: 8,
    lineHeight: 20,
  },
});
