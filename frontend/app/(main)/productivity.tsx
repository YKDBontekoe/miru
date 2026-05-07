import React, { useMemo } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../src/components/AppText';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { NoteCard } from '../../src/components/productivity/NoteCard';
import { TaskCard } from '../../src/components/productivity/TaskCard';
import { theme } from '../../src/core/theme';
import { CalendarEvent, Note, Task } from '../../src/core/models';
import { useTheme } from '../../src/hooks/useTheme';
import { RenderItemData, useProductivityViewModel } from '../../src/hooks/viewmodels/useProductivityViewModel';

const S = theme.spacing;
const R = theme.borderRadius;

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
    pendingTasksCount,
    taskPriorityCounts,
    dataToRender,
    generateTodayPlan,
    fetchNotes,
    fetchTasks,
    deleteNote,
    deleteTask,
    toggleTask,
  } = useProductivityViewModel();

  const { C } = useTheme();

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
          backgroundColor: 'transparent',
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
        eventCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.surface,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: R.xl,
          padding: S.lg,
          marginBottom: S.md,
          ...theme.elevation.sm,
        },
        eventIcon: {
          width: 32,
          height: 32,
          borderRadius: R.lg,
          backgroundColor: C.primarySurface,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: S.md,
        },
        eventBody: {
          flex: 1,
        },
        eventTitle: {
          color: C.text,
          fontWeight: '700',
          fontSize: 15,
        },
        eventMeta: {
          color: C.muted,
          marginTop: 2,
          fontSize: 13,
        },
        emptyContainer: {
          alignItems: 'center',
          paddingVertical: S.massive,
        },
        emptyIconCircle: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: C.primarySurface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: S.lg,
        },
        emptyTitle: {
          marginBottom: S.sm,
          textAlign: 'center',
          color: C.text,
        },
        emptySubtitle: {
          textAlign: 'center',
          marginBottom: S.xl,
          color: C.muted,
          paddingHorizontal: S.xxxl,
          lineHeight: 22,
        },
        emptyActions: {
          flexDirection: 'row',
          gap: S.md,
        },
        emptyButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.primary,
          borderRadius: R.xl,
          paddingVertical: S.md,
          paddingHorizontal: S.xl,
          ...theme.elevation.md,
        },
        emptyButtonSecondary: {
          backgroundColor: C.primarySurface,
          ...Platform.select({
            ios: {
              shadowOpacity: 0,
              elevation: 0,
            },
            android: {
              elevation: 0,
            },
            default: {
              elevation: 0,
            },
          }),
        },
        emptyButtonText: {
          color: '#FFFFFF',
          fontWeight: '700',
          fontSize: 15,
        },
        emptyButtonTextSecondary: {
          color: C.primary,
          fontWeight: '700',
          fontSize: 15,
        },
      }),
    [C]
  );

  const renderItem = React.useCallback(
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
              <Ionicons name="calendar-outline" size={16} color={C.primary} />
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
    [confirmDelete, deleteNote, deleteTask, i18n.language, toggleTask, C.primary, styles]
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
                {
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: taskPriority === option.key ? C.primary : C.border,
                  backgroundColor: taskPriority === option.key ? C.primarySurface : C.surface,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  marginRight: 8,
                  marginBottom: 8,
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
            <View
              style={{
                borderRadius: R.xl,
                backgroundColor: C.primarySurface,
                borderWidth: 1,
                borderColor: C.border,
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
                <AppText style={{ color: C.text, fontWeight: '700', fontSize: 15 }}>
                  Today plan
                </AppText>
                <Pressable onPress={() => setTodayPlan(null)}>
                  <Ionicons name="close" size={16} color={C.muted} />
                </Pressable>
              </View>
              <AppText style={{ color: C.muted, marginTop: 8, lineHeight: 20 }}>
                {todayPlan}
              </AppText>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={
                  activeTab === 'notes'
                    ? 'document-text'
                    : activeTab === 'tasks'
                      ? 'checkbox'
                      : activeTab === 'today'
                        ? 'sunny-outline'
                        : 'planet'
                }
                size={42}
                color={C.primary}
              />
            </View>
            <AppText variant="h3" style={styles.emptyTitle}>
              {searchQuery
                ? t('productivity.no_matches') || 'No matches found'
                : activeTab === 'notes'
                  ? t('productivity.no_notes') || 'No Notes'
                  : activeTab === 'tasks'
                    ? t('productivity.no_tasks') || 'No Tasks'
                    : activeTab === 'today'
                      ? t('productivity.nothing_urgent_today')
                      : t('productivity.workspace_clear') || 'Your workspace is clear'}
            </AppText>
            <AppText style={styles.emptySubtitle}>
              {searchQuery
                ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
                : activeTab === 'today'
                  ? t('productivity.today_empty_detail')
                  : t('productivity.capture_thoughts') ||
                    'Capture your thoughts and track what needs to get done.'}
            </AppText>

            {!searchQuery && (
              <View style={styles.emptyActions}>
                {(activeTab === 'all' || activeTab === 'notes') && (
                  <Pressable
                    onPress={() => setShowCreateNote(true)}
                    style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginEnd: 6 }} />
                    <AppText style={styles.emptyButtonText}>
                      {t('productivity.newNote') || 'New Note'}
                    </AppText>
                  </Pressable>
                )}
                {(activeTab === 'all' || activeTab === 'tasks' || activeTab === 'today') && (
                  <Pressable
                    onPress={() => setShowCreateTask(true)}
                    style={({ pressed }) => [
                      styles.emptyButton,
                      (activeTab === 'all' || activeTab === 'today') && styles.emptyButtonSecondary,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={activeTab === 'all' || activeTab === 'today' ? C.primary : '#FFFFFF'}
                      style={{ marginEnd: 6 }}
                    />
                    <AppText
                      style={
                        activeTab === 'all' || activeTab === 'today'
                          ? styles.emptyButtonTextSecondary
                          : styles.emptyButtonText
                      }
                    >
                      {t('productivity.new_task')}
                    </AppText>
                  </Pressable>
                )}
              </View>
            )}
          </View>
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
