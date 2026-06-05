import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
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
    <Animated.View entering={FadeIn.delay(200).duration(300)} style={{ paddingHorizontal: 20 }}>
      {/* Search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Ionicons name="search" size={15} color={C.faint} style={{ marginEnd: 8 }} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search personas…"
          placeholderTextColor={C.faint}
          style={{ flex: 1, color: C.text, fontSize: 14 }}
        />
        {searchQuery.length > 0 && (
          <ScalePressable onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={16} color={C.faint} />
          </ScalePressable>
        )}
      </View>

      {/* Primary Filters */}
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
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
            style={{
              borderRadius: 12,
              backgroundColor: filterMode === option.key ? C.primary : C.surfaceHigh,
              borderWidth: 1,
              borderColor: filterMode === option.key ? C.primary : C.border,
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginRight: 8,
            }}
          >
            <AppText
              variant="caption"
              style={{
                color: filterMode === option.key ? 'white' : C.muted,
                fontWeight: '700',
              }}
            >
              {option.label}
            </AppText>
          </ScalePressable>
        ))}
      </View>

      {/* Sort Options */}
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
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
            style={{
              borderRadius: 12,
              backgroundColor: sortMode === option.key ? C.primary : C.surface,
              borderWidth: 1,
              borderColor: sortMode === option.key ? C.primary : C.border,
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginRight: 8,
            }}
          >
            <AppText
              variant="caption"
              style={{
                color: sortMode === option.key ? 'white' : C.muted,
                fontWeight: '700',
              }}
            >
              {option.label}
            </AppText>
          </ScalePressable>
        ))}
      </View>

      {/* Template Categories */}
      <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' }}>
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
            style={{
              borderRadius: 12,
              backgroundColor: templateCategory === option.key ? C.primary : C.surface,
              borderWidth: 1,
              borderColor: templateCategory === option.key ? C.primary : C.border,
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginRight: 8,
              marginBottom: 8,
            }}
          >
            <AppText
              variant="caption"
              style={{
                color: templateCategory === option.key ? 'white' : C.muted,
                fontWeight: '700',
              }}
            >
              {option.label}
            </AppText>
          </ScalePressable>
        ))}
      </View>
    </Animated.View>
  );
}
