import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const { C } = useTheme();
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => onChangeQuery(localQuery), 300);
    return () => clearTimeout(timer);
  }, [localQuery, onChangeQuery]);

  return (
    <>
      <View style={[styles.heroCard, { backgroundColor: C.surfaceMid }]}>
        <AppText variant="caption" style={[styles.heroSub, { color: C.muted }]}>
          {t('chat.title', 'Miru')}
        </AppText>
        <AppText variant="h2" style={[styles.heroTitle, { color: C.text }]}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="bodySm" style={[styles.heroSub, { color: C.text }]}>
          {t('chat.design_subtitle', 'Search, pin, and continue the right conversation fast.')}
        </AppText>
      </View>

      <View style={[styles.searchCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.searchInputWrapper, { borderColor: C.border, backgroundColor: C.surfaceMid }]}>
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
                  selected
                    ? { backgroundColor: C.primarySurface, borderColor: `${C.primary}73` }
                    : { backgroundColor: C.surfaceMid, borderColor: C.border }
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
                active
                  ? { backgroundColor: C.primarySurface, borderColor: `${C.primary}73` }
                  : { backgroundColor: C.surfaceMid, borderColor: C.border }
              ]}
            >
              <AppText
                variant="caption"
                style={[styles.filterPillText, { color: active ? C.primary : C.muted }]}
              >
                {label}
              </AppText>
            </ScalePressable>
          ))}
        </ScrollView>
      </View>

      {agents.length > 0 ? (
        <View style={[styles.personasCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.personasHeader}>
            <AppText variant="h3" style={[styles.personasTitle, { color: C.text }]}>
              {t('chat.personas', 'Personas')}
            </AppText>
            <AppText variant="caption" style={[styles.personasSubtitle, { color: C.muted }]}>
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
                !selectedAgentId
                  ? { backgroundColor: C.primarySurface, borderColor: `${C.primary}73` }
                  : { backgroundColor: C.surfaceMid, borderColor: C.border }
              ]}
            >
              <AppText
                variant="caption"
                style={[styles.filterPillText, { color: !selectedAgentId ? C.primary : C.muted }]}
              >
                {t('chat.all_agents', 'All')}
              </AppText>
            </ScalePressable>
            {agents.map((item) => (
              <View key={item.id} style={{ marginRight: theme.spacing.sm }}>
                <AgentPill
                  agent={item}
                  onPress={() => onSelectAgent(selectedAgentId === item.id ? null : item.id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.chatsHeader}>
        <AppText variant="h3" style={[styles.chatsTitle, { color: C.text }]}>
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
  heroCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.elevation.md,
  },
  heroSub: {
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  searchCard: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.elevation.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: theme.typography.bodySm.fontSize,
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
  personasCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.elevation.md,
  },
  personasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  personasTitle: {
    fontWeight: 'bold',
  },
  personasSubtitle: {
    fontWeight: 'bold',
  },
  personasScrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  chatsHeader: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xxs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatsTitle: {
    fontWeight: 'bold',
  },
});
