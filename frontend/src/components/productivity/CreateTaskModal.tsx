import React, { useState } from 'react';
import {
  View,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
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
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setTitle('');
    setDueDate('');
    setIsSaving(false);
    onClose();
  };

  const toIsoDate = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(`${trimmed}T09:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('productivity.title_required'), t('productivity.enter_task_title'));
      return;
    }
    const normalizedDueDate = toIsoDate(dueDate);
    if (dueDate.trim() && !normalizedDueDate) {
      Alert.alert(t('productivity.error'), t('productivity.invalid_due_date'));
      return;
    }
    setIsSaving(true);
    try {
      await createTask(title.trim(), normalizedDueDate);
      setTitle('');
      setDueDate('');
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
        dueDateRow: {
          flexDirection: 'row',
          gap: S.sm,
          marginBottom: S.md,
        },
        quickDateButton: {
          borderRadius: R.lg,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.surfaceHigh,
          paddingHorizontal: S.md,
          paddingVertical: S.sm,
        },
        quickDateButtonText: {
          color: C.text,
          fontWeight: '600',
          fontSize: 12,
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
        <View style={styles.modalContent}>
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
            {t('productivity.due_date_label')}
          </AppText>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder={t('productivity.due_date_placeholder')}
            placeholderTextColor={C.faint}
            style={styles.textInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.dueDateRow}>
            <ScalePressable
              onPress={() => setDueDate(new Date().toISOString().slice(0, 10))}
              style={styles.quickDateButton}
            >
              <AppText style={styles.quickDateButtonText}>{t('productivity.today')}</AppText>
            </ScalePressable>
            <ScalePressable
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setDueDate(tomorrow.toISOString().slice(0, 10));
              }}
              style={styles.quickDateButton}
            >
              <AppText style={styles.quickDateButtonText}>{t('productivity.tomorrow')}</AppText>
            </ScalePressable>
            <ScalePressable onPress={() => setDueDate('')} style={styles.quickDateButton}>
              <AppText style={styles.quickDateButtonText}>{t('productivity.clear')}</AppText>
            </ScalePressable>
          </View>

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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
