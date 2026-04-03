import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

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
const C = {
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
};

const styles = StyleSheet.create({
  searchContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.massive + theme.spacing.sm, // equivalent to 56
  },
  searchIconCircle: {
    width: theme.spacing.colossal,
    height: theme.spacing.colossal,
    borderRadius: theme.borderRadius.full,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  searchTitle: {
    color: C.text,
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  searchSubtitle: {
    color: C.muted,
    textAlign: 'center',
    ...theme.typography.bodySm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.massive + theme.spacing.sm,
    paddingHorizontal: theme.spacing.xxl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    backgroundColor: `${C.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: `${C.primary}20`,
  },
  emptyTitle: {
    color: C.text,
    ...theme.typography.h3,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    color: C.muted,
    textAlign: 'center',
    ...theme.typography.bodySm,
    lineHeight: theme.typography.bodySm.fontSize * 1.5,
    marginBottom: theme.spacing.avatar,
  },
  createButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm + theme.spacing.xs, // equivalent to 14
    paddingHorizontal: theme.spacing.avatar, // equivalent to 28
    marginBottom: theme.spacing.md,
    ...theme.elevation.md,
    shadowColor: C.primary,
  },
  createButtonIcon: {
    marginEnd: theme.spacing.sm,
  },
  createButtonText: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '700',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  browseButtonText: {
    color: C.muted,
    ...theme.typography.bodySm,
  },
});

export const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery, onCreate, onBrowse }) => {

  if (searchQuery.trim()) {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.searchContainer}>
        <View style={styles.searchIconCircle}>
          <Ionicons name="search" size={26} color={C.faint} />
        </View>
        <AppText style={styles.searchTitle}>No matches</AppText>
        <AppText style={styles.searchSubtitle}>Try a different search term.</AppText>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="people" size={36} color={`${C.primary}90`} />
      </View>
      <AppText style={styles.emptyTitle}>No personas yet</AppText>
      <AppText style={styles.emptySubtitle}>
        Create your first AI persona or start from a template.
      </AppText>
      <ScalePressable onPress={onCreate}>
        <View style={styles.createButtonContainer}>
          <Ionicons
            name="sparkles"
            size={17}
            color={theme.colors.white}
            style={styles.createButtonIcon}
          />
          <AppText style={styles.createButtonText}>Create Persona</AppText>
        </View>
      </ScalePressable>
      <ScalePressable onPress={onBrowse}>
        <View style={styles.browseButton}>
          <Ionicons name="albums-outline" size={15} color={C.muted} />
          <AppText style={styles.browseButtonText}>Browse templates</AppText>
        </View>
      </ScalePressable>
    </Animated.View>
  );
};
