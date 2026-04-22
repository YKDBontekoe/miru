import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  white: '#FFFFFF',
};

interface Props {
  activeTab: 'today' | 'all' | 'notes' | 'tasks';
  searchQuery: string;
  setShowCreateNote: (show: boolean) => void;
  setShowCreateTask: (show: boolean) => void;
}

export const ProductivityEmptyState = ({
  activeTab,
  searchQuery,
  setShowCreateNote,
  setShowCreateTask,
}: Props) => {
  const { t } = useTranslation();

  return (
    <View className="items-center py-24">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-6"
        style={{ backgroundColor: T.primary.surfaceLight }}
      >
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
      <AppText variant="h3" className="mb-2 text-center" style={{ color: T.onSurface.light }}>
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
      <AppText
        className="text-center mb-8 px-10 leading-6"
        style={{ color: T.onSurface.mutedLight }}
      >
        {searchQuery
          ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
          : activeTab === 'today'
            ? t('productivity.today_empty_detail') || 'Enjoy the rest of your day.'
            : t('productivity.capture_thoughts') ||
              'Capture your thoughts and track what needs to get done.'}
      </AppText>

      {!searchQuery && (
        <View className="flex-row gap-4">
          {(activeTab === 'all' || activeTab === 'notes') && (
            <Pressable
              onPress={() => setShowCreateNote(true)}
              className="flex-row items-center rounded-xl py-3 px-6 shadow-md"
              style={({ pressed }) => [
                { backgroundColor: T.primary.DEFAULT },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="add" size={18} color={T.white} style={{ marginEnd: 6 }} />
              <AppText className="text-white font-bold text-[15px]">
                {t('productivity.newNote') || 'New Note'}
              </AppText>
            </Pressable>
          )}
          {(activeTab === 'all' || activeTab === 'tasks' || activeTab === 'today') && (
            <Pressable
              onPress={() => setShowCreateTask(true)}
              className="flex-row items-center rounded-xl py-3 px-6 shadow-md"
              style={({ pressed }) => [
                {
                  backgroundColor:
                    activeTab === 'all' || activeTab === 'today'
                      ? T.primary.surfaceLight
                      : T.primary.DEFAULT,
                },
                pressed && { opacity: 0.8 },
                (activeTab === 'all' || activeTab === 'today') && { shadowOpacity: 0, elevation: 0 },
              ]}
            >
              <Ionicons
                name="add"
                size={18}
                color={activeTab === 'all' || activeTab === 'today' ? T.primary.DEFAULT : T.white}
                style={{ marginEnd: 6 }}
              />
              <AppText
                className="font-bold text-[15px]"
                style={{
                  color:
                    activeTab === 'all' || activeTab === 'today' ? T.primary.DEFAULT : T.white,
                }}
              >
                {t('productivity.new_task') || 'New Task'}
              </AppText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

export default ProductivityEmptyState;
