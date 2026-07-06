import React, { useState, useEffect } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { useDebounce } from '@/hooks/useDebounce';

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

/**
 * Header component for the Productivity Screen.
 */
function HeaderIconButton({
  onPress,
  icon,
  label,
}: {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-10 h-10 rounded-full bg-primary-soft items-center justify-center active:opacity-70"
    >
      <Ionicons name={icon} size={20} color={T.primary.DEFAULT} />
    </Pressable>
  );
}

export function ProductivityHeader({
  pendingTasksCount,
  searchQuery,
  setSearchQuery,
  onGeneratePlan,
  onShowCreateNote,
  onShowCreateTask,
}: Props) {
  const { t } = useTranslation();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  useEffect(() => {
    if (searchQuery !== debouncedSearch) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery, debouncedSearch]);

  return (
    <View className="px-5 pt-4 pb-6 bg-surface z-10 shadow-sm elevation-sm">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <AppText variant="h1" className="text-text text-[28px] font-extrabold tracking-tight">
            {t('productivity.title', { defaultValue: 'Workspace' })}
          </AppText>
          <AppText className="text-muted text-sm mt-1">
            {pendingTasksCount === 0
              ? t('productivity.header.subtitle.empty', {
                  defaultValue: "You're all caught up for today.",
                })
              : t('productivity.header.subtitle.pending', {
                  count: pendingTasksCount,
                  defaultValue: `You have ${pendingTasksCount} tasks pending.`,
                })}
          </AppText>
        </View>

        <View className="flex-row gap-2">
          <HeaderIconButton
            onPress={onGeneratePlan}
            icon="sparkles"
            label="Generate Today's Plan"
          />
          <HeaderIconButton onPress={onShowCreateNote} icon="document-text" label="Create Note" />
          <HeaderIconButton onPress={onShowCreateTask} icon="checkbox" label="Create Task" />
        </View>
      </View>

      <View className="flex-row items-center bg-page rounded-lg px-4 h-11 border border-border">
        <Ionicons name="search" size={18} color={T.onSurface.mutedLight} className="mr-3" />
        <TextInput
          value={localSearch}
          onChangeText={setLocalSearch}
          placeholder={t('productivity.search', { defaultValue: 'Search notes & tasks...' })}
          placeholderTextColor={T.onSurface.disabledLight}
          className="flex-1 text-text text-base h-full"
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
}
