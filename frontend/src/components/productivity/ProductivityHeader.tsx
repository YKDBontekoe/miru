import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, TextInput, PressableStateCallbackType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  onSurface: {
    mutedLight: DESIGN_TOKENS.colors.muted,
    disabledLight: DESIGN_TOKENS.colors.faint,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
  },
};

interface Props {
  pendingTasksCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onGeneratePlan: () => void;
  onShowCreateNote: () => void;
  onShowCreateTask: () => void;
}

export const ProductivityHeader = React.memo(({
  pendingTasksCount,
  searchQuery,
  setSearchQuery,
  onGeneratePlan,
  onShowCreateNote,
  onShowCreateTask,
}: Props) => {
  const { t } = useTranslation();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [localSearch, setSearchQuery]);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  return (
    <View className="px-6 pt-4 pb-5 bg-surface shadow-sm z-10 elevation-sm">
      <View className="flex-row justify-between items-center mb-5">
        <View>
          <AppText variant="h1" className="text-text text-[28px] font-extrabold tracking-tight">
            {t('productivity.title') || 'Workspace'}
          </AppText>
          <AppText className="text-muted text-[14px] mt-1">
            {pendingTasksCount === 0
              ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
              : t('productivity.header.subtitle.pending', { count: pendingTasksCount }) ||
                `You have ${pendingTasksCount} tasks pending.`}
          </AppText>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={onGeneratePlan}
            accessibilityRole="button"
            accessibilityLabel="Generate plan"
            style={({ pressed }: PressableStateCallbackType) => [pressed ? { opacity: 0.7 } : undefined]}
            className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
          >
            <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
          </Pressable>
          <Pressable
            onPress={onShowCreateNote}
            accessibilityRole="button"
            accessibilityLabel="Create note"
            style={({ pressed }: PressableStateCallbackType) => [pressed ? { opacity: 0.7 } : undefined]}
            className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
          >
            <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
          </Pressable>
          <Pressable
            onPress={onShowCreateTask}
            accessibilityRole="button"
            accessibilityLabel="Create task"
            style={({ pressed }: PressableStateCallbackType) => [pressed ? { opacity: 0.7 } : undefined]}
            className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
          >
            <Ionicons name="checkbox" size={20} color={T.primary.DEFAULT} />
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-center bg-page rounded-lg px-3 h-11 border border-border">
        <Ionicons
          name="search"
          size={18}
          color={T.onSurface.mutedLight}
          style={{ marginRight: 8 }}
        />
        <TextInput
          value={localSearch}
          onChangeText={setLocalSearch}
          placeholder={t('productivity.search') || 'Search notes & tasks...'}
          placeholderTextColor={T.onSurface.disabledLight}
          className="flex-1 text-text text-[16px] h-full"
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
});

ProductivityHeader.displayName = 'ProductivityHeader';
