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
      <View style={[styles.heroContainer, { backgroundColor: C.primary }]}>
        <View style={[styles.heroCircleLarge, { backgroundColor: C.surface, opacity: 0.1 }]} />
        <View style={[styles.heroCircleSmall, { backgroundColor: C.surface, opacity: 0.05 }]} />
        <AppText variant="caption" style={[styles.heroCaption, { color: C.surface, opacity: 0.8 }]}>
          {t('chat.title', 'Miru')}
        </AppText>
        <AppText variant="h2" style={[styles.heroTitle, { color: C.surface }]}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="bodySm" style={[styles.heroSubtitle, { color: C.surface, opacity: 0.8 }]}>
          {t('chat.design_subtitle', 'Search, pin, and continue the right conversation fast.')}
        </AppText>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.searchInputWrapper, { borderColor: C.border, backgroundColor: C.surfaceHigh }]}>
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
                    borderColor: selected ? C.primary : C.border,
                    backgroundColor: selected ? C.surface : C.surfaceHigh,
                  },
                ]}
              >
                {selected ? (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.1 }]} />
                ) : null}
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
                  borderColor: active ? C.primary : C.border,
                  backgroundColor: active ? C.surface : C.surfaceHigh,
                },
              ]}
            >
              {active ? (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.1 }]} />
              ) : null}
              <AppText variant="caption" style={[styles.filterPillText, { color: active ? C.primary : C.muted }]}>
                {label}
              </AppText>
            </ScalePressable>
          ))}
        </ScrollView>
      </View>

      {agents.length > 0 ? (
        <View style={[styles.personasContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
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
                  borderColor: selectedAgentId ? C.border : C.primary,
                  backgroundColor: selectedAgentId ? C.surfaceHigh : C.surface,
                },
              ]}
            >
              {!selectedAgentId ? (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.1 }]} />
              ) : null}
              <AppText
                variant="caption"
                style={[styles.filterPillText, { color: selectedAgentId ? C.muted : C.primary }]}
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

      <View style={styles.headerTitleRow}>
        <AppText variant="h3" style={[styles.headerTitle, { color: C.text }]}>
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
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroCircleLarge: {
    position: 'absolute',
    right: -26,
    top: -24,
    width: 132,
    height: 132,
    borderRadius: 66,
  },
  heroCircleSmall: {
    position: 'absolute',
    right: 36,
    bottom: -48,
    width: 148,
    height: 148,
    borderRadius: 74,
  },
  heroCaption: {
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  heroSubtitle: {
    // defaults from variant
  },
  searchContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    marginLeft: theme.spacing.sm,
  },
  filterPill: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  filterPillText: {
    fontWeight: 'bold',
  },
  personasContainer: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  personasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 10,
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
  headerTitleRow: {
    marginBottom: theme.spacing.md,
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
});
