import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';

import { useTheme } from '@/hooks/useTheme';
import { Tab } from '@/hooks/viewmodels/useProductivityViewModel';

interface ProductivityEmptyStateProps {
  activeTab: Tab;
  searchQuery: string;
  onCreateNote: () => void;
  onCreateTask: () => void;
}

export const ProductivityEmptyState = React.memo(function ProductivityEmptyState({
  activeTab,
  searchQuery,
  onCreateNote,
  onCreateTask,
}: ProductivityEmptyStateProps) {
  const { t } = useTranslation();
  const { C } = useTheme();

  return (
    <View className="items-center py-20">
      <View className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: C.primarySurface }}>
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
      <AppText variant="h3" className="mb-2 text-center" style={{ color: C.text }}>
        {searchQuery
          ? t('productivity.no_matches', 'No matches found')
          : activeTab === 'notes'
            ? t('productivity.no_notes', 'No Notes')
            : activeTab === 'tasks'
              ? t('productivity.no_tasks', 'No Tasks')
              : activeTab === 'today'
                ? t('productivity.nothing_urgent_today', 'Nothing urgent today')
                : t('productivity.workspace_clear', 'Your workspace is clear')}
      </AppText>
      <AppText className="text-center mb-8 px-10 leading-6" style={{ color: C.subtext }}>
        {searchQuery
          ? t('productivity.try_adjust_search', 'Try adjusting your search terms.')
          : activeTab === 'today'
            ? t('productivity.today_empty_detail', 'Take a moment to plan your day.')
            : t('productivity.capture_thoughts', 'Capture your thoughts and track what needs to get done.')}
      </AppText>

      {!searchQuery && (
        <View className="flex-row gap-4">
          {(activeTab === 'all' || activeTab === 'notes') && (
            <Pressable
              onPress={onCreateNote}
              className="flex-row items-center rounded-xl py-4 px-6 shadow-md"
              style={({ pressed }) => [
                { backgroundColor: C.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" className="mr-1.5" />
              <AppText className="text-white font-bold text-[15px]">
                {t('productivity.newNote', 'New Note')}
              </AppText>
            </Pressable>
          )}
          {(activeTab === 'all' || activeTab === 'tasks' || activeTab === 'today') && (
            <Pressable
              onPress={onCreateTask}
              className={`flex-row items-center rounded-xl py-4 px-6 ${activeTab === 'all' || activeTab === 'today' ? (Platform.OS === 'ios' ? 'shadow-none' : 'elevation-0') : 'shadow-md'}`}
              style={({ pressed }) => [
                (activeTab === 'all' || activeTab === 'today') ? { backgroundColor: C.primarySurface } : { backgroundColor: C.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons
                name="add"
                size={18}
                color={activeTab === 'all' || activeTab === 'today' ? C.primary : '#FFFFFF'}
                className="mr-1.5"
              />
              <AppText
                className="font-bold text-[15px]"
                style={
                  activeTab === 'all' || activeTab === 'today'
                    ? { color: C.primary }
                    : { color: '#FFFFFF' }
                }
              >
                {t('productivity.new_task', 'New Task')}
              </AppText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
});
