import React, { useState } from 'react';
import { View, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../../AppText';
import { ScalePressable } from '../../ScalePressable';
import { useTheme } from '../../../hooks/useTheme';
import { haptic } from '../../../utils/haptics';
import { Agent } from '../../../core/models';

interface AgentDetailEditFormProps {
  agent: Agent;
  editPersonality: string;
  setEditPersonality: (v: string) => void;
  editDescription: string;
  setEditDescription: (v: string) => void;
  editGoals: string[];
  setEditGoals: React.Dispatch<React.SetStateAction<string[]>>;
  isSaving: boolean;
  onSave: () => void;
  onClose: () => void;
  onDeleted: (agent: Agent) => void;
}

export function AgentDetailEditForm({
  agent,
  editPersonality,
  setEditPersonality,
  editDescription,
  setEditDescription,
  editGoals,
  setEditGoals,
  isSaving,
  onSave,
  onClose,
  onDeleted,
}: AgentDetailEditFormProps) {
  const { C } = useTheme();
  const [goalInput, setGoalInput] = useState('');

  const addGoal = () => {
    const trimmed = goalInput.trim();
    if (trimmed && !editGoals.includes(trimmed)) {
      setEditGoals((prev) => [...prev, trimmed]);
      setGoalInput('');
    }
  };

  const label: any = {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  };

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
    <Animated.View entering={FadeIn.duration(200)}>
      <AppText style={label}>Personality</AppText>
      <TextInput
        value={editPersonality}
        onChangeText={setEditPersonality}
        multiline
        numberOfLines={4}
        style={[input, { minHeight: 90, textAlignVertical: 'top' }]}
        placeholder="How does this persona think and communicate?"
        placeholderTextColor={C.faint}
      />

      <AppText style={label}>
        Description{' '}
        <AppText style={{ color: C.faint, textTransform: 'none' }}>(optional)</AppText>
      </AppText>
      <TextInput
        value={editDescription}
        onChangeText={setEditDescription}
        multiline
        numberOfLines={2}
        style={[input, { minHeight: 60, textAlignVertical: 'top' }]}
        placeholder="A short bio…"
        placeholderTextColor={C.faint}
      />

      <AppText style={label}>Goals</AppText>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <TextInput
          value={goalInput}
          onChangeText={setGoalInput}
          placeholder="Add a goal…"
          placeholderTextColor={C.faint}
          style={{
            flex: 1,
            backgroundColor: C.surfaceHigh,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 12,
            paddingVertical: 9,
            color: C.text,
            fontSize: 14,
          }}
          onSubmitEditing={addGoal}
          returnKeyType="done"
        />
        <ScalePressable
          onPress={addGoal}
          style={{
            width: 40,
            backgroundColor: `${C.primary}15`,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: `${C.primary}30`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={20} color={C.primary} />
        </ScalePressable>
      </View>
      {editGoals.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {editGoals.map((g, i) => (
            <ScalePressable
              key={i}
              onPress={() => setEditGoals((gs) => gs.filter((_, idx) => idx !== i))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: `${C.primary}12`,
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: `${C.primary}25`,
              }}
            >
              <AppText style={{ color: C.primary, fontSize: 12 }}>{g}</AppText>
              <Ionicons name="close" size={11} color={C.primary} />
            </ScalePressable>
          ))}
        </View>
      )}

      <ScalePressable
        onPress={onSave}
        disabled={isSaving}
        style={{
          backgroundColor: isSaving ? `${C.primary}70` : C.primary,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        {isSaving ? (
          <ActivityIndicator color="white" />
        ) : (
          <AppText style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
            Save Changes
          </AppText>
        )}
      </ScalePressable>

      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: `${C.danger}28`,
          backgroundColor: C.dangerSurface,
          padding: 14,
          marginBottom: 40,
        }}
      >
        <AppText
          style={{
            color: C.danger,
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 10,
          }}
        >
          Danger Zone
        </AppText>
        <ScalePressable
          onPress={() => {
            haptic.heavy();
            Alert.alert(
              `Archive "${agent.name}"?`,
              'This persona will be archived and hidden from your list.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Archive',
                  style: 'destructive',
                  onPress: () => {
                    onClose();
                    onDeleted(agent);
                  },
                },
              ]
            );
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: C.danger,
            borderRadius: 10,
            paddingVertical: 10,
          }}
        >
          <Ionicons
            name="archive-outline"
            size={15}
            color="white"
            style={{ marginEnd: 6 }}
          />
          <AppText style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
            Archive Persona
          </AppText>
        </ScalePressable>
      </View>
    </Animated.View>
  );
}
