import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
  primarySurface: DESIGN_TOKENS.colors.primarySoft,
};

interface ChatRoomHeaderProps {
  room: { name: string } | undefined;
  roomAgents: Agent[];
  onBack: () => void;
  onQuickViewAgent: (agent: Agent) => void;
  onManageAgentsPress: () => void;
  getAgentColor: (name: string) => string;
}

export const ChatRoomHeader = ({
  room,
  roomAgents,
  onBack,
  onQuickViewAgent,
  onManageAgentsPress,
  getAgentColor,
}: ChatRoomHeaderProps) => {
  return (
    <View
      className="flex-row items-center px-3.5 py-2.5 gap-2"
      style={{ borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface }}
    >
      <ScalePressable
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={26} color={C.text} />
      </ScalePressable>

      <View
        className="w-9 h-9 rounded-[10px] items-center justify-center"
        style={{ backgroundColor: C.primarySurface, borderWidth: 1, borderColor: `${C.primary}33` }}
      >
        <AppText className="font-bold text-base" style={{ color: C.primary }}>
          {(room?.name?.charAt(0) || '?').toUpperCase()}
        </AppText>
      </View>

      <View className="flex-1">
        <AppText className="text-base font-semibold" style={{ color: C.text }} numberOfLines={1}>
          {room?.name ?? 'Chat'}
        </AppText>
        {roomAgents.length > 0 && (
          <AppText className="text-[11px]" style={{ color: C.muted }} numberOfLines={1}>
            {roomAgents.map((a) => a.name).join(', ')}
          </AppText>
        )}
      </View>

      {/* Tappable agent avatars row */}
      {roomAgents.length > 0 && (
        <View className="flex-row items-center">
          {roomAgents.slice(0, 3).map((agent, i) => {
            const color = getAgentColor(agent.name);
            return (
              <ScalePressable
                key={agent.id}
                onPress={() => onQuickViewAgent(agent)}
                className="w-[30px] h-[30px] rounded-[15px] border-2 border-white items-center justify-center"
                style={{
                  backgroundColor: `${color}22`,
                  marginStart: i === 0 ? 0 : -9,
                  zIndex: 3 - i,
                }}
              >
                <AppText style={{ color }} className="text-[11px] font-bold">
                  {(agent.name?.charAt(0) || '?').toUpperCase()}
                </AppText>
              </ScalePressable>
            );
          })}
          {roomAgents.length > 3 && (
            <View
              className="w-[30px] h-[30px] rounded-[15px] border-2 border-white items-center justify-center -ms-[9px] z-0"
              style={{ backgroundColor: C.surfaceHigh }}
            >
              <AppText className="text-[10px] font-bold" style={{ color: C.muted }}>
                +{roomAgents.length - 3}
              </AppText>
            </View>
          )}
        </View>
      )}

      <ScalePressable
        onPress={onManageAgentsPress}
        className="w-8 h-8 rounded-2xl items-center justify-center"
        style={{ backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border }}
        accessibilityRole="button"
        accessibilityLabel="Manage agents"
      >
        <Ionicons name="person-add-outline" size={16} color={C.primary} />
      </ScalePressable>
    </View>
  );
};
