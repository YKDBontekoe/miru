import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { useDebounce } from '@/hooks/useDebounce';
import { useState, useEffect } from 'react';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  surface: { light: DESIGN_TOKENS.colors.surface },
  border: { light: DESIGN_TOKENS.colors.border },
  background: { light: DESIGN_TOKENS.colors.pageBg },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
    disabledLight: DESIGN_TOKENS.colors.faint,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
};


interface ProductivityHeaderProps {
  pendingTasksCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onGeneratePlan: () => void;
  onAddNote: () => void;
  onAddTask: () => void;
}

export const ProductivityHeader = React.memo(
  ({
    pendingTasksCount,
    searchQuery,
    setSearchQuery,
    onGeneratePlan,
    onAddNote,
    onAddTask,
  }: ProductivityHeaderProps) => {
    const { t } = useTranslation();
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const debouncedQuery = useDebounce(localQuery, 300);

    useEffect(() => {
      setSearchQuery(debouncedQuery);
    }, [debouncedQuery, setSearchQuery]);

    return (
      <View className="px-6 pt-4 pb-6 bg-white z-10 shadow-sm">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <AppText variant="h1" className="text-[#13251C] text-2xl font-extrabold tracking-tight">
              {t('productivity.title') || 'Workspace'}
            </AppText>
            <AppText className="text-[#5A7467] text-sm mt-1">
              {pendingTasksCount === 0
                ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
                : t('productivity.header.subtitle.pending', { count: pendingTasksCount }) ||
                  `You have ${pendingTasksCount} tasks pending.`}
            </AppText>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={onGeneratePlan}
              className="w-10 h-10 rounded-full bg-[#ECF5F0] items-center justify-center"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : {})}
              accessibilityLabel="Generate productivity plan"
              accessibilityHint="Generates a plan for the day based on tasks and events"
              accessibilityRole="button"
            >
              <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={onAddNote}
              className="w-10 h-10 rounded-full bg-[#ECF5F0] items-center justify-center"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : {})}
              accessibilityLabel="Add note"
              accessibilityHint="Opens a modal to create a new note"
              accessibilityRole="button"
            >
              <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
            </Pressable>
            <Pressable
              onPress={onAddTask}
              className="w-10 h-10 rounded-full bg-[#ECF5F0] items-center justify-center"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : {})}
              accessibilityLabel="Add task"
              accessibilityHint="Opens a modal to create a new task"
              accessibilityRole="button"
            >
              <Ionicons name="checkbox" size={20} color={T.primary.DEFAULT} />
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center bg-[#F2F7F2] rounded-lg px-4 h-11 border border-[#DDE8E0]">
          <Ionicons
            name="search"
            size={18}
            color={T.onSurface.mutedLight}
            className="mr-2"
          />
          <TextInput
            value={localQuery}
            onChangeText={setLocalQuery}
            placeholder={t('productivity.search') || 'Search notes & tasks...'}
            placeholderTextColor={T.onSurface.disabledLight}
            className="flex-1 text-[#13251C] text-base h-full"
            clearButtonMode="while-editing"
          />
        </View>
      </View>
    );
  }
);

ProductivityHeader.displayName = 'ProductivityHeader';
