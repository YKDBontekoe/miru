import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TextInput,
  Alert,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { useProductivityStore } from '../../src/store/useProductivityStore';
import { theme } from '../../src/core/theme';

import { NoteCard } from '../../src/components/productivity/NoteCard';
import { TaskCard } from '../../src/components/productivity/TaskCard';
import { CreateNoteModal } from '../../src/components/productivity/CreateNoteModal';
import { CreateTaskModal } from '../../src/components/productivity/CreateTaskModal';
import { Note, Task } from '../../src/core/models';

const T = theme.colors;
const S = theme.spacing;
const R = theme.borderRadius;

type RenderItemData = {
  date?: number;
  type: 'note' | 'task';
  item: Note | Task;
  id: string;
};

export default function ProductivityScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'tasks'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { notes, tasks, fetchNotes, fetchTasks, isLoading, deleteNote, deleteTask, toggleTask } =
    useProductivityStore();

  const [showCreateNote, setShowCreateNote] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchTasks();
  }, [fetchNotes, fetchTasks]);

  const handleRefresh = useCallback(() => {
    fetchNotes();
    fetchTasks();
  }, [fetchNotes, fetchTasks]);

  const confirmDelete = useCallback(
    (action: () => Promise<void>) =>
      Alert.alert(
        t('productivity.delete') || 'Delete',
        t('productivity.are_you_sure') || 'Are you sure?',
        [
          {
            text: t('settings.actions.cancel') || 'Cancel',
            style: 'cancel',
          },
          {
            text: t('settings.actions.delete') || 'Delete',
            style: 'destructive',
            onPress: () => action(),
          },
        ]
      ),
    [t]
  );

  // Derived state for filtering
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const lowerQ = searchQuery.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(lowerQ) || n.content.toLowerCase().includes(lowerQ)
    );
  }, [notes, searchQuery]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const lowerQ = searchQuery.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(lowerQ));
  }, [tasks, searchQuery]);

  const pendingTasksCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);

  // Combine items for 'all' tab
  const mixedData = useMemo(() => {
    const arr: RenderItemData[] = [];
    filteredNotes.forEach((n) =>
      arr.push({
        type: 'note',
        item: n,
        id: `note-${n.id}`,
        date: new Date(n.created_at).getTime(),
      })
    );
    filteredTasks.forEach((t) =>
      arr.push({
        type: 'task',
        item: t,
        id: `task-${t.id}`,
        date: new Date(t.created_at).getTime(),
      })
    );
    return arr.sort((a, b) => (b.date || 0) - (a.date || 0)); // Sort newest first
  }, [filteredNotes, filteredTasks]);

  const renderItem = useCallback(
    ({ item }: { item: RenderItemData }) => {
      if (item.type === 'note') {
        const note = item.item as Note;
        return <NoteCard note={note} onDelete={() => confirmDelete(() => deleteNote(note.id))} />;
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

  const dataToRender: RenderItemData[] =
    activeTab === 'all'
      ? mixedData
      : activeTab === 'notes'
        ? filteredNotes.map((n) => ({ type: 'note' as const, item: n, id: n.id }))
        : filteredTasks.map((t) => ({ type: 'task' as const, item: t, id: t.id }));

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header Area ──────────────────────────────────────────────────────── */}
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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={T.onSurface.mutedLight}
            className="me-2"
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

      {/* ── Tab Switcher ─────────────────────────────────────────────────────── */}
      <View style={styles.tabsContainer}>
        {(['all', 'notes', 'tasks'] as const).map((tab) => (
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
              {tab === 'all'
                ? t('productivity.all') || 'All'
                : tab === 'notes'
                  ? t('productivity.notes') || 'Notes'
                  : t('productivity.tasks') || 'Tasks'}
            </AppText>
          </Pressable>
        ))}
      </View>

      {/* ── Content List ─────────────────────────────────────────────────────── */}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={
                  activeTab === 'notes'
                    ? 'document-text'
                    : activeTab === 'tasks'
                      ? 'checkbox'
                      : 'planet'
                }
                size={42}
                color={T.primary.DEFAULT}
              />
            </View>
            <AppText variant="h3" style={styles.emptyTitle}>
              {searchQuery
                ? t('productivity.no_matches') || 'No matches found'
                : activeTab === 'notes'
                  ? t('productivity.no_notes') || 'No Notes'
                  : activeTab === 'tasks'
                    ? t('productivity.no_tasks') || 'No Tasks'
                    : t('productivity.workspace_clear') || 'Your workspace is clear'}
            </AppText>
            <AppText style={styles.emptySubtitle}>
              {searchQuery
                ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
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
                    <Ionicons name="add" size={18} color={T.white} style={{ marginEnd: 6 }} />
                    <AppText style={styles.emptyButtonText}>
                      {t('productivity.newNote') || 'New Note'}
                    </AppText>
                  </Pressable>
                )}
                {(activeTab === 'all' || activeTab === 'tasks') && (
                  <Pressable
                    onPress={() => setShowCreateTask(true)}
                    style={({ pressed }) => [
                      styles.emptyButton,
                      activeTab === 'all' && styles.emptyButtonSecondary,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={activeTab === 'all' ? T.primary.DEFAULT : T.white}
                      style={{ marginEnd: 6 }}
                    />
                    <AppText
                      style={
                        activeTab === 'all'
                          ? styles.emptyButtonTextSecondary
                          : styles.emptyButtonText
                      }
                    >
                      New Task
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
    paddingBottom: S.xxxl,
    paddingTop: S.sm,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: S.massive,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.lg,
  },
  emptyTitle: {
    marginBottom: S.sm,
    textAlign: 'center',
    color: T.onSurface.light,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: S.xl,
    color: T.onSurface.mutedLight,
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
    backgroundColor: T.primary.DEFAULT,
    borderRadius: R.xl,
    paddingVertical: S.md,
    paddingHorizontal: S.xl,
    ...theme.elevation.md,
  },
  emptyButtonSecondary: {
    backgroundColor: T.primary.surfaceLight,
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
    color: T.white,
    fontWeight: '700',
    fontSize: 15,
  },
  emptyButtonTextSecondary: {
    color: T.primary.DEFAULT,
    fontWeight: '700',
    fontSize: 15,
  },
});
