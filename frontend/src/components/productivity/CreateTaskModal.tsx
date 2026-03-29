import React, { useState } from 'react';
import {
  View,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { useProductivityStore } from '../../store/useProductivityStore';
import { theme } from '../../core/theme';
import { useTheme } from '../../hooks/useTheme';
import { RecurrenceRule } from '../../core/models';

const RECURRENCE_OPTIONS: { id: RecurrenceRule; label: string; icon: string }[] = [
  { id: 'daily', label: 'Daily', icon: '☀️' },
  { id: 'weekly', label: 'Weekly', icon: '📅' },
  { id: 'biweekly', label: 'Biweekly', icon: '🗓️' },
  { id: 'monthly', label: 'Monthly', icon: '📆' },
  { id: 'yearly', label: 'Yearly', icon: '🎯' },
];

const S = theme.spacing;
const R = theme.borderRadius;

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTaskModal({ visible, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const { createTask } = useProductivityStore();
  const { C } = useTheme();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [autoCreateEvent, setAutoCreateEvent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setTitle('');
    setDueDate('');
    setRecurrenceRule(null);
    setRecurrenceEndDate('');
    setAutoCreateEvent(false);
    setIsSaving(false);
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('productivity.title_required'), t('productivity.enter_task_title'));
      return;
    }
    setIsSaving(true);
    try {
      await createTask(title.trim(), {
        due_date: dueDate.trim() || null,
        recurrence_rule: recurrenceRule,
        recurrence_end_date: recurrenceEndDate.trim() || null,
        auto_create_event: autoCreateEvent,
      });
      setTitle('');
      setDueDate('');
      setRecurrenceRule(null);
      setRecurrenceEndDate('');
      setAutoCreateEvent(false);
      onCreated();
      onClose();
    } catch {
      Alert.alert(t('productivity.error'), t('productivity.failed_create_task'));
    } finally {
      setIsSaving(false);
    }
  };

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        modalOverlay: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: C.backdrop,
        },
        modalContent: {
          backgroundColor: C.surface,
          borderTopLeftRadius: R.xxl,
          borderTopRightRadius: R.xxl,
          padding: S.xxl,
          paddingBottom: Platform.OS === 'ios' ? 40 : S.xxl,
          ...theme.elevation.lg,
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: S.xl,
        },
        modalTitle: {
          color: C.text,
        },
        closeButton: {
          padding: S.xs,
        },
        inputLabel: {
          color: C.muted,
          marginBottom: S.sm,
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: '600',
        },
        textInput: {
          backgroundColor: C.surfaceHigh,
          borderRadius: R.lg,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: S.lg,
          paddingVertical: S.md,
          color: C.text,
          fontSize: 16,
          marginBottom: S.xl,
        },
        toggleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: C.surfaceHigh,
          borderRadius: R.lg,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: S.lg,
          paddingVertical: S.md,
          marginBottom: S.xl,
        },
        toggleLabel: {
          color: C.text,
          fontSize: 15,
          fontWeight: '500',
        },
        toggleSubLabel: {
          color: C.muted,
          fontSize: 12,
          marginTop: 2,
        },
        primaryButton: {
          backgroundColor: C.primary,
          borderRadius: R.xl,
          paddingVertical: S.lg,
          alignItems: 'center',
          marginTop: S.sm,
          ...theme.elevation.md,
        },
        primaryButtonDisabled: {
          backgroundColor: C.primarySurface,
          ...theme.elevation.none,
        },
        primaryButtonText: {
          color: theme.colors.white,
          fontWeight: '700',
          fontSize: 16,
        },
      }),
    [C]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={{ paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalHeader}>
            <AppText variant="h2" style={styles.modalTitle}>
              {t('productivity.new_task') || 'New Task'}
            </AppText>
            <ScalePressable onPress={handleClose} hitSlop={8} style={styles.closeButton}>
              <Ionicons name="close-circle" size={26} color={C.muted} />
            </ScalePressable>
          </View>

          <AppText variant="caption" style={styles.inputLabel}>
            {t('productivity.task_label') || 'Task'}
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('productivity.task_content_placeholder')}
            placeholderTextColor={C.faint}
            style={styles.textInput}
            autoFocus
          />

          <AppText variant="caption" style={styles.inputLabel}>
            Due Date
          </AppText>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD  (optional)"
            placeholderTextColor={C.faint}
            style={styles.textInput}
            keyboardType="numbers-and-punctuation"
          />

          {/* Recurrence rule chips */}
          <AppText variant="caption" style={styles.inputLabel}>
            Repeat
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: S.xl, marginHorizontal: -4 }}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
          >
            {RECURRENCE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setRecurrenceRule(recurrenceRule === opt.id ? null : opt.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 1,
                  backgroundColor: recurrenceRule === opt.id ? C.primary : C.surfaceHigh,
                  borderColor: recurrenceRule === opt.id ? C.primary : C.border,
                }}
              >
                <AppText style={{ fontSize: 14 }}>{opt.icon}</AppText>
                <AppText
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: recurrenceRule === opt.id ? '#fff' : C.text,
                  }}
                >
                  {opt.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Recurrence end date — only shown when a rule is selected */}
          {recurrenceRule && (
            <>
              <AppText variant="caption" style={styles.inputLabel}>
                Repeat Until
              </AppText>
              <TextInput
                value={recurrenceEndDate}
                onChangeText={setRecurrenceEndDate}
                placeholder="YYYY-MM-DD  (optional)"
                placeholderTextColor={C.faint}
                style={styles.textInput}
                keyboardType="numbers-and-punctuation"
              />
            </>
          )}

          {/* Auto-create calendar event toggle — only when due date is set */}
          {dueDate.trim().length >= 8 && (
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, marginEnd: S.md }}>
                <AppText style={styles.toggleLabel}>Add to Calendar</AppText>
                <AppText style={styles.toggleSubLabel}>
                  Create a calendar event on the due date
                </AppText>
              </View>
              <Switch
                value={autoCreateEvent}
                onValueChange={setAutoCreateEvent}
                trackColor={{ false: C.border, true: C.primary }}
                thumbColor={theme.colors.white}
              />
            </View>
          )}

          <ScalePressable
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
          >
            {isSaving ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <AppText style={styles.primaryButtonText}>
                {t('productivity.add_task') || 'Add Task'}
              </AppText>
            )}
          </ScalePressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
