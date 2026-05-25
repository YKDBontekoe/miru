import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TextInput, View, StyleSheet, Platform } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { AgentPill } from '@/components/chat/AgentPill';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { Agent } from '@/core/models';
import { theme } from '@/core/theme';

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
        <View style={styles.heroCircleTopRight} />
        <View style={styles.heroCircleBottomRight} />
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

      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
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
                  selected ? styles.filterPillSelected : styles.filterPillUnselected
                ]}
              >
                <AppText
                  variant="caption"
                  style={[
                    styles.filterPillText,
                    selected ? styles.filterPillTextSelected : styles.filterPillTextUnselected
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
                active ? styles.filterPillSelected : styles.filterPillUnselected
              ]}
            >
              <AppText
                variant="caption"
                style={[
                  styles.filterPillText,
                  active ? styles.filterPillTextSelected : styles.filterPillTextUnselected
                ]}
              >
                {label}
              </AppText>
            </ScalePressable>
          ))}
        </ScrollView>
      </View>

      {agents.length > 0 ? (
        <View style={styles.personasSection}>
          <View style={styles.personasHeaderRow}>
            <AppText variant="h3" style={styles.sectionTitle}>
              {t('chat.personas', 'Personas')}
            </AppText>
            <AppText variant="caption" style={styles.personasCountText}>
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
                !selectedAgentId ? styles.filterPillSelected : styles.filterPillUnselected
              ]}
            >
              <AppText
                variant="caption"
                style={[
                  styles.filterPillText,
                  !selectedAgentId ? styles.filterPillTextSelected : styles.filterPillTextUnselected
                ]}
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

      <View style={styles.listHeaderRow}>
        <AppText variant="h3" style={styles.sectionTitle}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="caption" style={styles.listHeaderCountText}>
          {roomCount}
        </AppText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    borderRadius: theme.spacing.avatar,
    backgroundColor: DESIGN_TOKENS.colors.deep,
    padding: 18,
    marginBottom: theme.spacing.bubblePaddingH,
    overflow: 'hidden',
    ...Platform.select({
      ios: theme.elevation.md,
      android: theme.elevation.sm,
    }),
  },
  heroCircleTopRight: {
    position: 'absolute',
    right: -26,
    top: -24,
    width: 132,
    height: 132,
    borderRadius: theme.borderRadius.full,
    backgroundColor: DESIGN_TOKENS.colors.overlayWhite10,
  },
  heroCircleBottomRight: {
    position: 'absolute',
    right: 36,
    bottom: -48,
    width: 148,
    height: 148,
    borderRadius: theme.borderRadius.full,
    backgroundColor: DESIGN_TOKENS.colors.overlayWhite05,
  },
  heroPreTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    color: DESIGN_TOKENS.colors.white,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchSection: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    padding: theme.spacing.bubblePaddingH,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: theme.elevation.md,
      android: theme.elevation.sm,
    }),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.spacing.bubblePaddingH,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: theme.typography.bodySm.fontSize,
    marginLeft: theme.spacing.sm,
    color: DESIGN_TOKENS.colors.text,
  },
  filterPill: {
    marginEnd: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
  },
  filterPillSelected: {
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    borderColor: `${DESIGN_TOKENS.colors.primary}73`, // 73 is ~45% hex opacity
  },
  filterPillUnselected: {
    backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  filterPillText: {
    fontWeight: 'bold',
  },
  filterPillTextSelected: {
    color: DESIGN_TOKENS.colors.primary,
  },
  filterPillTextUnselected: {
    color: DESIGN_TOKENS.colors.muted,
  },
  personasSection: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    paddingVertical: theme.spacing.bubblePaddingH,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: theme.elevation.md,
      android: theme.elevation.sm,
    }),
  },
  personasHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 10,
  },
  sectionTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontWeight: 'bold',
  },
  personasCountText: {
    color: DESIGN_TOKENS.colors.muted,
    fontWeight: 'bold',
  },
  personasScrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  listHeaderRow: {
    marginBottom: theme.spacing.md,
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHeaderCountText: {
    color: DESIGN_TOKENS.colors.muted,
  },
  agentPillWrapper: {
    marginRight: theme.spacing.sm,
  },
});
