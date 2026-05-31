import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TextInput, View, StyleSheet, Platform } from 'react-native';
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
  white: DESIGN_TOKENS.colors.white,
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
        <View style={styles.heroCircleTop} />
        <View style={styles.heroCircleBottom} />
        <AppText variant="caption" style={styles.heroPreTitle}>
          {t('chat.title', 'Miru')}
        </AppText>
        <AppText variant="h2" style={styles.heroTitle}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="bodySm" style={styles.heroSubtitle}>
          {t('chat.design_subtitle', 'Search, pin, and continue the right conversation fast.')}
        </AppText>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.searchContainer}>
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
                style={[styles.filterPill, selected ? styles.filterPillActive : styles.filterPillInactive]}
              >
                {selected ? <View style={styles.filterPillActiveBorder} /> : null}
                <AppText
                  variant="caption"
                  style={[styles.filterPillText, selected ? styles.filterPillTextActive : styles.filterPillTextInactive]}
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
              style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive]}
            >
              {active ? <View style={styles.filterPillActiveBorder} /> : null}
              <AppText variant="caption" style={[styles.filterPillText, active ? styles.filterPillTextActive : styles.filterPillTextInactive]}>
                {label}
              </AppText>
            </ScalePressable>
          ))}
        </ScrollView>
      </View>

      {agents.length > 0 ? (
        <View style={styles.personasCardContainer}>
          <View style={styles.personasHeader}>
            <AppText variant="h3" style={styles.personasTitle}>
              {t('chat.personas', 'Personas')}
            </AppText>
            <AppText variant="caption" style={styles.personasFilterCount}>
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
              style={[styles.filterPill, !selectedAgentId ? styles.filterPillActive : styles.filterPillInactive]}
            >
              {!selectedAgentId ? <View style={styles.filterPillActiveBorder} /> : null}
              <AppText
                variant="caption"
                style={[styles.filterPillText, !selectedAgentId ? styles.filterPillTextActive : styles.filterPillTextInactive]}
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

      <View style={styles.listHeaderContainer}>
        <AppText variant="h3" style={styles.listHeaderTitle}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="caption" style={styles.listHeaderCount}>
          {roomCount}
        </AppText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    borderRadius: 28,
    backgroundColor: C.deep,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: theme.elevation.md,
      android: {
        ...theme.elevation.md,
        elevation: theme.elevation.md.elevation,
        shadowColor: DESIGN_TOKENS.colors.deep,
      },
    }),
  },
  heroCircleTop: {
    position: 'absolute',
    right: -26,
    top: -24,
    width: 132,
    height: 132,
    borderRadius: DESIGN_TOKENS.radius.full,
    backgroundColor: C.white,
    opacity: 0.1,
  },
  heroCircleBottom: {
    position: 'absolute',
    right: 36,
    bottom: -48,
    width: 148,
    height: 148,
    borderRadius: DESIGN_TOKENS.radius.full,
    backgroundColor: C.white,
    opacity: 0.05,
  },
  heroPreTitle: {
    color: C.white,
    opacity: 0.8,
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    color: C.white,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: C.white,
    opacity: 0.8,
  },
  cardContainer: {
    backgroundColor: C.white,
    borderRadius: 24, // Approximation of rounded-3xl
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: theme.elevation.md,
      android: {
        ...theme.elevation.md,
        elevation: theme.elevation.md.elevation,
        shadowColor: DESIGN_TOKENS.colors.deep,
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceHigh,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    marginLeft: theme.spacing.sm,
    color: C.text,
  },
  filterPill: {
    marginRight: theme.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: C.primarySoft,
    borderColor: 'transparent', // The border will be managed by absolute view for opacity
  },
  filterPillActiveBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DESIGN_TOKENS.radius.full,
    borderWidth: 1,
    borderColor: C.primary,
    opacity: 0.45, // 73 in hex is ~45%
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
  personasCardContainer: {
    backgroundColor: C.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: theme.elevation.md,
      android: {
        ...theme.elevation.md,
        elevation: theme.elevation.md.elevation,
        shadowColor: DESIGN_TOKENS.colors.deep,
      },
    }),
  },
  personasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 10,
  },
  personasTitle: {
    color: C.text,
    fontWeight: 'bold',
  },
  personasFilterCount: {
    color: C.muted,
    fontWeight: 'bold',
  },
  personasScrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  agentPillWrapper: {
    marginRight: theme.spacing.sm,
  },
  listHeaderContainer: {
    marginBottom: theme.spacing.md,
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHeaderTitle: {
    color: C.text,
    fontWeight: 'bold',
  },
  listHeaderCount: {
    color: C.muted,
  },
});
