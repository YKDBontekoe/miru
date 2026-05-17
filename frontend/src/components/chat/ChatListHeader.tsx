import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { AgentPill } from '@/components/chat/AgentPill';
import { DESIGN_TOKENS, OPACITY } from '@/core/design/tokens';
import { theme, BUBBLE_DECORATIONS } from '@/core/theme';
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
      <View
        className="rounded-[28px] bg-[#0F3D31] p-[18px] mb-[14px] overflow-hidden shadow-md"
        style={{
          backgroundColor: DESIGN_TOKENS.colors.deep,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.heroCardPadding,
          marginBottom: theme.spacing.bubblePaddingH,
          ...DESIGN_TOKENS.shadow,
        }}
      >
        <View
          className="absolute -right-[26px] -top-[24px] w-[132px] h-[132px] rounded-full bg-white/10"
          style={{
            position: 'absolute',
            right: -26,
            top: -24,
            width: BUBBLE_DECORATIONS.topRight.size,
            height: BUBBLE_DECORATIONS.topRight.size,
            borderRadius: DESIGN_TOKENS.radius.full,
            backgroundColor: OPACITY.bubbleOverlay,
          }}
        />
        <View
          className="absolute right-[36px] -bottom-[48px] w-[148px] h-[148px] rounded-full bg-white/5"
          style={{
            position: 'absolute',
            right: theme.spacing.bubbleTimestampIndent,
            bottom: -48,
            width: BUBBLE_DECORATIONS.bottomRight.size,
            height: BUBBLE_DECORATIONS.bottomRight.size,
            borderRadius: DESIGN_TOKENS.radius.full,
            backgroundColor: OPACITY.bubbleSubtle,
          }}
        />
        <AppText
          variant="caption"
          className="text-white/80 mb-1"
          style={{
            ...theme.typography.caption,
            color: OPACITY.heroText,
            marginBottom: theme.spacing.xs,
          }}
        >
          {t('chat.title', 'Miru')}
        </AppText>
        <AppText
          variant="h2"
          className="text-white font-bold mb-1.5"
          style={{
            ...theme.typography.h2,
            color: DESIGN_TOKENS.colors.white,
            fontWeight: '700',
            marginBottom: theme.spacing.xs + 2,
          }}
        >
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText
          variant="bodySm"
          className="text-white/80"
          style={{
            ...theme.typography.bodySm,
            color: OPACITY.heroText,
          }}
        >
          {t('chat.design_subtitle', 'Search, pin, and continue the right conversation fast.')}
        </AppText>
      </View>

      <View
        className="bg-white rounded-3xl border border-[#DDE8E0] p-[14px] mb-3 shadow-md"
        style={{
          backgroundColor: DESIGN_TOKENS.colors.white,
          borderRadius: theme.borderRadius.xxl,
          borderWidth: 1,
          borderColor: DESIGN_TOKENS.colors.border,
          padding: theme.spacing.bubblePaddingH,
          marginBottom: theme.spacing.md,
          ...DESIGN_TOKENS.shadow,
        }}
      >
        <View
          className="flex-row items-center rounded-[14px] border border-[#DDE8E0] bg-[#ECF5F0] px-2.5 mb-2.5"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: theme.borderRadius.md + 2,
            borderWidth: 1,
            borderColor: DESIGN_TOKENS.colors.border,
            backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
            paddingHorizontal: theme.spacing.bubblePaddingV,
            marginBottom: theme.spacing.bubblePaddingV,
          }}
        >
          <Ionicons name="search" size={theme.spacing.lg} color={DESIGN_TOKENS.colors.muted} />
          <TextInput
            value={localQuery}
            onChangeText={setLocalQuery}
            placeholder={t('chat.search_placeholder', 'Search chats')}
            placeholderTextColor={DESIGN_TOKENS.colors.faint}
            className="flex-1 h-[42px] text-[14px] ml-2 text-[#13251C]"
            style={{
              flex: 1,
              height: theme.spacing.inputBarMinHeight - 2,
              ...theme.typography.bodySm,
              marginLeft: theme.spacing.sm,
              color: DESIGN_TOKENS.colors.text,
            }}
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
        >
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
                className={`me-2 rounded-full px-3 py-2 border ${
                  selected
                    ? 'bg-[#DDF4EB] border-[#147D6473]'
                    : 'bg-[#ECF5F0] border-[#DDE8E0]'
                }`}
                style={{
                  marginRight: theme.spacing.sm,
                  borderRadius: DESIGN_TOKENS.radius.full,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderWidth: 1,
                  backgroundColor: selected ? DESIGN_TOKENS.colors.primarySoft : DESIGN_TOKENS.colors.surfaceSoft,
                  borderColor: selected ? `${DESIGN_TOKENS.colors.primary}${OPACITY.primaryBorder}` : DESIGN_TOKENS.colors.border,
                }}
              >
                <AppText
                  variant="caption"
                  className={`font-bold ${selected ? 'text-[#147D64]' : 'text-[#5A7467]'}`}
                  style={{
                    ...theme.typography.caption,
                    fontWeight: '700',
                    color: selected ? DESIGN_TOKENS.colors.primary : DESIGN_TOKENS.colors.muted,
                  }}
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
              className={`me-2 rounded-full px-3 py-2 border ${
                active ? 'bg-[#DDF4EB] border-[#147D6473]' : 'bg-[#ECF5F0] border-[#DDE8E0]'
              }`}
              style={{
                marginRight: theme.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.full,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderWidth: 1,
                backgroundColor: active ? DESIGN_TOKENS.colors.primarySoft : DESIGN_TOKENS.colors.surfaceSoft,
                borderColor: active ? `${DESIGN_TOKENS.colors.primary}${OPACITY.primaryBorder}` : DESIGN_TOKENS.colors.border,
              }}
            >
              <AppText
                variant="caption"
                className={`font-bold ${active ? 'text-[#147D64]' : 'text-[#5A7467]'}`}
                style={{
                  ...theme.typography.caption,
                  fontWeight: '700',
                  color: active ? DESIGN_TOKENS.colors.primary : DESIGN_TOKENS.colors.muted,
                }}
              >
                {label}
              </AppText>
            </ScalePressable>
          ))}
        </ScrollView>
      </View>

      {agents.length > 0 ? (
        <View
          className="bg-white rounded-3xl border border-[#DDE8E0] py-[14px] mb-3 shadow-md"
          style={{
            backgroundColor: DESIGN_TOKENS.colors.white,
            borderRadius: theme.borderRadius.xxl,
            borderWidth: 1,
            borderColor: DESIGN_TOKENS.colors.border,
            paddingVertical: theme.spacing.bubblePaddingH,
            marginBottom: theme.spacing.md,
            ...DESIGN_TOKENS.shadow,
          }}
        >
          <View
            className="flex-row justify-between items-center px-4 mb-2.5"
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing.bubblePaddingV,
              paddingHorizontal: theme.spacing.bubblePaddingH,
            }}
          >
            <AppText
              variant="h3"
              className="text-[#13251C] font-bold"
              style={{
                ...theme.typography.h3,
                color: DESIGN_TOKENS.colors.text,
                fontWeight: '700',
              }}
            >
              {t('chat.personas', 'Personas')}
            </AppText>
            <AppText
              variant="caption"
              className="text-[#5A7467] font-bold"
              style={{
                ...theme.typography.caption,
                color: DESIGN_TOKENS.colors.muted,
                fontWeight: '700',
              }}
            >
              {activeFilterCount > 0
                ? t('chat.active_filters', { count: activeFilterCount, defaultValue: '{{count}} filters' })
                : agents.length}
            </AppText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
          >
            <ScalePressable
              onPress={() => onSelectAgent(null)}
              className={`me-2 rounded-full px-3 py-2 border ${
                selectedAgentId ? 'bg-[#ECF5F0] border-[#DDE8E0]' : 'bg-[#DDF4EB] border-[#147D6473]'
              }`}
              style={{
                marginRight: theme.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.full,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderWidth: 1,
                backgroundColor: selectedAgentId ? DESIGN_TOKENS.colors.surfaceSoft : DESIGN_TOKENS.colors.primarySoft,
                borderColor: selectedAgentId ? DESIGN_TOKENS.colors.border : `${DESIGN_TOKENS.colors.primary}${OPACITY.primaryBorder}`,
              }}
            >
              <AppText
                variant="caption"
                className={`font-bold ${selectedAgentId ? 'text-[#5A7467]' : 'text-[#147D64]'}`}
                style={{
                  ...theme.typography.caption,
                  fontWeight: '700',
                  color: selectedAgentId ? DESIGN_TOKENS.colors.muted : DESIGN_TOKENS.colors.primary,
                }}
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

      <View
        className="mb-3 mt-0.5 flex-row justify-between items-center"
        style={{
          marginBottom: theme.spacing.md,
          marginTop: theme.spacing.xxs,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.bubblePaddingH,
        }}
      >
        <AppText
          variant="h3"
          className="text-[#13251C] font-bold"
          style={{
            ...theme.typography.h3,
            color: DESIGN_TOKENS.colors.text,
            fontWeight: '700',
          }}
        >
          {t('chat.chats', 'Chats')}
        </AppText>
        <AppText
          variant="caption"
          className="text-[#5A7467]"
          style={{
            ...theme.typography.caption,
            color: DESIGN_TOKENS.colors.muted,
          }}
        >
          {roomCount}
        </AppText>
      </View>
    </>
  );
}
