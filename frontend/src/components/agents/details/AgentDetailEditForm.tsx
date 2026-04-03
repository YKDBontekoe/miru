import React, { useState, useCallback } from 'react';
import { View, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';
import { Agent } from '@/core/models';

const EditGoalBadge = React.memo(
  ({ goal, index, onRemove, iconColor }: { goal: string; index: number; onRemove: (index: number) => void; iconColor?: string }) => (
    <ScalePressable
      onPress={() => onRemove(index)}
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 border bg-primary/10 border-primary/25"
    >
      <AppText className="text-primary text-xs">{goal}</AppText>
      <Ionicons name="close" size={11} color={iconColor ?? '#000'} />
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
  const { t } = useTranslation();
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
        {t('agents.edit.personality_label')}
      </AppText>
      <TextInput
        value={editPersonality}
        onChangeText={setEditPersonality}
        multiline
        numberOfLines={4}
        className="bg-surfaceHigh rounded-xl px-4 py-3 text-text text-[15px] border border-border min-h-[90px]"
        style={{ textAlignVertical: 'top' }}
        placeholder={t('agents.edit.personality_placeholder')}
        placeholderTextColor={C.faint}
      />

      <AppText className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5 mt-3.5">
        {t('agents.edit.description_label')} <AppText className="text-faint normal-case">({t('agents.edit.optional')})</AppText>
      </AppText>
      <TextInput
        value={editDescription}
        onChangeText={setEditDescription}
        multiline
        numberOfLines={2}
        className="bg-surfaceHigh rounded-xl px-4 py-3 text-text text-[15px] border border-border min-h-[60px]"
        style={{ textAlignVertical: 'top' }}
        placeholder={t('agents.edit.description_placeholder')}
        placeholderTextColor={C.faint}
      />

      <AppText className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5 mt-3.5">
        {t('agents.edit.goals_label')}
      </AppText>
      <View className="flex-row gap-2 mb-2.5">
        <TextInput
          value={goalInput}
          onChangeText={setGoalInput}
          placeholder={t('agents.edit.goal_placeholder')}
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
              iconColor={C.primary}
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
          <AppText className="text-white font-bold text-[15px]">{t('agents.edit.save_changes')}</AppText>
        )}
      </ScalePressable>

      <View className="rounded-xl border p-3.5 mb-10 bg-dangerSurface border-danger/25">
        <AppText className="text-danger text-xs font-bold uppercase tracking-wider mb-2.5">
          {t('agents.edit.danger_zone')}
        </AppText>
        <ScalePressable
          onPress={() => {
            haptic.heavy();
            Alert.alert(
              t('agents.edit.archive_confirm_title', { name: agent.name }),
              t('agents.edit.archive_confirm_desc'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('agents.edit.archive_action'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await onDeleted(agent);
                      onClose();
                    } catch (e: any) {
                      Alert.alert(t('agents.edit.archive_error', { name: agent.name }), e.message);
                    }
                  },
                },
              ]
            );
          }}
          className="flex-row items-center justify-center bg-danger rounded-lg py-2.5"
        >
          <Ionicons name="archive-outline" size={15} color="white" className="me-1.5" />
          <AppText className="text-white font-bold text-sm">{t('agents.edit.archive_persona')}</AppText>
        </ScalePressable>
      </View>
    </Animated.View>
  );
}
