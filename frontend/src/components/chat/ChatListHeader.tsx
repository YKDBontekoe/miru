import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TextInput, View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { AgentPill } from '@/components/chat/AgentPill';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';
import { Agent } from '@/core/models';

const C = {
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  deep: DESIGN_TOKENS.colors.deep,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
  primarySoft: DESIGN_TOKENS.colors.primarySoft,
};

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
      <View style={styles.heroContainer}>
        <View style={styles.heroDecorTopRight} />
        <View style={styles.heroDecorBottomRight} />
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

      <View style={styles.searchFilterCard}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={C.muted} />
          <TextInput
            value={localQuery}
            onChangeText={setLocalQuery}
            placeholder={t('chat.search_placeholder', 'Search chats')}
            placeholderTextColor={C.faint}
            style={styles.searchInput}
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
                  selected ? styles.filterPillActive : styles.filterPillInactive,
                ]}
              >
                <AppText
                  variant="caption"
                  style={[
                    styles.filterPillText,
                    selected ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
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
                active ? styles.filterPillActive : styles.filterPillInactive,
              ]}
            >
              <AppText
                variant="caption"
                style={[
                  styles.filterPillText,
                  active ? styles.filterPillTextActive : styles.filterPillTextInactive,
                ]}
              >
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
            <AppText variant="caption" style={styles.personasSubtitle}>
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
                selectedAgentId ? styles.filterPillInactive : styles.filterPillActive,
              ]}
            >
              <AppText
                variant="caption"
                style={[
                  styles.filterPillText,
                  selectedAgentId ? styles.filterPillTextInactive : styles.filterPillTextActive,
                ]}
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

      <View style={styles.chatListHeader}>
        <AppText variant="h3" style={styles.chatListTitle}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="caption" style={styles.chatListSubtitle}>
          {roomCount}
        </AppText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    borderRadius: theme.borderRadius.xl + theme.spacing.xs,
    backgroundColor: C.deep,
    padding: theme.spacing.lg + 2,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...DESIGN_TOKENS.shadow,
  },
  heroDecorTopRight: {
    position: 'absolute',
    right: -theme.spacing.xl - 6,
    top: -theme.spacing.xl - 4,
    width: theme.spacing.colossal * 2 + 4,
    height: theme.spacing.colossal * 2 + 4,
    borderRadius: theme.spacing.colossal + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroDecorBottomRight: {
    position: 'absolute',
    right: theme.spacing.xxxl + 4,
    bottom: -theme.spacing.massive,
    width: theme.spacing.colossal * 2 + theme.spacing.xl,
    height: theme.spacing.colossal * 2 + theme.spacing.xl,
    borderRadius: theme.spacing.colossal + theme.spacing.xs + 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    color: DESIGN_TOKENS.colors.white,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm - 2,
  },
  heroDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchFilterCard: {
    backgroundColor: C.surface,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: theme.spacing.md + 2,
    marginBottom: theme.spacing.md,
    ...DESIGN_TOKENS.shadow,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md + 2,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceHigh,
    paddingHorizontal: theme.spacing.md - 2,
    marginBottom: theme.spacing.md - 2,
  },
  searchInput: {
    flex: 1,
    height: theme.spacing.huge + 2,
    fontSize: theme.typography.bodySm.fontSize,
    marginLeft: theme.spacing.sm,
    color: C.text,
  },
  filterPill: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: C.primarySoft,
    borderColor: `${C.primary}73`,
  },
  filterPillInactive: {
    backgroundColor: C.surfaceHigh,
    borderColor: C.border,
  },
  filterPillText: {
    fontWeight: 'bold',
  },
  filterPillTextActive: {
    color: C.primary,
  },
  filterPillTextInactive: {
    color: C.muted,
  },
  personasCard: {
    backgroundColor: C.surface,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: theme.spacing.md + 2,
    marginBottom: theme.spacing.md,
    ...DESIGN_TOKENS.shadow,
  },
  personasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md - 2,
  },
  personasTitle: {
    color: C.text,
    fontWeight: 'bold',
  },
  personasSubtitle: {
    color: C.muted,
    fontWeight: 'bold',
  },
  personasScrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  chatListHeader: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatListTitle: {
    color: C.text,
    fontWeight: 'bold',
  },
  chatListSubtitle: {
    color: C.muted,
  },
});
