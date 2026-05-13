import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';

import { useTheme } from '@/hooks/useTheme';

interface ProductivityHeaderProps {
  pendingTasksCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onGeneratePlan: () => void;
  onCreateNote: () => void;
  onCreateTask: () => void;
}

import { useDebounce } from '@/hooks/useDebounce';
export const ProductivityHeader = React.memo(function ProductivityHeader({
  pendingTasksCount,
  searchQuery,
  setSearchQuery,
  onGeneratePlan,
  onCreateNote,
  onCreateTask,
}: ProductivityHeaderProps) {
  const { t } = useTranslation();
  const { C } = useTheme();

  const [localQuery, setLocalQuery] = React.useState(searchQuery);
  const debouncedSetSearchQuery = useDebounce(setSearchQuery, 300);

  React.useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (q: string) => {
    setLocalQuery(q);
    debouncedSetSearchQuery(q);
  };


  return (
    <View className="px-6 pt-4 pb-6 shadow-sm z-10" style={{ backgroundColor: C.surface }}>
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <AppText variant="h1" className="text-[28px] font-[800] tracking-[-0.5px]" style={{ color: C.text }}>
            {t('productivity.title') || 'Workspace'}
          </AppText>
          <AppText className="text-[14px] mt-1" style={{ color: C.subtext }}>
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
            accessibilityHint="Generates a today plan"
            className="w-10 h-10 rounded-full items-center justify-center"
            style={({ pressed }) => [
              { backgroundColor: C.primarySurface },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="sparkles" size={20} color={C.primary} />
          </Pressable>
          <Pressable
            onPress={onCreateNote}
            accessibilityRole="button"
            accessibilityLabel="Create note"
            accessibilityHint="Creates a new note"
            className="w-10 h-10 rounded-full items-center justify-center"
            style={({ pressed }) => [
              { backgroundColor: C.primarySurface },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="document-text" size={20} color={C.primary} />
          </Pressable>
          <Pressable
            onPress={onCreateTask}
            accessibilityRole="button"
            accessibilityLabel="Create task"
            accessibilityHint="Creates a new task"
            className="w-10 h-10 rounded-full items-center justify-center"
            style={({ pressed }) => [
              { backgroundColor: C.primarySurface },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="checkbox" size={20} color={C.primary} />
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-center rounded-lg px-4 h-11 border" style={{ backgroundColor: C.bg, borderColor: C.border }}>
        <Ionicons name="search" size={18} color={C.subtext} className="mr-2" />
        <TextInput
          value={localQuery}
          onChangeText={handleSearchChange}
          placeholder={t('productivity.search') || 'Search notes & tasks...'}
          placeholderTextColor={C.subtext}
          className="flex-1 text-[16px] h-full" style={{ color: C.text }}
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
});
