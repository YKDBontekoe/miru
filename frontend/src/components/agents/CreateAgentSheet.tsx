import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp, SlideOutDown, FadeIn } from 'react-native-reanimated';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { TemplateGallerySheet } from './TemplateGallerySheet';
import { useTheme } from '../../hooks/useTheme';
import { useAgentStore, AgentTemplate } from '../../store/useAgentStore';
import { haptic } from '../../utils/haptics';
import { TONES, SURPRISE_KEYWORDS, getTonePrefix } from './agentUtils';

interface Prefill {
  name?: string;
  personality?: string;
  description?: string;
  goals?: string[];
}

interface CreateAgentSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Optional pre-filled values (e.g. applied from a template). */
  prefill?: Prefill;
}

const ToneItemComponent = ({
  tone,
  isSelected,
  onSelect,
  themeC,
}: {
  tone: (typeof TONES)[0];
  isSelected: boolean;
  onSelect: (id: string) => void;
  themeC: any;
}) => {
  return (
    <TouchableOpacity
      onPress={() => {
        haptic.selection();
        onSelect(tone.id);
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: isSelected ? themeC.primary : themeC.surfaceHigh,
        borderWidth: 1,
        borderColor: isSelected ? themeC.primary : themeC.border,
      }}
    >
      <AppText style={{ fontSize: 13 }}>{tone.icon}</AppText>
      <AppText
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: isSelected ? 'white' : themeC.text,
        }}
      >
        {tone.label}
      </AppText>
    </TouchableOpacity>
  );
};

const ToneItem = memo(ToneItemComponent);

