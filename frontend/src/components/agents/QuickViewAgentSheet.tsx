import React from 'react';
import { View, TouchableOpacity, Pressable, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { AppText } from '../AppText';
import { Agent } from '../../core/models';

const C = {
  surface: '#FFFFFF',
  text: '#12121A',
  muted: '#6E6E80',
  faint: '#C0C0D0',
  primary: '#2563EB',
};

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
    <Modal visible animationType="none" transparent>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Animated.View
          entering={SlideInUp.springify().damping(22)}
          exiting={SlideOutDown.duration(180)}
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
          }}
          onStartShouldSetResponder={() => true}
        >
          {/* Drag handle */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: C.faint }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: `${color}18`,
                borderWidth: 2,
                borderColor: `${color}40`,
                alignItems: 'center',
                justifyContent: 'center',
                marginEnd: 14,
              }}
            >
              <AppText style={{ color, fontSize: 22, fontWeight: '700' }}>
                {agent.name[0]?.toUpperCase() ?? '?'}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 2 }}>
                {agent.name}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    backgroundColor: `${color}18`,
                    borderRadius: 6,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                  }}
                >
                  <AppText style={{ color, fontSize: 11, fontWeight: '700' }}>Lv {level}</AppText>
                </View>
                <AppText style={{ color: C.muted, fontSize: 12 }}>
                  {agent.message_count} messages
                </AppText>
              </View>
            </View>
          </View>

          <AppText
            style={{ color: C.muted, fontSize: 13, lineHeight: 19, marginBottom: 18 }}
            numberOfLines={3}
          >
            {agent.personality}
          </AppText>

          {isInRoom ? (
            <TouchableOpacity
              onPress={handleRemove}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FEF2F2',
                borderRadius: 14,
                paddingVertical: 13,
                borderWidth: 1,
                borderColor: '#FECACA',
                marginBottom: 36,
              }}
            >
              <Ionicons
                name="person-remove-outline"
                size={16}
                color="#EF4444"
                style={{ marginEnd: 7 }}
              />
              <AppText style={{ color: '#EF4444', fontWeight: '700', fontSize: 15 }}>
                Remove from Chat
              </AppText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleAdd}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: C.primary,
                borderRadius: 14,
                paddingVertical: 13,
                marginBottom: 36,
              }}
            >
              <Ionicons
                name="person-add-outline"
                size={16}
                color="white"
                style={{ marginEnd: 7 }}
              />
              <AppText style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
                Add to Chat
              </AppText>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
