import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { Tab } from '@/hooks/viewmodels/useProductivityViewModel';

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

interface ProductivityEmptyStateProps {
  activeTab: Tab;
  searchQuery: string;
  setShowCreateNote: (show: boolean) => void;
  setShowCreateTask: (show: boolean) => void;
}

const ICON_BY_TAB: Record<Tab | 'default', keyof typeof Ionicons.glyphMap> = {
  notes: 'document-text',
  tasks: 'checkbox',
  today: 'sunny-outline',
  default: 'planet',
  all: 'planet',
};

export function ProductivityEmptyState({
  activeTab,
  searchQuery,
  setShowCreateNote,
  setShowCreateTask,
}: ProductivityEmptyStateProps) {
  const { t } = useTranslation();

  const iconName = ICON_BY_TAB[activeTab] || ICON_BY_TAB.default;

  return (
    <View className="items-center py-colossal">
      <View className="w-20 h-20 rounded-full bg-primary-surfaceLight items-center justify-center mb-lg">
        <Ionicons name={iconName} size={42} color={T.primary.DEFAULT} />
      </View>
      <AppText variant="h3" className="mb-sm text-center text-onSurface-light">
        {searchQuery
          ? t('productivity.no_matches') || 'No matches found'
          : activeTab === 'notes'
            ? t('productivity.no_notes') || 'No Notes'
            : activeTab === 'tasks'
              ? t('productivity.no_tasks') || 'No Tasks'
              : activeTab === 'today'
                ? t('productivity.nothing_urgent_today')
                : t('productivity.workspace_clear') || 'Your workspace is clear'}
      </AppText>
      <AppText className="text-center mb-xl text-onSurface-mutedLight px-xxxl leading-relaxed">
        {searchQuery
          ? t('productivity.try_adjust_search') || 'Try adjusting your search terms.'
          : activeTab === 'today'
            ? t('productivity.today_empty_detail')
            : t('productivity.capture_thoughts') ||
              'Capture your thoughts and track what needs to get done.'}
      </AppText>

      {!searchQuery && (
        <View className="flex-row gap-md">
          {(activeTab === 'all' || activeTab === 'notes') && (
            <Pressable
              onPress={() => setShowCreateNote(true)}
              className="flex-row items-center bg-primary rounded-xl py-md px-xl shadow-md active:opacity-80"
              style={Platform.OS === 'android' ? { elevation: 3 } : {}}
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
              className={`flex-row items-center rounded-xl py-md px-xl active:opacity-80 ${(activeTab === 'all' || activeTab === 'today') ? 'bg-primary-surfaceLight' : 'bg-primary shadow-md'}`}
              style={
                (activeTab === 'all' || activeTab === 'today')
                  ? {}
                  : Platform.OS === 'android'
                    ? { elevation: 3 }
                    : {}
              }
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
                className={`font-bold text-[15px] ${(activeTab === 'all' || activeTab === 'today') ? 'text-primary' : 'text-white'}`}
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
