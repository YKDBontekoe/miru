import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../src/components/AppText';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { NoteCard } from '../../src/components/productivity/NoteCard';
import { TaskCard } from '../../src/components/productivity/TaskCard';
import { EventCard } from '../../src/components/productivity/EventCard';
import { ProductivityEmptyState } from '../../src/components/productivity/ProductivityEmptyState';
import { theme } from '../../src/core/theme';
import { CalendarEvent, Note, Task } from '../../src/core/models';
import { RenderItemData, useProductivityViewModel } from '../../src/hooks/useProductivityViewModel';
import { useTheme } from '../../src/hooks/useTheme';

const S = theme.spacing;
const R = theme.borderRadius;

export default function ProductivityScreen() {
  const { C } = useTheme();

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
    dataToRender,
    handleRefresh,
    confirmDelete,
    pendingTasksCount,
    taskPriorityCounts,
    generateTodayPlan,
    deleteNote,
    deleteTask,
    toggleTask,
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: C.bg,
        },
        headerContainer: {
          paddingHorizontal: S.xl,
          paddingTop: S.md,
          paddingBottom: S.lg,
          backgroundColor: C.surface,
          ...theme.elevation.sm,
          zIndex: 10,
        },
        headerRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: S.lg,
        },
        headerTitle: {
          color: C.text,
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: -0.5,
        },
        headerSubtitle: {
          color: C.muted,
          fontSize: 14,
          marginTop: S.xs,
        },
        headerActions: {
          flexDirection: 'row',
          gap: S.sm,
        },
        iconButton: {
          width: 40,
          height: 40,
          borderRadius: R.full,
          backgroundColor: C.primarySurface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.bg,
          borderRadius: R.lg,
          paddingHorizontal: S.md,
          height: 44,
          borderWidth: 1,
          borderColor: C.border,
        },
        searchIcon: {
          marginRight: S.sm,
        },
        searchInput: {
          flex: 1,
          color: C.text,
          fontSize: 16,
          height: '100%',
        },
        tabsContainer: {
          flexDirection: 'row',
          backgroundColor: C.surfaceHigh,
          borderRadius: R.xl,
          padding: S.xs,
          marginHorizontal: S.xl,
          marginTop: S.lg,
          marginBottom: S.md,
          borderWidth: 1,
          borderColor: C.border,
        },
        tabButton: {
          flex: 1,
          paddingVertical: S.sm,
          alignItems: 'center',
          borderRadius: R.lg,
          backgroundColor: theme.colors.transparent,
        },
        tabButtonActive: {
          backgroundColor: C.surface,
          ...theme.elevation.sm,
        },
        tabText: {
          fontSize: 14,
          fontWeight: '500',
          color: C.muted,
        },
        tabTextActive: {
          fontWeight: '700',
          color: C.text,
        },
        listContent: {
          paddingHorizontal: S.xl,
          paddingBottom: 100,
          paddingTop: S.sm,
        },
        todayPlanContainer: {
          borderRadius: R.xl,
          backgroundColor: C.primarySurface,
          borderWidth: 1,
          borderColor: C.border,
          padding: S.lg,
          marginBottom: S.md,
        },
        todayPlanHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        todayPlanTitle: {
          color: C.text,
          fontWeight: '700',
          fontSize: 15,
        },
        todayPlanText: {
          color: C.muted,
          marginTop: 8,
          lineHeight: 20,
        },
        priorityPill: {
          borderRadius: 12,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 6,
          marginRight: 8,
          marginBottom: 8,
        },
      }),
    [C]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <View>
            <AppText variant="h1" style={styles.headerTitle}>
              {t('productivity.title') || 'Workspace'}
            </AppText>
            <AppText style={styles.headerSubtitle}>
              {pendingTasksCount === 0
                ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
                : t('productivity.header.subtitle.pending', { count: pendingTasksCount }) ||
                  `You have ${pendingTasksCount} tasks pending.`}
            </AppText>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={generateTodayPlan}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="sparkles" size={20} color={C.primary} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateNote(true)}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="document-text" size={20} color={C.primary} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateTask(true)}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="checkbox" size={20} color={C.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={C.muted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('productivity.search') || 'Search notes & tasks...'}
            placeholderTextColor={C.faint}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

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
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: S.xl,
            marginBottom: S.sm,
          }}
        >
          {(
            [
              {
                key: 'all',
                label: t('productivity.priority.all', { count: taskPriorityCounts.all }),
              },
              {
                key: 'overdue',
                label: t('productivity.priority.overdue', { count: taskPriorityCounts.overdue }),
              },
              {
                key: 'today',
                label: t('productivity.priority.today', { count: taskPriorityCounts.today }),
              },
              {
                key: 'upcoming',
                label: t('productivity.priority.upcoming', { count: taskPriorityCounts.upcoming }),
              },
              {
                key: 'no_due',
                label: t('productivity.priority.no_due', { count: taskPriorityCounts.no_due }),
              },
            ] as const
          ).map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setTaskPriority(option.key)}
              style={({ pressed }) => [
                styles.priorityPill,
                {
                  borderColor: taskPriority === option.key ? C.primary : C.border,
                  backgroundColor: taskPriority === option.key ? C.primarySurface : C.surface,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AppText
                variant="caption"
                style={{
                  color: taskPriority === option.key ? C.primary : C.muted,
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
        data={dataToRender}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && dataToRender.length > 0}
            onRefresh={handleRefresh}
            tintColor={C.primary}
          />
        }
        renderItem={renderItem}
        ListHeaderComponent={
          activeTab === 'today' && todayPlan ? (
            <View style={styles.todayPlanContainer}>
              <View style={styles.todayPlanHeader}>
                <AppText style={styles.todayPlanTitle}>Today plan</AppText>
                <Pressable onPress={() => setTodayPlan(null)}>
                  <Ionicons name="close" size={16} color={C.muted} />
                </Pressable>
              </View>
              <AppText style={styles.todayPlanText}>{todayPlan}</AppText>
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
