import React, { useState, useEffect } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { useDebounce } from '@/hooks/useDebounce';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  onSurface: {
    disabledLight: DESIGN_TOKENS.colors.faint,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
  },
};

type ProductivityHeaderProps = {
  t: (key: string, options?: any) => string;
  pendingTasksCount: number;
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  onGenerateTodayPlan: () => void;
  onShowCreateNote: () => void;
  onShowCreateTask: () => void;
};

export const ProductivityHeader: React.FC<ProductivityHeaderProps> = ({
  t,
  pendingTasksCount,
  searchQuery,
  setSearchQuery,
  onGenerateTodayPlan,
  onShowCreateNote,
  onShowCreateTask,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  return (
    <View className="z-10 bg-surface px-6 pb-6 pt-4 shadow-sm">
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <AppText variant="h1" className="text-3xl font-extrabold tracking-tight text-text">
            {t('productivity.title') || 'Workspace'}
          </AppText>
          <AppText className="mt-1 text-sm text-muted">
            {pendingTasksCount === 0
              ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
              : t('productivity.header.subtitle.pending', { count: pendingTasksCount }) ||
                `You have ${pendingTasksCount} tasks pending.`}
          </AppText>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={onGenerateTodayPlan}
            className="h-10 w-10 items-center justify-center rounded-full bg-primarySoft active:opacity-70"
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel="Generate today's plan"
          >
            <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
          </Pressable>
          <Pressable
            onPress={onShowCreateNote}
            className="h-10 w-10 items-center justify-center rounded-full bg-primarySoft active:opacity-70"
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel="Create note"
          >
            <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
          </Pressable>
          <Pressable
            onPress={onShowCreateTask}
            className="h-10 w-10 items-center justify-center rounded-full bg-primarySoft active:opacity-70"
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel="Create task"
          >
            <Ionicons name="checkbox" size={20} color={T.primary.DEFAULT} />
          </Pressable>
        </View>
      </View>

      <View className="h-11 flex-row items-center rounded-lg border border-border bg-pageBg px-4">
        <Ionicons name="search" size={18} color={T.onSurface.mutedLight} className="mr-2" />
        <TextInput
          value={localSearch}
          onChangeText={setLocalSearch}
          placeholder={t('productivity.search') || 'Search notes & tasks...'}
          placeholderTextColor={T.onSurface.disabledLight}
          className="flex-1 text-base text-text"
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
};
