import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp, SlideOutDown, FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { TemplateGallerySheet } from './TemplateGallerySheet';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore, AgentTemplate } from '@/store/useAgentStore';
import { haptic } from '@/utils/haptics';
import { SURPRISE_KEYWORDS, getTonePrefix } from '@/components/agents/agentUtils';
import { ScalePressable } from '@/components/ScalePressable';
import { CreateAgentForm } from '@/components/agents/create';

interface Prefill {
  name?: string;
  personality?: string;
  description?: string;
  goals?: string[];
  isGenerated?: boolean;
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
  const { createAgent, generateAgent } = useAgentStore();

  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [wasGenerated, setWasGenerated] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  const reset = () => {
    setName('');
    setPersonality('');
    setDescription('');
    setGoals([]);
    setSelectedTone('');
    setKeywords('');
    setErrorMsg('');
    setWasGenerated(false);
  };

  useEffect(() => {
    if (visible && prefill) {
      if (prefill.name) setName(prefill.name);
      if (prefill.personality) setPersonality(prefill.personality);
      if (prefill.description) setDescription(prefill.description);
      if (prefill.goals) setGoals(prefill.goals);
      setWasGenerated(Boolean(prefill.isGenerated));
    } else if (!visible) {
      reset();
    }
  }, [visible, prefill]);

  const handleSurprise = () => {
    haptic.selection();
    const randomKW = SURPRISE_KEYWORDS[Math.floor(Math.random() * SURPRISE_KEYWORDS.length)];
    setKeywords(randomKW);
  };

  const handleGenerate = async () => {
    if (!keywords.trim() || isGeneratingRef.current) return;
    haptic.light();
    setIsGenerating(true);
    isGeneratingRef.current = true;
    setErrorMsg('');
    try {
      const prompt = keywords.trim();
      const generated = await generateAgent(prompt);
      setName(generated.name);
      setPersonality(generated.personality);
      setDescription(generated.description ?? '');
      setGoals(generated.goals ?? []);
      setWasGenerated(true);
      haptic.success();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to generate persona.');
      haptic.error();
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (successVisible) {
      timeoutId = setTimeout(() => {
        setSuccessVisible(false);
        onCreated();
        reset();
        onClose();
      }, 1500);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [successVisible, onCreated, onClose]);

  const handleSave = async () => {
    if (!name.trim() || !personality.trim()) {
      setErrorMsg('Name and personality are required.');
      haptic.error();
      return;
    }
    setErrorMsg('');
    haptic.light();
    setIsSaving(true);
    try {
      const finalPersonality = selectedTone
        ? `${getTonePrefix(selectedTone)} ${personality.trim()}`
        : personality.trim();

      await createAgent({
        name: name.trim(),
        personality: finalPersonality,
        description: description.trim() || undefined,
        goals: goals.length > 0 ? goals : undefined,
      });

      haptic.success();
      setSuccessVisible(true);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to create persona.');
      haptic.error();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTemplate = (t: AgentTemplate) => {
    setName(t.name);
    setPersonality(t.personality);
    setDescription(t.description ?? '');
    setGoals(t.goals ?? []);
    setWasGenerated(true);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <Animated.View
            entering={SlideInUp.duration(300)}
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
              <ScalePressable
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
              </ScalePressable>
            </View>

            <ScrollView
              style={{ paddingHorizontal: 22 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Templates shortcut */}
              <ScalePressable
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
              </ScalePressable>

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
                  <ScalePressable
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
                  </ScalePressable>
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
                  <ScalePressable
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
                  </ScalePressable>
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

              <CreateAgentForm
                name={name}
                setName={setName}
                selectedTone={selectedTone}
                setSelectedTone={setSelectedTone}
                personality={personality}
                setPersonality={setPersonality}
                description={description}
                setDescription={setDescription}
                goals={goals}
                setGoals={setGoals}
                isSaving={isSaving}
                onSave={handleSave}
                errorMsg={errorMsg}
              />
            </ScrollView>
          </Animated.View>

          {successVisible && (
            <View style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              justifyContent: 'center', alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}>
              <View style={{ backgroundColor: C.surface, padding: 20, borderRadius: 16, alignItems: 'center' }}>
                 <Ionicons name="checkmark-circle" size={48} color={C.success} />
                 <AppText style={{ marginTop: 12, fontSize: 18, fontWeight: 'bold', color: C.text }}>Persona Created</AppText>
              </View>
            </View>
          )}
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
}
