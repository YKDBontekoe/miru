import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  border: DESIGN_TOKENS.colors.border,
  surfaceSoft: DESIGN_TOKENS.colors.surfaceSoft,
  destructive: DESIGN_TOKENS.colors.destructive,
  white: DESIGN_TOKENS.colors.white,
};

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
          <AppText variant="h3" style={styles.title}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" style={styles.subtitle}>
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
                    { color: option.tone === 'destructive' ? C.destructive : C.text },
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
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '70%',
  },
  title: {
    color: C.text,
    marginBottom: 4,
  },
  subtitle: {
    color: C.muted,
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  optionText: {
    fontWeight: '600',
  },
  closeButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  closeButtonText: {
    color: C.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
});
