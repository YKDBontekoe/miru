import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
};

type FilterMode = 'all' | 'pinned' | 'active';
type SortMode = 'recent' | 'messages' | 'name';
type TemplateCategory = 'all' | 'work' | 'planning' | 'creative';

interface AgentsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  templateCategory: TemplateCategory;
  onTemplateCategoryChange: (category: TemplateCategory) => void;
  categoryCount: {
    all: number;
    work: number;
    planning: number;
    creative: number;
  };
  onShowTemplates: () => void;
}

export function AgentsFilters({
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  sortMode,
  onSortModeChange,
  templateCategory,
  onTemplateCategoryChange,
  categoryCount,
  onShowTemplates,
}: AgentsFiltersProps) {
  const { t } = useTranslation();

  return (
    <Animated.View entering={FadeIn.delay(200).duration(300)} className="px-5">
      {/* Search */}
      <View className="flex-row items-center bg-surface rounded-xl border border-border px-3 py-2.5">
        <Ionicons name="search" size={15} color={C.faint} className="mr-2" />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search personas…"
          placeholderTextColor={C.faint}
          className="flex-1 text-text text-sm"
        />
        {searchQuery.length > 0 && (
          <ScalePressable onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={16} color={C.faint} />
          </ScalePressable>
        )}
      </View>

      {/* Primary Filters */}
      <View className="flex-row mt-2.5">
        {(
          [
            { key: 'all', label: t('agents.filter.all') },
            { key: 'pinned', label: t('agents.filter.pinned') },
            { key: 'active', label: t('agents.filter.active') },
          ] as const
        ).map((option) => (
          <ScalePressable
            key={option.key}
            onPress={() => onFilterModeChange(option.key)}
            className={`rounded-xl border px-2.5 py-1.5 mr-2 ${
              filterMode === option.key
                ? 'bg-primary border-primary'
                : 'bg-surfaceSoft border-border'
            }`}
          >
            <AppText
              variant="caption"
              className={`font-bold ${filterMode === option.key ? 'text-white' : 'text-muted'}`}
            >
              {option.label}
            </AppText>
          </ScalePressable>
        ))}
      </View>

      {/* Sort Options */}
      <View className="flex-row mt-2">
        {(
          [
            { key: 'recent', label: t('agents.sort.recent') },
            { key: 'messages', label: t('agents.sort.messages') },
            { key: 'name', label: t('agents.sort.name') },
          ] as const
        ).map((option) => (
          <ScalePressable
            key={option.key}
            onPress={() => onSortModeChange(option.key)}
            className={`rounded-xl border px-2.5 py-1.5 mr-2 ${
              sortMode === option.key ? 'bg-primary border-primary' : 'bg-surface border-border'
            }`}
          >
            <AppText
              variant="caption"
              className={`font-bold ${sortMode === option.key ? 'text-white' : 'text-muted'}`}
            >
              {option.label}
            </AppText>
          </ScalePressable>
        ))}
      </View>

      {/* Template Categories */}
      <View className="flex-row mt-2 flex-wrap">
        {(
          [
            {
              key: 'all',
              label: t('agents.template.all', { count: categoryCount.all }),
            },
            {
              key: 'work',
              label: t('agents.template.work', { count: categoryCount.work }),
            },
            {
              key: 'planning',
              label: t('agents.template.planning', { count: categoryCount.planning }),
            },
            {
              key: 'creative',
              label: t('agents.template.creative', { count: categoryCount.creative }),
            },
          ] as const
        ).map((option) => (
          <ScalePressable
            key={option.key}
            onPress={() => {
              onTemplateCategoryChange(option.key);
              onShowTemplates();
            }}
            className={`rounded-xl border px-2.5 py-1.5 mr-2 mb-2 ${
              templateCategory === option.key
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            }`}
          >
            <AppText
              variant="caption"
              className={`font-bold ${templateCategory === option.key ? 'text-white' : 'text-muted'}`}
            >
              {option.label}
            </AppText>
          </ScalePressable>
        ))}
      </View>
    </Animated.View>
  );
}
