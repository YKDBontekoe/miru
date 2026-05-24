import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { theme } from '@/core/theme';
import { ThemeColors, useTheme } from '@/hooks/useTheme';

export interface EmptyStateProps {
  searchQuery: string;
  onCreate: () => void;
  onBrowse: () => void;
}

/**
 * EmptyState Component
 * Displays a placeholder UI when no personas/agents match the search or when the list is empty.
 * Adheres to the Premium Standard with a modular StyleSheet, theme tokens, and dynamic styling based on context.
 *
 * @param {EmptyStateProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered empty state view.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery, onCreate, onBrowse }) => {
  const { C } = useTheme();

  if (searchQuery.trim()) {
    return (
      <Animated.View entering={FadeIn.duration(300)} className="items-center py-14">
        <View className="mb-4 h-12 w-12 items-center justify-center rounded-full border border-border bg-surfaceSoft">
          <Ionicons name="search" size={26} color={C.faint} />
        </View>
        <AppText className="mb-2 text-base font-semibold text-text">No matches</AppText>
        <AppText className="text-center text-sm text-muted">Try a different search term.</AppText>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} className="items-center px-10 py-14">
      <View className="mb-8 h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
        <Ionicons name="people" size={36} color={`${C.primary}90`} />
      </View>
      <AppText className="mb-2 text-xl font-bold text-text">No personas yet</AppText>
      <AppText className="mb-7 text-center text-sm leading-relaxed text-muted">
        Create your first AI persona or start from a template.
      </AppText>

      <ScalePressable onPress={onCreate}>
        <View className="mb-4 flex-row items-center rounded-lg bg-primary px-7 py-3.5 shadow-md shadow-primary">
          <Ionicons name="sparkles" size={17} color={theme.colors.white} className="mr-2" />
          <AppText className="text-base font-bold text-white">Create Persona</AppText>
        </View>
      </ScalePressable>

      <ScalePressable onPress={onBrowse}>
        <View className="flex-row items-center gap-2 p-2">
          <Ionicons name="albums-outline" size={15} color={C.muted} />
          <AppText className="text-sm text-muted">Browse Templates</AppText>
        </View>
      </ScalePressable>
    </Animated.View>
  );
};
