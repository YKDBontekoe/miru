import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';

const S = theme.spacing;
const R = theme.borderRadius;

interface ProductivityEmptyStateProps {
  searchQuery: string;
  activeTab: 'today' | 'all' | 'notes' | 'tasks';
  setShowCreateNote: (show: boolean) => void;
  setShowCreateTask: (show: boolean) => void;
}

export const ProductivityEmptyState = React.memo(({
  searchQuery,
  activeTab,
  setShowCreateNote,
  setShowCreateTask,
}: ProductivityEmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <View className="items-center py-20">
      <View className="w-20 h-20 rounded-full bg-primary-soft items-center justify-center mb-6">
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
          color={DESIGN_TOKENS.colors.primary}
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
      <AppText className="text-center mb-8 text-muted px-12 leading-[22px]">
        {searchQuery
          ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
          : activeTab === 'today'
            ? t('productivity.today_empty_detail') || 'Enjoy your day!'
            : t('productivity.capture_thoughts') ||
              'Capture your thoughts and track what needs to get done.'}
      </AppText>

      {!searchQuery && (
        <View className="flex-row gap-4">
          {(activeTab === 'all' || activeTab === 'notes') && (
            <Pressable
              onPress={() => setShowCreateNote(true)}
              className={`flex-row items-center bg-primary rounded-xl py-4 px-6 shadow-md active:opacity-80`}
            >
              <Ionicons name="add" size={18} color={'#FFFFFF'} className="mr-1.5" />
              <AppText className="text-white font-bold text-[15px]">
                {t('productivity.newNote') || 'New Note'}
              </AppText>
            </Pressable>
          )}
          {(activeTab === 'all' || activeTab === 'tasks' || activeTab === 'today') && (
            <Pressable
              onPress={() => setShowCreateTask(true)}
              className={`flex-row items-center rounded-xl py-4 px-6 ${activeTab === 'all' || activeTab === 'today' ? 'bg-primary-soft shadow-none' : 'bg-primary shadow-md'} active:opacity-80`}
            >
              <Ionicons
                name="add"
                size={18}
                color={
                  activeTab === 'all' || activeTab === 'today' ? DESIGN_TOKENS.colors.primary : '#FFFFFF'
                }
                className="mr-1.5"
              />
              <AppText
                className={activeTab === 'all' || activeTab === 'today' ? "text-primary font-bold text-[15px]" : "text-white font-bold text-[15px]"}
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
