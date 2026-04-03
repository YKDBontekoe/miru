import React, { useState, useCallback } from 'react';
import { View, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/utils/haptics';
import { Agent } from '@/core/models';

const EditGoalBadge = React.memo(
  ({ goal, index, onRemove, C }: { goal: string; index: number; onRemove: (index: number) => void; C: any }) => (
    <ScalePressable
      onPress={() => onRemove(index)}
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 border bg-primary/10 border-primary/25"
    >
      <AppText className="text-primary text-xs">{goal}</AppText>
      <Ionicons name="close" size={11} color={C.primary} />
    </ScalePressable>
  )
);
EditGoalBadge.displayName = 'EditGoalBadge';

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
  onDeleted: (agent: Agent) => Promise<void> | void;
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

  const removeGoal = useCallback((idx: number) => {
    setEditGoals((gs) => gs.filter((_, gIdx) => gIdx !== idx));
  }, [setEditGoals]);

  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <AppText className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5 mt-3.5">
        Personality
      </AppText>
      <TextInput
        value={editPersonality}
        onChangeText={setEditPersonality}
        multiline
        numberOfLines={4}
        className="bg-surfaceHigh rounded-xl px-4 py-3 text-text text-[15px] border border-border min-h-[90px]"
        style={{ textAlignVertical: 'top' }}
        placeholder="How does this persona think and communicate?"
        placeholderTextColor={C.faint}
      />

      <AppText className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5 mt-3.5">
        Description <AppText className="text-faint normal-case">(optional)</AppText>
      </AppText>
      <TextInput
        value={editDescription}
        onChangeText={setEditDescription}
        multiline
        numberOfLines={2}
        className="bg-surfaceHigh rounded-xl px-4 py-3 text-text text-[15px] border border-border min-h-[60px]"
        style={{ textAlignVertical: 'top' }}
        placeholder="A short bio…"
        placeholderTextColor={C.faint}
      />

      <AppText className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5 mt-3.5">
        Goals
      </AppText>
      <View className="flex-row gap-2 mb-2.5">
        <TextInput
          value={goalInput}
          onChangeText={setGoalInput}
          placeholder="Add a goal…"
          placeholderTextColor={C.faint}
          className="flex-1 bg-surfaceHigh rounded-lg border border-border px-3 py-2 text-text text-sm"
          onSubmitEditing={addGoal}
          returnKeyType="done"
        />
        <ScalePressable
          onPress={addGoal}
          className="w-10 rounded-lg border items-center justify-center bg-primary/15 border-primary/30"
        >
          <Ionicons name="add" size={20} color={C.primary} />
        </ScalePressable>
      </View>
      {editGoals.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-3.5">
          {editGoals.map((g, i) => (
            <EditGoalBadge
              key={i}
              goal={g}
              index={i}
              onRemove={removeGoal}
              C={C}
            />
          ))}
        </View>
      )}

      <ScalePressable
        onPress={onSave}
        disabled={isSaving}
        className={`rounded-xl py-3.5 items-center mb-3.5 ${isSaving ? 'bg-primary/70' : 'bg-primary'}`}
      >
        {isSaving ? (
          <ActivityIndicator color="white" />
        ) : (
          <AppText className="text-white font-bold text-[15px]">Save Changes</AppText>
        )}
      </ScalePressable>

      <View className="rounded-xl border p-3.5 mb-10 bg-dangerSurface border-danger/25">
        <AppText className="text-danger text-xs font-bold uppercase tracking-wider mb-2.5">
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
                  onPress: async () => {
                    try {
                      await onDeleted(agent);
                      onClose();
                    } catch (e: any) {
                      Alert.alert(`Failed to archive ${agent.name}`, e.message);
                    }
                  },
                },
              ]
            );
          }}
          className="flex-row items-center justify-center bg-danger rounded-lg py-2.5"
        >
          <Ionicons name="archive-outline" size={15} color="white" className="mr-1.5" />
          <AppText className="text-white font-bold text-sm">Archive Persona</AppText>
        </ScalePressable>
      </View>
    </Animated.View>
  );
}
