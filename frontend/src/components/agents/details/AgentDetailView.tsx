import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../../AppText';
import { ScalePressable } from '../../ScalePressable';
import { useTheme } from '../../../hooks/useTheme';
import { Agent } from '../../../core/models';
import { MILESTONES } from '../agentUtils';
import { AgentDetailStats } from './AgentDetailStats';

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

  const label: any = {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  };

  return (
    <Animated.View entering={FadeIn.duration(200)}>
      {/* Start Chat CTA */}
      <ScalePressable onPress={onStartChat}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: displayColor,
            borderRadius: 16,
            paddingVertical: 14,
            marginBottom: 18,
            shadowColor: displayColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {isStartingChat ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons
                name="chatbubble-ellipses"
                size={17}
                color="white"
                style={{ marginEnd: 8 }}
              />
              <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                Start Chat
              </AppText>
            </>
          )}
        </View>
      </ScalePressable>

      <AgentDetailStats agent={agent} level={level} displayColor={displayColor} />

      {/* Relationship / Affinity */}
      <View
        style={{
          backgroundColor: C.surfaceHigh,
          borderRadius: 14,
          padding: 14,
          marginBottom: 18,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <AppText style={label}>Relationship</AppText>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 6,
              backgroundColor: `${displayColor}20`,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${affinityPct}%`,
                height: 6,
                backgroundColor: displayColor,
                borderRadius: 3,
              }}
            />
          </View>
          <AppText
            style={{
              color: displayColor,
              fontSize: 12,
              fontWeight: '700',
              minWidth: 90,
              textAlign: 'right',
            }}
          >
            {affinityLabel}
          </AppText>
        </View>

        {/* Milestone badges */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {MILESTONES.map((m) => {
            const earned = agent.message_count >= m.threshold;
            return (
              <View
                key={m.threshold}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: earned ? `${displayColor}15` : C.surfaceMid,
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: earned ? `${displayColor}30` : C.border,
                  opacity: earned ? 1 : 0.55,
                }}
              >
                <AppText style={{ fontSize: 12 }}>{m.icon}</AppText>
                <AppText
                  style={{
                    fontSize: 11,
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
          <AppText style={{ color: C.faint, fontSize: 11, marginTop: 8 }}>
            Next: {nextMilestone.icon} {nextMilestone.label} at {nextMilestone.threshold}{' '}
            messages ({nextMilestone.threshold - agent.message_count} to go)
          </AppText>
        )}
      </View>

      {/* Personality */}
      <View style={{ marginBottom: 16 }}>
        <AppText style={label}>Personality</AppText>
        <AppText style={{ lineHeight: 23, color: C.text, fontSize: 15 }}>
          {agent.personality}
        </AppText>
      </View>

      {agent.description ? (
        <View style={{ marginBottom: 16 }}>
          <AppText style={label}>About</AppText>
          <AppText style={{ lineHeight: 23, color: C.text, fontSize: 15 }}>
            {agent.description}
          </AppText>
        </View>
      ) : null}

      {agent.goals && agent.goals.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <AppText style={label}>Goals</AppText>
          {agent.goals.map((goal, i) => (
            <View
              key={i}
              style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: `${displayColor}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginEnd: 10,
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                <AppText style={{ color: displayColor, fontSize: 10, fontWeight: '700' }}>
                  {i + 1}
                </AppText>
              </View>
              <AppText style={{ flex: 1, lineHeight: 21, color: C.text, fontSize: 14 }}>
                {goal}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {agent.integrations && agent.integrations.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <AppText style={label}>Integrations</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {agent.integrations.map((ig, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: C.surfaceHigh,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <AppText
                  style={{ fontSize: 12, textTransform: 'capitalize', color: C.text }}
                >
                  {ig}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      )}

      <AppText
        style={{
          color: C.faint,
          fontSize: 11,
          textAlign: 'center',
          marginTop: 4,
          marginBottom: 40,
        }}
      >
        Created{' '}
        {new Date(agent.created_at).toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </AppText>
    </Animated.View>
  );
}
