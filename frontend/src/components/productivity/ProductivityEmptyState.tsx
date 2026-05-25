import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { Tab } from '@/hooks/useProductivityViewModel';

const T = {
  white: '#FFFFFF',
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
};
const S = theme.spacing;
const R = theme.borderRadius;

interface ProductivityEmptyStateProps {
  activeTab: Tab;
  searchQuery: string;
  setShowCreateNote: (show: boolean) => void;
  setShowCreateTask: (show: boolean) => void;
}

/**
 * Empty state component for the Productivity Screen.
 * Adapts its message and actions based on the active tab and search query.
 */
export const ProductivityEmptyState: React.FC<ProductivityEmptyStateProps> = ({
  activeTab,
  searchQuery,
  setShowCreateNote,
  setShowCreateTask,
}) => {
  const { t } = useTranslation();

  return (
    <View className="items-center py-12">
      <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4">
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
      <AppText variant="h3" className="mb-2 text-center text-gray-900">
        {searchQuery
          ? t('productivity.no_matches') ?? 'No matches found'
          : activeTab === 'notes'
            ? t('productivity.no_notes') ?? 'No Notes'
            : activeTab === 'tasks'
              ? t('productivity.no_tasks') ?? 'No Tasks'
              : activeTab === 'today'
                ? t('productivity.nothing_urgent_today') ?? 'Nothing urgent today'
                : t('productivity.workspace_clear') ?? 'Your workspace is clear'}
      </AppText>
      <AppText className="text-center mb-5 text-gray-500 px-8 leading-6">
        {searchQuery
          ? t('productivity.try_adjust_search') ?? 'Try adjusting your search terms.'
          : activeTab === 'today'
            ? t('productivity.today_empty_detail') ?? 'Enjoy the rest of your day, or get ahead on upcoming tasks.'
            : t('productivity.capture_thoughts') ?? 'Capture your thoughts and track what needs to get done.'}
      </AppText>

      {!searchQuery && (
        <View className="flex-row gap-3">
          {(activeTab === 'all' || activeTab === 'notes') && (
            <Pressable
              onPress={() => setShowCreateNote(true)}
              className="flex-row items-center bg-blue-600 rounded-2xl py-3 px-5 shadow-md active:opacity-80"
            >
              <Ionicons name="add" size={18} color={T.white} style={{ marginEnd: 6 }} />
              <AppText className="text-white font-bold text-[15px]">
                {t('productivity.newNote') ?? 'New Note'}
              </AppText>
            </Pressable>
          )}
          {(activeTab === 'all' || activeTab === 'tasks' || activeTab === 'today') && (
            <Pressable
              onPress={() => setShowCreateTask(true)}
              className={`flex-row items-center rounded-2xl py-3 px-5 ${(activeTab === 'all' || activeTab === 'today') ? 'bg-blue-50 shadow-none' : 'bg-blue-600 shadow-md'} active:opacity-80`}
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
                className={(activeTab === 'all' || activeTab === 'today') ? "text-blue-600 font-bold text-[15px]" : "text-white font-bold text-[15px]"}
              >
                {t('productivity.new_task') ?? 'New Task'}
              </AppText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
