import React from 'react';
import { View, Pressable, Platform, PressableStateCallbackType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import type { Tab } from './ProductivityTabs';

const T = {
  white: '#FFFFFF',
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
  },
};

interface Props {
  activeTab: Tab;
  searchQuery: string;
  onShowCreateNote: () => void;
  onShowCreateTask: () => void;
}

export const ProductivityEmptyState = React.memo(({
  activeTab,
  searchQuery,
  onShowCreateNote,
  onShowCreateTask,
}: Props) => {
  const { t } = useTranslation();

  return (
    <View className="items-center py-20">
      <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
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
          color={T.primary.DEFAULT}
        />
      </View>
      <AppText variant="h3" className="mb-2 text-center text-text">
        {searchQuery
          ? t('productivity.no_matches') || 'No matches found'
          : activeTab === 'notes'
            ? t('productivity.no_notes') || 'No Notes'
            : activeTab === 'tasks'
              ? t('productivity.no_tasks') || 'No Tasks'
              : activeTab === 'today'
                ? t('productivity.nothing_urgent_today') || 'Nothing urgent today'
                : t('productivity.workspace_clear') || 'Your workspace is clear'}
      </AppText>
      <AppText className="text-center mb-6 text-muted px-12 leading-relaxed">
        {searchQuery
          ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
          : activeTab === 'today'
            ? t('productivity.today_empty_detail') || 'Enjoy the rest of your day!'
            : t('productivity.capture_thoughts') ||
              'Capture your thoughts and track what needs to get done.'}
      </AppText>

      {!searchQuery && (
        <View className="flex-row gap-4">
          {(activeTab === 'all' || activeTab === 'notes') && (
            <Pressable
              onPress={onShowCreateNote}
              style={({ pressed }: PressableStateCallbackType) => [
                pressed ? { opacity: 0.8 } : undefined
              ]}
              className="flex-row items-center bg-primary rounded-xl py-3 px-6 shadow-md"
            >
              <Ionicons name="add" size={18} color={T.white} style={{ marginEnd: 6 }} />
              <AppText className="text-white font-bold text-[15px]">
                {t('productivity.newNote') || 'New Note'}
              </AppText>
            </Pressable>
          )}
          {(activeTab === 'all' || activeTab === 'tasks' || activeTab === 'today') && (
            <Pressable
              onPress={onShowCreateTask}
              style={({ pressed }: PressableStateCallbackType) => [
                (activeTab === 'all' || activeTab === 'today') && Platform.OS !== 'web'
                  ? { shadowOpacity: 0, elevation: 0 }
                  : undefined,
                pressed ? { opacity: 0.8 } : undefined
              ]}
              className={`flex-row items-center rounded-xl py-3 px-6 shadow-md ${
                activeTab === 'all' || activeTab === 'today' ? 'bg-primary/10 shadow-none' : 'bg-primary'
              }`}
            >
              <Ionicons
                name="add"
                size={18}
                color={
                  activeTab === 'all' || activeTab === 'today' ? T.primary.DEFAULT : T.white
                }
                style={{ marginEnd: 6 }}
              />
              <AppText
                className={`font-bold text-[15px] ${
                  activeTab === 'all' || activeTab === 'today'
                    ? 'text-primary'
                    : 'text-white'
                }`}
              >
                {t('productivity.new_task') || 'New Task'}
              </AppText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
});

ProductivityEmptyState.displayName = 'ProductivityEmptyState';
