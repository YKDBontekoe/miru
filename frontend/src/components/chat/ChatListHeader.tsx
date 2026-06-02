import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, TextInput, View } from 'react-native';
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

const FilterItemComponent = React.memo(({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <ScalePressable
    onPress={onPress}
    className={`me-2 rounded-full px-3 py-2 border ${
      selected
        ? 'bg-[#DDF4EB] border-[#147D6473]'
        : 'bg-[#ECF5F0] border-[#DDE8E0]'
    }`}
  >
    <AppText
      variant="caption"
      className={`font-bold ${selected ? 'text-[#147D64]' : 'text-[#5A7467]'}`}
    >
      {label}
    </AppText>
  </ScalePressable>
));
FilterItemComponent.displayName = 'FilterItemComponent';

const AgentItemComponent = React.memo(({
  item,
  selectedAgentId,
  onSelectAgent,
}: {
  item: Agent;
  selectedAgentId: string | null;
  onSelectAgent: (id: string | null) => void;
}) => (
  <View style={{ marginRight: 8 }}>
    <AgentPill
      agent={item}
      onPress={() => onSelectAgent(selectedAgentId === item.id ? null : item.id)}
    />
  </View>
));
AgentItemComponent.displayName = 'AgentItemComponent';

export const ChatListHeader = React.memo(function ChatListHeader({
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

  type FilterData =
    | { type: 'sort'; id: SortMode; label: string; selected: boolean; onPress: () => void }
    | { type: 'toggle'; id: string; label: string; selected: boolean; onPress: () => void };

  const filtersData = useMemo<FilterData[]>(() => {
    const sorts: FilterData[] = (
      [
        ['recent', t('chat.filter_recent', 'Recent')],
        ['mentions', t('chat.filter_mentions', 'Mentions')],
        ['tasks', t('chat.filter_tasks', 'Tasks')],
      ] as [SortMode, string][]
    ).map(([mode, label]) => ({
      type: 'sort',
      id: mode,
      label,
      selected: sortMode === mode,
      onPress: () => onChangeSortMode(mode),
    }));

    const toggles: FilterData[] = (
      [
        ['recent_only', recentOnly, onToggleRecentOnly, t('chat.recent_only', '7d')],
        ['unread_only', unreadOnly, onToggleUnreadOnly, t('chat.unread_only', 'Unread')],
      ] as const
    ).map(([id, active, onToggle, label]) => ({
      type: 'toggle',
      id,
      label,
      selected: active,
      onPress: onToggle,
    }));

    return [...sorts, ...toggles];
  }, [
    t,
    sortMode,
    onChangeSortMode,
    recentOnly,
    onToggleRecentOnly,
    unreadOnly,
    onToggleUnreadOnly,
  ]);

  const renderFilterItem = useCallback(
    ({ item }: { item: FilterData }) => {
      return (
        <FilterItemComponent
          label={item.label}
          selected={item.selected}
          onPress={item.onPress}
        />
      );
    },
    []
  );

  const filterKeyExtractor = useCallback((item: FilterData) => item.id, []);

  const agentsData = useMemo(() => {
    return [{ id: 'all', isAllItem: true } as const, ...agents];
  }, [agents]);

  const renderAgentItem = useCallback(
    ({ item }: { item: typeof agentsData[number] }) => {
      if ('isAllItem' in item) {
        return (
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
        );
      }
      return (
        <AgentItemComponent
          item={item}
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
        />
      );
    },
    [selectedAgentId, onSelectAgent, t]
  );

  const agentKeyExtractor = useCallback((item: typeof agentsData[number]) => item.id, []);

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
          data={filtersData}
          keyExtractor={filterKeyExtractor}
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
            contentContainerClassName="px-4"
            data={agentsData}
            keyExtractor={agentKeyExtractor}
            renderItem={renderAgentItem}
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
