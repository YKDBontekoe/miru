import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../AppText';
import { AgentAvatar } from '../../AgentAvatar';
import { XPBar } from '../../XPBar';
import { ScalePressable } from '../../ScalePressable';
import { useTheme } from '../../../hooks/useTheme';
import { Agent } from '../../../core/models';

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

  const input: any = {
    backgroundColor: C.surfaceHigh,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: C.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.border,
  };

  return (
    <View
      style={{
        backgroundColor: `${displayColor}0D`,
        borderBottomWidth: 1,
        borderBottomColor: `${displayColor}18`,
        padding: 20,
        paddingTop: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <AgentAvatar
          name={isEditing ? editName || agent.name : agent.name}
          size={64}
          color={displayColor}
        />
        <View style={{ flex: 1, marginStart: 14 }}>
          {isEditing ? (
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[
                input,
                {
                  marginBottom: 6,
                  fontSize: 18,
                  fontWeight: '700',
                  backgroundColor: `${C.surface}CC`,
                },
              ]}
              placeholder="Name"
              placeholderTextColor={C.faint}
            />
          ) : (
            <>
              <AppText
                style={{ fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 2 }}
              >
                {agent.name}
              </AppText>
              {agent.mood && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    marginBottom: 6,
                  }}
                >
                  <AppText style={{ fontSize: 14 }}>{moodEmoji}</AppText>
                  <AppText style={{ color: displayColor, fontSize: 12, fontWeight: '600' }}>
                    {agent.mood}
                  </AppText>
                </View>
              )}
            </>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                backgroundColor: `${displayColor}22`,
                borderRadius: 6,
                paddingHorizontal: 7,
                paddingVertical: 2,
              }}
            >
              <AppText style={{ color: displayColor, fontSize: 11, fontWeight: '700' }}>
                Lv {level}
              </AppText>
            </View>
            <XPBar progress={xpProgress} color={displayColor} />
            <AppText style={{ color: C.faint, fontSize: 10 }}>
              {agent.message_count % 10}/10
            </AppText>
          </View>
        </View>

        <View style={{ gap: 8, marginStart: 8 }}>
          {!isEditing && (
            <ScalePressable
              onPress={onEditToggle}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="pencil" size={14} color={C.muted} />
            </ScalePressable>
          )}
          <ScalePressable
            onPress={isEditing ? onCancelEdit : onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={16} color={C.muted} />
          </ScalePressable>
        </View>
      </View>
    </View>
  );
}
