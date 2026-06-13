import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';
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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <AppText variant="h3" style={styles.titleText}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" style={styles.subtitleText}>
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
                style={styles.optionButton}
              >
                <AppText
                  style={[
                    styles.optionText,
                    option.tone === 'destructive' ? styles.destructiveText : styles.defaultText,
                  ]}
                >
                  {option.label}
                </AppText>
              </ScalePressable>
            ))}
          </View>
          <ScalePressable onPress={onClose} style={styles.closeButton}>
            <AppText style={styles.closeButtonText}>Close</AppText>
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
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheetContainer: {
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    padding: theme.spacing.lg,
    maxHeight: '70%',
  },
  titleText: {
    color: DESIGN_TOKENS.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitleText: {
    color: DESIGN_TOKENS.colors.muted,
    marginBottom: theme.spacing.md,
  },
  optionsContainer: {
    gap: theme.spacing.sm,
  },
  optionButton: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  optionText: {
    fontWeight: '600',
  },
  destructiveText: {
    color: DESIGN_TOKENS.colors.destructive,
  },
  defaultText: {
    color: DESIGN_TOKENS.colors.text,
  },
  closeButton: {
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  closeButtonText: {
    color: DESIGN_TOKENS.colors.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
});
