import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, View, FlatList } from 'react-native';
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

const FilterItemCell = React.memo(({
  label,
  active,
  onPress
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <ScalePressable
    onPress={onPress}
    className={`me-2 rounded-full px-3 py-2 border ${
      active
        ? 'bg-[#DDF4EB] border-[#147D6473]'
        : 'bg-[#ECF5F0] border-[#DDE8E0]'
    }`}
  >
    <AppText
      variant="caption"
      className={`font-bold ${active ? 'text-[#147D64]' : 'text-[#5A7467]'}`}
    >
      {label}
    </AppText>
  </ScalePressable>
));

const AgentItemCell = React.memo(({
  agent,
  selectedAgentId,
  onSelectAgent
}: {
  agent: Agent;
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string | null) => void;
}) => (
  <View style={{ marginRight: 8 }}>
    <AgentPill
      agent={agent}
      onPress={() => onSelectAgent(selectedAgentId === agent.id ? null : agent.id)}
    />
  </View>
));

export const ChatListHeader = React.memo(({
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

  const filterItems = useMemo(() => [
    { id: 'sort-recent', type: 'sort' as const, mode: 'recent' as SortMode, label: t('chat.filter_recent', 'Recent') },
    { id: 'sort-mentions', type: 'sort' as const, mode: 'mentions' as SortMode, label: t('chat.filter_mentions', 'Mentions') },
    { id: 'sort-tasks', type: 'sort' as const, mode: 'tasks' as SortMode, label: t('chat.filter_tasks', 'Tasks') },
    { id: 'filter-recent', type: 'filter' as const, active: recentOnly, onToggle: onToggleRecentOnly, label: t('chat.recent_only', '7d') },
    { id: 'filter-unread', type: 'filter' as const, active: unreadOnly, onToggle: onToggleUnreadOnly, label: t('chat.unread_only', 'Unread') },
  ], [t, recentOnly, onToggleRecentOnly, unreadOnly, onToggleUnreadOnly]);

  const renderFilterItem = useCallback(({ item }: { item: typeof filterItems[0] }) => {
    if (item.type === 'sort') {
      return (
        <FilterItemCell
          label={item.label}
          active={sortMode === item.mode}
          onPress={() => onChangeSortMode(item.mode!)}
        />
      );
    } else {
      return (
        <FilterItemCell
          label={item.label}
          active={item.active!}
          onPress={item.onToggle!}
        />
      );
    }
  }, [sortMode, onChangeSortMode]);

  const filterKeyExtractor = useCallback((item: typeof filterItems[0]) => item.id, []);

  const renderAgentItem = useCallback(({ item }: { item: Agent }) => (
    <AgentItemCell
      agent={item}
      selectedAgentId={selectedAgentId}
      onSelectAgent={onSelectAgent}
    />
  ), [selectedAgentId, onSelectAgent]);

  const agentKeyExtractor = useCallback((item: Agent) => item.id, []);

  const AllAgentsHeader = useCallback(() => (
    <ScalePressable
      onPress={() => onSelectAgent(null)}
      className={`me-2 rounded-full px-3 py-2 border ${
        selectedAgentId ? 'bg-[#ECF5F0] border-[#DDE8E0]' : 'bg-[#DDF4EB] border-[#147D6473]'
      }`}
    >
      <AppText
        variant="caption"
        className={`font-bold ${selectedAgentId ? 'text-[#5A7467]' : 'text-[#147D64]'}`}
      >
        {t('chat.all_agents', 'All')}
      </AppText>
    </ScalePressable>
  ), [onSelectAgent, selectedAgentId, t]);

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
          renderItem={renderFilterItem}
          keyExtractor={filterKeyExtractor}
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
            contentContainerClassName="px-4"
            data={agents}
            renderItem={renderAgentItem}
            keyExtractor={agentKeyExtractor}
            ListHeaderComponent={<AllAgentsHeader />}
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
FilterItemCell.displayName = 'FilterItemCell';
AgentItemCell.displayName = 'AgentItemCell';
ChatListHeader.displayName = 'ChatListHeader';
