import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { AgentAvatar } from '@/components/AgentAvatar';
import { XPBar } from '@/components/XPBar';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';
import { Agent } from '@/core/models';

interface AgentDetailHeaderProps {
  agent: Agent;
  isEditing: boolean;
  editName: string;
  setEditName: (v: string) => void;
  displayColor: string;
  moodEmoji: string;
  level: number;
  xpProgress: number;
  onEditToggle: () => void;
  onCancelEdit: () => void;
  onClose: () => void;
}

export function AgentDetailHeader({
  agent,
  isEditing,
  editName,
  setEditName,
  displayColor,
  moodEmoji,
  level,
  xpProgress,
  onEditToggle,
  onCancelEdit,
  onClose,
}: AgentDetailHeaderProps) {
  const { C } = useTheme();

  return (
    <View
      className="p-5 pt-3.5 border-b"
      style={{
        backgroundColor: `${displayColor}0D`,
        borderBottomColor: `${displayColor}18`,
      }}
    >
      <View className="flex-row items-start">
        <AgentAvatar
          name={isEditing ? editName || agent.name : agent.name}
          size={64}
          color={displayColor}
        />
        <View className="flex-1 ml-3.5">
          {isEditing ? (
            <TextInput
              value={editName}
              onChangeText={setEditName}
              className="bg-surfaceHigh rounded-xl px-4 py-3 text-text text-lg font-bold border border-border mb-1.5"
              style={{ backgroundColor: `${C.surface}CC` }}
              placeholder="Name"
              placeholderTextColor={C.faint}
            />
          ) : (
            <>
              <AppText className="text-[22px] font-bold text-text mb-0.5">{agent.name}</AppText>
              {agent.mood && (
                <View className="flex-row items-center gap-1.5 mb-1.5">
                  <AppText className="text-sm">{moodEmoji}</AppText>
                  <AppText className="text-xs font-semibold" style={{ color: displayColor }}>
                    {agent.mood}
                  </AppText>
                </View>
              )}
            </>
          )}
          <View className="flex-row items-center gap-2">
            <View
              className="rounded-md px-1.5 py-0.5"
              style={{
                backgroundColor: `${displayColor}22`,
              }}
            >
              <AppText className="text-[11px] font-bold" style={{ color: displayColor }}>
                Lv {level}
              </AppText>
            </View>
            <XPBar progress={xpProgress} color={displayColor} />
            <AppText className="text-faint text-[10px]">{agent.message_count % 10}/10</AppText>
          </View>
        </View>

        <View className="gap-2 ml-2">
          {!isEditing && (
            <ScalePressable
              onPress={onEditToggle}
              className="w-8 h-8 rounded-full bg-surface border border-border items-center justify-center"
            >
              <Ionicons name="pencil" size={14} color={C.muted} />
            </ScalePressable>
          )}
          <ScalePressable
            onPress={isEditing ? onCancelEdit : onClose}
            className="w-8 h-8 rounded-full bg-surface border border-border items-center justify-center"
          >
            <Ionicons name="close" size={16} color={C.muted} />
          </ScalePressable>
        </View>
      </View>
    </View>
  );
}
