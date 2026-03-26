import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
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

export function CreateAgentSheet({ visible, onClose, onCreated, prefill }: CreateAgentSheetProps) {
  const { C } = useTheme();
  const { t } = useTranslation();
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

  const reset = () => {
    setName('');
    setPersonality('');
    setDescription('');
    setGoals([]);
    setGoalInput('');
    setKeywords('');
    setSelectedTone('');
    setWasGenerated(false);
  };

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

  const handleGenerate = async (kw?: string) => {
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
  };

  const handleSurprise = () => {
    const kw = SURPRISE_KEYWORDS[Math.floor(Math.random() * SURPRISE_KEYWORDS.length)];
    setKeywords(kw);
    handleGenerate(kw);
  };

  const addGoal = () => {
    const g = goalInput.trim();
    if (g && !goals.includes(g)) {
      setGoals((prev) => [...prev, g]);
      setGoalInput('');
    }
  };

  const handleSave = async () => {
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
  };

  const handleSelectTemplate = (template: AgentTemplate) => {
    setName(template.name);
    setPersonality(template.personality);
    setDescription(template.description ?? '');
    setGoals(template.goals ?? []);
    setWasGenerated(true);
  };

  const input = {
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
  const label = {
    color: C.muted,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <Animated.View
            entering={SlideInUp.springify().damping(22)}
            exiting={SlideOutDown.duration(200)}
            style={{
              backgroundColor: C.surface,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              maxHeight: '96%',
            }}
          >
            <View style={{ alignItems: 'center', paddingTop: 12 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.faint }} />
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 22,
                paddingBottom: 8,
                paddingTop: 14,
              }}
            >
              <AppText style={{ fontSize: 22, fontWeight: '700', color: C.text }}>
                New Persona
              </AppText>
              <TouchableOpacity
                onPress={() => {
                  reset();
                  onClose();
                }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: C.surfaceHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={16} color={C.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ paddingHorizontal: 22 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Templates shortcut */}
              <TouchableOpacity
                onPress={() => setShowTemplates(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 16,
                  padding: 12,
                  backgroundColor: C.surfaceHigh,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <Ionicons name="albums-outline" size={16} color={C.primary} />
                <AppText style={{ color: C.primary, fontWeight: '600', fontSize: 13, flex: 1 }}>
                  Browse persona templates
                </AppText>
                <Ionicons name="chevron-forward" size={14} color={C.faint} />
              </TouchableOpacity>

              {/* AI Generation */}
              <View
                style={{
                  backgroundColor: C.primarySurface,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: `${C.primary}22`,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="sparkles" size={15} color={C.primary} style={{ marginEnd: 7 }} />
                  <AppText style={{ color: C.primary, fontWeight: '700', fontSize: 14, flex: 1 }}>
                    Generate with AI
                  </AppText>
                  <TouchableOpacity
                    onPress={handleSurprise}
                    disabled={isGenerating}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: `${C.primary}15`,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <AppText style={{ fontSize: 12 }}>🎲</AppText>
                    <AppText style={{ color: C.primary, fontSize: 12, fontWeight: '600' }}>
                      Surprise me
                    </AppText>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={keywords}
                    onChangeText={setKeywords}
                    placeholder="e.g. curious scientist, pirate chef…"
                    placeholderTextColor={C.faint}
                    style={{
                      flex: 1,
                      backgroundColor: C.surface,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: C.border,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: C.text,
                      fontSize: 14,
                    }}
                    onSubmitEditing={() => handleGenerate()}
                    returnKeyType="go"
                  />
                  <TouchableOpacity
                    onPress={() => handleGenerate()}
                    disabled={isGenerating}
                    style={{
                      backgroundColor: C.primary,
                      borderRadius: 10,
                      paddingHorizontal: 16,
                      justifyContent: 'center',
                      minWidth: 48,
                    }}
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
                <Animated.View
                  entering={FadeIn.duration(300)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 14,
                    paddingHorizontal: 2,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={14} color={C.success} />
                  <AppText style={{ color: C.success, fontSize: 12, fontWeight: '600' }}>
                    AI-generated · review and edit before saving
                  </AppText>
                </Animated.View>
              )}

              <AppText style={label}>{t('agents.labels.name')}</AppText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Persona name"
                placeholderTextColor={C.faint}
                style={input}
              />

              {/* Tone selector */}
              <AppText style={label}>
                Tone <AppText style={{ color: C.faint, textTransform: 'none' }}>(optional)</AppText>
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 14 }}
                contentContainerStyle={{ gap: 8 }}
              >
                {TONES.map((tone) => {
                  const isSelected = selectedTone === tone.id;
                  return (
                    <TouchableOpacity
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
                        {tone.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <AppText style={label}>{t('agents.labels.personality')}</AppText>
              <TextInput
                value={personality}
                onChangeText={setPersonality}
                placeholder="How does this persona think and communicate?"
                placeholderTextColor={C.faint}
                multiline
                numberOfLines={4}
                style={[input, { minHeight: 90, textAlignVertical: 'top' }]}
              />

              <AppText style={label}>
                Description{' '}
                <AppText style={{ color: C.faint, textTransform: 'none' }}>(optional)</AppText>
              </AppText>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="A short bio or backstory…"
                placeholderTextColor={C.faint}
                multiline
                numberOfLines={2}
                style={[input, { minHeight: 60, textAlignVertical: 'top' }]}
              />

              {/* Goals */}
              <AppText style={label}>
                Goals{' '}
                <AppText style={{ color: C.faint, textTransform: 'none' }}>(optional)</AppText>
              </AppText>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                <TextInput
                  value={goalInput}
                  onChangeText={setGoalInput}
                  placeholder="Add a goal and press +"
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
                <TouchableOpacity
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
                </TouchableOpacity>
              </View>
              {goals.length > 0 && (
                <Animated.View
                  entering={FadeIn.duration(250)}
                  style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}
                >
                  {goals.map((g, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setGoals((gs) => gs.filter((_, idx) => idx !== i))}
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
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}

              <ScalePressable onPress={handleSave}>
                <View
                  style={{
                    backgroundColor: !name.trim() ? C.faint : C.primary,
                    borderRadius: 16,
                    paddingVertical: 15,
                    alignItems: 'center',
                    marginTop: 4,
                    marginBottom: 40,
                    shadowColor: C.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: name.trim() ? 0.25 : 0,
                    shadowRadius: 8,
                    elevation: name.trim() ? 3 : 0,
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                      Create Persona
                    </AppText>
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
        onSelect={(template) => {
          handleSelectTemplate(template);
          setShowTemplates(false);
        }}
      />
    </>
  );
}
