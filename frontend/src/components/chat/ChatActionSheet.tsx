import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

export interface ChatActionSheetOption {
  id: string;
  label: string;
  tone?: 'default' | 'destructive';
  onPress: () => void;
}

interface ChatActionSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: ChatActionSheetOption[];
  onClose: () => void;
}

export function ChatActionSheet({
  visible,
  title,
  subtitle,
  options,
  onClose,
}: ChatActionSheetProps) {
  const { C } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: C.surface }]}>
          <AppText variant="h3" style={[styles.title, { color: C.text }]}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" style={[styles.subtitle, { color: C.muted }]}>
              {subtitle}
            </AppText>
          ) : null}
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <ScalePressable
                key={option.id}
                onPress={() => {
                  onClose();
                  option.onPress();
                }}
                style={[
                  styles.optionButton,
                  {
                    borderColor: C.border,
                    backgroundColor: C.surfaceHigh,
                  },
                ]}
              >
                <AppText
                  style={[
                    styles.optionText,
                    { color: option.tone === 'destructive' ? C.danger : C.text },
                  ]}
                >
                  {option.label}
                </AppText>
              </ScalePressable>
            ))}
          </View>
          <ScalePressable
            onPress={onClose}
            style={[
              styles.closeButton,
              {
                borderColor: C.border,
              },
            ]}
          >
            <AppText style={[styles.closeButtonText, { color: C.muted }]}>Close</AppText>
          </ScalePressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  container: {
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    padding: theme.spacing.lg,
    maxHeight: '70%',
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.md,
  },
  optionsContainer: {
    gap: theme.spacing.sm,
  },
  optionButton: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  optionText: {
    fontWeight: '600',
  },
  closeButton: {
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
  },
  closeButtonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
