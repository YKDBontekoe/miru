import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TextInput, View, StyleSheet, Platform } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { AgentPill } from '@/components/chat/AgentPill';
import { Agent } from '@/core/models';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

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
  const { C } = useTheme();

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => onChangeQuery(localQuery), 300);
    return () => clearTimeout(timer);
  }, [localQuery, onChangeQuery]);

  return (
    <>
      <View style={[styles.heroContainer, { backgroundColor: DESIGN_TOKENS.colors.deep }]}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <AppText variant="caption" style={styles.heroSubtitle}>
          {t('chat.title', 'Miru')}
        </AppText>
        <AppText variant="h2" style={styles.heroTitle}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="bodySm" style={styles.heroDesc}>
          {t('chat.design_subtitle', 'Search, pin, and continue the right conversation fast.')}
        </AppText>
      </View>

      <View style={[styles.sectionContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.searchBar, { backgroundColor: C.surfaceHigh, borderColor: C.border }]}>
          <Ionicons name="search" size={16} color={C.muted} />
          <TextInput
            value={localQuery}
            onChangeText={setLocalQuery}
            placeholder={t('chat.search_placeholder', 'Search chats')}
            placeholderTextColor={C.faint}
            style={[styles.searchInput, { color: C.text }]}
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
                  styles.filterPill,
                  {
                    backgroundColor: selected ? C.primarySurface : C.surfaceHigh,
                    borderColor: selected ? `${C.primary}73` : C.border,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  style={[styles.filterPillText, { color: selected ? C.primary : C.muted }]}
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
                styles.filterPill,
                {
                  backgroundColor: active ? C.primarySurface : C.surfaceHigh,
                  borderColor: active ? `${C.primary}73` : C.border,
                },
              ]}
            >
              <AppText variant="caption" style={[styles.filterPillText, { color: active ? C.primary : C.muted }]}>
                {label}
              </AppText>
            </ScalePressable>
          ))}
        </ScrollView>
      </View>

      {agents.length > 0 ? (
        <View style={[styles.sectionContainer, styles.personasContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.personasHeader}>
            <AppText variant="h3" style={[styles.personasTitle, { color: C.text }]}>
              {t('chat.personas', 'Personas')}
            </AppText>
            <AppText variant="caption" style={[styles.personasCount, { color: C.muted }]}>
              {activeFilterCount > 0
                ? t('chat.active_filters', { count: activeFilterCount, defaultValue: '{{count}} filters' })
                : agents.length}
            </AppText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.personasScrollContent}
          >
            <ScalePressable
              onPress={() => onSelectAgent(null)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: selectedAgentId ? C.surfaceHigh : C.primarySurface,
                  borderColor: selectedAgentId ? C.border : `${C.primary}73`,
                },
              ]}
            >
              <AppText
                variant="caption"
                style={[styles.filterPillText, { color: selectedAgentId ? C.muted : C.primary }]}
              >
                {t('chat.all_agents', 'All')}
              </AppText>
            </ScalePressable>
            {agents.map((item) => (
              <View key={item.id} style={styles.agentPillWrapper}>
                <AgentPill
                  agent={item}
                  onPress={() => onSelectAgent(selectedAgentId === item.id ? null : item.id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.listHeader}>
        <AppText variant="h3" style={[styles.listTitle, { color: C.text }]}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="caption" style={{ color: C.muted }}>
          {roomCount}
        </AppText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    borderRadius: theme.borderRadius.xxl + 4,
    padding: theme.spacing.lg + 2,
    marginBottom: theme.spacing.md + 2,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' ? theme.elevation.md : {
      elevation: theme.elevation.md.elevation,
      shadowColor: 'transparent',
    }),
  },
  heroCircle1: {
    position: 'absolute',
    right: -26,
    top: -24,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: DESIGN_TOKENS.colors.white + '1A', // 10% opacity
  },
  heroCircle2: {
    position: 'absolute',
    right: 36,
    bottom: -48,
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: DESIGN_TOKENS.colors.white + '0D', // 5% opacity
  },
  heroSubtitle: {
    color: DESIGN_TOKENS.colors.surface,
    opacity: 0.8,
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    color: DESIGN_TOKENS.colors.white,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm - 2,
  },
  heroDesc: {
    color: DESIGN_TOKENS.colors.surface,
    opacity: 0.8,
  },
  sectionContainer: {
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    padding: theme.spacing.md + 2,
    marginBottom: theme.spacing.md,
    ...(Platform.OS === 'ios' ? theme.elevation.md : {
      elevation: theme.elevation.md.elevation,
      shadowColor: 'transparent',
    }),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md + 2,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md - 2,
    marginBottom: theme.spacing.md - 2,
  },
  searchInput: {
    flex: 1,
    height: 42, // Keeping min height for touch target
    ...theme.typography.bodySm,
    marginLeft: theme.spacing.sm,
  },
  filterPill: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
  },
  filterPillText: {
    fontWeight: 'bold',
  },
  personasContainer: {
    paddingVertical: theme.spacing.md + 2,
    paddingHorizontal: 0,
  },
  personasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md - 2,
  },
  personasTitle: {
    fontWeight: 'bold',
  },
  personasCount: {
    fontWeight: 'bold',
  },
  personasScrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  agentPillWrapper: {
    marginRight: theme.spacing.sm,
  },
  listHeader: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xxs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontWeight: 'bold',
  },
});
