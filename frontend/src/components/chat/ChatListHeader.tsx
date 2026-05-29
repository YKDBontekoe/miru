import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, TextInput, View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { AgentPill } from '@/components/chat/AgentPill';
import { DESIGN_TOKENS } from '@/core/design/tokens';
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

interface FilterItem {
  key: string;
  type: 'sort' | 'toggle';
  mode?: SortMode;
  label: string;
  active: boolean;
  onPress: () => void;
}

const renderFilterItem = ({ item }: { item: FilterItem }) => (
  <ScalePressable
    onPress={item.onPress}
    style={[
      styles.filterPill,
      item.active ? styles.filterPillActive : styles.filterPillInactive
    ]}
  >
    <AppText
      variant="caption"
      style={[
        styles.filterPillText,
        item.active ? styles.filterTextActive : styles.filterTextInactive
      ]}
    >
      {item.label}
    </AppText>
  </ScalePressable>
);

const renderAgentItem = ({ item }: { item: Agent | { id: 'all'; isAllItem: true } }, selectedAgentId: string | null, onSelectAgent: (agentId: string | null) => void, t: any) => {
  if ('isAllItem' in item) {
    const isSelected = selectedAgentId === null;
    return (
      <ScalePressable
        onPress={() => onSelectAgent(null)}
        style={[
          styles.allAgentsPill,
          isSelected ? styles.allAgentsActive : styles.allAgentsInactive
        ]}
      >
        <AppText
          variant="caption"
          style={[
            styles.allAgentsText,
            isSelected ? styles.allAgentsTextActive : styles.allAgentsTextInactive
          ]}
        >
          {t('chat.all_agents', 'All')}
        </AppText>
      </ScalePressable>
    );
  }
  return (
    <View style={{ marginRight: 8 }}>
      <AgentPill
        agent={item}
        onPress={() => onSelectAgent(selectedAgentId === item.id ? null : item.id)}
      />
    </View>
  );
};

export const ChatListHeader = memo(({
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
}: ChatListHeaderProps) => {
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => onChangeQuery(localQuery), 300);
    return () => clearTimeout(timer);
  }, [localQuery, onChangeQuery]);

  const filterItems = useMemo<FilterItem[]>(() => [
    { key: 'sort-recent', type: 'sort', mode: 'recent', label: t('chat.filter_recent', 'Recent'), active: sortMode === 'recent', onPress: () => onChangeSortMode('recent') },
    { key: 'sort-mentions', type: 'sort', mode: 'mentions', label: t('chat.filter_mentions', 'Mentions'), active: sortMode === 'mentions', onPress: () => onChangeSortMode('mentions') },
    { key: 'sort-tasks', type: 'sort', mode: 'tasks', label: t('chat.filter_tasks', 'Tasks'), active: sortMode === 'tasks', onPress: () => onChangeSortMode('tasks') },
    { key: 'toggle-recent', type: 'toggle', label: t('chat.recent_only', '7d'), active: recentOnly, onPress: onToggleRecentOnly },
    { key: 'toggle-unread', type: 'toggle', label: t('chat.unread_only', 'Unread'), active: unreadOnly, onPress: onToggleUnreadOnly }
  ], [sortMode, recentOnly, unreadOnly, onChangeSortMode, onToggleRecentOnly, onToggleUnreadOnly, t]);

  const agentsListData = useMemo(() => {
    return [{ id: 'all', isAllItem: true } as const, ...agents];
  }, [agents]);

  const renderAgent = useCallback(
    ({ item }: { item: Agent | { id: 'all'; isAllItem: true } }) => renderAgentItem({ item }, selectedAgentId, onSelectAgent, t),
    [selectedAgentId, onSelectAgent, t]
  );

  return (
    <>
      <View className="rounded-[28px] bg-[#0F3D31] p-[18px] mb-[14px] overflow-hidden shadow-md">
        <View className="absolute -right-[26px] -top-[24px] w-[132px] h-[132px] rounded-full bg-white/10" />
        <View className="absolute right-[36px] -bottom-[48px] w-[148px] h-[148px] rounded-full bg-white/5" />
        <AppText variant="caption" className="text-white/80 mb-1">
          {t('chat.title', 'Miru')}
        </AppText>
        <AppText variant="h2" className="text-white font-bold mb-1.5">
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="bodySm" className="text-white/80">
          {t('chat.design_subtitle', 'Search, pin, and continue the right conversation fast.')}
        </AppText>
      </View>

      <View className="bg-white rounded-3xl border border-[#DDE8E0] p-[14px] mb-3 shadow-md">
        <View className="flex-row items-center rounded-[14px] border border-[#DDE8E0] bg-[#ECF5F0] px-2.5 mb-2.5">
          <Ionicons name="search" size={16} color={C.muted} />
          <TextInput
            value={localQuery}
            onChangeText={setLocalQuery}
            placeholder={t('chat.search_placeholder', 'Search chats')}
            placeholderTextColor={C.faint}
            className="flex-1 h-[42px] text-[14px] ml-2 text-[#13251C]"
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

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterItems}
          keyExtractor={(item) => item.key}
          renderItem={renderFilterItem}
        />
      </View>

      {agents.length > 0 ? (
        <View className="bg-white rounded-3xl border border-[#DDE8E0] py-[14px] mb-3 shadow-md">
          <View className="flex-row justify-between items-center px-4 mb-2.5">
            <AppText variant="h3" className="text-[#13251C] font-bold">
              {t('chat.personas', 'Personas')}
            </AppText>
            <AppText variant="caption" className="text-[#5A7467] font-bold">
              {activeFilterCount > 0
                ? t('chat.active_filters', { count: activeFilterCount, defaultValue: '{{count}} filters' })
                : agents.length}
            </AppText>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.agentsContainer}
            data={agentsListData}
            keyExtractor={(item) => item.id}
            renderItem={renderAgent}
          />
        </View>
      ) : null}

      <View className="mb-3 mt-0.5 flex-row justify-between items-center">
        <AppText variant="h3" className="text-[#13251C] font-bold">
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="caption" className="text-[#5A7467]">
          {roomCount}
        </AppText>
      </View>
    </>
  );
});
ChatListHeader.displayName = 'ChatListHeader';

const styles = StyleSheet.create({
  filterPill: {
    marginRight: 8,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: '#DDF4EB',
    borderColor: '#147D6473',
  },
  filterPillInactive: {
    backgroundColor: '#ECF5F0',
    borderColor: '#DDE8E0',
  },
  filterPillText: {
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#147D64',
  },
  filterTextInactive: {
    color: '#5A7467',
  },
  agentsContainer: {
    paddingHorizontal: 16,
  },
  allAgentsPill: {
    marginRight: 8,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  allAgentsActive: {
    backgroundColor: '#DDF4EB',
    borderColor: '#147D6473',
  },
  allAgentsInactive: {
    backgroundColor: '#ECF5F0',
    borderColor: '#DDE8E0',
  },
  allAgentsText: {
    fontWeight: 'bold',
  },
  allAgentsTextActive: {
    color: '#147D64',
  },
  allAgentsTextInactive: {
    color: '#5A7467',
  },
});
