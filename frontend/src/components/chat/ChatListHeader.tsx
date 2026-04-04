import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TextInput, View } from 'react-native';
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.surfaceHigh,
            paddingHorizontal: 10,
            marginBottom: 10,
          }}
        >
          <Ionicons name="search" size={16} color={C.muted} />
          <TextInput
            value={localQuery}
            onChangeText={setLocalQuery}
            placeholder={t('chat.search_placeholder', 'Search chats')}
            placeholderTextColor={C.faint}
            style={{ flex: 1, height: 42, color: C.text, marginLeft: 8, fontSize: 14 }}
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
                className="me-2 rounded-full px-3 py-2"
                style={{
                  backgroundColor: selected ? C.primarySoft : C.surfaceHigh,
                  borderWidth: 1,
                  borderColor: selected ? `${C.primary}45` : C.border,
                }}
              >
                <AppText
                  variant="caption"
                  style={{ color: selected ? C.primary : C.muted, fontWeight: '700' }}
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
              className="me-2 rounded-full px-3 py-2"
              style={{
                backgroundColor: active ? C.primarySoft : C.surfaceHigh,
                borderWidth: 1,
                borderColor: active ? `${C.primary}45` : C.border,
              }}
            >
              <AppText variant="caption" style={{ color: active ? C.primary : C.muted, fontWeight: '700' }}>
                {label}
              </AppText>
            </ScalePressable>
          ))}
        </ScrollView>
      </View>

      {agents.length > 0 ? (
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: C.border,
            paddingVertical: 14,
            marginBottom: 12,
            ...DESIGN_TOKENS.shadow,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              marginBottom: 10,
            }}
          >
            <AppText variant="h3" style={{ color: C.text, fontWeight: '700' }}>
              {t('chat.personas', 'Personas')}
            </AppText>
            <AppText variant="caption" style={{ color: C.muted, fontWeight: '700' }}>
              {activeFilterCount > 0
                ? t('chat.active_filters', { count: activeFilterCount, defaultValue: '{{count}} filters' })
                : agents.length}
            </AppText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <ScalePressable
              onPress={() => onSelectAgent(null)}
              className="me-2 rounded-full px-3 py-2"
              style={{
                backgroundColor: selectedAgentId ? C.surfaceHigh : C.primarySoft,
                borderWidth: 1,
                borderColor: selectedAgentId ? C.border : `${C.primary}45`,
              }}
            >
              <AppText variant="caption" style={{ color: selectedAgentId ? C.muted : C.primary, fontWeight: '700' }}>
                {t('chat.all_agents', 'All')}
              </AppText>
            </ScalePressable>
            {agents.map((item) => (
              <View key={item.id} style={{ marginRight: 8 }}>
                <AgentPill
                  agent={item}
                  onPress={() => onSelectAgent(selectedAgentId === item.id ? null : item.id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View
        style={{
          marginBottom: 12,
          marginTop: 2,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <AppText variant="h3" style={{ color: C.text, fontWeight: '700' }}>
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText variant="caption" style={{ color: C.muted }}>
          {roomCount}
        </AppText>
      </View>
    </>
  );
}
