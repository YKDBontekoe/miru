import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';
import { haptic } from '@/utils/haptics';
import { TONES, getTonePrefix } from '../agentUtils';

const GoalBadge = React.memo(
  ({
    goal,
    index,
    onRemove,
  }: {
    goal: string;
    index: number;
    onRemove: (index: number) => void;
  }) => (
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

  const removeGoal = useCallback(
    (idx: number) => {
      setGoals((gs) => gs.filter((_, gIdx) => gIdx !== idx));
    },
    [setGoals]
  );

  const handleNameChange = (val: string) => setName(val.trimStart());
  const handlePersonalityChange = (val: string) => setPersonality(val.trimStart());

  const tonePrefix = selectedTone ? `${getTonePrefix(selectedTone)} ` : '';
  const maxPersonalityLen = 1000 - tonePrefix.length;

  return (
    <>
      {!!errorMsg && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.errorBox,
            { backgroundColor: `${C.danger}15`, borderColor: `${C.danger}30` },
          ]}
        >
          <Ionicons name="alert-circle" size={16} color={C.danger} />
          <AppText style={[styles.errorText, { color: C.danger }]}>{errorMsg}</AppText>
        </Animated.View>
      )}

      <AppText style={[styles.label, { color: C.muted }]}>{t('agent.name')}</AppText>
      <TextInput
        value={name}
        onChangeText={handleNameChange}
        placeholder={t('agent.name_placeholder')}
        placeholderTextColor={C.faint}
        style={[
          styles.input,
          { backgroundColor: C.surfaceHigh, borderColor: C.border, color: C.text },
        ]}
        maxLength={100}
      />

      <AppText style={[styles.label, { color: C.muted }]}>
        {t('agent.tone')}{' '}
        <AppText style={[styles.optionalText, { color: C.faint }]}>({t('agent.optional')})</AppText>
      </AppText>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={TONES}
        keyExtractor={(item: Tone) => item.id}
        style={styles.toneList}
        contentContainerStyle={styles.toneListContent}
        renderItem={({ item: tone }: { item: Tone }) => {
          const isSelected = selectedTone === tone.id;
          return (
            <ScalePressable
              key={tone.id}
              onPress={() => {
                haptic.selection();
                setSelectedTone(isSelected ? '' : tone.id);
              }}
              style={[
                styles.toneItem,
                {
                  backgroundColor: isSelected ? C.primary : C.surfaceHigh,
                  borderColor: isSelected ? C.primary : C.border,
                },
              ]}
            >
              <AppText style={styles.toneIcon}>{tone.icon}</AppText>
              <AppText style={[styles.toneLabel, { color: isSelected ? 'white' : C.text }]}>
                {t(`agent.tones.${tone.id}`, tone.label)}
              </AppText>
            </ScalePressable>
          );
        }}
      />

      <AppText style={[styles.label, { color: C.muted }]}>{t('agent.personality')}</AppText>
      <TextInput
        value={personality}
        onChangeText={handlePersonalityChange}
        placeholder={t('agent.personality_placeholder')}
        placeholderTextColor={C.faint}
        multiline
        maxLength={maxPersonalityLen}
        numberOfLines={4}
        style={[
          styles.input,
          { backgroundColor: C.surfaceHigh, borderColor: C.border, color: C.text },
          styles.textAreaLarge,
        ]}
      />

      <AppText style={[styles.label, { color: C.muted }]}>
        {t('agent.description')}{' '}
        <AppText style={[styles.optionalText, { color: C.faint }]}>({t('agent.optional')})</AppText>
      </AppText>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t('agent.description_placeholder')}
        placeholderTextColor={C.faint}
        multiline
        maxLength={500}
        numberOfLines={2}
        style={[
          styles.input,
          { backgroundColor: C.surfaceHigh, borderColor: C.border, color: C.text },
          styles.textAreaSmall,
        ]}
      />

      <AppText style={[styles.label, { color: C.muted }]}>
        {t('agent.goals')}{' '}
        <AppText style={[styles.optionalText, { color: C.faint }]}>({t('agent.optional')})</AppText>
      </AppText>
      <View style={styles.goalInputContainer}>
        <TextInput
          value={goalInput}
          onChangeText={setGoalInput}
          placeholder={t('agent.goals_placeholder')}
          placeholderTextColor={C.faint}
          maxLength={200}
          style={[
            styles.goalInput,
            { backgroundColor: C.surfaceHigh, borderColor: C.border, color: C.text },
          ]}
          onSubmitEditing={addGoal}
          returnKeyType="done"
        />
        <ScalePressable
          onPress={addGoal}
          style={[
            styles.addGoalBtn,
            { backgroundColor: `${C.primary}15`, borderColor: `${C.primary}30` },
          ]}
        >
          <Ionicons name="add" size={20} color={C.primary} />
        </ScalePressable>
      </View>
      {goals.length > 0 && (
        <View style={styles.goalsContainer}>
          {goals.map((g, i) => (
            <GoalBadge key={i} goal={g} index={i} onRemove={removeGoal} />
          ))}
        </View>
      )}

      <ScalePressable
        onPress={onSave}
        disabled={isSaving}
        style={[
          styles.saveBtn,
          { backgroundColor: isSaving ? `${C.primary}70` : C.primary, shadowColor: C.primary },
        ]}
      >
        {isSaving ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <AppText style={styles.saveBtnText}>{t('agent.create_persona')}</AppText>
          </>
        )}
      </ScalePressable>
    </>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: theme.typography.bodySm.fontSize,
    flex: 1,
  },
  label: {
    marginBottom: theme.spacing.sm,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    marginBottom: theme.spacing.md,
  },
  optionalText: {
    textTransform: 'none',
  },
  toneList: {
    marginBottom: theme.spacing.md,
  },
  toneListContent: {
    gap: 8,
  },
  toneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
  },
  toneIcon: {
    fontSize: theme.typography.bodySm.fontSize,
  },
  toneLabel: {
    fontSize: theme.typography.bodySm.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
  },
  textAreaLarge: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  textAreaSmall: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  goalInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  goalInput: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.bodySm.fontSize,
  },
  addGoalBtn: {
    width: 40,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.xxl,
  },
  saveBtn: {
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.huge,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    ...theme.elevation.md,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: theme.typography.h2.fontWeight,
    fontSize: theme.typography.body.fontSize,
  },
});
