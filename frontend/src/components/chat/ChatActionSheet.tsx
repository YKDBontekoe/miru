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

  const dynamicStyles = StyleSheet.create({
    backdrop: {
      backgroundColor: C.backdrop,
    },
    sheet: {
      backgroundColor: C.surface,
    },
    title: {
      color: C.text,
    },
    subtitle: {
      color: C.subtext,
    },
    optionButton: {
      backgroundColor: C.surfaceHigh,
      borderColor: C.border,
    },
    optionTextDefault: {
      color: C.text,
    },
    optionTextDestructive: {
      color: C.danger,
    },
    closeButton: {
      borderColor: C.border,
      backgroundColor: C.surface,
    },
    closeText: {
      color: C.subtext,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, dynamicStyles.backdrop]}>
        <View style={[styles.sheet, dynamicStyles.sheet]}>
          <AppText variant="h3" style={[styles.title, dynamicStyles.title]}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" style={[styles.subtitle, dynamicStyles.subtitle]}>
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
                style={[styles.optionButton, dynamicStyles.optionButton]}
              >
                <AppText
                  style={[
                    styles.optionText,
                    option.tone === 'destructive'
                      ? dynamicStyles.optionTextDestructive
                      : dynamicStyles.optionTextDefault,
                  ]}
                >
                  {option.label}
                </AppText>
              </ScalePressable>
            ))}
          </View>
          <ScalePressable onPress={onClose} style={[styles.closeButton, dynamicStyles.closeButton]}>
            <AppText style={[styles.closeText, dynamicStyles.closeText]}>Close</AppText>
          </ScalePressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: theme.borderRadius.xl + 4,
    borderTopRightRadius: theme.borderRadius.xl + 4,
    padding: theme.spacing.lg,
    maxHeight: '70%',
  },
  title: {
    marginBottom: theme.spacing.xs,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: theme.spacing.md,
  },
  optionsContainer: {
    gap: theme.spacing.sm,
  },
  optionButton: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  optionText: {
    fontWeight: '600',
  },
  closeButton: {
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
  },
  closeText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
