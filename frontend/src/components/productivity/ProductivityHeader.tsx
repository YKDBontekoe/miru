import React, { useEffect, useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  surface: { light: DESIGN_TOKENS.colors.surface, highLight: DESIGN_TOKENS.colors.surfaceSoft },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
  transparent: 'transparent',
};

type Tab = 'today' | 'all' | 'notes' | 'tasks';
type TaskPriority = 'all' | 'overdue' | 'today' | 'upcoming' | 'no_due';

interface Props {
  pendingTasksCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  generateTodayPlan: () => void;
  taskPriority: TaskPriority;
  setTaskPriority: (priority: TaskPriority) => void;
  taskPriorityCounts: Record<TaskPriority, number>;
  setShowCreateNote: (show: boolean) => void;
  setShowCreateTask: (show: boolean) => void;
}

export const ProductivityHeader = ({
  pendingTasksCount,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  generateTodayPlan,
  taskPriority,
  setTaskPriority,
  taskPriorityCounts,
  setShowCreateNote,
  setShowCreateTask,
}: Props) => {
  const { t } = useTranslation();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: t('productivity.today') || 'Today' },
    { key: 'all', label: t('productivity.all') || 'All' },
    { key: 'notes', label: t('productivity.notes') || 'Notes' },
    { key: 'tasks', label: t('productivity.tasks') || 'Tasks' },
  ];

  const priorityOptions: { key: TaskPriority; label: string }[] = [
    { key: 'all', label: t('productivity.priority.all', { count: taskPriorityCounts.all }) || `All (${taskPriorityCounts.all})` },
    { key: 'overdue', label: t('productivity.priority.overdue', { count: taskPriorityCounts.overdue }) || `Overdue (${taskPriorityCounts.overdue})` },
    { key: 'today', label: t('productivity.priority.today', { count: taskPriorityCounts.today }) || `Today (${taskPriorityCounts.today})` },
    { key: 'upcoming', label: t('productivity.priority.upcoming', { count: taskPriorityCounts.upcoming }) || `Upcoming (${taskPriorityCounts.upcoming})` },
    { key: 'no_due', label: t('productivity.priority.no_due', { count: taskPriorityCounts.no_due }) || `Someday (${taskPriorityCounts.no_due})` },
  ];

  return (
    <>
      <View
        className="px-6 pt-4 pb-6 z-10 shadow-sm"
        style={{ backgroundColor: T.surface.light }}
      >
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <AppText variant="h1" className="text-[28px] font-extrabold tracking-tight" style={{ color: T.onSurface.light }}>
              {t('productivity.title') || 'Workspace'}
            </AppText>
            <AppText className="text-sm mt-1" style={{ color: T.onSurface.mutedLight }}>
              {pendingTasksCount === 0
                ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
                : t('productivity.header.subtitle.pending', { count: pendingTasksCount }) ||
                  `You have ${pendingTasksCount} tasks pending.`}
            </AppText>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={generateTodayPlan}
              accessibilityRole="button"
              accessibilityLabel="Generate today's plan"
              className="w-10 h-10 rounded-full items-center justify-center"
              style={({ pressed }) => [
                { backgroundColor: T.primary.surfaceLight },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateNote(true)}
              accessibilityRole="button"
              accessibilityLabel="Create note"
              className="w-10 h-10 rounded-full items-center justify-center"
              style={({ pressed }) => [
                { backgroundColor: T.primary.surfaceLight },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={() => setShowCreateTask(true)}
              accessibilityRole="button"
              accessibilityLabel="Create task"
              className="w-10 h-10 rounded-full items-center justify-center"
              style={({ pressed }) => [
                { backgroundColor: T.primary.surfaceLight },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="checkbox" size={20} color={T.primary.DEFAULT} />
            </Pressable>
          </View>
        </View>

        <View
          className="flex-row items-center rounded-lg px-4 h-11 border"
          style={{ backgroundColor: T.background.light, borderColor: T.border.light }}
        >
          <Ionicons
            name="search"
            size={18}
            color={T.onSurface.mutedLight}
            className="mr-2"
          />
          <TextInput
            className="flex-1 text-base h-full"
            style={{ color: T.onSurface.light }}
            placeholder={t('productivity.search') || 'Search notes, tasks, events...'}
            placeholderTextColor={T.onSurface.mutedLight}
            value={localQuery}
            onChangeText={setLocalQuery}
          />
          {localQuery.length > 0 && (
            <Pressable
              onPress={() => setLocalQuery('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={20} color={T.onSurface.mutedLight} />
            </Pressable>
          )}
        </View>
      </View>

      <View
        className="flex-row rounded-xl p-1 mx-6 mt-6 mb-4 border"
        style={{ backgroundColor: T.surface.highLight, borderColor: T.border.light }}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: activeTab === tab.key }}
            className={`flex-1 py-2 items-center rounded-lg ${
              activeTab === tab.key ? 'shadow-sm' : ''
            }`}
            style={[
              { backgroundColor: T.transparent },
              activeTab === tab.key && { backgroundColor: T.surface.light },
            ]}
          >
            <AppText
              className="text-sm"
              style={[
                { fontWeight: '500', color: T.onSurface.mutedLight },
                activeTab === tab.key && { fontWeight: '700', color: T.onSurface.light },
              ]}
            >
              {tab.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {(activeTab === 'tasks' || activeTab === 'today') && (
        <View className="flex-row px-6 mb-2 flex-wrap">
          {priorityOptions.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setTaskPriority(option.key)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: taskPriority === option.key }}
              className="px-3 py-1.5 rounded-full border mr-2 mb-2"
              style={({ pressed }) => [
                {
                  backgroundColor:
                    taskPriority === option.key ? T.primary.surfaceLight : T.surface.light,
                  borderColor: taskPriority === option.key ? T.primary.DEFAULT : T.border.light,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AppText
                variant="caption"
                className="font-bold"
                style={{
                  color: taskPriority === option.key ? T.primary.DEFAULT : T.onSurface.mutedLight,
                }}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
};
