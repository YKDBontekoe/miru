import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../src/components/AppText';
import { useProductivityStore } from '../../src/store/useProductivityStore';
import { Note, Task } from '../../src/core/models';

// ─── Light mode palette ───────────────────────────────────────────────────────
const C = {
  bg: '#F8F8FC',
  surface: '#FFFFFF',
  surfaceHigh: '#F0F0F6',
  border: '#E0E0EC',
  text: '#12121A',
  muted: '#6E6E80',
  faint: '#C0C0D0',
  primary: '#2563EB',
  success: '#059669',
  successSurface: '#F0FDF4',
};

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
  const { createNote } = useProductivityStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for your note.');
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
      Alert.alert('Error', 'Failed to create note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <View
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <AppText variant="h2" style={{ color: C.text }}>
              New Note
            </AppText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </TouchableOpacity>
          </View>
          <AppText
            variant="caption"
            style={{
              color: C.muted,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Title
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Note title"
            placeholderTextColor={C.faint}
            style={{
              backgroundColor: C.surfaceHigh,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: C.text,
              fontSize: 16,
              marginBottom: 16,
            }}
          />
          <AppText
            variant="caption"
            style={{
              color: C.muted,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Content
          </AppText>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write your note here..."
            placeholderTextColor={C.faint}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: C.surfaceHigh,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: C.text,
              fontSize: 15,
              minHeight: 100,
              textAlignVertical: 'top',
              marginBottom: 20,
            }}
          />
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? `${C.primary}70` : C.primary,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                Save Note
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  const { createTask } = useProductivityStore();
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a task title.');
      return;
    }
    setIsSaving(true);
    try {
      await createTask(title.trim());
      setTitle('');
      onCreated();
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <View
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <AppText variant="h2" style={{ color: C.text }}>
              New Task
            </AppText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </TouchableOpacity>
          </View>
          <AppText
            variant="caption"
            style={{
              color: C.muted,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Task
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            placeholderTextColor={C.faint}
            style={{
              backgroundColor: C.surfaceHigh,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: C.text,
              fontSize: 16,
              marginBottom: 20,
            }}
          />
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? `${C.primary}70` : C.primary,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                Add Task
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Performance Log: Extracted styles to StyleSheet and memoized components.
const styles = StyleSheet.create({
  noteCardWrapper: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noteCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    flex: 1,
    marginRight: 8,
  },
  noteCardContent: { color: C.muted, marginTop: 6, lineHeight: 18 },
  noteCardDate: { color: C.faint, marginTop: 8, fontSize: 10 },
  taskCardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  taskCardCheckButton: { marginRight: 14 },
  taskCardTitleWrapper: { flex: 1 },
  taskCardTitle: { fontSize: 15, fontWeight: '500' },
  taskCardDate: { color: C.muted, marginTop: 3, fontSize: 11 },
});

// ─── Note Card ────────────────────────────────────────────────────────────────

const NoteCard = React.memo(function NoteCard({
  note,
  onDelete,
}: {
  note: Note;
  onDelete: (id: string) => void;
}) {
  const date = new Date(note.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const handleDelete = useCallback(() => onDelete(note.id), [note.id, onDelete]);
  return (
    <View style={styles.noteCardWrapper}>
      <View style={styles.noteCardHeader}>
        <AppText style={styles.noteCardTitle}>{note.title}</AppText>
        <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={17} color={C.faint} />
        </TouchableOpacity>
      </View>
      {note.content ? (
        <AppText variant="caption" style={styles.noteCardContent} numberOfLines={2}>
          {note.content}
        </AppText>
      ) : null}
      <AppText variant="caption" style={styles.noteCardDate}>
        {date}
      </AppText>
    </View>
  );
});

// ─── Task Card ────────────────────────────────────────────────────────────────

const TaskCard = React.memo(function TaskCard({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const handleToggle = useCallback(() => onToggle(task.id), [task.id, onToggle]);
  const handleDelete = useCallback(() => onDelete(task.id), [task.id, onDelete]);

  return (
    <View
      style={[
        styles.taskCardWrapper,
        {
          backgroundColor: task.completed ? C.successSurface : C.surface,
          borderColor: task.completed ? `${C.success}30` : C.border,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.taskCardCheckButton}
      >
        <Ionicons
          name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={task.completed ? C.success : C.faint}
        />
      </TouchableOpacity>
      <View style={styles.taskCardTitleWrapper}>
        <AppText
          style={[
            styles.taskCardTitle,
            {
              textDecorationLine: task.completed ? 'line-through' : 'none',
              color: task.completed ? C.muted : C.text,
            },
          ]}
        >
          {task.title}
        </AppText>
        {task.due_date && (
          <AppText variant="caption" style={styles.taskCardDate}>
            Due {new Date(task.due_date).toLocaleDateString()}
          </AppText>
        )}
      </View>
      <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={17} color={C.faint} />
      </TouchableOpacity>
    </View>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProductivityScreen() {
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks'>('notes');
  const { notes, tasks, fetchNotes, fetchTasks, isLoading, deleteNote, deleteTask, toggleTask } =
    useProductivityStore();
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    if (activeTab === 'notes') fetchNotes();
    else fetchTasks();
  }, [activeTab, fetchNotes, fetchTasks]);

  const handleRefresh = useCallback(() => {
    if (activeTab === 'notes') fetchNotes();
    else fetchTasks();
  }, [activeTab, fetchNotes, fetchTasks]);

  const confirmDeleteNote = useCallback(
    (id: string) => {
      Alert.alert('Delete', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteNote(id) },
      ]);
    },
    [deleteNote]
  );

  const confirmDeleteTask = useCallback(
    (id: string) => {
      Alert.alert('Delete', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTask(id) },
      ]);
    },
    [deleteTask]
  );

  const renderNoteCard = useCallback(
    ({ item }: { item: Note }) => <NoteCard note={item} onDelete={confirmDeleteNote} />,
    [confirmDeleteNote]
  );

  const renderTaskCard = useCallback(
    ({ item }: { item: Task }) => (
      <TaskCard task={item} onToggle={toggleTask} onDelete={confirmDeleteTask} />
    ),
    [toggleTask, confirmDeleteTask]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <AppText variant="h1" style={{ fontSize: 28, fontWeight: '700', color: C.text }}>
          Productivity
        </AppText>
        <TouchableOpacity
          onPress={() =>
            activeTab === 'notes' ? setShowCreateNote(true) : setShowCreateTask(true)
          }
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: C.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: C.surfaceHigh,
          borderRadius: 12,
          padding: 4,
          marginHorizontal: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        {(['notes', 'tasks'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              borderRadius: 9,
              backgroundColor: activeTab === tab ? C.surface : 'transparent',
            }}
          >
            <AppText
              style={{
                fontSize: 14,
                fontWeight: activeTab === tab ? '700' : '400',
                color: activeTab === tab ? C.text : C.muted,
              }}
            >
              {tab === 'notes' ? 'Notes' : 'Tasks'}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'notes' ? (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={C.primary}
            />
          }
          renderItem={renderNoteCard}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={C.faint}
                style={{ marginBottom: 16 }}
              />
              <AppText variant="h3" style={{ marginBottom: 8, textAlign: 'center', color: C.text }}>
                No notes yet
              </AppText>
              <AppText style={{ textAlign: 'center', marginBottom: 24, color: C.muted }}>
                Capture your thoughts and ideas.
              </AppText>
              <TouchableOpacity
                onPress={() => setShowCreateNote(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: C.primary,
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                }}
              >
                <Ionicons name="add" size={18} color="white" style={{ marginRight: 6 }} />
                <AppText style={{ color: 'white', fontWeight: '700' }}>New Note</AppText>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={C.primary}
            />
          }
          renderItem={renderTaskCard}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons
                name="checkbox-outline"
                size={48}
                color={C.faint}
                style={{ marginBottom: 16 }}
              />
              <AppText variant="h3" style={{ marginBottom: 8, textAlign: 'center', color: C.text }}>
                No tasks yet
              </AppText>
              <AppText style={{ textAlign: 'center', marginBottom: 24, color: C.muted }}>
                Track what needs to get done.
              </AppText>
              <TouchableOpacity
                onPress={() => setShowCreateTask(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: C.primary,
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                }}
              >
                <Ionicons name="add" size={18} color="white" style={{ marginRight: 6 }} />
                <AppText style={{ color: 'white', fontWeight: '700' }}>New Task</AppText>
              </TouchableOpacity>
            </View>
          }
        />
      )}

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
