import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '../../core/models';

const C = {
  bg: '#F8F8FC',
  surface: '#FFFFFF',
  surfaceHigh: '#F0F0F6',
  border: '#E0E0EC',
  text: '#12121A',
  muted: '#6E6E80',
  faint: '#C0C0D0',
  primary: '#2563EB',
  primarySurface: '#EFF6FF',
};

interface ChatRoomHeaderProps {
  room: { name: string } | undefined;
  roomAgents: Agent[];
  onBack: () => void;
  onQuickViewAgent: (agent: Agent) => void;
  onManageAgentsPress: () => void;
  getAgentColor: (name: string) => string;
}

export function ChatRoomHeader({
  room,
  roomAgents,
  onBack,
  onQuickViewAgent,
  onManageAgentsPress,
  getAgentColor,
}: ChatRoomHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.surface,
        gap: 8,
      }}
    >
      <ScalePressable onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-back" size={26} color={C.text} />
      </ScalePressable>

      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: C.primarySurface,
          borderWidth: 1,
          borderColor: `${C.primary}25`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppText style={{ color: C.primary, fontWeight: '700', fontSize: 16 }}>
          {room?.name[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>

      <View style={{ flex: 1 }}>
        <AppText style={{ fontSize: 16, fontWeight: '600', color: C.text }} numberOfLines={1}>
          {room?.name ?? 'Chat'}
        </AppText>
        {roomAgents.length > 0 && (
          <AppText style={{ fontSize: 11, color: C.muted }} numberOfLines={1}>
            {roomAgents.map((a) => a.name).join(', ')}
          </AppText>
        )}
      </View>

      {/* Tappable agent avatars row */}
      {roomAgents.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {roomAgents.slice(0, 3).map((agent, i) => {
            const color = getAgentColor(agent.name);
            return (
              <ScalePressable
                key={agent.id}
                onPress={() => onQuickViewAgent(agent)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: `${color}22`,
                  borderWidth: 2,
                  borderColor: C.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginStart: i === 0 ? 0 : -9,
                  zIndex: 3 - i,
                }}
              >
                <AppText style={{ color, fontSize: 11, fontWeight: '700' }}>
                  {agent.name[0].toUpperCase()}
                </AppText>
              </ScalePressable>
            );
          })}
          {roomAgents.length > 3 && (
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: C.surfaceHigh,
                borderWidth: 2,
                borderColor: C.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginStart: -9,
                zIndex: 0,
              }}
            >
              <AppText style={{ color: C.muted, fontSize: 10, fontWeight: '700' }}>
                +{roomAgents.length - 3}
              </AppText>
            </View>
          )}
        </View>
      )}

      <ScalePressable
        onPress={onManageAgentsPress}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: C.surfaceHigh,
          borderWidth: 1,
          borderColor: C.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="person-add-outline" size={16} color={C.primary} />
      </ScalePressable>
    </View>
  );
}