const CreateAgentSheetComponent = ({
  visible,
  onClose,
  onCreated,
  prefill,
}: CreateAgentSheetProps) => {
  const { C } = useTheme();
  const { createAgent, generateAgent } = useAgentStore();

  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [selectedTone, setSelectedTone] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wasGenerated, setWasGenerated] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
        container: {
          backgroundColor: C.surface,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          maxHeight: '96%',
        },
        dragIndicatorWrapper: { alignItems: 'center', paddingTop: 12 },
        dragIndicator: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.faint },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 22,
          paddingBottom: 8,
          paddingTop: 14,
        },
        headerTitle: { fontSize: 22, fontWeight: '700', color: C.text },
        closeBtn: {
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: C.surfaceHigh,
          alignItems: 'center',
          justifyContent: 'center',
        },
        scrollView: { paddingHorizontal: 22 },
        templateShortcut: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          padding: 12,
          backgroundColor: C.surfaceHigh,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.border,
        },
        templateShortcutText: { color: C.primary, fontWeight: '600', fontSize: 13, flex: 1 },
        aiGenBox: {
          backgroundColor: C.primarySurface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: `${C.primary}22`,
        },
        aiGenHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
        aiGenSparkle: { marginEnd: 7 },
        aiGenTitle: { color: C.primary, fontWeight: '700', fontSize: 14, flex: 1 },
        surpriseBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: `${C.primary}15`,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        surpriseBtnIcon: { fontSize: 12 },
        surpriseBtnText: { color: C.primary, fontSize: 12, fontWeight: '600' },
        aiGenInputRow: { flexDirection: 'row', gap: 8 },
        aiGenInput: {
          flex: 1,
          backgroundColor: C.surface,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: C.text,
          fontSize: 14,
        },
        aiGenSubmitBtn: {
          backgroundColor: C.primary,
          borderRadius: 10,
          paddingHorizontal: 16,
          justifyContent: 'center',
          minWidth: 48,
        },
        generatedNotice: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 14,
          paddingHorizontal: 2,
        },
        generatedNoticeText: { color: C.success, fontSize: 12, fontWeight: '600' },
        input: {
          backgroundColor: C.surfaceHigh,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: C.text,
          fontSize: 15,
          marginBottom: 14,
        },
        label: {
          color: C.muted,
          marginBottom: 6,
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        },
        labelFaint: { color: C.faint, textTransform: 'none' },
        tonesContainer: { gap: 8 },
        tonesList: { marginBottom: 14 },
        goalInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
        goalInput: {
          flex: 1,
          backgroundColor: C.surfaceHigh,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 12,
          paddingVertical: 9,
          color: C.text,
          fontSize: 14,
        },
        addGoalBtn: {
          width: 40,
          backgroundColor: `${C.primary}15`,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: `${C.primary}30`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        goalsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
        goalPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: `${C.primary}12`,
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderWidth: 1,
          borderColor: `${C.primary}25`,
        },
        goalPillText: { color: C.primary, fontSize: 12 },
        submitBtn: {
          borderRadius: 16,
          paddingVertical: 15,
          alignItems: 'center',
          marginTop: 4,
          marginBottom: 40,
        },
        submitBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
      }),
    [C]
  );

  const reset = useCallback(() => {
    setName('');
    setPersonality('');
    setDescription('');
    setGoals([]);
    setGoalInput('');
    setKeywords('');
    setSelectedTone('');
    setWasGenerated(false);
  }, []);

  // Apply prefill when sheet becomes visible with pre-filled data
  useEffect(() => {
    if (visible && prefill) {
      if (prefill.name) setName(prefill.name);
      if (prefill.personality) setPersonality(prefill.personality);
      if (prefill.description) setDescription(prefill.description);
      if (prefill.goals) setGoals(prefill.goals);
      if (prefill.name || prefill.personality) setWasGenerated(true);
    }
  }, [visible, prefill]);

  const handleGenerate = useCallback(
    async (kw?: string) => {
      const words = kw ?? keywords.trim();
      if (!words) {
        Alert.alert('Keywords required', 'Enter a description to generate from.');
        return;
      }
      setIsGenerating(true);
      haptic.medium();
      try {
        const result = await generateAgent(words);
        setName(result.name);
        setPersonality(result.personality);
        setDescription(result.description ?? '');
        setGoals(result.goals ?? []);
        setWasGenerated(true);
        haptic.success();
      } catch {
        haptic.error();
        Alert.alert('Error', 'Could not generate persona. Try again.');
      } finally {
        setIsGenerating(false);
      }
    },
    [keywords, generateAgent]
  );

  const handleSurprise = useCallback(() => {
    const kw = SURPRISE_KEYWORDS[Math.floor(Math.random() * SURPRISE_KEYWORDS.length)];
    setKeywords(kw);
    handleGenerate(kw);
  }, [handleGenerate]);

  const addGoal = useCallback(() => {
    const g = goalInput.trim();
    if (g && !goals.includes(g)) {
      setGoals((prev) => [...prev, g]);
      setGoalInput('');
    }
  }, [goalInput, goals]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    if (!name.trim() || !personality.trim()) {
      Alert.alert('Required', 'Name and personality are required.');
      return;
    }
    setIsSaving(true);
    haptic.medium();
    try {
      const tonePrefix = getTonePrefix(selectedTone);
      await createAgent({
        name: name.trim(),
        personality: (tonePrefix + personality).trim(),
        description: description.trim() || undefined,
        goals: goals.filter(Boolean),
      });
      haptic.success();
      reset();
      onCreated();
      onClose();
    } catch {
      haptic.error();
      Alert.alert('Error', 'Failed to create persona. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    name,
    personality,
    selectedTone,
    description,
    goals,
    createAgent,
    reset,
    onCreated,
    onClose,
  ]);

  const handleSelectTemplate = useCallback((t: AgentTemplate) => {
    setName(t.name);
    setPersonality(t.personality);
    setDescription(t.description ?? '');
    setGoals(t.goals ?? []);
    setWasGenerated(true);
  }, []);

  const handleRemoveGoal = useCallback((indexToRemove: number) => {
    setGoals((gs) => gs.filter((_, idx) => idx !== indexToRemove));
  }, []);

  const handleToneSelect = useCallback((id: string) => {
    setSelectedTone((prev) => (prev === id ? '' : id));
  }, []);

  const renderToneItem = useCallback(
    ({ item: tone }: ListRenderItemInfo<(typeof TONES)[0]>) => {
      const isSelected = selectedTone === tone.id;
      return (
        <ToneItem tone={tone} isSelected={isSelected} onSelect={handleToneSelect} themeC={C} />
      );
    },
    [selectedTone, handleToneSelect, C]
  );

  const toneKeyExtractor = useCallback((item: (typeof TONES)[0]) => item.id, []);

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={SlideInUp.duration(300)}
            exiting={SlideOutDown.duration(200)}
            style={styles.container}
          >
            <View style={styles.dragIndicatorWrapper}>
              <View style={styles.dragIndicator} />
            </View>

            <View style={styles.header}>
              <AppText style={styles.headerTitle}>New Persona</AppText>
              <TouchableOpacity
                onPress={() => {
                  reset();
                  onClose();
                }}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={16} color={C.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Templates shortcut */}
              <TouchableOpacity
                onPress={() => setShowTemplates(true)}
                style={styles.templateShortcut}
              >
                <Ionicons name="albums-outline" size={16} color={C.primary} />
                <AppText style={styles.templateShortcutText}>Browse persona templates</AppText>
                <Ionicons name="chevron-forward" size={14} color={C.faint} />
              </TouchableOpacity>

              {/* AI Generation */}
              <View style={styles.aiGenBox}>
                <View style={styles.aiGenHeader}>
                  <Ionicons
                    name="sparkles"
                    size={15}
                    color={C.primary}
                    style={styles.aiGenSparkle}
                  />
                  <AppText style={styles.aiGenTitle}>Generate with AI</AppText>
                  <TouchableOpacity
                    onPress={handleSurprise}
                    disabled={isGenerating}
                    style={styles.surpriseBtn}
                  >
                    <AppText style={styles.surpriseBtnIcon}>🎲</AppText>
                    <AppText style={styles.surpriseBtnText}>Surprise me</AppText>
                  </TouchableOpacity>
                </View>
                <View style={styles.aiGenInputRow}>
                  <TextInput
                    value={keywords}
                    onChangeText={setKeywords}
                    placeholder="e.g. curious scientist, pirate chef…"
                    placeholderTextColor={C.faint}
                    style={styles.aiGenInput}
                    onSubmitEditing={() => handleGenerate()}
                    returnKeyType="go"
                  />
                  <TouchableOpacity
                    onPress={() => handleGenerate()}
                    disabled={isGenerating}
                    style={styles.aiGenSubmitBtn}
                  >
                    {isGenerating ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {wasGenerated && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.generatedNotice}>
                  <Ionicons name="checkmark-circle" size={14} color={C.success} />
                  <AppText style={styles.generatedNoticeText}>
                    AI-generated · review and edit before saving
                  </AppText>
                </Animated.View>
              )}

              <AppText style={styles.label}>Name</AppText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Persona name"
                placeholderTextColor={C.faint}
                style={styles.input}
              />

              {/* Tone selector */}
              <AppText style={styles.label}>
                Tone <AppText style={styles.labelFaint}>(optional)</AppText>
              </AppText>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tonesList}
                contentContainerStyle={styles.tonesContainer}
                data={TONES}
                renderItem={renderToneItem}
                keyExtractor={toneKeyExtractor}
                keyboardShouldPersistTaps="handled"
              />

              <AppText style={styles.label}>Personality</AppText>
              <TextInput
                value={personality}
                onChangeText={setPersonality}
                placeholder="How does this persona think and communicate?"
                placeholderTextColor={C.faint}
                multiline
                numberOfLines={4}
                style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
              />

              <AppText style={styles.label}>
                Description <AppText style={styles.labelFaint}>(optional)</AppText>
              </AppText>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="A short bio or backstory…"
                placeholderTextColor={C.faint}
                multiline
                numberOfLines={2}
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
              />

              {/* Goals */}
              <AppText style={styles.label}>
                Goals <AppText style={styles.labelFaint}>(optional)</AppText>
              </AppText>
              <View style={styles.goalInputRow}>
                <TextInput
                  value={goalInput}
                  onChangeText={setGoalInput}
                  placeholder="Add a goal and press +"
                  placeholderTextColor={C.faint}
                  style={styles.goalInput}
                  onSubmitEditing={addGoal}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={addGoal} style={styles.addGoalBtn}>
                  <Ionicons name="add" size={20} color={C.primary} />
                </TouchableOpacity>
              </View>
              {goals.length > 0 && (
                <Animated.View entering={FadeIn.duration(250)} style={styles.goalsWrap}>
                  {goals.map((g, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleRemoveGoal(i)}
                      style={styles.goalPill}
                    >
                      <AppText style={styles.goalPillText}>{g}</AppText>
                      <Ionicons name="close" size={11} color={C.primary} />
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}

              <ScalePressable onPress={handleSave}>
                <View
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: !name.trim() ? C.faint : C.primary,
                      shadowColor: C.primary,
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: name.trim() ? 0.25 : 0,
                      shadowRadius: 8,
                      elevation: name.trim() ? 3 : 0,
                    },
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <AppText style={styles.submitBtnText}>Create Persona</AppText>
                  )}
                </View>
              </ScalePressable>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <TemplateGallerySheet
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={(t) => {
          handleSelectTemplate(t);
          setShowTemplates(false);
        }}
      />
    </>
  );
};

export const CreateAgentSheet = memo(CreateAgentSheetComponent);
