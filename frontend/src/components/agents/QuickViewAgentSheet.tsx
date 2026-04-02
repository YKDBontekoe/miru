import React from 'react';
import { View, Pressable, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { Agent } from '@/core/models';
import { ScalePressable } from '@/components/ScalePressable';
import { theme } from '@/core/theme';

interface QuickViewAgentSheetProps {
  agent: Agent;
  onClose: () => void;
  onAdd: (agentId: string) => Promise<void>;
  onRemove: (agentId: string) => Promise<void>;
  roomAgents: Agent[];
  getAgentColor: (name: string) => string;
}

export function QuickViewAgentSheet({
  agent,
  onClose,
  onAdd,
  onRemove,
  roomAgents,
  getAgentColor,
}: QuickViewAgentSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const color = getAgentColor(agent.name);
  const level = Math.floor(agent.message_count / 10) + 1;
  const isInRoom = roomAgents.some((a) => a.id === agent.id);

  const handleAdd = async () => {
    try {
      await onAdd(agent.id);
      onClose();
    } catch {
      Alert.alert('Error', 'Could not add agent to chat. Please try again.');
    }
  };

  const handleRemove = async () => {
    try {
      await onRemove(agent.id);
      onClose();
    } catch {
      Alert.alert('Error', 'Could not remove agent from chat. Please try again.');
    }
  };

  return (
    <Modal visible animationType="none" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/30" onPress={onClose}>
        <Animated.View
          entering={SlideInUp.duration(300)}
          exiting={SlideOutDown.duration(180)}
          className={`rounded-t-[28px] p-8 ${isDark ? 'bg-surface-dark' : 'bg-surface-light'}`}
          onStartShouldSetResponder={() => true}
        >
          {/* Drag handle */}
          <View className="items-center mb-6">
            <View
              className={`w-8 h-1 rounded-sm ${
                isDark ? 'bg-surface-highestDark' : 'bg-surface-highestLight'
              }`}
            />
          </View>

          <View className="flex-row items-center mb-6">
            <View
              className="w-[52px] h-[52px] rounded-full border-2 items-center justify-center me-4"
              style={{
                backgroundColor: `${color}18`,
                borderColor: `${color}40`,
              }}
            >
              <AppText variant="h2" style={{ color, fontWeight: '700' }}>
                {agent.name[0]?.toUpperCase() ?? '?'}
              </AppText>
            </View>
            <View className="flex-1">
              <AppText
                variant="h3"
                className={`font-bold mb-1 ${
                  isDark ? 'text-onSurface-dark' : 'text-onSurface-light'
                }`}
              >
                {agent.name}
              </AppText>
              <View className="flex-row items-center gap-3">
                <View className="rounded px-2 py-0.5" style={{ backgroundColor: `${color}18` }}>
                  <AppText variant="caption" style={{ color, fontWeight: '700' }}>
                    Lv {level}
                  </AppText>
                </View>
                <AppText
                  variant="caption"
                  className={isDark ? 'text-onSurface-mutedDark' : 'text-onSurface-mutedLight'}
                >
                  {agent.message_count} messages
                </AppText>
              </View>
            </View>
          </View>

          <AppText
            variant="bodySm"
            className={`leading-5 mb-8 ${
              isDark ? 'text-onSurface-mutedDark' : 'text-onSurface-mutedLight'
            }`}
            numberOfLines={3}
          >
            {agent.personality}
          </AppText>

          {isInRoom ? (
            <ScalePressable
              onPress={handleRemove}
              className={`flex-row items-center justify-center rounded-md py-3.5 mb-10 border ${
                isDark
                  ? 'bg-status-errorSurfaceDark border-status-error'
                  : 'bg-status-errorSurfaceLight border-status-error'
              }`}
            >
              <Ionicons
                name="person-remove-outline"
                size={16}
                color={theme.colors.status.error}
                className="me-3"
              />
              <AppText
                className="font-bold text-[15px]"
                style={{ color: theme.colors.status.error }}
              >
                Remove from Chat
              </AppText>
            </ScalePressable>
          ) : (
            <ScalePressable
              onPress={handleAdd}
              className="flex-row items-center justify-center rounded-md py-3.5 mb-10 bg-primary-DEFAULT"
            >
              <Ionicons
                name="person-add-outline"
                size={16}
                color={theme.colors.white}
                className="me-3"
              />
              <AppText className="font-bold text-[15px] text-white">Add to Chat</AppText>
            </ScalePressable>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
