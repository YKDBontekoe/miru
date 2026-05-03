import React, { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { theme } from '../../core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  surface: { light: DESIGN_TOKENS.colors.surface },
  border: { light: DESIGN_TOKENS.colors.border },
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

const S = theme.spacing;
const R = theme.borderRadius;

interface ProductivityHeaderProps {
  pendingTasksCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  generateTodayPlan: () => void;
  setShowCreateNote: (show: boolean) => void;
  setShowCreateTask: (show: boolean) => void;
}

import { useDebouncedCallback } from 'use-debounce';
import { useState, useEffect } from 'react';

export function ProductivityHeader({
  pendingTasksCount,
  searchQuery,
  setSearchQuery,
  generateTodayPlan,
  setShowCreateNote,
  setShowCreateTask,
}: ProductivityHeaderProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value: string) => setSearchQuery(value), 300),
    [setSearchQuery]
  );

  const handleSearchChange = (text: string) => {
    setLocalSearchQuery(text);
    debouncedSetSearchQuery(text);
  };

  useEffect(() => {
    return () => {
      debouncedSetSearchQuery.cancel();
    };
  }, [debouncedSetSearchQuery]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value: string) => setSearchQuery(value), 300),
    [setSearchQuery]
  );

  const handleSearchChange = (text: string) => {
    setLocalSearchQuery(text);
    debouncedSetSearchQuery(text);
  };

  useEffect(() => {
    return () => {
      debouncedSetSearchQuery.cancel();
    };
  }, [debouncedSetSearchQuery]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value: string) => setSearchQuery(value), 300),
    [setSearchQuery]
  );

  const handleSearchChange = (text: string) => {
    setLocalSearchQuery(text);
    debouncedSetSearchQuery(text);
  };

  useEffect(() => {
    return () => {
      debouncedSetSearchQuery.cancel();
    };
  }, [debouncedSetSearchQuery]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const debouncedSetSearchQuery = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleSearchChange = (text: string) => {
    setLocalSearchQuery(text);
    debouncedSetSearchQuery(text);
  };

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const debouncedSetSearchQuery = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleSearchChange = (text: string) => {
    setLocalSearchQuery(text);
    debouncedSetSearchQuery(text);
  };

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const debouncedSetSearchQuery = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleSearchChange = (text: string) => {
    setLocalSearchQuery(text);
    debouncedSetSearchQuery(text);
  };

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const debouncedSetSearchQuery = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleSearchChange = (text: string) => {
    setLocalSearchQuery(text);
    debouncedSetSearchQuery(text);
  };

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  const { t } = useTranslation();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <View>
          <AppText variant="h1" style={styles.headerTitle}>
            {t('productivity.title') || 'Workspace'}
          </AppText>
          <AppText style={styles.headerSubtitle}>
            {pendingTasksCount === 0
              ? t('productivity.header.subtitle.empty') || "You're all caught up for today."
              : t('productivity.header.subtitle.pending', { count: pendingTasksCount }) ||
                `You have ${pendingTasksCount} tasks pending.`}
          </AppText>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={generateTodayPlan} accessibilityRole="button" accessibilityLabel={t('productivity.generate_plan') || "Generate today's plan"} accessibilityRole="button" accessibilityLabel={t('productivity.generate_plan') || "Generate today's plan"} accessibilityRole="button" accessibilityLabel={t('productivity.generate_plan') || "Generate today's plan"} accessibilityRole="button" accessibilityLabel={t('productivity.generate_plan') || "Generate today's plan"} accessibilityRole="button" accessibilityLabel={t('productivity.generate_plan') || "Generate today's plan"}
            accessibilityRole="button"
            accessibilityLabel={t('productivity.generate_plan') || "Generate today's plan"}
            accessibilityRole="button"
            accessibilityLabel={t('productivity.generate_plan') || "Generate today's plan"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.generate_plan') || \"Generate today's plan\"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.generate_plan') || \"Generate today's plan\"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.generate_plan') || \"Generate today's plan\"}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="sparkles" size={20} color={T.primary.DEFAULT} />
          </Pressable>
          <Pressable
            onPress={() => setShowCreateNote(true)} accessibilityRole="button" accessibilityLabel={t('productivity.create_note') || "Create note"} accessibilityRole="button" accessibilityLabel={t('productivity.create_note') || "Create note"} accessibilityRole="button" accessibilityLabel={t('productivity.create_note') || "Create note"} accessibilityRole="button" accessibilityLabel={t('productivity.create_note') || "Create note"} accessibilityRole="button" accessibilityLabel={t('productivity.create_note') || "Create note"}
            accessibilityRole="button"
            accessibilityLabel={t('productivity.create_note') || "Create note"}
            accessibilityRole="button"
            accessibilityLabel={t('productivity.create_note') || "Create note"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.create_note') || \"Create note\"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.create_note') || \"Create note\"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.create_note') || \"Create note\"}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="document-text" size={20} color={T.primary.DEFAULT} />
          </Pressable>
          <Pressable
            onPress={() => setShowCreateTask(true)} accessibilityRole="button" accessibilityLabel={t('productivity.create_task') || "Create task"} accessibilityRole="button" accessibilityLabel={t('productivity.create_task') || "Create task"} accessibilityRole="button" accessibilityLabel={t('productivity.create_task') || "Create task"} accessibilityRole="button" accessibilityLabel={t('productivity.create_task') || "Create task"} accessibilityRole="button" accessibilityLabel={t('productivity.create_task') || "Create task"}
            accessibilityRole="button"
            accessibilityLabel={t('productivity.create_task') || "Create task"}
            accessibilityRole="button"
            accessibilityLabel={t('productivity.create_task') || "Create task"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.create_task') || \"Create task\"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.create_task') || \"Create task\"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.create_task') || \"Create task\"}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="checkbox" size={20} color={T.primary.DEFAULT} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={T.onSurface.mutedLight}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('productivity.search') || 'Search everything...'}
          placeholderTextColor={T.onSurface.disabledLight}
          value={localSearchQuery}
          onChangeText={(text) => handleSearchChange(text)}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} accessibilityRole="button" accessibilityLabel={t('productivity.clear_search') || "Clear search"} accessibilityRole="button" accessibilityLabel={t('productivity.clear_search') || "Clear search"} accessibilityRole="button" accessibilityLabel={t('productivity.clear_search') || "Clear search"} accessibilityRole="button" accessibilityLabel={t('productivity.clear_search') || "Clear search"} accessibilityRole="button" accessibilityLabel={t('productivity.clear_search') || "Clear search"}
            accessibilityRole="button"
            accessibilityLabel={t('productivity.clear_search') || "Clear search"}
            accessibilityRole="button"
            accessibilityLabel={t('productivity.clear_search') || "Clear search"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.clear_search') || \"Clear search\"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.clear_search') || \"Clear search\"}
            accessibilityRole=\"button\"
            accessibilityLabel={t('productivity.clear_search') || \"Clear search\"}>
            <Ionicons name="close-circle" size={20} color={T.onSurface.mutedLight} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: S.xl,
    paddingTop: S.md,
    paddingBottom: S.lg,
    backgroundColor: T.surface.light,
    ...theme.elevation.sm,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.lg,
  },
  headerTitle: {
    color: T.onSurface.light,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: T.onSurface.mutedLight,
    fontSize: 14,
    marginTop: S.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: S.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: R.full,
    backgroundColor: T.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.background.light,
    borderRadius: R.lg,
    paddingHorizontal: S.md,
    height: 44,
    borderWidth: 1,
    borderColor: T.border.light,
  },
  searchIcon: {
    marginRight: S.sm,
  },
  searchInput: {
    flex: 1,
    color: T.onSurface.light,
    fontSize: 16,
    height: '100%',
  },
});
