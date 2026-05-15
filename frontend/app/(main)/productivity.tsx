import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
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
import { ProductivityEmptyState } from '../../src/components/productivity/ProductivityEmptyState';
import { CalendarEvent, Note, Task } from '../../src/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { RenderItemData, useProductivityViewModel } from '@/hooks/viewmodels/useProductivityViewModel';

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

const renderItem = ({
  item,
  extraData,
}: {
  item: RenderItemData;
  extraData: {
    confirmDelete: (action: () => Promise<void>) => void;
    deleteNote: (id: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    language: string;
  };
}) => {
  if (item.type === 'note') {
    const note = item.item as Note;
    return (
      <NoteCard
        note={note}
        onDelete={() => extraData.confirmDelete(() => extraData.deleteNote(note.id))}
      />
    );
  }
  if (item.type === 'event') {
    const event = item.item as CalendarEvent;
    return (
      <View className="flex-row items-center bg-surface-light border border-border-light rounded-xl p-lg mb-md shadow-sm">
        <View className="w-8 h-8 rounded-lg bg-primary-surfaceLight items-center justify-center mr-md">
          <Ionicons name="calendar-outline" size={16} color={T.primary.DEFAULT} />
        </View>
        <View className="flex-1">
          <AppText className="text-onSurface-light font-bold text-[15px]">{event.title}</AppText>
          <AppText className="text-onSurface-mutedLight mt-0.5 text-[13px]">
            {new Intl.DateTimeFormat(extraData.language, {
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
      onToggle={() => extraData.toggleTask(task.id)}
      onDelete={() => extraData.confirmDelete(() => extraData.deleteTask(task.id))}
    />
  );
};

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
    dataToRender,
    isLoading,
    pendingTasksCount,
    taskPriorityCounts,
    confirmDelete,
    generateTodayPlan,
    handleRefresh,
    fetchNotes,
    fetchTasks,
    deleteNote,
    deleteTask,
    toggleTask,
  } = useProductivityViewModel();

  const renderItemWrapper = useCallback(
    ({ item }: { item: RenderItemData }) =>
      renderItem({
        item,
        extraData: {
          confirmDelete,
          deleteNote,
          deleteTask,
          toggleTask,
          language: i18n.language,
        },
      }),
    [confirmDelete, deleteNote, deleteTask, i18n.language, toggleTask]
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light">
      <View className="px-xl pt-md pb-lg bg-surface-light shadow-sm z-10">
        <View className="flex-row justify-between items-center mb-lg">
          <View>
            <AppText variant="h1" className="text-onSurface-light text-[28px] font-extrabold tracking-tight">
              {t('productivity.title') || 'Workspace'}
            </AppText>
            <AppText className="text-onSurface-mutedLight text-[14px] mt-xs">
              {pendingTasksCount === 0
                ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
                : t('productivity.header.subtitle.pending', { count: pendingTasksCount }) ||
                  `You have ${pendingTasksCount} tasks pending.`}
            </AppText>
          </View>

          <View className="flex-row gap-sm">
            <Pressable
              onPress={generateTodayPlan}
              className="w-10 h-10 rounded-full bg-primary-surfaceLight items-center justify-center active:opacity-70"
            >
              <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateNote(true)}
              className="w-10 h-10 rounded-full bg-primary-surfaceLight items-center justify-center active:opacity-70"
            >
              <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateTask(true)}
              className="w-10 h-10 rounded-full bg-primary-surfaceLight items-center justify-center active:opacity-70"
            >
              <Ionicons name="checkbox" size={20} color={T.primary.DEFAULT} />
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center bg-background-light rounded-lg px-md h-11 border border-border-light">
          <Ionicons
            name="search"
            size={18}
            color={T.onSurface.mutedLight}
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('productivity.search') || 'Search notes & tasks...'}
            placeholderTextColor={T.onSurface.disabledLight}
            className="flex-1 text-onSurface-light text-[16px] h-full"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <View className="flex-row bg-surface-highLight rounded-xl p-xs mx-xl mt-lg mb-md border border-border-light">
        {(['today', 'all', 'notes', 'tasks'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-sm items-center rounded-lg active:opacity-60 ${activeTab === tab ? 'bg-surface-light shadow-sm' : 'bg-transparent'}`}
          >
            <AppText className={`text-[14px] ${activeTab === tab ? 'font-bold text-onSurface-light' : 'font-medium text-onSurface-mutedLight'}`}>
              {tab === 'today'
                ? t('productivity.today') || 'Today'
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
        <View className="flex-row flex-wrap mx-xl mb-sm">
          {(
            [
              { key: 'all', label: t('productivity.priority.all', { count: taskPriorityCounts.all }) },
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
              className={`rounded-xl border px-2.5 py-1.5 mr-2 mb-2 active:opacity-80 ${taskPriority === option.key ? 'border-primary bg-primary-surfaceLight' : 'border-border-light bg-surface-light'}`}
            >
              <AppText
                variant="caption"
                className={`font-bold ${taskPriority === option.key ? 'text-primary' : 'text-onSurface-mutedLight'}`}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}

      <FlatList
        data={dataToRender}
        extraData={{ confirmDelete, deleteNote, deleteTask, toggleTask, language: i18n.language }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && dataToRender.length > 0}
            onRefresh={handleRefresh}
            tintColor={T.primary.DEFAULT}
          />
        }
        renderItem={renderItemWrapper}
        ListHeaderComponent={
          activeTab === 'today' && todayPlan ? (
            <View className="rounded-xl bg-primary-surfaceLight border border-border-light p-lg mb-md">
              <View className="flex-row justify-between items-center">
                <AppText className="text-onSurface-light font-bold text-[15px]">Today plan</AppText>
                <Pressable onPress={() => setTodayPlan(null)}>
                  <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
                </Pressable>
              </View>
              <AppText className="text-onSurface-mutedLight mt-2 leading-relaxed">{todayPlan}</AppText>
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
