import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TextInput, View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { AgentPill } from '@/components/chat/AgentPill';
import { Agent } from '@/core/models';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

type SortMode = 'recent' | 'mentions' | 'tasks';

interface ChatListHeaderProps {
  t: (key: string, opts?: Record<string, unknown> | string) => string;
  query: string;
  onChangeQuery: (value: string) => void;
  sortMode: SortMode;
  onChangeSortMode: (mode: SortMode) => void;
  recentOnly: boolean;
  unreadOnly: boolean;
  onToggleRecentOnly: () => void;
  onToggleUnreadOnly: () => void;
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string | null) => void;
  activeFilterCount: number;
  roomCount: number;
}

export function ChatListHeader({
  t,
  query,
  onChangeQuery,
  sortMode,
  onChangeSortMode,
  recentOnly,
  unreadOnly,
  onToggleRecentOnly,
  onToggleUnreadOnly,
  agents,
  selectedAgentId,
  onSelectAgent,
  activeFilterCount,
  roomCount,
}: ChatListHeaderProps) {
  const [localQuery, setLocalQuery] = useState(query);
  const { C, isDark } = useTheme();

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => onChangeQuery(localQuery), 300);
    return () => clearTimeout(timer);
  }, [localQuery, onChangeQuery]);

  const dynamicStyles = StyleSheet.create({
    heroContainer: {
      backgroundColor: isDark ? C.surfaceHigh : '#0F3D31',
    },
    heroSubtitle: {
      color: isDark ? C.muted : 'rgba(255,255,255,0.8)',
    },
    heroTitle: {
      color: isDark ? C.text : '#FFF',
    },
    sectionCard: {
      backgroundColor: C.surface,
      borderColor: C.border,
    },
    searchInputContainer: {
      backgroundColor: C.surfaceHigh,
      borderColor: C.border,
    },
    searchInput: {
      color: C.text,
    },
    chipDefault: {
      backgroundColor: C.surfaceHigh,
      borderColor: C.border,
    },
    chipSelected: {
      backgroundColor: C.primarySurface,
      borderColor: `${C.primary}73`,
    },
    chipTextDefault: {
      color: C.subtext,
    },
    chipTextSelected: {
      color: C.primary,
    },
    sectionTitle: {
      color: C.text,
    },
    sectionSubtitle: {
      color: C.subtext,
    },
  });

  return (
    <>
      <View style={[styles.heroContainer, dynamicStyles.heroContainer, theme.elevation.sm]}>
        <View style={[styles.heroCircle1, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.1)' }]} />
        <View style={[styles.heroCircle2, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)' }]} />
        <AppText variant="caption" style={[styles.heroSubtitle, dynamicStyles.heroSubtitle]}>
          {t('chat.title', 'Miru')}
        </AppText>
        <AppText variant="h2" style={[styles.heroTitle, dynamicStyles.heroTitle]}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="bodySm" style={[styles.heroSubtitle, dynamicStyles.heroSubtitle]}>
          {t('chat.design_subtitle', 'Search, pin, and continue the right conversation fast.')}
        </AppText>
      </View>

      <View style={[styles.sectionCard, dynamicStyles.sectionCard, theme.elevation.sm]}>
        <View style={[styles.searchInputContainer, dynamicStyles.searchInputContainer]}>
          <Ionicons name="search" size={16} color={C.muted} />
          <TextInput
            value={localQuery}
            onChangeText={setLocalQuery}
            placeholder={t('chat.search_placeholder', 'Search chats')}
            placeholderTextColor={C.faint}
            style={[styles.searchInput, dynamicStyles.searchInput]}
            accessibilityLabel={t('chat.search_placeholder', 'Search chats')}
          />
          {localQuery ? (
            <ScalePressable
              onPress={() => setLocalQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'Close')}
            >
              <Ionicons name="close-circle" size={16} color={C.faint} />
            </ScalePressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(
            [
              ['recent', t('chat.filter_recent', 'Recent')],
              ['mentions', t('chat.filter_mentions', 'Mentions')],
              ['tasks', t('chat.filter_tasks', 'Tasks')],
            ] as [SortMode, string][]
          ).map(([mode, label]) => {
            const selected = sortMode === mode;
            return (
              <ScalePressable
                key={mode}
                onPress={() => onChangeSortMode(mode)}
                style={[
                  styles.chip,
                  selected ? dynamicStyles.chipSelected : dynamicStyles.chipDefault
                ]}
              >
                <AppText
                  variant="caption"
                  style={[styles.chipText, selected ? dynamicStyles.chipTextSelected : dynamicStyles.chipTextDefault]}
                >
                  {label}
                </AppText>
              </ScalePressable>
            );
          })}
          {(
            [
              [recentOnly, onToggleRecentOnly, t('chat.recent_only', '7d')],
              [unreadOnly, onToggleUnreadOnly, t('chat.unread_only', 'Unread')],
            ] as const
          ).map(([active, onToggle, label]) => (
            <ScalePressable
              key={label}
              onPress={onToggle}
              style={[
                styles.chip,
                active ? dynamicStyles.chipSelected : dynamicStyles.chipDefault
              ]}
            >
              <AppText variant="caption" style={[styles.chipText, active ? dynamicStyles.chipTextSelected : dynamicStyles.chipTextDefault]}>
                {label}
              </AppText>
            </ScalePressable>
          ))}
        </ScrollView>
      </View>

      {agents.length > 0 ? (
        <View style={[styles.sectionCard, dynamicStyles.sectionCard, theme.elevation.sm]}>
          <View style={styles.sectionHeader}>
            <AppText variant="h3" style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
              {t('chat.personas', 'Personas')}
            </AppText>
            <AppText variant="caption" style={[styles.sectionSubtitle, dynamicStyles.sectionSubtitle]}>
              {activeFilterCount > 0
                ? t('chat.active_filters', { count: activeFilterCount, defaultValue: '{{count}} filters' })
                : agents.length}
            </AppText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.agentsContainer}
          >
            <ScalePressable
              onPress={() => onSelectAgent(null)}
              style={[
                styles.chip,
                !selectedAgentId ? dynamicStyles.chipSelected : dynamicStyles.chipDefault
              ]}
            >
              <AppText
                variant="caption"
                style={[styles.chipText, !selectedAgentId ? dynamicStyles.chipTextSelected : dynamicStyles.chipTextDefault]}
              >
                {t('chat.all_agents', 'All')}
              </AppText>
            </ScalePressable>
            {agents.map((item) => (
              <View key={item.id} style={{ marginRight: 8 }}>
                <AgentPill
                  agent={item}
                  onPress={() => onSelectAgent(selectedAgentId === item.id ? null : item.id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.headerRow}>
        <AppText variant="h3" style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="caption" style={[styles.sectionSubtitle, dynamicStyles.sectionSubtitle]}>
          {roomCount}
        </AppText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    borderRadius: theme.borderRadius.xl + 4, // 28
    padding: theme.spacing.lg + 2, // 18
    marginBottom: theme.spacing.md + 2, // 14
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    right: -26,
    top: -24,
    width: 132,
    height: 132,
    borderRadius: theme.borderRadius.full,
  },
  heroCircle2: {
    position: 'absolute',
    right: 36,
    bottom: -48,
    width: 148,
    height: 148,
    borderRadius: theme.borderRadius.full,
  },
  heroSubtitle: {
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs + 2,
  },
  sectionCard: {
    borderRadius: theme.borderRadius.xl + 4,
    borderWidth: 1,
    paddingVertical: theme.spacing.md + 2,
    marginBottom: theme.spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md + 2,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm + 2,
    marginHorizontal: theme.spacing.md + 2,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    marginLeft: theme.spacing.sm,
  },
  chip: {
    marginEnd: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
  },
  chipText: {
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm + 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontWeight: 'bold',
  },
  agentsContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  headerRow: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.none + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
