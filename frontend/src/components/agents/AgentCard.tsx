import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '../AppText';
import { AgentAvatar } from '../AgentAvatar';
import { ScalePressable } from '../ScalePressable';
import { useTheme } from '../../hooks/useTheme';
import { Agent } from '../../core/models';
import { getAgentColor, getMoodEmoji } from './agentUtils';

interface AgentCardProps {
  item: Agent;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
  isPinned: boolean;
}

export function AgentCard({ item, index, onPress, onLongPress, isPinned }: AgentCardProps) {
  const { C } = useTheme();
  const color = getAgentColor(item.name);
  const level = Math.floor(item.message_count / 10) + 1;
  const xpProgress = (item.message_count % 10) / 10;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .springify()
        .damping(20)}
    >
      <ScalePressable onPress={onPress} onLongPress={onLongPress}>
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 18,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: C.border,
            borderLeftWidth: 3,
            borderLeftColor: color,
            overflow: 'hidden',
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingStart: 16 }}
          >
            <AgentAvatar name={item.name} size={48} color={color} />
            <View style={{ flex: 1, marginStart: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <AppText style={{ fontSize: 15, fontWeight: '700', color: C.text }}>
                  {item.name}
                </AppText>
                {item.mood && item.mood !== 'Neutral' && (
                  <AppText style={{ fontSize: 13 }}>{getMoodEmoji(item.mood)}</AppText>
                )}
                {isPinned && <Ionicons name="star" size={11} color="#F59E0B" />}
              </View>
              <AppText style={{ color: C.muted, fontSize: 12, lineHeight: 17 }} numberOfLines={1}>
                {item.personality}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <View
                  style={{
                    backgroundColor: `${color}18`,
                    borderRadius: 5,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                  }}
                >
                  <AppText style={{ color, fontSize: 10, fontWeight: '700' }}>Lv {level}</AppText>
                </View>
                <View
                  style={{
                    flex: 1,
                    height: 3,
                    backgroundColor: `${color}18`,
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${xpProgress * 100}%`,
                      height: 3,
                      backgroundColor: `${color}70`,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', marginStart: 10 }}>
              <AppText style={{ color: C.faint, fontSize: 10, marginBottom: 8 }}>
                {item.message_count} msgs
              </AppText>
              <Ionicons name="chevron-forward" size={14} color={C.faint} />
            </View>
          </View>
        </View>
      </ScalePressable>
    </Animated.View>
  );
}

export function AgentGridCard({ item, index, onPress, onLongPress, isPinned }: AgentCardProps) {
  const { C } = useTheme();
  const color = getAgentColor(item.name);
  const level = Math.floor(item.message_count / 10) + 1;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45)
        .springify()
        .damping(20)}
      style={{ flex: 1, maxWidth: '50%' }}
    >
      <ScalePressable onPress={onPress} onLongPress={onLongPress}>
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 18,
            margin: 5,
            borderWidth: 1,
            borderColor: C.border,
            padding: 16,
            alignItems: 'center',
          }}
        >
          <View style={{ position: 'relative', marginBottom: 10 }}>
            <AgentAvatar name={item.name} size={56} color={color} />
            {isPinned && (
              <View
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  backgroundColor: '#F59E0B',
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: C.surface,
                }}
              >
                <Ionicons name="star" size={8} color="white" />
              </View>
            )}
          </View>
          <AppText
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: C.text,
              textAlign: 'center',
              marginBottom: 3,
            }}
            numberOfLines={1}
          >
            {item.name}
          </AppText>
          {item.mood && item.mood !== 'Neutral' && (
            <AppText style={{ fontSize: 12, marginBottom: 6 }}>{getMoodEmoji(item.mood)}</AppText>
          )}
          <View
            style={{
              backgroundColor: `${color}18`,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 2,
              marginBottom: 8,
            }}
          >
            <AppText style={{ color, fontSize: 10, fontWeight: '700' }}>Lv {level}</AppText>
          </View>
          <AppText style={{ color: C.muted, fontSize: 11, textAlign: 'center' }} numberOfLines={2}>
            {item.personality}
          </AppText>
        </View>
      </ScalePressable>
    </Animated.View>
  );
}
