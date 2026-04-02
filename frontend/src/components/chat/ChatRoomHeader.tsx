import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';

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

/**
 * Performance Log: Rendering mapped items directly in the tree causes unnecessary memory churn and re-renders.
 * Optimized Code: Extracted AgentAvatar as a standalone React.memo component.
 * Complexity Delta: Reduced component re-creation and render cycles inside ChatRoomHeader.
 */
const AgentAvatar = React.memo(({ agent, index, color, onQuickViewAgent }: any) => {
  // Use useCallback so the inline function doesn't trigger parent re-renders if this was lifted higher,
  // but here we just avoid anonymous functions in the render output of the memoized component.
  const handlePress = React.useCallback(() => {
    onQuickViewAgent(agent);
  }, [onQuickViewAgent, agent]);

  return (
    <ScalePressable
      onPress={handlePress}
      className="w-[30px] h-[30px] rounded-[15px] border-2 border-white items-center justify-center"
      style={{
        backgroundColor: `${color}22`,
        marginStart: index === 0 ? 0 : -9,
        zIndex: 3 - index,
      }}
    >
      <AppText style={{ color }} className="text-[11px] font-bold">
        {(agent.name?.charAt(0) || '?').toUpperCase()}
      </AppText>
    </ScalePressable>
  );
});

export const ChatRoomHeader = ({
  room,
  roomAgents,
  onBack,
  onQuickViewAgent,
  onManageAgentsPress,
  getAgentColor,
}: ChatRoomHeaderProps) => {
  return (
    <View className="flex-row items-center px-3 py-2.5 border-b border-[#E0E0EC] bg-white gap-2">
      <ScalePressable
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={26} color={C.text} />
      </ScalePressable>

      <View className="w-9 h-9 rounded-[10px] bg-[#EFF6FF] border border-[#2563EB25] items-center justify-center">
        <AppText className="text-[#2563EB] font-bold text-base">
          {(room?.name?.charAt(0) || '?').toUpperCase()}
        </AppText>
      </View>

      <View className="flex-1">
        <AppText className="text-base font-semibold text-[#12121A]" numberOfLines={1}>
          {room?.name ?? 'Chat'}
        </AppText>
        {roomAgents.length > 0 && (
          <AppText className="text-[11px] text-[#6E6E80]" numberOfLines={1}>
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
              <AgentAvatar
                key={agent.id}
                agent={agent}
                index={i}
                color={color}
                onQuickViewAgent={onQuickViewAgent}
              />
            );
          })}
          {roomAgents.length > 3 && (
            <View className="w-[30px] h-[30px] rounded-[15px] bg-[#F0F0F6] border-2 border-white items-center justify-center -ms-[9px] z-0">
              <AppText className="text-[#6E6E80] text-[10px] font-bold">
                +{roomAgents.length - 3}
              </AppText>
            </View>
          )}
        </View>
      )}

      <ScalePressable
        onPress={onManageAgentsPress}
        className="w-8 h-8 rounded-2xl bg-[#F0F0F6] border border-[#E0E0EC] items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Manage agents"
      >
        <Ionicons name="person-add-outline" size={16} color={C.primary} />
      </ScalePressable>
    </View>
  );
};
