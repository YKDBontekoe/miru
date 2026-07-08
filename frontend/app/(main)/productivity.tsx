import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { NoteCard } from '../../src/components/productivity/NoteCard';
import { TaskCard } from '../../src/components/productivity/TaskCard';
import { ProductivityEmptyState } from '../../src/components/productivity/ProductivityEmptyState';
import { EventCard } from '../../src/components/productivity/EventCard';
import { theme } from '../../src/core/theme';
import { CalendarEvent, Note, Task } from '../../src/core/models';
import { useProductivityStore } from '../../src/store/useProductivityStore';
import {
  useProductivityData,
  Tab,
  TaskPriority,
  RenderItemData,
} from '../../src/hooks/useProductivityData';
import { DESIGN_TOKENS } from '@/core/design/tokens';

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
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const openCreateTask = params.openCreateTask;
  const openCreateNote = params.openCreateNote;
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [todayPlan, setTodayPlan] = useState<string | null>(null);

  const {
    fetchNotes,
    fetchTasks,
    fetchEvents,
    isLoading,
    deleteNote,
    deleteTask,
    toggleTask,
  } = useProductivityStore();

  useEffect(() => {
    const controller = new AbortController();
    fetchNotes(controller.signal);
    fetchTasks(controller.signal);
    fetchEvents(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchEvents, fetchNotes, fetchTasks]);

  useEffect(() => {
    if (openCreateTask === '1' || openCreateTask === 'true') {
      setShowCreateTask(true);
      const nextParams = Object.fromEntries(
        Object.entries(params).filter(
          ([key, value]) => key !== 'openCreateTask' && typeof value === 'string'
        )
      );
      router.replace({ pathname, params: nextParams });
    }
  }, [openCreateTask, params, pathname, router]);

  useEffect(() => {
    if (openCreateNote === '1' || openCreateNote === 'true') {
      setShowCreateNote(true);
      const nextParams = Object.fromEntries(
        Object.entries(params).filter(
          ([key, value]) => key !== 'openCreateNote' && typeof value === 'string'
        )
      );
      router.replace({ pathname, params: nextParams });
    }
  }, [openCreateNote, params, pathname, router]);

  const handleRefresh = useCallback(() => {
    fetchNotes();
    fetchTasks();
    fetchEvents();
  }, [fetchEvents, fetchNotes, fetchTasks]);

  const confirmDelete = useCallback(
    (action: () => Promise<void>) =>
      Alert.alert(
        t('productivity.delete') || 'Delete',
        t('productivity.are_you_sure') || 'Are you sure?',
        [
          { text: t('settings.actions.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('settings.actions.delete') || 'Delete',
            style: 'destructive',
            onPress: () => action(),
          },
        ]
      ),
    [t]
  );

  const { pendingTasksCount, taskPriorityCounts, dataToRender, generateTodayPlan } =
    useProductivityData(activeTab, taskPriority, searchQuery, setTodayPlan, setActiveTab);

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
              <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateNote(true)}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateTask(true)}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="checkbox" size={20} color={T.primary.DEFAULT} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={T.onSurface.mutedLight}
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('productivity.search') || 'Search notes & tasks...'}
            placeholderTextColor={T.onSurface.disabledLight}
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
                  borderColor: taskPriority === option.key ? T.primary.DEFAULT : T.border.light,
                  backgroundColor:
                    taskPriority === option.key ? T.primary.surfaceLight : T.surface.light,
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
                  color: taskPriority === option.key ? T.primary.DEFAULT : T.onSurface.mutedLight,
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
  headerContainer: {
    paddingHorizontal: S.xl,
    paddingTop: S.md,
    paddingBottom: S.lg,
    backgroundColor: T.surface.light,
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
    color: T.onSurface.light,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: T.onSurface.mutedLight,
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
    backgroundColor: T.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.background.light,
    borderRadius: R.lg,
    paddingHorizontal: S.md,
    height: 44,
    borderWidth: 1,
    borderColor: T.border.light,
  },
  searchIcon: {
    marginRight: S.sm,
  },
  searchInput: {
    flex: 1,
    color: T.onSurface.light,
    fontSize: 16,
    height: '100%',
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
    ...theme.elevation.sm,
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
  listContent: {
    paddingHorizontal: S.xl,
    paddingBottom: 100,
    paddingTop: S.sm,
  },
});
