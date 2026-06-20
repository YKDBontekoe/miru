import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { Tab } from '@/hooks/useProductivityData';

const T = {
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
  white: '#FFFFFF',
};


interface ProductivityEmptyStateProps {
  activeTab: Tab;
  searchQuery: string;
  onAddNote: () => void;
  onAddTask: () => void;
}

export const ProductivityEmptyState = React.memo(
  ({ activeTab, searchQuery, onAddNote, onAddTask }: ProductivityEmptyStateProps) => {
    const { t } = useTranslation();

    return (
      <View className="items-center py-20">
        <View className="w-20 h-20 rounded-full bg-[#ECF5F0] items-center justify-center mb-6">
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
        <AppText variant="h3" className="mb-2 text-center text-[#13251C]">
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
        <AppText className="text-center mb-8 text-[#5A7467] px-12 leading-6">
          {searchQuery
            ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
            : activeTab === 'today'
              ? t('productivity.today_empty_detail') || "Enjoy the clear schedule or get ahead on upcoming tasks."
              : t('productivity.capture_thoughts') ||
                'Capture your thoughts and track what needs to get done.'}
        </AppText>

        {!searchQuery && (
          <View className="flex-row gap-4">
            {(activeTab === 'all' || activeTab === 'notes') && (
              <Pressable
                onPress={onAddNote}
                className="flex-row items-center bg-[#25C16A] rounded-xl py-3 px-6 shadow-md"
                style={({ pressed }) => (pressed ? { opacity: 0.8 } : {})}
              >
                <Ionicons name="add" size={18} color={T.white} style={{ marginEnd: 6 }} />
                <AppText className="text-white font-bold text-[15px]">
                  {t('productivity.newNote') || 'New Note'}
                </AppText>
              </Pressable>
            )}
            {(activeTab === 'all' || activeTab === 'tasks' || activeTab === 'today') && (
              <Pressable
                onPress={onAddTask}
                className={`flex-row items-center rounded-xl py-3 px-6 ${activeTab === 'all' || activeTab === 'today' ? 'bg-[#ECF5F0]' : 'bg-[#25C16A] shadow-md'}`}
                style={({ pressed }) => (pressed ? { opacity: 0.8 } : {})}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={activeTab === 'all' || activeTab === 'today' ? T.primary.DEFAULT : T.white}
                  style={{ marginEnd: 6 }}
                />
                <AppText
                  className={`font-bold text-[15px] ${activeTab === 'all' || activeTab === 'today' ? 'text-[#25C16A]' : 'text-white'}`}
                >
                  {t('productivity.new_task') || 'New Task'}
                </AppText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  }
);

ProductivityEmptyState.displayName = 'ProductivityEmptyState';
