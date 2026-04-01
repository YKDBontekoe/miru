import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';
import { Agent } from '@/core/models';
import { MILESTONES } from '@/components/agents/agentUtils';
import { useTranslation } from 'react-i18next';
import { AgentDetailStats } from './AgentDetailStats';
import i18n from '@/core/i18n';

interface AgentDetailViewProps {
  agent: Agent;
  level: number;
  displayColor: string;
  affinityPct: number;
  affinityLabel: string;
  nextMilestone: any;
  isStartingChat: boolean;
  onStartChat: () => void;
}

export function AgentDetailView({
  agent,
  level,
  displayColor,
  affinityPct,
  affinityLabel,
  nextMilestone,
  isStartingChat,
  onStartChat,
}: AgentDetailViewProps) {
  const { C } = useTheme();
  const { t } = useTranslation();

  return (
    <Animated.View entering={FadeIn.duration(200)}>
      {/* Start Chat CTA */}
      <ScalePressable onPress={isStartingChat ? undefined : onStartChat} disabled={isStartingChat}>
        <View
          className={`flex-row items-center justify-center rounded-2xl py-3.5 mb-4 shadow-lg elevation-4 ${isStartingChat ? 'opacity-70' : ''}`}
          style={{
            backgroundColor: displayColor,
            shadowColor: displayColor,
          }}
          accessibilityState={{ disabled: isStartingChat }}
        >
          {isStartingChat ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons
                name="chatbubble-ellipses"
                size={17}
                color="white"
                className="me-2"
              />
              <AppText className="text-white font-bold text-base">
                {t('agents.start_chat')}
              </AppText>
            </>
          )}
        </View>
      </ScalePressable>

      <AgentDetailStats agent={agent} level={level} displayColor={displayColor} />

      {/* Relationship / Affinity */}
      <View
        className="bg-surfaceHigh rounded-2xl p-3.5 mb-4 border border-border"
      >
        <AppText className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5 mt-3.5">
          {t('agents.relationship')}
        </AppText>
        <View
          className="flex-row items-center gap-2.5 mb-2.5"
        >
          <View
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: `${displayColor}20` }}
          >
            <View
              className="h-1.5 rounded-full"
              style={{
                width: `${affinityPct}%`,
                backgroundColor: displayColor,
              }}
            />
          </View>
          <AppText
            className="text-xs font-bold min-w-[90px] text-right"
            style={{ color: displayColor }}
          >
            {affinityLabel}
          </AppText>
        </View>

        {/* Milestone badges */}
        <View className="flex-row flex-wrap gap-2">
          {MILESTONES.map((m) => {
            const earned = agent.message_count >= m.threshold;
            return (
              <View
                key={m.threshold}
                className={`flex-row items-center gap-1 rounded-lg px-2 py-1 border ${earned ? '' : 'bg-surfaceMid border-border opacity-55'}`}
                style={earned ? {
                  backgroundColor: `${displayColor}15`,
                  borderColor: `${displayColor}30`,
                } : undefined}
              >
                <AppText className="text-xs">{m.icon}</AppText>
                <AppText
                  className="text-[11px]"
                  style={{
                    color: earned ? displayColor : C.faint,
                    fontWeight: earned ? '600' : '400',
                  }}
                >
                  {m.label}
                </AppText>
              </View>
            );
          })}
        </View>

        {nextMilestone && (
          <AppText className="text-faint text-[11px] mt-2">
            Next: {nextMilestone.icon} {nextMilestone.label} at {nextMilestone.threshold}{' '}
            messages ({nextMilestone.threshold - agent.message_count} to go)
          </AppText>
        )}
      </View>

      {/* Personality */}
      <View className="mb-4">
        <AppText className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5 mt-3.5">
          {t('agents.personality_label')}
        </AppText>
        <AppText className="leading-6 text-text text-[15px]">
          {agent.personality}
        </AppText>
      </View>

      {agent.description ? (
        <View className="mb-4">
          <AppText className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5 mt-3.5">
            {t('agents.about_label')}
          </AppText>
          <AppText className="leading-6 text-text text-[15px]">
            {agent.description}
          </AppText>
        </View>
      ) : null}

      {agent.goals && agent.goals.length > 0 && (
        <View className="mb-4">
          <AppText className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5 mt-3.5">
            {t('agents.goals_label')}
          </AppText>
          {agent.goals.map((goal, i) => (
            <View
              key={i}
              className="flex-row items-start mb-2"
            >
              <View
                className="w-5 h-5 rounded-full items-center justify-center me-2.5 mt-0.5 shrink-0"
                style={{ backgroundColor: `${displayColor}18` }}
              >
                <AppText className="text-[10px] font-bold" style={{ color: displayColor }}>
                  {i + 1}
                </AppText>
              </View>
              <AppText className="flex-1 leading-5 text-text text-sm">
                {goal}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {agent.integrations && agent.integrations.length > 0 && (
        <View className="mb-4">
          <AppText className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5 mt-3.5">
            {t('agents.integrations_label')}
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {agent.integrations.map((ig, i) => (
              <View
                key={i}
                className="bg-surfaceHigh rounded-lg px-2.5 py-1 border border-border"
              >
                <AppText
                  className="text-xs capitalize text-text"
                >
                  {ig}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      )}

      <AppText
        className="text-faint text-[11px] text-center mt-1 mb-10"
      >
        {t('agents.created')}{' '}
        {new Date(agent.created_at).toLocaleDateString(i18n.language, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </AppText>
    </Animated.View>
  );
}
