import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { useProductivityStore } from '../../src/store/useProductivityStore';
import { Note, Task } from '../../src/core/models';
import { theme } from '../../src/core/theme';

const T = theme.colors;
const S = theme.spacing;
const R = theme.borderRadius;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(hour: number, t: (k: string) => string): string {
  if (hour < 12) return t('home.greeting.morning');
  if (hour < 17) return t('home.greeting.afternoon');
  return t('home.greeting.evening');
}

// ─── Create Note Modal ────────────────────────────────────────────────────────

function CreateNoteModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const { createNote } = useProductivityStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('productivity.title_required'), t('productivity.enter_title'));
      return;
    }
    setIsSaving(true);
    try {
      await createNote(title.trim(), content.trim());
      setTitle('');
      setContent('');
      onCreated();
      onClose();
    } catch {
      Alert.alert(t('productivity.error'), t('productivity.failed_create_note'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <AppText variant="h2" style={styles.modalTitle}>
              {t('productivity.new_note') || 'New Note'}
            </AppText>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={26} color={T.onSurface.mutedLight} />
            </Pressable>
          </View>

          <AppText variant="caption" style={styles.inputLabel}>
            {t('productivity.title_label') || 'Title'}
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('productivity.note_title_placeholder')}
            placeholderTextColor={T.onSurface.disabledLight}
            style={styles.textInput}
          />

          <AppText variant="caption" style={styles.inputLabel}>
            {t('productivity.content_label') || 'Content'}
          </AppText>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={t('productivity.note_content_placeholder')}
            placeholderTextColor={T.onSurface.disabledLight}
            multiline
            style={[styles.textInput, styles.textArea]}
          />

          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.primaryButton,
              isSaving && styles.primaryButtonDisabled,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color={T.white} />
            ) : (
              <AppText style={styles.primaryButtonText}>
                {t('productivity.save_note') || 'Save Note'}
              </AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Create Task Modal ────────────────────────────────────────────────────────

function CreateTaskModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const { createTask } = useProductivityStore();
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('productivity.title_required'), t('productivity.enter_task_title'));
      return;
    }
    setIsSaving(true);
    try {
      await createTask(title.trim());
      setTitle('');
      onCreated();
      onClose();
    } catch {
      Alert.alert(t('productivity.error'), t('productivity.failed_create_task'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <AppText variant="h2" style={styles.modalTitle}>
              {t('productivity.new_task') || 'New Task'}
            </AppText>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={26} color={T.onSurface.mutedLight} />
            </Pressable>
          </View>

          <AppText variant="caption" style={styles.inputLabel}>
            {t('productivity.task_label') || 'Task'}
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('productivity.task_content_placeholder')}
            placeholderTextColor={T.onSurface.disabledLight}
            style={styles.textInput}
            autoFocus
          />

          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.primaryButton,
              isSaving && styles.primaryButtonDisabled,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color={T.white} />
            ) : (
              <AppText style={styles.primaryButtonText}>
                {t('productivity.add_task') || 'Add Task'}
              </AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────

const NoteCard = React.memo(({ note, onDelete }: { note: Note; onDelete: () => void }) => {
  const { i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(note.created_at));

  return (
    <View style={styles.noteCard}>
      <View style={styles.noteCardHeader}>
        <AppText style={styles.noteCardTitle} numberOfLines={1}>
          {note.title}
        </AppText>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [styles.deleteIcon, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="trash-outline" size={18} color={T.onSurface.mutedLight} />
        </Pressable>
      </View>
      {note.content ? (
        <AppText variant="bodySm" style={styles.noteCardContent} numberOfLines={3}>
          {note.content}
        </AppText>
      ) : null}
      <View style={styles.noteCardFooter}>
        <Ionicons name="time-outline" size={12} color={T.onSurface.disabledLight} style={{ marginRight: 4 }} />
        <AppText variant="caption" style={styles.noteCardDate}>
          {date}
        </AppText>
      </View>
    </View>
  );
});

// ─── Task Card ────────────────────────────────────────────────────────────────

const TaskCard = React.memo(
  ({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) => {
    const { t, i18n } = useTranslation();
    return (
      <View style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
        <Pressable
          onPress={onToggle}
          hitSlop={12}
          style={({ pressed }) => [styles.taskToggle, pressed && { opacity: 0.7 }]}
        >
          <View
            style={[
              styles.taskCheckbox,
              task.completed && styles.taskCheckboxActive,
            ]}
          >
            {task.completed && <Ionicons name="checkmark" size={16} color={T.white} />}
          </View>
        </Pressable>
        <View style={styles.taskBody}>
          <AppText
            style={[
              styles.taskTitle,
              task.completed && styles.taskTitleCompleted,
            ]}
          >
            {task.title}
          </AppText>
          {task.due_date && (
            <AppText variant="caption" style={styles.taskDueDate}>
              {t('productivity.due_date', {
                date: new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(
                  new Date(task.due_date)
                ),
              })}
            </AppText>
          )}
        </View>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [styles.deleteIcon, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="trash-outline" size={18} color={T.onSurface.mutedLight} />
        </Pressable>
      </View>
    );
  }
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

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

  const confirmDelete = useCallback((action: () => Promise<void>) =>
    Alert.alert(t('productivity.delete') || 'Delete', t('productivity.are_you_sure') || 'Are you sure?', [
      { text: t('settings.actions.cancel') || 'Cancel', style: 'cancel' },
      { text: t('settings.actions.delete') || 'Delete', style: 'destructive', onPress: () => action() },
    ]), [t]);

  // Derived state for filtering
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const lowerQ = searchQuery.toLowerCase();
    return notes.filter(n => n.title.toLowerCase().includes(lowerQ) || n.content.toLowerCase().includes(lowerQ));
  }, [notes, searchQuery]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const lowerQ = searchQuery.toLowerCase();
    return tasks.filter(t => t.title.toLowerCase().includes(lowerQ));
  }, [tasks, searchQuery]);

  const pendingTasksCount = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);

  // Combine items for 'all' tab
  const mixedData = useMemo(() => {
    const arr: Array<{ type: 'note' | 'task', item: any, id: string, date: number }> = [];
    filteredNotes.forEach(n => arr.push({ type: 'note', item: n, id: `note-${n.id}`, date: new Date(n.created_at).getTime() }));
    filteredTasks.forEach(t => arr.push({ type: 'task', item: t, id: `task-${t.id}`, date: new Date(t.created_at).getTime() }));
    return arr.sort((a, b) => b.date - a.date); // Sort newest first
  }, [filteredNotes, filteredTasks]);


  const renderItem = useCallback(({ item }: { item: { type: 'note' | 'task', item: any } }) => {
    if (item.type === 'note') {
      return (
        <NoteCard
          note={item.item as Note}
          onDelete={() => confirmDelete(() => deleteNote(item.item.id))}
        />
      );
    }
    return (
      <TaskCard
        task={item.item as Task}
        onToggle={() => toggleTask(item.item.id)}
        onDelete={() => confirmDelete(() => deleteTask(item.item.id))}
      />
    );
  }, [confirmDelete, deleteNote, deleteTask, toggleTask]);

  const dataToRender = activeTab === 'all'
    ? mixedData
    : activeTab === 'notes'
      ? filteredNotes.map(n => ({ type: 'note' as const, item: n, id: n.id }))
      : filteredTasks.map(t => ({ type: 'task' as const, item: t, id: t.id }));


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
                ? "You're all caught up for today."
                : `You have ${pendingTasksCount} tasks pending.`}
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
          <Ionicons name="search" size={18} color={T.onSurface.mutedLight} style={styles.searchIcon} />
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
              pressed && activeTab !== tab && { opacity: 0.6 }
            ]}
          >
            <AppText
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === 'all'
                ? (t('productivity.all') || 'All')
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
                name={activeTab === 'notes' ? "document-text" : activeTab === 'tasks' ? "checkbox" : "planet"}
                size={42}
                color={T.primary.DEFAULT}
              />
            </View>
            <AppText variant="h3" style={styles.emptyTitle}>
              {searchQuery
                ? 'No matches found'
                : activeTab === 'notes'
                  ? t('productivity.no_notes') || 'No Notes'
                  : activeTab === 'tasks'
                    ? t('productivity.no_tasks') || 'No Tasks'
                    : 'Your workspace is clear'}
            </AppText>
            <AppText style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search terms.'
                : 'Capture your thoughts and track what needs to get done.'}
            </AppText>

            {!searchQuery && (
              <View style={styles.emptyActions}>
                {(activeTab === 'all' || activeTab === 'notes') && (
                  <Pressable
                    onPress={() => setShowCreateNote(true)}
                    style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="add" size={18} color={T.white} style={{ marginEnd: 6 }} />
                    <AppText style={styles.emptyButtonText}>New Note</AppText>
                  </Pressable>
                )}
                {(activeTab === 'all' || activeTab === 'tasks') && (
                  <Pressable
                    onPress={() => setShowCreateTask(true)}
                    style={({ pressed }) => [
                      styles.emptyButton,
                      activeTab === 'all' && styles.emptyButtonSecondary,
                      pressed && { opacity: 0.8 }
                    ]}
                  >
                    <Ionicons name="add" size={18} color={activeTab === 'all' ? T.primary.DEFAULT : T.white} style={{ marginEnd: 6 }} />
                    <AppText style={activeTab === 'all' ? styles.emptyButtonTextSecondary : styles.emptyButtonText}>New Task</AppText>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    elevation: 0,
    shadowOpacity: 0,
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

  // Note Card
  noteCard: {
    backgroundColor: T.surface.light,
    borderRadius: R.xl,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: T.border.light,
    ...Platform.select({
      ios: theme.elevation.sm,
      android: { elevation: 1 },
    }),
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: S.xs,
  },
  noteCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.onSurface.light,
    flex: 1,
    marginRight: S.sm,
  },
  noteCardContent: {
    color: T.onSurface.mutedLight,
    marginTop: S.xs,
    lineHeight: 20,
    marginBottom: S.md,
  },
  noteCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: S.xs,
  },
  noteCardDate: {
    color: T.onSurface.disabledLight,
    fontSize: 11,
    fontWeight: '500',
  },

  // Task Card
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface.light,
    borderRadius: R.xl,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: T.border.light,
    ...Platform.select({
      ios: theme.elevation.sm,
      android: { elevation: 1 },
    }),
  },
  taskCardCompleted: {
    backgroundColor: T.status.successSurfaceLight,
    borderColor: '#D1FAE5', // success 100
  },
  taskToggle: {
    marginRight: S.md,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: R.sm,
    borderWidth: 2,
    borderColor: T.onSurface.disabledLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.transparent,
  },
  taskCheckboxActive: {
    borderColor: T.status.success,
    backgroundColor: T.status.success,
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: T.onSurface.light,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: T.onSurface.mutedLight,
  },
  taskDueDate: {
    color: T.primary.DEFAULT,
    fontWeight: '600',
    marginTop: 4,
    fontSize: 12,
  },
  deleteIcon: {
    padding: S.xs,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(18, 18, 26, 0.4)',
  },
  modalContent: {
    backgroundColor: T.surface.light,
    borderTopLeftRadius: R.xxl,
    borderTopRightRadius: R.xxl,
    padding: S.xxl,
    paddingBottom: Platform.OS === 'ios' ? 40 : S.xxl,
    ...theme.elevation.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.xl,
  },
  modalTitle: {
    color: T.onSurface.light,
  },
  closeButton: {
    padding: S.xs,
  },
  inputLabel: {
    color: T.onSurface.mutedLight,
    marginBottom: S.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: T.surface.highLight,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: T.border.light,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    color: T.onSurface.light,
    fontSize: 16,
    marginBottom: S.xl,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: S.md,
  },
  primaryButton: {
    backgroundColor: T.primary.DEFAULT,
    borderRadius: R.xl,
    paddingVertical: S.lg,
    alignItems: 'center',
    marginTop: S.sm,
    ...theme.elevation.md,
  },
  primaryButtonDisabled: {
    backgroundColor: T.primary.light,
    ...theme.elevation.none,
  },
  primaryButtonText: {
    color: T.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
