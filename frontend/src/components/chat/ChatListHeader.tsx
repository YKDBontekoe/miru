import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TextInput, View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { AgentPill } from '@/components/chat/AgentPill';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';
import { Agent } from '@/core/models';

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

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => onChangeQuery(localQuery), 300);
    return () => clearTimeout(timer);
  }, [localQuery, onChangeQuery]);

  return (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroBubbleTopRight} />
        <View style={styles.heroBubbleBottomRight} />
        <AppText variant="caption" style={styles.heroSubtitle}>
          {t('chat.title', 'Miru')}
        </AppText>
        <AppText variant="h2" style={styles.heroTitle}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="bodySm" style={styles.heroDescription}>
          {t('chat.design_subtitle', 'Search, pin, and continue the right conversation fast.')}
        </AppText>
      </View>

      <View style={styles.filterCard}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={theme.spacing.lg} color={DESIGN_TOKENS.colors.muted} />
          <TextInput
            value={localQuery}
            onChangeText={setLocalQuery}
            placeholder={t('chat.search_placeholder', 'Search chats')}
            placeholderTextColor={DESIGN_TOKENS.colors.faint}
            style={styles.searchInput}
            accessibilityLabel={t('chat.search_placeholder', 'Search chats')}
          />
          {localQuery ? (
            <ScalePressable
              onPress={() => setLocalQuery('')}
              hitSlop={{ top: theme.spacing.sm, bottom: theme.spacing.sm, left: theme.spacing.sm, right: theme.spacing.sm }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'Close')}
            >
              <Ionicons name="close-circle" size={theme.spacing.lg} color={DESIGN_TOKENS.colors.faint} />
            </ScalePressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                style={[styles.pill, selected ? styles.pillSelected : styles.pillDefault]}
              >
                <AppText
                  variant="caption"
                  style={[styles.pillText, selected ? styles.pillTextSelected : styles.pillTextDefault]}
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
              style={[styles.pill, active ? styles.pillSelected : styles.pillDefault]}
            >
              <AppText variant="caption" style={[styles.pillText, active ? styles.pillTextSelected : styles.pillTextDefault]}>
                {label}
              </AppText>
            </ScalePressable>
          ))}
        </ScrollView>
      </View>

      {agents.length > 0 ? (
        <View style={styles.personasCard}>
          <View style={styles.personasHeader}>
            <AppText variant="h3" style={styles.personasTitle}>
              {t('chat.personas', 'Personas')}
            </AppText>
            <AppText variant="caption" style={styles.personasCount}>
              {activeFilterCount > 0
                ? t('chat.active_filters', { count: activeFilterCount, defaultValue: '{{count}} filters' })
                : agents.length}
            </AppText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <ScalePressable
              onPress={() => onSelectAgent(null)}
              style={[styles.pill, selectedAgentId ? styles.pillDefault : styles.pillSelected]}
            >
              <AppText
                variant="caption"
                style={[styles.pillText, selectedAgentId ? styles.pillTextDefault : styles.pillTextSelected]}
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
        <AppText variant="h3" style={styles.listTitle}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="caption" style={styles.listCount}>
          {roomCount}
        </AppText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: DESIGN_TOKENS.colors.deep,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg + 2,
    marginBottom: theme.spacing.bubblePaddingH,
    overflow: 'hidden',
    ...DESIGN_TOKENS.shadow,
  },
  heroBubbleTopRight: {
    position: 'absolute',
    right: -26,
    top: -24,
    width: 132,
    height: 132,
    borderRadius: DESIGN_TOKENS.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroBubbleBottomRight: {
    position: 'absolute',
    right: theme.spacing.bubbleTimestampIndent,
    bottom: -48,
    width: 148,
    height: 148,
    borderRadius: DESIGN_TOKENS.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroSubtitle: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    ...theme.typography.h2,
    color: DESIGN_TOKENS.colors.white,
    fontWeight: '700',
    marginBottom: theme.spacing.xs + 2,
  },
  heroDescription: {
    ...theme.typography.bodySm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterCard: {
    backgroundColor: DESIGN_TOKENS.colors.white,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    padding: theme.spacing.bubblePaddingH,
    marginBottom: theme.spacing.md,
    ...DESIGN_TOKENS.shadow,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md + 2,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
    paddingHorizontal: theme.spacing.bubblePaddingV,
    marginBottom: theme.spacing.bubblePaddingV,
  },
  searchInput: {
    flex: 1,
    height: theme.spacing.inputBarMinHeight - 2,
    ...theme.typography.bodySm,
    marginLeft: theme.spacing.sm,
    color: DESIGN_TOKENS.colors.text,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  pill: {
    marginRight: theme.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
  },
  pillSelected: {
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    borderColor: `${DESIGN_TOKENS.colors.primary}73`,
  },
  pillDefault: {
    backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  pillText: {
    ...theme.typography.caption,
    fontWeight: '700',
  },
  pillTextSelected: {
    color: DESIGN_TOKENS.colors.primary,
  },
  pillTextDefault: {
    color: DESIGN_TOKENS.colors.muted,
  },
  personasCard: {
    backgroundColor: DESIGN_TOKENS.colors.white,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    paddingVertical: theme.spacing.bubblePaddingH,
    marginBottom: theme.spacing.md,
    ...DESIGN_TOKENS.shadow,
  },
  personasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.bubblePaddingV,
    paddingHorizontal: theme.spacing.bubblePaddingH,
  },
  personasTitle: {
    ...theme.typography.h3,
    color: DESIGN_TOKENS.colors.text,
    fontWeight: '700',
  },
  personasCount: {
    ...theme.typography.caption,
    color: DESIGN_TOKENS.colors.muted,
    fontWeight: '700',
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
    paddingHorizontal: theme.spacing.bubblePaddingH,
  },
  listTitle: {
    ...theme.typography.h3,
    color: DESIGN_TOKENS.colors.text,
    fontWeight: '700',
  },
  listCount: {
    ...theme.typography.caption,
    color: DESIGN_TOKENS.colors.muted,
  },
});
