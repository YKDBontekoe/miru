import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/utils/haptics';
import { TONES, getTonePrefix } from '../agentUtils';

const GoalBadge = React.memo(
  ({ goal, index, onRemove }: { goal: string; index: number; onRemove: (index: number) => void }) => (
    <ScalePressable
      onPress={() => onRemove(index)}
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 border bg-primary/10 border-primary/25"
    >
      <AppText className="text-primary text-xs">{goal}</AppText>
      <Ionicons name="close" size={11} className="text-primary" />
    </ScalePressable>
  )
);
GoalBadge.displayName = 'GoalBadge';

type Tone = (typeof TONES)[number];

interface CreateAgentFormProps {
  name: string;
  setName: (v: string) => void;
  selectedTone: string;
  setSelectedTone: (v: string) => void;
  personality: string;
  setPersonality: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  goals: string[];
  setGoals: React.Dispatch<React.SetStateAction<string[]>>;
  isSaving: boolean;
  onSave: () => void;
  errorMsg: string;
}

export function CreateAgentForm({
  name,
  setName,
  selectedTone,
  setSelectedTone,
  personality,
  setPersonality,
  description,
  setDescription,
  goals,
  setGoals,
  isSaving,
  onSave,
  errorMsg,
}: CreateAgentFormProps) {
  const { C } = useTheme();
  const { t } = useTranslation();
  const [goalInput, setGoalInput] = useState('');

  const addGoal = () => {
    const trimmed = goalInput.trim();
    if (trimmed && !goals.includes(trimmed)) {
      setGoals((prev) => [...prev, trimmed]);
      setGoalInput('');
    }
  };

  const removeGoal = useCallback((idx: number) => {
    setGoals((gs) => gs.filter((_, gIdx) => gIdx !== idx));
  }, [setGoals]);

  const handleNameChange = (val: string) => setName(val.trimStart());
  const handlePersonalityChange = (val: string) => setPersonality(val.trimStart());

  const tonePrefix = selectedTone ? `${getTonePrefix(selectedTone)} ` : '';
  const maxPersonalityLen = 1000 - tonePrefix.length;

  const input: StyleProp<ViewStyle | TextStyle> = {
    backgroundColor: C.surfaceHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 15,
    marginBottom: 14,
  };

  const label: StyleProp<TextStyle> = {
    color: C.muted,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  };

  return (
    <>
      {!!errorMsg && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={{
            backgroundColor: `${C.danger}15`,
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: `${C.danger}30`,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="alert-circle" size={16} color={C.danger} />
          <AppText style={{ color: C.danger, fontSize: 13, flex: 1 }}>{errorMsg}</AppText>
        </Animated.View>
      )}

      <AppText style={label}>{t('agent.name')}</AppText>
      <TextInput
        value={name}
        onChangeText={handleNameChange}
        placeholder={t('agent.name_placeholder')}
        placeholderTextColor={C.faint}
        style={input}
        maxLength={100}
      />

      <AppText style={label}>
        {t('agent.tone')}{' '}
        <AppText style={{ color: C.faint, textTransform: 'none' }}>({t('agent.optional')})</AppText>
      </AppText>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={TONES}
        keyExtractor={(item: Tone) => item.id}
        style={{ marginBottom: 14 }}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item: tone }: { item: Tone }) => {
          const isSelected = selectedTone === tone.id;
          return (
            <ScalePressable
              key={tone.id}
              onPress={() => {
                haptic.selection();
                setSelectedTone(isSelected ? '' : tone.id);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: isSelected ? C.primary : C.surfaceHigh,
                borderWidth: 1,
                borderColor: isSelected ? C.primary : C.border,
              }}
            >
              <AppText style={{ fontSize: 13 }}>{tone.icon}</AppText>
              <AppText
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: isSelected ? 'white' : C.text,
                }}
              >
                {t(`agent.tones.${tone.id}`, tone.label)}
              </AppText>
            </ScalePressable>
          );
        }}
      />

      <AppText style={label}>{t('agent.personality')}</AppText>
      <TextInput
        value={personality}
        onChangeText={handlePersonalityChange}
        placeholder={t('agent.personality_placeholder')}
        placeholderTextColor={C.faint}
        multiline
        maxLength={maxPersonalityLen}
        numberOfLines={4}
        style={[input as any, { minHeight: 90, textAlignVertical: 'top' }]}
      />

      <AppText style={label}>
        {t('agent.description')}{' '}
        <AppText style={{ color: C.faint, textTransform: 'none' }}>({t('agent.optional')})</AppText>
      </AppText>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t('agent.description_placeholder')}
        placeholderTextColor={C.faint}
        multiline
        maxLength={500}
        numberOfLines={2}
        style={[input as any, { minHeight: 60, textAlignVertical: 'top' }]}
      />

      <AppText style={label}>
        {t('agent.goals')}{' '}
        <AppText style={{ color: C.faint, textTransform: 'none' }}>({t('agent.optional')})</AppText>
      </AppText>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <TextInput
          value={goalInput}
          onChangeText={setGoalInput}
          placeholder={t('agent.goals_placeholder')}
          placeholderTextColor={C.faint}
          maxLength={200}
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
      {goals.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {goals.map((g, i) => (
            <GoalBadge
              key={i}
              goal={g}
              index={i}
              onRemove={removeGoal}
            />
          ))}
        </View>
      )}

      <ScalePressable
        onPress={onSave}
        disabled={isSaving}
        style={{
          backgroundColor: isSaving ? `${C.primary}70` : C.primary,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: 'center',
          marginBottom: 40,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
          shadowColor: C.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {isSaving ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
              {t('agent.create_persona')}
            </AppText>
          </>
        )}
      </ScalePressable>
    </>
  );
}
